import { db, auth } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  writeBatch,
  onSnapshot,
  query,
  orderBy 
} from 'firebase/firestore';
import { saveVideo, getVideo } from './videoStorage';

let isQuotaCooling = false;
const QUOTA_COOL_DOWN_KEY = 'djapero_firestore_quota_cooldown';

function checkQuota() {
  if (isQuotaCooling) return false;
  const coolDown = localStorage.getItem(QUOTA_COOL_DOWN_KEY);
  if (coolDown) {
    const expiry = parseInt(coolDown);
    if (Date.now() < expiry) {
      isQuotaCooling = true;
      return false;
    } else {
      localStorage.removeItem(QUOTA_COOL_DOWN_KEY);
      isQuotaCooling = false;
    }
  }
  return true;
}

function setQuotaCoolDown() {
  // Cool down for 4 hours if quota hit to stop spamming the console and exhausting limit
  const FOUR_HOURS = 4 * 60 * 60 * 1000;
  localStorage.setItem(QUOTA_COOL_DOWN_KEY, (Date.now() + FOUR_HOURS).toString());
  isQuotaCooling = true;
}

// Firestore error handler as required by skill
function handleFirestoreSyncError(error: any, operation: string, path: string) {
  const isQuota = error?.code === 'resource-exhausted' || 
                  error?.message?.includes('Quota exceeded') || 
                  error?.message?.includes('quota limit');
  
  const isOffline = error?.code === 'unavailable' || 
                    error?.code === 'failed-precondition' ||
                    error?.code === 'deadline-exceeded' ||
                    error?.message?.includes('10 seconds') ||
                    error?.message?.toLowerCase().includes('offline') ||
                    !window.navigator.onLine;

  if (isQuota) {
    setQuotaCoolDown();
    console.warn("Firestore Quota Exceeded. Entering persistent cooling mode (4h). Using local cache only.");
    return; // Don't throw for quota errors to avoid crashing callers
  }

  if (isOffline) {
    // These are expected in poor network or after quota block
    console.log(`Firestore Sync [${operation} on ${path}]: Operating in offline mode.`);
    return; // Don't throw for offline/timeout errors, SDK handles retry
  }

  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operation,
    path,
    userId: auth.currentUser?.uid,
    email: auth.currentUser?.email
  };
  console.error("Firestore Sync Error:", JSON.stringify(errInfo));
  // Only throw for critical errors (auth, permission, validation)
  if (error?.code === 'permission-denied' || error?.code === 'unauthenticated') {
    throw new Error(JSON.stringify(errInfo));
  }
}

/**
 * Executes a batch of operations in chunks of 500
 */
async function executeBatchOperations(ops: { type: 'delete' | 'set', ref: any, data?: any }[]): Promise<void> {
    for (let i = 0; i < ops.length; i += 500) {
        const batch = writeBatch(db);
        const chunk = ops.slice(i, i + 500);
        for (const op of chunk) {
            if (op.type === 'delete') {
                batch.delete(op.ref);
            } else {
                batch.set(op.ref, op.data);
            }
        }
        await batch.commit();
    }
}

/**
 * Saves a string that might exceed 1MB to Firestore by chunking if necessary
 */
async function saveLargeString(docId: string, largeString: string): Promise<void> {
  if (!checkQuota()) return;
  const path = `settings/${docId}`;
  try {
    // Standard size check (1 character is approx 1-2 bytes in UTF-16, let's count characters)
    // 600,000 characters is safely below 1MB
    if (largeString.length < 600000) {
      await setDoc(doc(db, 'settings', docId), { 
        data: largeString, 
        isChunked: false,
        updatedAt: new Date().toISOString()
      });
      return;
    }

    const chunkSize = 600000;
    const numChunks = Math.ceil(largeString.length / chunkSize);

    // Save metadata
    await setDoc(doc(db, 'settings', docId), { 
      isChunked: true, 
      numChunks,
      updatedAt: new Date().toISOString()
    });

    // Save chunks
    for (let i = 0; i < numChunks; i++) {
      const chunk = largeString.substring(i * chunkSize, (i + 1) * chunkSize);
      await setDoc(doc(db, 'settings', docId, 'chunks', String(i)), { text: chunk });
    }
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', path);
  }
}

/**
 * Loads a chunked or single large string from Firestore
 */
async function loadLargeString(docId: string): Promise<string | null> {
  if (!checkQuota()) return null;
  const path = `settings/${docId}`;
  try {
    const docRef = doc(db, 'settings', docId);
    const metaSnap = await getDoc(docRef);
    if (!metaSnap.exists()) return null;

    const data = metaSnap.data();
    if (!data.isChunked) {
      return data.data || null;
    }

    const numChunks = data.numChunks;
    // Optimization: query all chunks at once to minimize roundtrips
    const chunksSnap = await getDocs(query(collection(db, 'settings', docId, 'chunks'), orderBy('__name__')));
    const chunksMap = new Map();
    chunksSnap.forEach(d => chunksMap.set(d.id, d.data().text || ''));

    let fullString = '';
    for (let i = 0; i < numChunks; i++) {
      fullString += chunksMap.get(String(i)) || '';
    }
    return fullString;
  } catch (error) {
    handleFirestoreSyncError(error, 'GET', path);
    return null;
  }
}

/**
 * Syncs the entire products array to Firestore
 */
export async function syncProductsToFirestore(products: any[]): Promise<void> {
  if (!checkQuota()) return;
  try {
    const currentDocs = await getDocs(collection(db, 'products'));
    const batchOps: { type: 'delete' | 'set', ref: any, data?: any }[] = currentDocs.docs.map(docSnap => ({ type: 'delete', ref: docSnap.ref }));
    
    for (const product of products) {
      const productToSave = {
        name: product.name || '',
        category: product.category || 'Fruits & Légumes',
        priceDetail: String(product.priceDetail || '0'),
        priceGros: String(product.priceGros || '0'),
        image: product.image || '',
        description: product.description || ''
      };
      batchOps.push({ type: 'set' as const, ref: doc(db, 'products', product.id), data: productToSave });
    }
    
    await executeBatchOperations(batchOps);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'products');
  }
}

/**
 * Syncs the entire markets array to Firestore
 */
export async function syncMarketsToFirestore(markets: any[]): Promise<void> {
  if (!checkQuota()) return;
  try {
    const currentDocs = await getDocs(collection(db, 'markets'));
    const batchOps: { type: 'delete' | 'set', ref: any, data?: any }[] = currentDocs.docs.map(docSnap => ({ type: 'delete', ref: docSnap.ref }));
    
    for (const market of markets) {
      const marketToSave = {
        name: market.name || '',
        location: market.location || '',
        rating: String(market.rating || '5'),
        tags: market.tags || '',
        image: market.image || ''
      };
      batchOps.push({ type: 'set' as const, ref: doc(db, 'markets', market.id), data: marketToSave });
    }
    
    await executeBatchOperations(batchOps);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'markets');
  }
}

/**
 * Syncs the team array to Firestore
 */
export async function syncTeamToFirestore(teamMembers: any[]): Promise<void> {
  if (!checkQuota()) return;
  try {
    const currentDocs = await getDocs(collection(db, 'team'));
    const batchOps: { type: 'delete' | 'set', ref: any, data?: any }[] = currentDocs.docs.map(docSnap => ({ type: 'delete', ref: docSnap.ref }));
    
    for (const member of teamMembers) {
      const memberToSave = {
        name: member.name || '',
        role: member.role || '',
        image: member.image || '',
        phone: member.phone || '',
        description: member.description || '',
        quote: member.quote || '',
        special: Boolean(member.special)
      };
      batchOps.push({ type: 'set' as const, ref: doc(db, 'team', member.id), data: memberToSave });
    }
    
    await executeBatchOperations(batchOps);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'team');
  }
}

/**
 * Syncs the welcome content of the application
 */
export async function syncWelcomeContentToFirestore(content: any): Promise<void> {
  try {
    const fullContent = {
      ...content,
      updatedAt: new Date().toISOString()
    };
    
    // Save the full content as a large string because it might contain big video/images
    await saveLargeString('welcome_content_blob', JSON.stringify(fullContent));
    
    // Also save a small metadata doc to trigger the real-time watchers
    await setDoc(doc(db, 'settings', 'welcome_content'), {
      updatedAt: fullContent.updatedAt,
      hasBlob: true
    });
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'settings/welcome_content');
  }
}

/**
 * Syncs the campaign video of the application
 */
export async function syncCampaignVideoToFirestore(videoBase64OrUrl: string): Promise<void> {
  try {
    await saveLargeString('campaign_video', videoBase64OrUrl);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'settings/campaign_video');
  }
}

/**
 * Syncs an individual affiche video to Firestore
 */
export async function syncAfficheVideoToFirestore(id: string, videoBase64: string): Promise<void> {
  try {
    await saveLargeString(`affiche_video_${id}`, videoBase64);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', `settings/affiche_video_${id}`);
  }
}

/**
 * Syncs the portfolio affiches array to Firestore
 */
export async function syncAffichesToFirestore(affiches: any[]): Promise<void> {
  if (!checkQuota()) return;
  try {
    const currentDocs = await getDocs(collection(db, 'affiches'));
    const batchOps: { type: 'delete' | 'set', ref: any, data?: any }[] = currentDocs.docs.map(docSnap => ({ type: 'delete', ref: docSnap.ref }));
    
    for (const affiche of affiches) {
      const afficheToSave = {
        titleFr: affiche.titleFr || '',
        titleEn: affiche.titleEn || '',
        descFr: affiche.descFr || '',
        descEn: affiche.descEn || '',
        image: affiche.image || '',
        video: affiche.video || ''
      };
      batchOps.push({ type: 'set' as const, ref: doc(db, 'affiches', affiche.id), data: afficheToSave });
    }
    
    await executeBatchOperations(batchOps);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'affiches');
  }
}

/**
 * Syncs the notifications array to Firestore
 */
export async function syncNotificationsToFirestore(notifications: any[]): Promise<void> {
  if (!checkQuota()) return;
  try {
    const currentDocs = await getDocs(collection(db, 'notifications'));
    const batchOps: { type: 'delete' | 'set', ref: any, data?: any }[] = currentDocs.docs.map(docSnap => ({ type: 'delete', ref: docSnap.ref }));
    
    for (const notif of notifications) {
      const notifToSave = {
        title: notif.title || '',
        message: notif.message || '',
        image: notif.image || '',
        isActive: Boolean(notif.isActive),
        createdAt: notif.createdAt || new Date().toISOString()
      };
      batchOps.push({ type: 'set' as const, ref: doc(db, 'notifications', notif.id), data: notifToSave });
    }
    
    await executeBatchOperations(batchOps);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'notifications');
  }
}

/**
 * Syncs the admin phone number to Firestore
 */
export async function syncAdminPhoneToFirestore(phoneNumber: string): Promise<void> {
  try {
    await setDoc(doc(db, 'settings', 'admin_phone'), { 
      phoneNumber: phoneNumber || '',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'settings/admin_phone');
  }
}

/**
 * Syncs the basket empty state content
 */
export async function syncBasketContentToFirestore(content: any): Promise<void> {
  try {
    const docContent = {
      image: content.image || '',
      title: content.title || '',
      subtitle: content.subtitle || '',
      plateText: content.plateText || '',
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'settings', 'basket_content'), docContent);
  } catch (error) {
    handleFirestoreSyncError(error, 'WRITE', 'settings/basket_content');
  }
}

  // Master function to pull all configurations from Firestore and overwrite local storage / IDB
  export async function downloadAllFromFirestore(force = false): Promise<void> {
    if (!checkQuota()) return;
    const now = Date.now();
    const lastSync = localStorage.getItem('djapero_last_firestore_sync');
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    
    if (!force && lastSync && (now - parseInt(lastSync)) < TWO_HOURS) {
      return;
    }

    if (typeof window !== 'undefined' && !window.navigator.onLine) return;

  try {
    // Only handle items that don't have dedicated real-time listeners yet
    // 5. Load Welcome Content
    const welcomeDoc = await getDoc(doc(db, 'settings', 'welcome_content'));
    if (welcomeDoc.exists()) {
      const welcomeMeta = welcomeDoc.data();
      
      // Always try to load the latest blob if it exists, regardless of updatedAt to ensure consistency
      const fullContentJson = await loadLargeString('welcome_content_blob');
      if (fullContentJson) {
        try {
          const fullContent = JSON.parse(fullContentJson);
          
          // If the fetched content has a large data video, save it to IndexedDB instead of localStorage
          if (fullContent.video && fullContent.video.startsWith('data:video')) {
            try {
              await saveVideo('djapero_welcome_video', fullContent.video);
              fullContent.video = 'indexeddb:djapero_welcome_video';
            } catch (err) {
              console.error("Failed to save remote welcome video to IDB:", err);
            }
          }
          
          localStorage.setItem('djapero_welcome_content', JSON.stringify(fullContent));
          if (welcomeMeta.updatedAt) {
            localStorage.setItem('djapero_welcome_content_updated', welcomeMeta.updatedAt);
          }
        } catch (e) {
          console.error("Error parsing welcome content blob:", e);
        }
      }
    }

    // 6. Load Admin Phone
    const adminPhoneDoc = await getDoc(doc(db, 'settings', 'admin_phone'));
    if (adminPhoneDoc.exists()) {
      const data = adminPhoneDoc.data();
      localStorage.setItem('djapero_admin_phone', data.phoneNumber || '');
    }

    // 7. Load Basket Content
    const basketDoc = await getDoc(doc(db, 'settings', 'basket_content'));
    if (basketDoc.exists()) {
      const data = basketDoc.data();
      localStorage.setItem('djapero_basket_content', JSON.stringify(data));
    }

    // Record last sync
    localStorage.setItem('djapero_last_firestore_sync', now.toString());

    // Trigger local updates
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('djapero_sync_complete'));
    window.dispatchEvent(new Event('welcome_content_updated'));
  } catch (error: any) {
    // Graceful offline and permission handling
    const isOffline = error?.code === 'unavailable' || 
                      error?.code === 'failed-precondition' ||
                      error?.message?.toLowerCase().includes('offline') ||
                      !window.navigator.onLine;

    if (isOffline) {
      console.info("Firestore sync: operating in offline mode. Using cached data.");
    } else if (error?.code === 'deadline-exceeded' || error?.message?.includes('10 seconds')) {
      console.info("Firestore sync: backend timeout. Switching to offline mode.");
    } else if (error?.code === 'permission-denied') {
      console.info("Firestore sync: admin access not detected. Accessing public data only.");
    } else {
      console.warn("Firestore Sync Warning:", error?.message || error);
    }
    window.dispatchEvent(new Event('djapero_sync_error'));
  }

}

/**
 * Subscribes to real-time updates for products
 */
export function subscribeToProducts(callback: (products: any[]) => void) {
  const q = query(collection(db, 'products'));
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    if (products.length > 0) {
      localStorage.setItem('djapero_products', JSON.stringify(products));
      callback(products);
      window.dispatchEvent(new Event('storage'));
    }
  }, (error) => {
    handleFirestoreSyncError(error, 'SUBSCRIBE', 'products');
  });
}

/**
 * Subscribes to real-time updates for markets
 */
export function subscribeToMarkets(callback: (markets: any[]) => void) {
  const q = query(collection(db, 'markets'));
  return onSnapshot(q, (snapshot) => {
    const markets = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    if (markets.length > 0) {
      localStorage.setItem('djapero_markets', JSON.stringify(markets));
      callback(markets);
      window.dispatchEvent(new Event('storage'));
    }
  }, (error) => {
    handleFirestoreSyncError(error, 'SUBSCRIBE', 'markets');
  });
}

/**
 * Subscribes to real-time updates for notifications
 */
export function subscribeToNotifications(callback: (notifications: any[]) => void) {
  const q = query(collection(db, 'notifications'));
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    if (snapshot.docs.length > 0) {
      localStorage.setItem('djapero_notifications', JSON.stringify(notifications));
      callback(notifications);
      window.dispatchEvent(new Event('storage'));
    }
  }, (error) => {
    handleFirestoreSyncError(error, 'SUBSCRIBE', 'notifications');
  });
}

/**
 * Subscribes to real-time updates for team members
 */
export function subscribeToTeam(callback: (team: any[]) => void) {
  const q = query(collection(db, 'team'));
  return onSnapshot(q, (snapshot) => {
    const team = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    if (team.length > 0) {
      localStorage.setItem('djapero_team', JSON.stringify(team));
      callback(team);
      window.dispatchEvent(new Event('storage'));
    }
  }, (error) => {
    handleFirestoreSyncError(error, 'SUBSCRIBE', 'team');
  });
}

/**
 * Subscribes to real-time updates for portfolio affiches
 */
export function subscribeToAffiches(callback: (affiches: any[]) => void) {
  const q = query(collection(db, 'affiches'));
  return onSnapshot(q, async (snapshot) => {
    const affiches = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
    if (affiches.length > 0) {
      localStorage.setItem('djapero_portfolio_affiches', JSON.stringify(affiches));
      callback(affiches);
      window.dispatchEvent(new Event('storage'));

      // Throttled background fetch for videos
      for (const affiche of (affiches as any[])) {
        if (typeof affiche.video === 'string' && affiche.video.startsWith('db:')) {
          const videoKey = affiche.video.replace('db:', '');
          // Check local DB first - very cheap
          const localVideo = await getVideo(videoKey);
          
          // Check metadata timestamp to avoid redundant downloads
          const lastUpdateKey = `djapero_video_updated_${videoKey}`;
          const lastUpdate = localStorage.getItem(lastUpdateKey);
          const needsUpdate = !localVideo || !lastUpdate || affiche.updatedAt !== lastUpdate;

          if (needsUpdate) {
            console.log(`Downloading video for ${affiche.id}...`);
            const remoteVideo = await loadLargeString(videoKey);
            if (remoteVideo) {
              await saveVideo(videoKey, remoteVideo);
              if (affiche.updatedAt) {
                localStorage.setItem(lastUpdateKey, affiche.updatedAt);
              }
            }
          }
        }
      }
    }
  }, (error) => {
    handleFirestoreSyncError(error, 'SUBSCRIBE', 'affiches');
  });
}

/**
 * Subscribes to real-time updates for settings (like campaign video)
 */
export function subscribeToSettings(callback: () => void) {
  const q = query(collection(db, 'settings'));
  return onSnapshot(q, async (snapshot) => {
    let changed = false;
    for (const change of snapshot.docChanges()) {
      if (change.doc.id === 'campaign_video') {
         const remoteMeta = change.doc.data();
         const localCampaignUpdate = localStorage.getItem('djapero_campaign_video_updated');
         const localVideo = await getVideo('djapero_campaign_video');
         
         // Only fetch video chunks if we don't have the video OR it's newer
         if (!localVideo || !localCampaignUpdate || remoteMeta.updatedAt !== localCampaignUpdate) {
            console.log("Real-time campaign video update detected...");
            const campaignVideo = await loadLargeString('campaign_video');
            if (campaignVideo) {
              await saveVideo('djapero_campaign_video', campaignVideo);
              localStorage.setItem('djapero_campaign_video_updated', remoteMeta.updatedAt || new Date().toISOString());
              changed = true;
            }
         }
      }

      if (change.doc.id === 'welcome_content') {
        const welcomeMeta = change.doc.data();
        const localUpdatedAt = localStorage.getItem('djapero_welcome_content_updated');
        
        if (!localUpdatedAt || welcomeMeta.updatedAt !== localUpdatedAt) {
          console.log("Real-time welcome content update detected...");
          const fullContentJson = await loadLargeString('welcome_content_blob');
          if (fullContentJson) {
            const fullContent = JSON.parse(fullContentJson);

            // If the fetched content has a large data video, save it to IndexedDB instead of localStorage
            if (fullContent.video && fullContent.video.startsWith('data:video')) {
              try {
                await saveVideo('djapero_welcome_video', fullContent.video);
                fullContent.video = 'indexeddb:djapero_welcome_video';
              } catch (err) {
                console.error("Failed to save remote welcome video to IDB (real-time):", err);
              }
            }

            localStorage.setItem('djapero_welcome_content', JSON.stringify(fullContent));
            if (fullContent.updatedAt) {
              localStorage.setItem('djapero_welcome_content_updated', fullContent.updatedAt);
            }
            changed = true;
          }
        }
      }

      if (change.doc.id === 'admin_phone') {
        const data = change.doc.data();
        localStorage.setItem('djapero_admin_phone', data.phoneNumber || '');
        changed = true;
      }

      if (change.doc.id === 'basket_content') {
        const data = change.doc.data();
        localStorage.setItem('djapero_basket_content', JSON.stringify(data));
        changed = true;
      }
    }
    if (changed) {
      callback();
      window.dispatchEvent(new Event('storage'));
    }
  }, (error) => {
    handleFirestoreSyncError(error, 'SUBSCRIBE', 'settings');
  });
}
