import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, LayoutDashboard, ShoppingBasket, Store, Briefcase, Users, Truck, Upload, Trash2, MapPin, Sparkles, Video, Image as ImageIcon, Settings, Link, Check, Bell, Plus, Edit2 } from 'lucide-react';
import { saveVideo, getVideo } from '../lib/videoStorage';
import { 
  syncProductsToFirestore, 
  syncMarketsToFirestore, 
  syncTeamToFirestore, 
  syncWelcomeContentToFirestore, 
  syncCampaignVideoToFirestore,
  syncAffichesToFirestore,
  syncAfficheVideoToFirestore,
  syncNotificationsToFirestore,
  syncAdminPhoneToFirestore,
  syncBasketContentToFirestore,
  downloadAllFromFirestore,
  subscribeToProducts,
  subscribeToMarkets,
  subscribeToNotifications,
  subscribeToSettings
} from '../lib/firestoreSync';

export function AdminPortal({ onBack }: { onBack: () => void }) {
    const [activePage, setActivePage] = useState('dashboard');
    const [isAddingProduct, setIsAddingProduct] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Welcome Section content
    const [welcomeTitle, setWelcomeTitle] = useState('BIENVENUE AU DJAPERO TOUT POUR RÉUSSIR');
    const [welcomeSubtitle, setWelcomeSubtitle] = useState('Votre voyage vers l\'excellence commence maintenant avec tous les outils nécessaires');
    const [welcomeVideo, setWelcomeVideo] = useState('');
    const [welcomeCards, setWelcomeCards] = useState<any[]>([]);
    const [isProcessingFile, setIsProcessingFile] = useState(false);

    // Campaign Video Section
    const [campaignVideo, setCampaignVideo] = useState('https://player.vimeo.com/external/370331493.sd.mp4?s=33d52579737cf9a3806be896f643e9fc448b111a&profile_id=139&oauth2_token_id=57447761');
    const campaignVideoInputRef = React.useRef<HTMLInputElement>(null);
    const afficheVideoInputRef = React.useRef<HTMLInputElement>(null);

    const resizeImageFile = (file: File, maxSize: number = 800): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height && width > maxSize) {
                        height = Math.round(height * (maxSize / width));
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = Math.round(width * (maxSize / height));
                        height = maxSize;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const [products, setProducts] = useState<any[]>([]);
    const [markets, setMarkets] = useState<any[]>([]);
    const [team, setTeam] = useState<any[]>([]);
    const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
    const [adminPhoneNumber, setAdminPhoneNumber] = useState(localStorage.getItem('djapero_admin_phone') || '');
    const [isSavingAdminPhone, setIsSavingAdminPhone] = useState(false);
    
    useEffect(() => {
        const handleStorage = () => {
            const saved = localStorage.getItem('djapero_admin_phone');
            if (saved !== null) setAdminPhoneNumber(saved);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);
    
    // Product states
    const [productName, setProductName] = useState('');
    const [productCategory, setProductCategory] = useState('Fruits & Légumes');
    const [productGros, setProductGros] = useState('');
    const [productDetail, setProductDetail] = useState('');
    const [productDesc, setProductDesc] = useState('');
    const [productImageUrl, setProductImageUrl] = useState('');
    const [productMeasure, setProductMeasure] = useState('');

    // Market states
    const [marketName, setMarketName] = useState('');
    const [marketLocation, setMarketLocation] = useState('');
    const [marketRating, setMarketRating] = useState('4.5');
    const [marketTags, setMarketTags] = useState('Frais & Artisanal');

    // Team states
    const [teamName, setTeamName] = useState('');
    const [teamRole, setTeamRole] = useState('');
    const [teamPhone, setTeamPhone] = useState('');
    const [teamDesc, setTeamDesc] = useState('');

    // Portfolio posters (affiches) states
    const [portfolioAffiches, setPortfolioAffiches] = useState<any[]>([]);
    const [afficheTitleFr, setAfficheTitleFr] = useState('');
    const [afficheTitleEn, setAfficheTitleEn] = useState('');
    const [afficheDescFr, setAfficheDescFr] = useState('');
    const [afficheDescEn, setAfficheDescEn] = useState('');
    const [afficheVideo, setAfficheVideo] = useState('');
    const [isProcessingAfficheVideo, setIsProcessingAfficheVideo] = useState(false);

    // Notifications states
    const [notifications, setNotifications] = useState<any[]>([]);
    const [notifTitle, setNotifTitle] = useState('');
    const [notifMessage, setNotifMessage] = useState('');
    const [notifImage, setNotifImage] = useState('');
    const [isNotifActive, setIsNotifActive] = useState(true);
    const [editingAfficheId, setEditingAfficheId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isSavingAffiche, setIsSavingAffiche] = useState(false);

    // Basket Content states
    const [basketEmptyImage, setBasketEmptyImage] = useState('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000');
    const [basketEmptyTitleFr, setBasketEmptyTitleFr] = useState("Votre Panier est Vide");
    const [basketEmptyTitleEn, setBasketEmptyTitleEn] = useState("Your Cart is Empty");
    const [basketEmptyDescFr, setBasketEmptyDescFr] = useState("Découvrez notre sélection de produits frais et authentiques du terroir.");
    const [basketEmptyDescEn, setBasketEmptyDescEn] = useState("Discover our selection of fresh and authentic local products.");
    const [basketEmptyPlateText, setBasketEmptyPlateText] = useState("Fresh & Organic");

    useEffect(() => {
        try {
            let unsubscribeProducts: () => void = () => {};
            let unsubscribeMarkets: () => void = () => {};
            let unsubscribeNotifications: () => void = () => {};
            let unsubscribeSettings: () => void = subscribeToSettings(() => {
                if (activePage === 'dashboard') {
                    getVideo('djapero_campaign_video').then(saved => {
                        if (saved) setCampaignVideo(saved);
                    });
                }
            });

            if (activePage === 'store') {
                unsubscribeProducts = subscribeToProducts(setProducts);
                const saved = JSON.parse(localStorage.getItem('djapero_products') || '[]');
                if (saved.length > 0) setProducts(saved);
            }
            if (activePage === 'markets') {
                unsubscribeMarkets = subscribeToMarkets(setMarkets);
                const saved = JSON.parse(localStorage.getItem('djapero_markets') || '[]');
                if (saved.length > 0) setMarkets(saved);
            }
            if (activePage === 'team') {
                fetch('/api/team')
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            setTeam(data);
                        } else {
                            const saved = JSON.parse(localStorage.getItem('djapero_team') || '[]');
                            setTeam(saved);
                        }
                    })
                    .catch(() => {
                        const saved = JSON.parse(localStorage.getItem('djapero_team') || '[]');
                        setTeam(saved);
                    });
            }

            if (activePage === 'localites') {
                unsubscribeMarkets = subscribeToMarkets(setMarkets);
                const saved = JSON.parse(localStorage.getItem('djapero_markets') || '[]');
                if (saved.length === 0) {
                    const defaultMarkets = [
                        { id: 'tg-1', name: 'Grand Marché d\'Assigamé', location: 'Lomé, Togo', rating: '4.8', tags: 'Traditionnel & Textile', image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&q=80&w=600' },
                        { id: 'bj-1', name: 'Marché International de Dantokpa', location: 'Cotonou, Bénin', rating: '4.9', tags: 'Divers & Artisanal', image: 'https://images.unsplash.com/photo-1544333323-16785191de40?auto=format&fit=crop&q=80&w=600' },
                        { id: 'ci-1', name: 'Marché de Treichville', location: 'Abidjan, Côte d\'Ivoire', rating: '4.7', tags: 'Gastronomie & Culture', image: 'https://images.unsplash.com/photo-1488459711635-0c00289b76c6?auto=format&fit=crop&q=80&w=600' },
                        { id: 'ci-2', name: 'Marché de Cocody', location: 'Abidjan, Côte d\'Ivoire', rating: '4.6', tags: 'Produits Frais', image: 'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&q=80&w=600' }
                    ];
                    localStorage.setItem('djapero_markets', JSON.stringify(defaultMarkets));
                    setMarkets(defaultMarkets);
                } else {
                    setMarkets(saved);
                }
            }
            if (activePage === 'welcome') {
                const saved = JSON.parse(localStorage.getItem('djapero_welcome_content') || '{}');
                setWelcomeTitle(saved.title || 'BIENVENUE AU DJAPERO TOUT POUR RÉUSSIR');
                setWelcomeSubtitle(saved.subtitle || 'Votre voyage vers l\'excellence commence maintenant avec tous les outils nécessaires');
                
                if (saved.video) {
                    if (saved.video === 'indexeddb:djapero_welcome_video') {
                        getVideo('djapero_welcome_video').then(video => {
                            if (video) setWelcomeVideo(video);
                        });
                    } else {
                        setWelcomeVideo(saved.video);
                    }
                } else {
                    setWelcomeVideo('');
                }

                setWelcomeCards(saved.cards || [
                    { title: 'Marché', text: 'Le cœur de nos échanges quotidiens.', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80' },
                    { title: 'Livraison', text: 'Rapide, fiable et sécurisée partout.', image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80' },
                    { title: 'Équipe', text: 'Ensemble pour atteindre l\'excellence.', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80' },
                    { title: 'Consommateur', text: 'La priorité au centre de tout.', image: 'https://images.unsplash.com/photo-1526779259127-1f9531130863?auto=format&fit=crop&w=400&q=80' },
                    { title: 'Vendeur', text: 'Des outils pour booster vos ventes.', image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=400&q=80' },
                    { title: 'Et autres', text: 'Découvrez tout le reste ici.', image: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=400&q=80' },
                ]);
            }
            if (activePage === 'dashboard') {
                getVideo('djapero_campaign_video').then(saved => {
                    if (saved) setCampaignVideo(saved);
                });
            }
            if (activePage === 'registrations') {
                fetch('/api/registered-users')
                    .then(r => r.json())
                    .then(setRegisteredUsers)
                    .catch(console.error);
            }
            if (activePage === 'portfolio_posts') {
                fetch('/api/affiches')
                    .then(r => r.json())
                    .then(data => {
                        if (data && data.length > 0) {
                            setPortfolioAffiches(data);
                        } else {
                            const saved = JSON.parse(localStorage.getItem('djapero_portfolio_affiches') || '[]');
                            setPortfolioAffiches(saved);
                        }
                    })
                    .catch(() => {
                        const saved = JSON.parse(localStorage.getItem('djapero_portfolio_affiches') || '[]');
                        setPortfolioAffiches(saved);
                    });
            }

            if (activePage === 'notifications') {
                const saved = JSON.parse(localStorage.getItem('djapero_notifications') || '[]');
                setNotifications(saved);
                unsubscribeNotifications = subscribeToNotifications(setNotifications);
            }

            if (activePage === 'basket_settings') {
                const saved = JSON.parse(localStorage.getItem('djapero_basket_content') || '{}');
                if (saved.image) setBasketEmptyImage(saved.image);
                if (saved.titleFr) setBasketEmptyTitleFr(saved.titleFr);
                if (saved.titleEn) setBasketEmptyTitleEn(saved.titleEn);
                if (saved.descFr) setBasketEmptyDescFr(saved.descFr);
                if (saved.descEn) setBasketEmptyDescEn(saved.descEn);
                if (saved.plateText) setBasketEmptyPlateText(saved.plateText);
            }

            return () => {
                unsubscribeProducts();
                unsubscribeMarkets();
                unsubscribeNotifications();
                unsubscribeSettings();
            };
        } catch (e) {
            console.error("Error loading Admin data:", e);
        }
    }, [activePage, isAddingProduct]);

    const handleSaveWelcome = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Save the video separately if it's a data URL (local upload)
        if (welcomeVideo && welcomeVideo.startsWith('data:video')) {
            try {
                await saveVideo('djapero_welcome_video', welcomeVideo);
            } catch (err) {
                console.error("Error saving welcome video to IndexedDB:", err);
            }
        }

        const content = {
            title: welcomeTitle,
            subtitle: welcomeSubtitle,
            video: welcomeVideo.startsWith('data:video') ? 'indexeddb:djapero_welcome_video' : welcomeVideo,
            cards: welcomeCards
        };
        try {
            localStorage.setItem('djapero_welcome_content', JSON.stringify(content));
            
            // Sync with Firestore using the actual video data (syncWelcomeContentToFirestore handles chunking)
            const firestoreContent = { 
                ...content,
                video: welcomeVideo 
            };

            await syncWelcomeContentToFirestore(firestoreContent);
            
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('welcome_content_updated'));
            alert('Félicitations ! Le contenu de bienvenue a été mis à jour avec succès et synchronisé sur votre compte.');
        } catch (error) {
            console.error("Storage error:", error);
            alert("Erreur: Le contenu est trop volumineux (probablement à cause d'une vidéo ou d'images trop lourdes). Essayez d'utiliser des fichiers plus légers ou des liens URL.");
        }
    };

    const handleAddWelcomeCard = () => {
        setWelcomeCards([...welcomeCards, { title: 'Nouveau', text: 'Description', image: '' }]);
    };

    const handleRemoveWelcomeCard = (index: number) => {
        setWelcomeCards(welcomeCards.filter((_, i) => i !== index));
    };

    const handleUpdateCard = (index: number, field: string, value: string) => {
        const updated = [...welcomeCards];
        updated[index] = { ...updated[index], [field]: value };
        setWelcomeCards(updated);
    };

    const handleSaveMarket = async (e: React.FormEvent) => {
        e.preventDefault();
        const existingMarkets = JSON.parse(localStorage.getItem('djapero_markets') || '[]');
        let updatedMarkets;

        if (editingId) {
            updatedMarkets = existingMarkets.map((m: any) => m.id === editingId ? {
                ...m,
                name: marketName,
                location: marketLocation,
                rating: marketRating,
                tags: marketTags,
                image: selectedImage || m.image
            } : m);
        } else {
            const newMarket = {
                id: Date.now().toString(),
                name: marketName,
                location: marketLocation,
                rating: marketRating,
                tags: marketTags,
                image: selectedImage || 'https://images.unsplash.com/photo-1544333323-16785191de40?auto=format&fit=crop&q=80&w=600'
            };
            updatedMarkets = [newMarket, ...existingMarkets];
        }

        localStorage.setItem('djapero_markets', JSON.stringify(updatedMarkets));
        setMarkets(updatedMarkets);

        // Sync with Firestore
        await syncMarketsToFirestore(updatedMarkets);

        // Sync with backend
        fetch('/api/markets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedMarkets)
        }).catch(console.error);

        // Trigger storage event
        window.dispatchEvent(new Event('storage'));

        setIsAddingProduct(false);
        setEditingId(null);
        setSelectedImage(null);
        setMarketName('');
        setMarketLocation('');
        setMarketRating('4.5');
        setMarketTags('');
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const existingProducts = JSON.parse(localStorage.getItem('djapero_products') || '[]');
            let updatedProducts;

            if (editingId) {
                updatedProducts = existingProducts.map((p: any) => p.id === editingId ? {
                    ...p,
                    name: productName || 'Nouveau Produit',
                    category: productCategory,
                    priceGros: productGros || '0',
                    priceDetail: productDetail || '0',
                    description: productDesc,
                    measure: productMeasure,
                    image: selectedImage || p.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
                } : p);
            } else {
                const newProduct = {
                    id: Date.now().toString(),
                    name: productName || 'Nouveau Produit',
                    category: productCategory,
                    priceGros: productGros || '0',
                    priceDetail: productDetail || '0',
                    description: productDesc,
                    measure: productMeasure,
                    image: selectedImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
                };
                updatedProducts = [newProduct, ...existingProducts];
            }

            localStorage.setItem('djapero_products', JSON.stringify(updatedProducts));
            setProducts(updatedProducts);
            
            // Sync with Firestore
            await syncProductsToFirestore(updatedProducts);
            
            // Sync with backend
            fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProducts)
            }).catch(console.error);

            // Trigger storage event to notify other components in same session
            window.dispatchEvent(new Event('storage'));

            setIsAddingProduct(false);
            setEditingId(null);
            setSelectedImage(null);
            setProductName('');
            setProductGros('');
            setProductDetail('');
            setProductDesc('');
            setProductImageUrl('');
            setProductMeasure('');
        } catch (error) {
            console.error("Storage error:", error);
            alert("Erreur lors de la sauvegarde du produit (localStorage est probablement plein ou l'image est trop grande).");
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setProductName(product.name || '');
        setProductCategory(product.category || 'Fruits & Légumes');
        setProductGros(product.priceGros || '');
        setProductDetail(product.priceDetail || '');
        setProductDesc(product.description || '');
        setSelectedImage(product.image);
        setProductImageUrl(product.image || '');
        setProductMeasure(product.measure || '');
        setIsAddingProduct(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
            const existingProducts = JSON.parse(localStorage.getItem('djapero_products') || '[]');
            const updatedProducts = existingProducts.filter((p: any) => p.id !== id);
            localStorage.setItem('djapero_products', JSON.stringify(updatedProducts));
            setProducts(updatedProducts);
            
            // Sync with Firestore
            await syncProductsToFirestore(updatedProducts);
            
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleDeleteMarket = async (id: string) => {
        if (confirm('Voulez-vous vraiment supprimer ce marché ?')) {
            const existingMarkets = JSON.parse(localStorage.getItem('djapero_markets') || '[]');
            const updatedMarkets = existingMarkets.filter((m: any) => m.id !== id);
            localStorage.setItem('djapero_markets', JSON.stringify(updatedMarkets));
            setMarkets(updatedMarkets);
            
            // Sync with Firestore
            await syncMarketsToFirestore(updatedMarkets);
            
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleEditMarket = (market: any) => {
        setEditingId(market.id);
        setMarketName(market.name);
        setMarketLocation(market.location);
        setMarketRating(market.rating);
        setMarketTags(market.tags);
        setSelectedImage(market.image);
        setIsAddingProduct(true);
    };

    const handleSaveTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        const existingTeam = JSON.parse(localStorage.getItem('djapero_team') || '[]');
        let updatedTeam;

        if (editingId) {
            updatedTeam = existingTeam.map((t: any) => t.id === editingId ? {
                ...t,
                name: teamName,
                role: teamRole,
                phone: teamPhone,
                description: teamDesc,
                image: selectedImage || t.image
            } : t);
        } else {
            const newMember = {
                id: Date.now().toString(),
                name: teamName,
                role: teamRole,
                phone: teamPhone,
                description: teamDesc,
                image: selectedImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
            };
            updatedTeam = [...existingTeam, newMember];
        }

        try {
            localStorage.setItem('djapero_team', JSON.stringify(updatedTeam));
            setTeam(updatedTeam);

            // Sync with Firestore
            await syncTeamToFirestore(updatedTeam);

            // Sync with backend
            fetch('/api/team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedTeam)
            }).catch(console.error);

            window.dispatchEvent(new Event('storage'));

            setIsAddingProduct(false);
            setEditingId(null);
            setSelectedImage(null);
        } catch (error) {
            console.error("Storage error:", error);
            alert("Erreur lors de la sauvegarde. L'image est peut-être encore trop lourde ou la mémoire est pleine.");
        }
        setTeamName('');
        setTeamRole('');
        setTeamPhone('');
        setTeamDesc('');
    };

    const handleDeleteTeam = async (id: string) => {
        if (confirm('Voulez-vous vraiment supprimer ce membre ?')) {
            const existingTeam = JSON.parse(localStorage.getItem('djapero_team') || '[]');
            const updatedTeam = existingTeam.filter((t: any) => t.id !== id);
            localStorage.setItem('djapero_team', JSON.stringify(updatedTeam));
            setTeam(updatedTeam);
            
            // Sync with Firestore
            await syncTeamToFirestore(updatedTeam);
            
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleEditTeam = (member: any) => {
        setEditingId(member.id);
        setTeamName(member.name);
        setTeamRole(member.role);
        setTeamPhone(member.phone || '');
        setTeamDesc(member.description || '');
        setSelectedImage(member.image);
        setIsAddingProduct(true);
    };

    const getYouTubeEmbedUrl = (url: string | null) => {
        if (!url) return null;
        let videoId = '';
        try {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split(/[?#]/)[0];
            } else if (url.includes('youtube.com/watch')) {
                const urlObj = new URL(url);
                videoId = urlObj.searchParams.get('v') || '';
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1].split(/[?#]/)[0];
            } else {
                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                const match = url.match(regExp);
                if (match && match[2].length === 11) videoId = match[2];
            }
        } catch (e) {
            console.error("Error parsing YouTube URL:", e);
        }
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&rel=0` : null;
    };

    const handleSaveAffiche = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingAffiche(true);
        
        try {
            const existingAffiches = JSON.parse(localStorage.getItem('djapero_portfolio_affiches') || '[]');
            let updatedAffiches;
            const targetId = editingAfficheId || Date.now().toString();

            let savedVideoValue = afficheVideo;
            if (afficheVideo && afficheVideo.startsWith('data:')) {
                try {
                    await saveVideo('djapero_affiche_video_' + targetId, afficheVideo);
                    await syncAfficheVideoToFirestore(targetId, afficheVideo);
                    savedVideoValue = 'db:djapero_affiche_video_' + targetId;
                } catch (err) {
                    console.error("Failed to save custom video to IndexedDB:", err);
                    alert("Erreur lors de l'enregistrement de la vidéo dans la base de données locale. Elle pourrait être trop volumineuse.");
                }
            }

            if (editingAfficheId) {
                updatedAffiches = existingAffiches.map((a: any) => a.id === editingAfficheId ? {
                    ...a,
                    titleFr: afficheTitleFr,
                    titleEn: afficheTitleEn,
                    descFr: afficheDescFr,
                    descEn: afficheDescEn,
                    image: selectedImage || a.image,
                    video: savedVideoValue
                } : a);
            } else {
                const newAffiche = {
                    id: targetId,
                    titleFr: afficheTitleFr,
                    titleEn: afficheTitleEn,
                    descFr: afficheDescFr,
                    descEn: afficheDescEn,
                    image: selectedImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
                    video: savedVideoValue
                };
                updatedAffiches = [...existingAffiches, newAffiche];
            }

            await syncAffichesToFirestore(updatedAffiches);
            localStorage.setItem('djapero_portfolio_affiches', JSON.stringify(updatedAffiches));
            setPortfolioAffiches(updatedAffiches);
            window.dispatchEvent(new Event('storage'));

            setIsAddingProduct(false);
            setEditingAfficheId(null);
            setSelectedImage(null);
            setAfficheVideo('');
            
            alert(editingAfficheId ? "Affiche modifiée avec succès !" : "Affiche ajoutée avec succès !");
            
            setAfficheTitleFr('');
            setAfficheTitleEn('');
            setAfficheDescFr('');
            setAfficheDescEn('');
            setSelectedImage(null);
            setAfficheVideo('');
        } catch (error) {
            console.error("Storage error:", error);
            alert("Erreur lors de la sauvegarde de l'affiche. L'image ou la vidéo est peut-être trop lourde ou la mémoire est pleine.");
        } finally {
            setIsSavingAffiche(false);
        }
    };

    const handleSaveBasketSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = {
            image: basketEmptyImage,
            titleFr: basketEmptyTitleFr,
            titleEn: basketEmptyTitleEn,
            descFr: basketEmptyDescFr,
            descEn: basketEmptyDescEn,
            plateText: basketEmptyPlateText
        };
        try {
            localStorage.setItem('djapero_basket_content', JSON.stringify(content));
            await syncBasketContentToFirestore(content);
            window.dispatchEvent(new Event('storage'));
            alert('L\'affiche publicitaire du panier a été mise à jour avec succès !');
        } catch (error) {
            console.error("Save basket settings error:", error);
            alert("Erreur lors de la sauvegarde.");
        }
    };

    const handleDeleteAffiche = async (id: string) => {
        if (confirm('Voulez-vous vraiment supprimer cette affiche ?')) {
            try {
                const existingAffiches = JSON.parse(localStorage.getItem('djapero_portfolio_affiches') || '[]');
                const updatedAffiches = existingAffiches.filter((a: any) => a.id !== id);
                localStorage.setItem('djapero_portfolio_affiches', JSON.stringify(updatedAffiches));
                await syncAffichesToFirestore(updatedAffiches);
                setPortfolioAffiches(updatedAffiches);
                window.dispatchEvent(new Event('storage'));
            } catch (error) {
                console.error("Delete affiche error:", error);
                alert("Erreur lors de la suppression de l'affiche (sync Firestore impossible).");
            }
        }
    };

    const handleSaveNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const finalImage = selectedImage || notifImage || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800';
            
            const newNotif = {
                id: Date.now().toString(),
                title: notifTitle,
                message: notifMessage,
                image: finalImage,
                isActive: isNotifActive,
                createdAt: new Date().toISOString()
            };

            const updatedNotifs = [newNotif, ...notifications];
            setNotifications(updatedNotifs);
            localStorage.setItem('djapero_notifications', JSON.stringify(updatedNotifs));
            await syncNotificationsToFirestore(updatedNotifs);
            
            setNotifTitle('');
            setNotifMessage('');
            setNotifImage('');
            setSelectedImage(null);
            setIsAddingProduct(false);
            alert("Notification envoyée avec succès !");
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error("Error saving notification:", error);
        }
    };

    const toggleNotificationStatus = async (id: string) => {
        const updated = notifications.map(n => n.id === id ? { ...n, isActive: !n.isActive } : n);
        setNotifications(updated);
        localStorage.setItem('djapero_notifications', JSON.stringify(updated));
        await syncNotificationsToFirestore(updated);
        window.dispatchEvent(new Event('storage'));
    };

    const deleteNotification = async (id: string) => {
        if (confirm('Supprimer cette notification ?')) {
            const updated = notifications.filter(n => n.id !== id);
            setNotifications(updated);
            localStorage.setItem('djapero_notifications', JSON.stringify(updated));
            await syncNotificationsToFirestore(updated);
            window.dispatchEvent(new Event('storage'));
        }
    };

    const handleEditAffiche = async (affiche: any) => {
        setEditingAfficheId(affiche.id);
        setAfficheTitleFr(affiche.titleFr);
        setAfficheTitleEn(affiche.titleEn || '');
        setAfficheDescFr(affiche.descFr);
        setAfficheDescEn(affiche.descEn || '');
        setSelectedImage(affiche.image);
        
        if (affiche.video) {
            if (affiche.video.startsWith('db:')) {
                try {
                    const dbKey = affiche.video.replace('db:', '');
                    const stored = await getVideo(dbKey);
                    setAfficheVideo(stored || '');
                } catch (e) {
                    console.error("Error loading poster video from DB:", e);
                    setAfficheVideo('');
                }
            } else {
                setAfficheVideo(affiche.video);
            }
        } else {
            setAfficheVideo('');
        }
        
        setIsAddingProduct(true);
    };

    const renderManagement = () => {
        if (activePage === 'basket_settings') {
            return (
                <div className="space-y-6 md:space-y-10 max-w-4xl mx-auto pb-10 md:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">Publicité Panier</h2>
                            <p className="text-slate-400 text-[10px] md:text-sm font-medium mt-1">Gérez l'affiche publicitaire et les messages qui apparaissent quand le panier est vide.</p>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl md:rounded-[40px] p-4 md:p-10 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-10">
                        <div className="flex-1">
                            <form className="space-y-4 md:space-y-6" onSubmit={handleSaveBasketSettings}>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Badge (Ex: Fresh & Organic)</label>
                                    <input type="text" value={basketEmptyPlateText} onChange={(e)=>setBasketEmptyPlateText(e.target.value)} placeholder="Fresh & Organic" className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Titre Principal (FR)</label>
                                        <input type="text" value={basketEmptyTitleFr} onChange={(e)=>setBasketEmptyTitleFr(e.target.value)} className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" />
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Titre Principal (EN)</label>
                                        <input type="text" value={basketEmptyTitleEn} onChange={(e)=>setBasketEmptyTitleEn(e.target.value)} className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description (FR)</label>
                                        <textarea rows={3} value={basketEmptyDescFr} onChange={(e)=>setBasketEmptyDescFr(e.target.value)} className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" />
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Description (EN)</label>
                                        <textarea rows={3} value={basketEmptyDescEn} onChange={(e)=>setBasketEmptyDescEn(e.target.value)} className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 md:pt-6 border-t border-slate-50">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Image de l'Affiche (Pub)</label>
                                    <div className="relative group/upload">
                                        <label className="border-2 border-dashed border-slate-200 group-hover/upload:border-[#1E8C45] group-hover/upload:bg-[#1E8C45]/5 rounded-2xl md:rounded-3xl flex flex-col items-center justify-center gap-3 md:gap-4 text-slate-500 transition-all cursor-pointer relative overflow-hidden aspect-video w-full">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                disabled={isProcessingFile}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setIsProcessingFile(true);
                                                        resizeImageFile(file, 1200).then(resized => {
                                                            setBasketEmptyImage(resized);
                                                            setIsProcessingFile(false);
                                                        });
                                                    }
                                                }}
                                            />
                                            {isProcessingFile ? (
                                                <div className="flex flex-col items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase text-[#1E8C45]">Optimisation...</span>
                                                </div>
                                            ) : basketEmptyImage ? (
                                                <>
                                                    <img src={basketEmptyImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover group-hover/upload:scale-105 transition-transform duration-700 font-sans" referrerPolicy="no-referrer" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                        <ImageIcon size={32} className="mb-2" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Changer l'affiche</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 md:gap-4 text-center p-4 md:p-6">
                                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center text-[#1E8C45]">
                                                       <Upload size={32} />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-slate-800 block">Importer l'affiche pub</span>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-2 md:pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isProcessingFile}
                                        className="w-full bg-[#1E8C45] hover:bg-[#007542] text-white py-4 min-h-[60px] rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-[#1E8C45]/30 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Enregistrer l'affiche
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="lg:w-[320px] shrink-0 space-y-6">
                             <div className="p-4 bg-slate-50 rounded-3xl border border-slate-100">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1 mb-4 block">Aperçu Layout PC</label>
                                <div className="aspect-[4/3] bg-white rounded-2xl shadow-inner border border-slate-200 overflow-hidden relative">
                                     <div className="flex w-full h-full">
                                         <div className="w-1/2 p-4 flex flex-col justify-center space-y-2 bg-[#E8F5E9]">
                                             <div className="w-4 h-4 bg-slate-900 rounded-[2px]" />
                                             <div className="h-1 w-8 bg-[#1E8C45]" />
                                             <div className="h-4 w-full bg-slate-800 rounded-[2px]" />
                                             <div className="h-2 w-2/3 bg-slate-400 rounded-[2px]" />
                                             <div className="h-4 w-12 bg-orange-500 rounded-[2px] mt-2" />
                                         </div>
                                         <div className="w-1/2 relative bg-slate-200">
                                             {basketEmptyImage && <img src={basketEmptyImage} className="w-full h-full object-cover opacity-80" alt="Preview" />}
                                         </div>
                                     </div>
                                </div>
                                <p className="text-[9px] text-slate-400 mt-4 leading-relaxed italic text-center px-4">
                                    Ceci représente la nouvelle structure "Full Width" que vous avez choisie pour le panier sur PC.
                                </p>
                             </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activePage === 'localites') {
            if (isAddingProduct) {
                return (
                    <div className="space-y-6 md:space-y-10 max-w-2xl mx-auto pb-10 md:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">{editingId ? 'Modifier le Marché' : 'Nouveau Marché'}</h2>
                                <p className="text-slate-400 text-[10px] md:text-sm font-medium mt-1">Ajoutez un point de vente stratégique à votre réseau.</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingProduct(false)}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white border border-slate-100 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all shadow-sm"
                            >
                                <ArrowLeft size={16} className="md:size-20" />
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-2xl md:rounded-[40px] p-4 md:p-10 shadow-sm border border-slate-100 space-y-4 md:space-y-8">
                            <form className="space-y-4 md:space-y-6" onSubmit={handleSaveMarket}>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom du marché</label>
                                    <input type="text" value={marketName} onChange={(e)=>setMarketName(e.target.value)} placeholder="Ex: Marché de Dantokpa" className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" required />
                                </div>
                                <div className="space-y-1.5 md:space-y-2">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Localisation (Ville, Pays)</label>
                                    <input type="text" value={marketLocation} onChange={(e)=>setMarketLocation(e.target.value)} placeholder="Ex: Lomé, Togo" className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-medium shadow-inner" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Note (0-5)</label>
                                        <input type="text" value={marketRating} onChange={(e)=>setMarketRating(e.target.value)} placeholder="4.5" className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-bold shadow-inner" />
                                    </div>
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Tags / Spécialités</label>
                                        <input type="text" value={marketTags} onChange={(e)=>setMarketTags(e.target.value)} placeholder="Ex: Frais & Artisanal" className="w-full px-4 md:px-6 py-3 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs md:text-sm font-medium shadow-inner" />
                                    </div>
                                </div>

                                <div className="space-y-3 pt-4 md:pt-6 border-t border-slate-50">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Image du marché</label>
                                    <div className="relative group/upload">
                                        <label className="border-2 border-dashed border-slate-200 group-hover/upload:border-[#1E8C45] group-hover/upload:bg-[#1E8C45]/5 rounded-2xl md:rounded-[32px] flex flex-col items-center justify-center gap-3 md:gap-4 text-slate-500 transition-all cursor-pointer relative overflow-hidden aspect-square max-w-[280px] md:max-w-[320px] mx-auto w-full">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                disabled={isProcessingFile}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setIsProcessingFile(true);
                                                        resizeImageFile(file).then(resized => {
                                                            setSelectedImage(resized);
                                                            setIsProcessingFile(false);
                                                        });
                                                    }
                                                }}
                                            />
                                            {isProcessingFile ? (
                                                <div className="flex flex-col items-center gap-2 md:gap-3">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 border-4 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-[8px] md:text-[10px] font-black uppercase text-[#1E8C45]">Optimisation...</span>
                                                </div>
                                            ) : selectedImage ? (
                                                <>
                                                    <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover group-hover/upload:scale-105 transition-transform duration-700 font-sans" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                        <ImageIcon size={24} className="md:size-32 mb-2" />
                                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em]">Changer l'image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 md:gap-4 text-center p-4 md:p-6">
                                                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-[32px] shadow-lg flex items-center justify-center text-[#1E8C45] group-hover:scale-110 transition-transform">
                                                       <Upload size={24} className="md:size-32" />
                                                    </div>
                                                    <div>
                                                        <span className="text-xs md:text-base font-black text-slate-800 block">Cliquez pour importer</span>
                                                        <span className="text-[7px] md:text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-1 inline-block">Format Carré Conseillé</span>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-2 md:pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isProcessingFile}
                                        className="w-full bg-[#1E8C45] hover:bg-[#007542] text-white py-4 md:py-6 rounded-2xl md:rounded-3xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl shadow-[#1E8C45]/30 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {editingId ? 'Mettre à jour' : 'Confirmer l\'ajout'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 md:pb-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-slate-800 tracking-tighter">Marchés & Localités</h2>
                            <p className="text-slate-400 font-bold text-[9px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em] mt-1">Gérez vos points de présence géographiques</p>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setMarketName('');
                                setMarketLocation('');
                                setMarketRating('4.5');
                                setMarketTags('');
                                setSelectedImage(null);
                                setIsAddingProduct(true);
                            }}
                            className="bg-[#1E8C45] hover:bg-[#007542] text-white px-5 md:px-8 py-3.5 md:py-5 rounded-xl md:rounded-[24px] font-black uppercase tracking-widest text-[9px] md:text-[11px] shadow-xl md:shadow-2xl shadow-[#1E8C45]/20 md:shadow-[#1E8C45]/30 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95 group w-full md:w-auto"
                        >
                            <MapPin size={16} className="md:size-18 group-hover:translate-y-[-2px] transition-transform" />
                            Nouveau Marché
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
                        {(markets || []).map(m => (
                            <div key={m.id} className="bg-white rounded-2xl md:rounded-[24px] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200 transition-all duration-500 group relative flex flex-col">
                                    <div className="w-full aspect-square relative overflow-hidden bg-slate-50">
                                        <img src={m.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 font-sans" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>
                                        <div className="absolute bottom-4 left-4 right-4">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                                <span className="text-[8px] font-black py-0.5 px-2 bg-white text-[#1E8C45] rounded-full uppercase tracking-widest shadow-lg">{m.tags.split('&')[0]}</span>
                                                <div className="bg-white/10 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                                                    <Sparkles size={8} className="text-yellow-400" />
                                                    <span className="text-[8px] font-bold text-white uppercase tracking-wider">{m.rating}</span>
                                                </div>
                                            </div>
                                            <h3 className="text-white font-black text-xs md:text-sm tracking-tight leading-tight group-hover:translate-x-1 transition-transform">{m.name}</h3>
                                            <p className="text-white/60 text-[9px] md:text-[10px] font-medium mt-0.5 flex items-center gap-1">
                                                <MapPin size={8} />
                                                {m.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-3 md:p-4 mt-auto border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex gap-1.5">
                                            <button 
                                                onClick={() => handleEditMarket(m)}
                                                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-[#1E8C45] hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <Edit2 size={12} className="md:size-14" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteMarket(m.id)}
                                                className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <Trash2 size={12} className="md:size-14" />
                                            </button>
                                        </div>
                                        <button className="text-[8px] md:text-[9px] font-black uppercase text-slate-300 hover:text-[#1E8C45] transition-colors tracking-widest">
                                            Détails
                                        </button>
                                    </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activePage === 'welcome') {
            return (
                <div className="space-y-4 md:space-y-6 max-w-[1600px] mx-auto pb-6 md:pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500 font-sans px-2 md:px-0">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 border-b border-slate-100 pb-2 mb-2 md:pb-3 md:mb-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-slate-800 tracking-tight">Design & Accueil</h2>
                            <p className="text-slate-500 text-[9px] md:text-[10px] mt-0.5">Personnalisez l'expérience de bienvenue</p>
                        </div>
                        <button 
                            onClick={handleSaveWelcome}
                            disabled={isProcessingFile}
                            className="bg-[#1E8C45] hover:bg-[#007542] text-white px-4 py-2.5 md:px-6 md:py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] md:text-[10px] shadow-xl shadow-[#1E8C45]/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 w-full md:w-auto"
                        >
                            <Sparkles size={14} />
                            Enregistrer
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* LEFT COLUMN: Main Text & Video */}
                        <div className="lg:col-span-5 space-y-4 md:space-y-5">
                            <div className="bg-white p-4 md:p-5 rounded-2xl md:rounded-[24px] border border-slate-100 shadow-sm space-y-3 md:space-y-4 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 md:p-6 text-slate-50 opacity-20 group-hover:opacity-40 transition-opacity">
                                    <Video size={80} className="md:hidden" strokeWidth={1} />
                                    <Video size={120} className="hidden md:block" strokeWidth={1} />
                                </div>
                                
                                <div className="relative">
                                    <h3 className="text-base md:text-xl font-black text-slate-800 mb-3 md:mb-6 flex items-center gap-2">
                                        <div className="w-1.5 md:w-2 h-5 md:h-8 bg-[#1E8C45] rounded-full"></div>
                                        Contenu Principal
                                    </h3>
                                    
                                    <div className="space-y-3 md:space-y-6">
                                        <div className="space-y-1 md:space-y-2">
                                            <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Titre de bienvenue</label>
                                            <textarea 
                                                rows={2} 
                                                value={welcomeTitle} 
                                                onChange={(e) => setWelcomeTitle(e.target.value)}
                                                className="w-full px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all font-black uppercase text-sm md:text-xl leading-tight shadow-inner"
                                                placeholder="TITRE..."
                                            />
                                        </div>
                                        
                                        <div className="space-y-1 md:space-y-2">
                                            <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Sous-titre</label>
                                            <textarea 
                                                rows={2} 
                                                value={welcomeSubtitle} 
                                                onChange={(e) => setWelcomeSubtitle(e.target.value)}
                                                className="w-full px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-slate-600 text-[11px] md:text-sm leading-relaxed"
                                                placeholder="Description..."
                                            />
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-slate-50">
                                            <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vidéo de présentation</label>
                                            
                                            {welcomeVideo && (
                                                <div className="w-full aspect-video rounded-xl md:rounded-2xl overflow-hidden bg-black mb-1 md:mb-2 shadow-lg border border-slate-100">
                                                    {welcomeVideo.startsWith('data:video') || welcomeVideo.match(/\.(mp4|webm|ogg|mov)$/i) || (!welcomeVideo.includes('youtube.com') && !welcomeVideo.includes('youtu.be')) ? (
                                                    <video 
                                                      src={welcomeVideo} 
                                                      className="w-full h-full object-cover" 
                                                      autoPlay 
                                                      muted 
                                                      playsInline 
                                                    />
                                                    ) : (
                                                        <iframe 
                                                            src={welcomeVideo.includes('watch?v=') ? welcomeVideo.replace('watch?v=', 'embed/') : welcomeVideo.includes('youtu.be/') ? welcomeVideo.replace('youtu.be/', 'youtube.com/embed/') : welcomeVideo.includes('shorts/') ? welcomeVideo.replace('shorts/', 'embed/') : welcomeVideo}
                                                            className="w-full h-full border-0"
                                                            allowFullScreen
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex flex-col gap-2">
                                                <div className="relative group/input">
                                                    <input 
                                                        type="text" 
                                                        value={welcomeVideo} 
                                                        onChange={(e) => setWelcomeVideo(e.target.value)}
                                                        placeholder="Lien Youtube ou URL..."
                                                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[9px] md:text-xs font-semibold pr-10 shadow-inner"
                                                    />
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                                                        <Video size={14} />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">OU</span>
                                                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <label className={`cursor-pointer group/upload relative overflow-hidden w-20 h-20 md:w-28 md:h-28 rounded-xl md:rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-1 ${welcomeVideo.startsWith('data:video') ? 'border-[#1E8C45] bg-[#1E8C45]/5' : 'border-slate-200 hover:border-[#1E8C45] hover:bg-slate-50'}`}>
                                                        {isProcessingFile ? (
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-5 h-5 border-2 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                            </div>
                                                        ) : welcomeVideo.startsWith('data:video') ? (
                                                            <>
                                                                <div className="w-8 h-8 bg-[#1E8C45] text-white rounded-full flex items-center justify-center shadow-lg">
                                                                    <Video size={14} />
                                                                </div>
                                                                <span className="text-[7px] font-black uppercase text-[#1E8C45]">VIDÉO</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-8 h-8 bg-slate-100 text-slate-400 group-hover/upload:bg-[#1E8C45] group-hover/upload:text-white rounded-full flex items-center justify-center transition-all">
                                                                    <Upload size={14} />
                                                                </div>
                                                                <span className="text-[7px] font-black uppercase text-slate-500 group-hover/upload:text-[#1E8C45] text-center px-1">Importer</span>
                                                            </>
                                                        )}
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="video/mp4, video/webm, video/ogg"
                                                            disabled={isProcessingFile}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    if (file.size > 100 * 1024 * 1024) {
                                                                        alert("⚠️ VIDÉO TROP LOURDE (Max 100 Mo)");
                                                                        return;
                                                                    }
                                                                    setIsProcessingFile(true);
                                                                    const reader = new FileReader();
                                                                    reader.onloadend = () => {
                                                                        setWelcomeVideo(reader.result as string);
                                                                        setIsProcessingFile(false);
                                                                    };
                                                                    reader.readAsDataURL(file);
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                    {welcomeVideo && (
                                                        <button 
                                                            onClick={() => setWelcomeVideo('')}
                                                            className="text-[8px] font-black uppercase text-rose-500 hover:text-rose-600 tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            Supprimer
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Carousel Cards */}
                        <div className="lg:col-span-7 space-y-4 md:space-y-6">
                            <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full min-h-[400px] md:min-h-[500px]">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                                    <div>
                                        <h3 className="text-base md:text-lg font-bold text-slate-800">Carousel</h3>
                                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5 tracking-tight">Cartes de présentation</p>
                                    </div>
                                    <button 
                                        onClick={handleAddWelcomeCard}
                                        className="bg-[#1E8C45]/10 hover:bg-[#1E8C45] text-[#1E8C45] hover:text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg md:rounded-xl font-bold text-[9px] md:text-xs transition-all flex items-center gap-1.5 md:gap-2"
                                    >
                                        <Plus size={14} />
                                        <span>Ajouter</span>
                                    </button>
                                </div>
                                
                                <div className="space-y-3 overflow-y-auto pr-1 md:pr-2 custom-scrollbar flex-1">
                                    {welcomeCards.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                            <ImageIcon size={32} className="mb-3" strokeWidth={1} />
                                            <p className="text-[10px] font-medium uppercase tracking-widest">Aucune carte</p>
                                        </div>
                                    )}
                                    {welcomeCards.map((card, idx) => (
                                        <div key={idx} className="group/card relative p-3 md:p-5 bg-slate-50/50 hover:bg-white rounded-xl md:rounded-2xl border border-slate-100 transition-all hover:shadow-lg hover:shadow-slate-200/50">
                                            <button 
                                                onClick={() => handleRemoveWelcomeCard(idx)}
                                                className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-white text-rose-500 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover/card:opacity-100 transition-all hover:scale-110 z-10 border border-rose-50"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                            
                                            <div className="flex gap-3 md:gap-5">
                                                <div className="relative group/img shrink-0">
                                                    <div className="w-12 h-12 md:w-20 md:h-20 rounded-lg md:rounded-2xl bg-slate-200 overflow-hidden border border-white shadow-sm relative">
                                                        <img src={card.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200'} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[1px]">
                                                            <Upload size={14} />
                                                        </div>
                                                    </div>
                                                    <label className="absolute inset-0 cursor-pointer">
                                                        <input 
                                                            type="file" 
                                                            className="hidden" 
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) {
                                                                    setIsProcessingFile(true);
                                                                    resizeImageFile(file).then(resized => {
                                                                        handleUpdateCard(idx, 'image', resized);
                                                                        setIsProcessingFile(false);
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                </div>
                                                
                                                <div className="flex-1 space-y-2">
                                                    <input 
                                                        type="text" 
                                                        value={card.title} 
                                                        onChange={(e) => handleUpdateCard(idx, 'title', e.target.value)}
                                                        placeholder="Titre..."
                                                        className="w-full bg-transparent border-b border-transparent focus:border-[#1E8C45] focus:outline-none font-bold text-[11px] md:text-sm text-slate-800 transition-all p-0"
                                                    />
                                                    <textarea 
                                                        rows={2}
                                                        value={card.text} 
                                                        onChange={(e) => handleUpdateCard(idx, 'text', e.target.value)}
                                                        placeholder="Description..."
                                                        className="w-full bg-transparent border-none focus:outline-none text-[10px] md:text-xs text-slate-500 font-medium resize-none p-0 scrollbar-hide"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activePage === 'portfolio_posts') {
            if (isAddingProduct) {
                return (
                    <div className="space-y-4 md:space-y-6 max-w-xl mx-auto pb-10 md:pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">{editingAfficheId ? 'Modifier Affiche' : 'Nouvelle Affiche'}</h2>
                                <p className="text-slate-500 text-[10px] md:text-xs mt-1">Visuel promotionnel du portfolio</p>
                            </div>
                            <button 
                                onClick={() => {
                                    setIsAddingProduct(false);
                                    setEditingAfficheId(null);
                                    setSelectedImage(null);
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] md:text-xs font-bold text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                            >
                                <ArrowLeft size={12} className="md:size-14" /> Annuler
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-2xl md:rounded-[24px] p-4 md:p-6 shadow-sm border border-slate-100 space-y-4 md:space-y-6">
                            <form className="space-y-4" onSubmit={handleSaveAffiche}>
                                <div className="space-y-2 pt-2">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Image de l'Affiche</label>
                                    <div className="relative group/upload">
                                        <label className="border-2 border-dashed border-slate-200 group-hover/upload:border-[#1E8C45] group-hover/upload:bg-[#1E8C45]/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 transition-all cursor-pointer relative overflow-hidden aspect-video w-full max-w-sm mx-auto">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                disabled={isProcessingFile}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setIsProcessingFile(true);
                                                        resizeImageFile(file).then(resized => {
                                                            setSelectedImage(resized);
                                                            setIsProcessingFile(false);
                                                        });
                                                    }
                                                }}
                                            />
                                            {isProcessingFile ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-[9px] md:text-[10px] font-bold text-[#1E8C45]">Chargement...</span>
                                                </div>
                                            ) : selectedImage ? (
                                                <>
                                                    <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover group-hover/upload:scale-105 transition-transform duration-700 font-sans" referrerPolicy="no-referrer" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                        <ImageIcon size={20} className="md:size-24 mb-1" />
                                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest">Changer l'image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#1E8C45]">
                                                       <Upload size={16} className="md:size-20" />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-[10px] md:text-xs font-black text-slate-800 block">Cliquer pour importer</span>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-slate-50">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alternative : Lien URL de l'Image direct (Internet)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={selectedImage || ''} 
                                            onChange={(e) => setSelectedImage(e.target.value)} 
                                            placeholder="Collez le lien de l'image ici (ex: https://images.unsplash.com/...)" 
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs font-semibold" 
                                        />
                                        {selectedImage && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(selectedImage);
                                                    alert("Lien de l'image copié dans le presse-papiers !");
                                                }}
                                                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all"
                                                title="Surligner/copier le lien de l'image actuel"
                                            >
                                                <Link size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium ml-1">Vous pouvez directement coller une URL d'image existante ou copier celle-ci.</p>
                                </div>

                                <div className="space-y-2 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Vidéo de l'Affiche (Optionnelle)</label>
                                    
                                    {/* Video Preview and Local File Uploader */}
                                    <div className="flex flex-col gap-4">
                                        {afficheVideo && (
                                            <div className="w-full max-w-sm mx-auto aspect-video rounded-2xl overflow-hidden bg-black shadow-md border border-slate-100">
                                                {getYouTubeEmbedUrl(afficheVideo) ? (
                                                    <iframe
                                                        src={getYouTubeEmbedUrl(afficheVideo)!}
                                                        className="w-full h-full border-0"
                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                        allowFullScreen
                                                        title="YouTube video preview"
                                                    ></iframe>
                                                ) : (
                                                    <video 
                                                        key={afficheVideo}
                                                        src={afficheVideo} 
                                                        className="w-full h-full object-cover" 
                                                        controls 
                                                        autoPlay
                                                        playsInline
                                                        muted 
                                                    />
                                                )}
                                            </div>
                                        )}

                                        <div className="relative group/vid-upload">
                                            <label className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 transition-all cursor-pointer relative overflow-hidden p-6 w-full max-w-sm mx-auto ${afficheVideo && afficheVideo.startsWith('data:') ? 'border-[#1E8C45] bg-[#1E8C45]/5' : 'border-slate-200 hover:border-[#1E8C45] hover:bg-slate-50'}`}>
                                                <input 
                                                    type="file" 
                                                    ref={afficheVideoInputRef}
                                                    className="hidden" 
                                                    accept="video/*"
                                                    disabled={isProcessingAfficheVideo}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            if (file.size > 100 * 1024 * 1024) {
                                                                alert("La vidéo est trop lourde. Veuillez utiliser une vidéo de moins de 100Mo.");
                                                                return;
                                                            }
                                                            setIsProcessingAfficheVideo(true);
                                                            
                                                            // Create a temporary URL for immediate preview
                                                            const objectUrl = URL.createObjectURL(file);
                                                            setAfficheVideo(objectUrl);

                                                            const reader = new FileReader();
                                                            reader.onload = (event) => {
                                                                try {
                                                                    const result = event.target?.result as string;
                                                                    // The Base64 is stored in a hidden field or kept for later save
                                                                    // We update the state with Base64 ONLY when reader finishes
                                                                    setAfficheVideo(result);
                                                                } catch (error) {
                                                                    console.error("FileReader error:", error);
                                                                } finally {
                                                                    setIsProcessingAfficheVideo(false);
                                                                }
                                                            };
                                                            reader.onerror = () => {
                                                                console.error("FileReader failed");
                                                                setIsProcessingAfficheVideo(false);
                                                            };
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }}
                                                />
                                                {isProcessingAfficheVideo ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-6 h-6 border-2 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-[10px] font-bold text-[#1E8C45]">Chargement de la vidéo...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-center">
                                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#1E8C45]">
                                                            <Upload size={20} />
                                                        </div>
                                                        <div>
                                                            <span className="text-xs font-black text-slate-800 block">Cliquer pour importer une vidéo locale</span>
                                                            <span className="text-[10px] text-slate-400 mt-1 block">Fichier vidéo .mp4, .mov, etc.</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 pt-2">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Alternative : Lien URL de la Vidéo direct (Internet)</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={afficheVideo && !afficheVideo.startsWith('data:') ? afficheVideo : ''} 
                                            onChange={(e) => setAfficheVideo(e.target.value)} 
                                            placeholder="Collez le lien de la vidéo ici (ex: https://assets.mixkit.co/... .mp4)" 
                                            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-xs font-semibold" 
                                        />
                                        {afficheVideo && !afficheVideo.startsWith('data:') && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    navigator.clipboard.writeText(afficheVideo);
                                                    alert("Lien de la vidéo copié !");
                                                }}
                                                className="px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center transition-all"
                                                title="Surligner/copier le lien de la vidéo actuel"
                                            >
                                                <Link size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-medium ml-1">Vous pouvez coller une URL de vidéo .mp4 existante de votre choix pour l'affiche.</p>
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isProcessingFile || isProcessingAfficheVideo || isSavingAffiche}
                                        className="w-full md:w-auto bg-[#1E8C45] hover:bg-[#007542] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-lg shadow-[#1E8C45]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSavingAffiche ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ENREGISTREMENT...
                                            </>
                                        ) : (
                                            editingAfficheId ? 'Sauvegarder les modifications' : 'Ajouter l\'Affiche'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 md:pb-20">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Portfolio & Affiches</h2>
                            <p className="text-slate-400 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mt-1">Visuels promotionnels du site public</p>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingAfficheId(null);
                                setAfficheTitleFr('');
                                setAfficheTitleEn('');
                                setAfficheDescFr('');
                                setAfficheDescEn('');
                                setSelectedImage(null);
                                setAfficheVideo('');
                                setIsAddingProduct(true);
                            }}
                            className="bg-[#1E8C45] hover:bg-[#007542] text-white px-6 md:px-10 py-3.5 md:py-4 rounded-xl md:rounded-2xl font-black uppercase tracking-wider text-[10px] md:text-xs shadow-xl shadow-[#1E8C45]/20 flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-95 w-full md:w-auto"
                        >
                            <ImageIcon size={16} className="md:size-18" />
                            Nouvelle Affiche
                        </button>
                    </div>

                    {!portfolioAffiches || portfolioAffiches.length === 0 ? (
                        <div className="bg-white border border-slate-100 rounded-3xl p-8 md:p-12 text-center text-slate-400">
                            <ImageIcon className="mx-auto text-slate-300 mb-4" size={32} md:size={48} />
                            <h3 className="font-black text-slate-700 text-base md:text-lg">Aucune affiche</h3>
                            <p className="text-[10px] md:text-xs text-slate-400 mt-1">Créez votre première affiche pour le portfolio.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 font-sans">
                            {(portfolioAffiches || []).map((a, idx) => (
                                <div key={a.id || idx} className="bg-white rounded-2xl md:rounded-[20px] border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                                    <div className="aspect-[4/3] relative flex items-center justify-center bg-slate-100 overflow-hidden">
                                        {a.image ? (
                                            <img src={a.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                                        ) : (
                                            <ImageIcon className="text-slate-400" size={20} />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-85 transition-opacity"></div>
                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 z-10">
                                            <button 
                                                onClick={() => handleEditAffiche(a)} 
                                                className="w-6 h-6 bg-white/90 backdrop-blur-md rounded border border-white/20 text-[#1E8C45] shadow-lg flex items-center justify-center hover:bg-white active:scale-90 transition-all" title="Modifier">
                                                <Edit2 size={10} />
                                            </button>
                                            <button onClick={() => handleDeleteAffiche(a.id)} className="w-6 h-6 bg-white/90 backdrop-blur-md rounded border border-white/20 text-red-500 shadow-lg flex items-center justify-center hover:bg-white active:scale-90 transition-all" title="Supprimer">
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="p-3 md:p-3.5 flex-1 flex flex-col justify-between text-left bg-slate-50/40">
                                        <div>
                                            <h4 className="font-black text-[11px] md:text-[13px] text-slate-800 leading-tight mb-0.5 line-clamp-1">{a.titleFr || `Affiche #${idx + 1}`}</h4>
                                            <p className="text-[8px] md:text-[9px] text-[#1E8C45] font-extrabold uppercase tracking-wide flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-[#1E8C45]" />
                                                {a.video ? "Vidéo" : "Image"}
                                            </p>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                                            <span>MEDIA</span>
                                            <span>{idx + 1}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        if (activePage === 'team') {
            if (isAddingProduct) {
                return (
                    <div className="space-y-6 max-w-xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{editingId ? 'Modifier Membre' : 'Nouveau Membre'}</h2>
                                <p className="text-slate-500 text-xs mt-1">Ajoutez informations et responsabilités</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingProduct(false)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                            >
                                <ArrowLeft size={14} /> Annuler
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                            <form className="space-y-4" onSubmit={handleSaveTeam}>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom Complet</label>
                                    <input type="text" value={teamName} onChange={(e)=>setTeamName(e.target.value)} placeholder="Ex: Jean Dupont" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-bold" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Rôle</label>
                                    <input type="text" value={teamRole} onChange={(e)=>setTeamRole(e.target.value)} placeholder="Ex: Ingénieur Backend" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-medium" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Numéro de Téléphone</label>
                                    <input type="text" value={teamPhone} onChange={(e)=>setTeamPhone(e.target.value)} placeholder="+33 6 12 34 56 78" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-medium" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Travail Quotidien</label>
                                    <textarea rows={2} value={teamDesc} onChange={(e)=>setTeamDesc(e.target.value)} placeholder="Description des tâches..." className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-medium" />
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-50">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Photo du Membre</label>
                                    <div className="relative group/upload">
                                        <label className="border-2 border-dashed border-slate-200 group-hover/upload:border-[#1E8C45] group-hover/upload:bg-[#1E8C45]/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 transition-all cursor-pointer relative overflow-hidden aspect-[4/5] w-full max-w-[200px] mx-auto">
                                            <input 
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                disabled={isProcessingFile}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        setIsProcessingFile(true);
                                                        resizeImageFile(file).then(resized => {
                                                            setSelectedImage(resized);
                                                            setIsProcessingFile(false);
                                                        });
                                                    }
                                                }}
                                            />
                                            {isProcessingFile ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-6 h-6 border-2 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-[10px] font-bold text-[#1E8C45]">Chargement...</span>
                                                </div>
                                            ) : selectedImage ? (
                                                <>
                                                    <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover group-hover/upload:scale-105 transition-transform duration-700 font-sans" referrerPolicy="no-referrer" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                        <ImageIcon size={24} className="mb-1" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Changer l'image</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-[#1E8C45]">
                                                       <Upload size={20} />
                                                    </div>
                                                    <div className="text-center">
                                                        <span className="text-xs font-black text-slate-800 block">Cliquer pour importer</span>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>

                                
                                <div className="flex justify-end pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isProcessingFile}
                                        className="w-full md:w-auto bg-[#1E8C45] hover:bg-[#007542] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wider text-[10px] shadow-lg shadow-[#1E8C45]/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {editingId ? 'Sauvegarder les modifications' : 'Ajouter Membre'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-6 max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight">Gestion d'Équipe</h2>
                            <p className="text-slate-500 text-[10px] mt-0.5">Équipe Djapero</p>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingId(null);
                                setTeamName('');
                                setTeamRole('');
                                setTeamPhone('');
                                setTeamDesc('');
                                setSelectedImage(null);
                                setIsAddingProduct(true);
                            }}
                            className="bg-[#1E8C45] hover:bg-[#007542] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-wider text-xs shadow-xl shadow-[#1E8C45]/20 flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <Users size={18} />
                            Nouveau Membre
                        </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 px-2">
                        {(team || []).map(m => (
                            <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                <div className="aspect-square relative flex items-center justify-center bg-slate-100 overflow-hidden">
                                    {m.image ? (
                                        <img src={m.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                                    ) : (
                                        <Users className="text-slate-400" size={32} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 z-10">
                                        <button onClick={() => handleEditTeam(m)} className="w-7 h-7 bg-white/90 backdrop-blur-md rounded border border-white/20 text-[#1E8C45] shadow-lg flex items-center justify-center hover:bg-white active:scale-90 transition-all">
                                            <Briefcase size={12} />
                                        </button>
                                        <button onClick={() => handleDeleteTeam(m.id)} className="w-7 h-7 bg-white/90 backdrop-blur-md rounded border border-white/20 text-red-500 shadow-lg flex items-center justify-center hover:bg-white active:scale-90 transition-all">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="absolute bottom-3 left-3 right-3 text-white text-left">
                                        <h4 className="font-black text-sm lg:text-base leading-tight mb-0.5">{m.name}</h4>
                                        <p className="text-[8px] lg:text-[9px] text-slate-200 font-bold uppercase tracking-widest leading-tight">{m.role}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (activePage === 'store') {
            if (isAddingProduct) {
                return (
                    <div className="space-y-6 max-w-lg mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black text-slate-800 tracking-tight">{editingId ? 'Modifier le Produit' : 'Nouveau Produit'}</h2>
                                <p className="text-slate-500 text-[10px]">Ajoutez un nouvel article à votre catalogue</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingProduct(false)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[9px] font-bold text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                            >
                                <ArrowLeft size={12} /> Annuler
                            </button>
                        </div>
                        
                    <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm border border-slate-100 space-y-4 md:space-y-6">
                            <form className="space-y-4" onSubmit={handleSave}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Nom du produit</label>
                                        <input type="text" value={productName || ''} onChange={(e)=>setProductName(e.target.value)} placeholder="Ex: Banane Plantain" className="w-full px-4 py-2 md:py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs font-bold" required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Catégorie</label>
                                        <select value={productCategory || 'Fruits & Légumes'} onChange={(e)=>setProductCategory(e.target.value)} className="w-full px-4 py-2 md:py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs font-bold appearance-none">
                                            <option>Fruits & Légumes</option>
                                            <option>Épicerie & Biscuits</option>
                                            <option>Volailles & Élevage</option>
                                        </select>
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Prix en Gros (FCFA)</label>
                                        <input type="number" value={productGros || ''} onChange={(e)=>setProductGros(e.target.value)} placeholder="Ex: 5000" className="w-full px-4 py-2 md:py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Prix en Détail (FCFA)</label>
                                        <input type="number" value={productDetail || ''} onChange={(e)=>setProductDetail(e.target.value)} placeholder="Ex: 6500" className="w-full px-4 py-2 md:py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Mesure / Unité</label>
                                        <input type="text" value={productMeasure || ''} onChange={(e)=>setProductMeasure(e.target.value)} placeholder="Ex: 1Kg, 5L" className="w-full px-4 py-2 md:py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs font-bold" />
                                    </div>
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Description</label>
                                    <textarea rows={2} value={productDesc || ''} onChange={(e)=>setProductDesc(e.target.value)} placeholder="Description..." className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs leading-relaxed"></textarea>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-50">
                                    <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-1">Image du produit</label>
                                    
                                    <div className="space-y-2">
                                        <input 
                                            type="text" 
                                            value={productImageUrl || ''} 
                                            onChange={(e) => {
                                                setProductImageUrl(e.target.value);
                                                setSelectedImage(e.target.value);
                                            }}
                                            placeholder="URL de l'image..." 
                                            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-[11px] md:text-xs font-medium shadow-inner" 
                                        />
                                        
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <label className="border-2 border-dashed border-slate-200 group/upload hover:border-[#1E8C45] hover:bg-[#1E8C45]/5 rounded-xl flex flex-col items-center justify-center gap-1 text-slate-500 transition-all cursor-pointer relative overflow-hidden h-20 w-20 md:h-24 md:w-24 shrink-0">
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/png, image/jpeg"
                                                    disabled={isProcessingFile}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setIsProcessingFile(true);
                                                            resizeImageFile(file).then(resized => {
                                                                setSelectedImage(resized);
                                                                setProductImageUrl(resized);
                                                                setIsProcessingFile(false);
                                                            });
                                                        }
                                                    }}
                                                />
                                                {isProcessingFile ? (
                                                    <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                ) : selectedImage ? (
                                                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <>
                                                        <Upload size={14} className="md:size-16 text-slate-300 group-hover/upload:text-[#1E8C45]" />
                                                        <span className="text-[7px] md:text-[8px] font-black uppercase text-slate-400 group-hover/upload:text-[#1E8C45]">Importer</span>
                                                    </>
                                                )}
                                            </label>
                                            <div className="text-slate-400 text-[8px] md:text-[9px] leading-relaxed">
                                                <p className="font-bold text-slate-800 uppercase tracking-widest text-[7px]">Format:</p>
                                                <p>PNG/JPG. Max 2Mo.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex justify-end pt-2">
                                    <button 
                                        type="submit" 
                                        disabled={isProcessingFile}
                                        className="w-full bg-[#1E8C45] hover:bg-[#007542] text-white px-8 py-2.5 rounded-xl font-black uppercase tracking-wider text-[9px] md:text-[10px] shadow-lg shadow-[#1E8C45]/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {editingId ? 'Sauvegarder' : 'Ajouter'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-6 max-w-4xl mx-auto pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3 mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Catalogue & Boutique</h2>
                            <p className="text-slate-500 text-sm mt-0.5">Gérez vos stocks et tarifs</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => {
                                    setEditingId(null);
                                    setProductName('');
                                    setProductCategory('Fruits & Légumes');
                                    setProductGros('');
                                    setProductDetail('');
                                    setProductDesc('');
                                    setSelectedImage(null);
                                    setIsAddingProduct(true);
                                }}
                                className="bg-[#1E8C45] hover:bg-[#007542] text-white px-5 h-10 rounded-lg font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                <ShoppingBasket size={18} />
                                Ajouter un produit
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl md:rounded-[40px] shadow-sm border border-slate-100 overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="py-4 md:py-6 px-4 md:px-8 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Produit</th>
                                    <th className="py-4 md:py-6 px-4 md:px-8 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Catégorie</th>
                                    <th className="py-4 md:py-6 px-4 md:px-8 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Détail</th>
                                    <th className="py-4 md:py-6 px-4 md:px-8 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest">Gros</th>
                                    <th className="py-4 md:py-6 px-4 md:px-8 text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {(products || []).map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex-shrink-0 overflow-hidden border border-slate-100 group-hover:scale-110 transition-transform">
                                                    {item.image ? (
                                                        <img 
                                                            src={item.image} 
                                                            alt={item.name} 
                                                            className="w-full h-full object-cover" 
                                                            onError={(e) => {
                                                                e.currentTarget.onerror = null;
                                                                e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                            <Store size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-black text-slate-800 text-xs block">{item.name}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="text-[9px] font-black py-0.5 px-2 bg-slate-100 text-slate-500 rounded-full uppercase tracking-tighter">{item.category}</span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="font-black text-[#1E8C45] text-xs">{item.priceDetail}</span>
                                            <span className="text-[9px] font-bold text-[#1E8C45] ml-1">FCFA</span>
                                        </td>
                                        <td className="py-3 px-4 text-slate-600">
                                            <span className="font-black text-slate-800 text-xs">{item.priceGros}</span>
                                            <span className="text-[9px] font-bold text-slate-400 ml-1">FCFA</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 transition-all">
                                                <button onClick={() => handleEdit(item)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                    <Briefcase size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id)} className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {products.length === 0 && (
                            <div className="py-20 text-center text-slate-300">
                                <ShoppingBasket size={48} strokeWidth={1} className="mx-auto mb-4" />
                                <p className="text-sm font-medium">Votre catalogue est vide</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        if (activePage === 'registrations') {
            return (
                <div className="space-y-6">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Nouvelles Inscriptions</h2>
                    <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-slate-100 overflow-x-auto">
                        <table className="w-full min-w-[600px]">
                            <thead>
                                <tr className="text-left text-xs font-black text-slate-400 uppercase tracking-widest">
                                    <th className="pb-4">Identity</th>
                                    <th className="pb-4">Phone</th>
                                    <th className="pb-4">Source</th>
                                    <th className="pb-4">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(registeredUsers || []).map((u, i) => (
                                    <tr key={i} className="border-t border-slate-50 text-sm font-bold text-slate-600">
                                        <td className="py-4 capitalize">{u.identity}</td>
                                        <td className="py-4">{u.phoneNumber}</td>
                                        <td className="py-4">{u.source}</td>
                                        <td className="py-4">{u.timestamp ? new Date(u.timestamp).toLocaleDateString() : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

        if (activePage === 'notifications') {
            if (isAddingProduct) {
                return (
                    <div className="space-y-6 max-w-xl mx-auto pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Nouvelle Notification</h2>
                                <p className="text-slate-500 text-xs mt-1">Envoyez une promotion à tous vos clients</p>
                            </div>
                            <button 
                                onClick={() => setIsAddingProduct(false)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 transition-all shadow-sm"
                            >
                                <ArrowLeft size={14} /> Annuler
                            </button>
                        </div>
                        
                        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 space-y-6">
                            <form className="space-y-4" onSubmit={handleSaveNotification}>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Titre de la Promotion</label>
                                    <input type="text" value={notifTitle} onChange={(e)=>setNotifTitle(e.target.value)} placeholder="Ex: Promotion du Weekend !" className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-bold" required />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Message</label>
                                    <textarea value={notifMessage} onChange={(e)=>setNotifMessage(e.target.value)} placeholder="Détails de l'offre..." className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-medium min-h-[100px]" required />
                                </div>
                                
                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Image de la Promotion</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative group/upload">
                                            <label className="border-2 border-dashed border-slate-200 group-hover/upload:border-[#1E8C45] group-hover/upload:bg-[#1E8C45]/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 transition-all cursor-pointer relative overflow-hidden aspect-video w-full">
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    disabled={isProcessingFile}
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            setIsProcessingFile(true);
                                                            resizeImageFile(file).then(resized => {
                                                                setSelectedImage(resized);
                                                                setIsProcessingFile(false);
                                                            });
                                                        }
                                                    }}
                                                />
                                                {isProcessingFile ? (
                                                    <div className="flex flex-col items-center gap-2">
                                                        <div className="w-6 h-6 border-2 border-[#1E8C45] border-t-transparent rounded-full animate-spin"></div>
                                                        <span className="text-[8px] font-black uppercase text-[#1E8C45]">Traitement...</span>
                                                    </div>
                                                ) : selectedImage ? (
                                                    <>
                                                        <img src={selectedImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/upload:opacity-100 transition-opacity flex flex-col items-center justify-center text-white backdrop-blur-[2px]">
                                                            <ImageIcon size={20} className="mb-1" />
                                                            <span className="text-[8px] font-black uppercase tracking-widest">Changer</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-center p-4">
                                                        <Upload size={24} className="text-[#1E8C45]" />
                                                        <span className="text-[10px] font-black text-slate-600">Importer une image</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                        
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ou Lien URL</label>
                                            <input type="text" value={notifImage} onChange={(e)=>setNotifImage(e.target.value)} placeholder="https://..." className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-medium" />
                                            <p className="text-[8px] text-slate-400 font-medium italic">Optionnel : L'image sera incluse dans le message de notification.</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <input 
                                        type="checkbox" 
                                        id="notif_active" 
                                        checked={isNotifActive} 
                                        onChange={(e) => setIsNotifActive(e.target.checked)}
                                        className="w-5 h-5 rounded-lg border-slate-300 text-[#1E8C45] focus:ring-[#1E8C45]"
                                    />
                                    <label htmlFor="notif_active" className="text-xs font-black text-slate-700 cursor-pointer">Activer immédiatement</label>
                                </div>

                                <button type="submit" className="w-full py-4 bg-[#1E8C45] text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-[#1E8C45]/20 hover:bg-[#166e36] transition-all">
                                    Diffuser la Notification
                                </button>
                            </form>
                        </div>
                    </div>
                );
            }

            return (
                <div className="space-y-6 pb-20">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Notifications & Promotions</h2>
                            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] mt-1">Communiquez avec vos clients</p>
                        </div>
                        <button 
                            onClick={() => setIsAddingProduct(true)}
                            className="bg-[#1E8C45] text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#1E8C45]/20 hover:scale-105 transition-all active:scale-95"
                        >
                            <Bell size={16} /> Envoyer une Promo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {notifications.map((n) => (
                            <div key={n.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex gap-4 group">
                                <div className="w-16 h-16 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100">
                                    {n.image ? (
                                        <img src={n.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[#1E8C45]/30">
                                            <Sparkles size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <h4 className="font-black text-sm text-slate-800">{n.title}</h4>
                                            <div className={`w-2 h-2 rounded-full ${n.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        </div>
                                        <p className="text-xs text-slate-500 line-clamp-2 leading-tight">{n.message}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => toggleNotificationStatus(n.id)}
                                                className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${n.isActive ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                                            >
                                                {n.isActive ? 'Désactiver' : 'Activer'}
                                            </button>
                                            <button 
                                                onClick={() => deleteNotification(n.id)}
                                                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                                            >
                                                Supprimer
                                            </button>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {notifications.length === 0 && (
                        <div className="py-20 text-center text-slate-300 bg-white rounded-3xl border-2 border-dashed border-slate-100">
                            <Bell size={48} strokeWidth={1} className="mx-auto mb-4" />
                            <p className="text-sm font-medium tracking-tight">Aucune notification envoyée</p>
                        </div>
                    )}
                </div>
            );
        }

        if (activePage === 'settings') {
            return (
                <div className="space-y-6 max-w-xl">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter">Paramètres Admin</h2>
                    <div className="bg-white rounded-3xl p-10 shadow-sm border border-slate-100 space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Numéro de téléphone Admin</label>
                            <input 
                                type="tel" 
                                value={adminPhoneNumber} 
                                onChange={(e) => setAdminPhoneNumber(e.target.value)} 
                                className="w-full px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 focus:outline-none focus:border-[#1E8C45] focus:bg-white transition-all text-sm font-bold shadow-inner" 
                                placeholder="Ex: 2250701020304" 
                            />
                            <p className="text-[9px] text-slate-400 ml-1 italic font-medium">Format conseillé: 225XXXXXXXXXX (avec l'indicatif pays)</p>
                        </div>
                        <button 
                            disabled={isSavingAdminPhone}
                            onClick={async () => {
                                setIsSavingAdminPhone(true);
                                // Clean up the phone number: remove spaces and +
                                let cleaned = adminPhoneNumber.trim().replace(/\s+/g, '').replace('+', '');
                                
                                // Auto-correct for common Côte d'Ivoire format (8 or 10 digits without prefix)
                                if ((cleaned.length === 8 || cleaned.length === 10) && !cleaned.startsWith('225')) {
                                    cleaned = '225' + cleaned;
                                }

                                localStorage.setItem('djapero_admin_phone', cleaned);
                                setAdminPhoneNumber(cleaned);
                                window.dispatchEvent(new Event('storage'));
                                
                                try {
                                    await syncAdminPhoneToFirestore(cleaned);
                                    alert('Numéro enregistré avec succès et synchronisé !');
                                } catch (e) {
                                    console.error(e);
                                    alert('Numéro enregistré localement, mais échec de la synchronisation.');
                                } finally {
                                    setIsSavingAdminPhone(false);
                                }
                            }}
                            className={`w-full ${isSavingAdminPhone ? 'bg-slate-400' : 'bg-[#1E8C45] hover:bg-[#007542]'} text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-[#1E8C45]/30 transition-all active:scale-95 flex items-center justify-center gap-2`}
                        >
                            {isSavingAdminPhone ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Synchronisation...
                                </>
                            ) : (
                                'Enregistrer le numéro'
                            )}
                        </button>
                    </div>
                </div>
            );
        }

        if (activePage === 'dashboard') {
            return (
                <div className="space-y-4 lg:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4 lg:mb-6">
                        <div>
                            <h2 className="text-lg lg:text-xl font-bold text-slate-800">Dashboard</h2>
                            <p className="text-slate-500 text-[10px] lg:text-sm mt-0.5">Status: En ligne</p>
                        </div>
                        <div className="hidden lg:flex items-center gap-2">
                            <button 
                                onClick={async () => {
                                    try {
                                        await downloadAllFromFirestore(true);
                                        alert('Synchronisation complète avec le Cloud réussie !');
                                    } catch (err) {
                                        alert('Erreur lors de la synchronisation.');
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 hover:text-[#1E8C45] hover:border-[#1E8C45]/20 transition-all shadow-sm group"
                            >
                                <Sparkles size={14} className="group-hover:animate-spin" />
                                SYNC CLOUD
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
                        {[
                            { label: 'Ventes', value: '124,500', unit: 'FCFA', color: 'blue', icon: ShoppingBasket, trend: '+12%' },
                            { label: 'Clients', value: '18', unit: 'Auj.', color: 'green', icon: Users, trend: '+5%' },
                            { label: 'Marchés', value: (markets || []).length.toString(), unit: 'Villes', color: 'orange', icon: MapPin, trend: 'stable' },
                            { label: 'Stocks', value: (products || []).length.toString(), unit: 'Articles', color: 'purple', icon: Store, trend: '-2%' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white p-2.5 lg:p-5 rounded-lg lg:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                                <div className="flex items-center justify-between mb-1.5 lg:mb-3">
                                    <div className={`w-7 h-7 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl flex items-center justify-center transition-transform duration-500 group-hover:scale-105 shadow-sm ${
                                        stat.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                                        stat.color === 'green' ? 'bg-emerald-50 text-emerald-500' :
                                        stat.color === 'orange' ? 'bg-orange-50 text-orange-500' :
                                        'bg-purple-50 text-purple-500'
                                    }`}>
                                        <stat.icon size={12} className="lg:hidden" />
                                        <stat.icon size={18} className="hidden lg:block" />
                                    </div>
                                    <span className={`text-[6px] lg:text-[9px] font-bold px-1 lg:px-2 py-0.5 rounded ${stat.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                        {stat.trend}
                                    </span>
                                </div>
                                <h3 className="text-slate-400 text-[8px] lg:text-[9px] font-bold uppercase tracking-[0.05em] mb-0.5 lg:mb-1">{stat.label}</h3>
                                <p className="text-sm lg:text-xl font-black text-slate-800 leading-none">
                                    {stat.value} <span className="text-[7px] lg:text-[10px] font-bold text-slate-400 ml-0.5 lg:ml-1">{stat.unit}</span>
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
                        <div className="lg:col-span-8 space-y-4 lg:space-y-8">
                            <div className="aspect-video lg:w-full lg:h-64 rounded-xl lg:rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 border border-white relative bg-slate-900 group">
                                <video 
                                    key={campaignVideo}
                                    autoPlay 
                                    muted 
                                    loop 
                                    playsInline
                                    className="w-full h-full object-contain transition-transform duration-1000 group-hover:scale-105"
                                >
                                    <source src={campaignVideo} type="video/mp4" />
                                </video>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3 lg:p-4">
                                    <div className="flex items-center justify-between">
                                         <div className="max-w-md">
                                             <span className="text-[8px] lg:text-[9px] font-black bg-[#1E8C45] text-white px-1.5 py-0.5 rounded-full uppercase tracking-widest mb-1 inline-block shadow-sm">Active</span>
                                             <h4 className="text-base lg:text-xl font-black text-white mb-0.5 leading-tight tracking-tight">Vidéo Principale</h4>
                                             <p className="text-white/80 text-[9px] lg:text-[10px] font-medium leading-relaxed">Design client.</p>
                                         </div>
                                         <div className="flex items-center gap-2">
                                             <input 
                                                 type="file" 
                                                 ref={campaignVideoInputRef}
                                                 className="hidden" 
                                                 accept="video/*"
                                                 onChange={(e) => {
                                                     const file = e.target.files?.[0];
                                                     if (file) {
                                                         if (file.size > 100 * 1024 * 1024) {
                                                             alert("La vidéo est trop lourde. Veuillez utiliser une vidéo de moins de 100Mo.");
                                                             return;
                                                         }
                                                         const reader = new FileReader();
                                                         reader.onload = async (event) => {
                                                             try {
                                                                 const result = event.target?.result as string;
                                                                 setCampaignVideo(result);
                                                                 await saveVideo('djapero_campaign_video', result);
                                                                 await syncCampaignVideoToFirestore(result);
                                                                 window.dispatchEvent(new Event('storage'));
                                                             } catch (error) {
                                                                 console.error("Storage error:", error);
                                                             }
                                                         };
                                                         reader.readAsDataURL(file);
                                                     }
                                                 }}
                                             />
                                             <button 
                                                 onClick={() => campaignVideoInputRef.current?.click()}
                                                 className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-lg flex items-center justify-center transition-all active:scale-90 shadow-lg"
                                                 title="Importer la vidéo"
                                             >
                                                 <Upload size={16} />
                                             </button>
                                         </div>
                                     </div>
                                 </div>
                            </div>

                            <div className="bg-white rounded-2xl lg:rounded-[40px] p-4 lg:p-8 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-4 lg:mb-8">
                                    <h3 className="text-base lg:text-xl font-black text-slate-800 tracking-tight">Activités Récentes</h3>
                                    <button className="text-[8px] font-black text-[#1E8C45] bg-emerald-50 px-2.5 lg:px-4 py-1.5 lg:py-2 rounded-lg lg:rounded-xl uppercase tracking-widest hover:bg-emerald-100 transition-colors">Explorer</button>
                                </div>
                                <div className="space-y-2 lg:space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center gap-3 lg:gap-5 p-2.5 lg:p-4 rounded-xl lg:rounded-2xl hover:bg-slate-50 transition-all group">
                                            <div className="w-9 h-9 lg:w-14 lg:h-14 rounded-lg lg:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black shrink-0 text-[9px] lg:text-sm">
                                                #{1023 + i}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-slate-800 text-xs lg:text-base leading-tight group-hover:text-[#1E8C45] transition-colors line-clamp-1">Nouvelle commande</h4>
                                                <p className="text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-tight">Il y a {i * 15} min</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-slate-800 text-sm lg:text-lg">4,500 <span className="text-[7px] lg:text-[10px]">CFA</span></p>
                                                <span className="text-[6px] lg:text-[9px] bg-emerald-50 text-emerald-600 px-1.5 lg:px-3 py-0.5 lg:py-1 rounded-full font-black uppercase tracking-widest mt-0.5 inline-block">OK</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-4 flex flex-col gap-8">
                            <div className="bg-gradient-to-br from-slate-900 to-black p-5 lg:p-8 rounded-2xl lg:rounded-[48px] text-white flex flex-col justify-between overflow-hidden relative group min-h-[260px] lg:min-h-[420px] shadow-2xl shadow-slate-900/30">
                                <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-1000"></div>
                                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-40 transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12">
                                    <Sparkles size={80} className="lg:hidden" strokeWidth={1} />
                                    <Sparkles size={180} className="hidden lg:block" strokeWidth={1} />
                                </div>
                                
                                <div className="relative z-10 w-full font-sans">
                                    <div className="w-10 h-10 lg:w-16 lg:h-16 bg-white/10 backdrop-blur-md rounded-xl lg:rounded-[24px] flex items-center justify-center mb-4 lg:mb-8 border border-white/10">
                                        <Store className="text-emerald-400 lg:hidden" size={20} />
                                        <Store className="text-emerald-400 hidden lg:block" size={32} />
                                    </div>
                                    <h3 className="text-lg lg:text-4xl font-black leading-tight tracking-tighter mb-2 lg:mb-4 uppercase">Design en Direct</h3>
                                    <p className="text-slate-400 text-[10px] lg:text-sm font-medium leading-relaxed max-w-[200px] lg:max-w-[280px]">Mettez à jour vos bannières et titres en un éclair.</p>
                                </div>

                                <button 
                                    onClick={() => setActivePage('welcome')}
                                    className="relative z-10 w-full bg-[#1E8C45] hover:bg-[#007542] text-white py-3.5 lg:py-5 rounded-xl lg:rounded-[28px] font-black uppercase tracking-widest text-[9px] lg:text-xs transition-all active:scale-95 shadow-xl shadow-[#1E8C45]/40 flex items-center justify-center gap-2 lg:gap-3 group"
                                >
                                    Modifier
                                    <ArrowLeft size={14} className="rotate-180 group-hover:translate-x-2 transition-transform lg:hidden" />
                                    <ArrowLeft size={18} className="rotate-180 hidden lg:flex group-hover:translate-x-2 transition-transform" />
                                </button>
                            </div>

                            <div className="bg-white p-5 lg:p-10 rounded-2xl lg:rounded-[40px] shadow-sm border border-slate-100 flex-1 flex flex-col font-sans">
                                <h3 className="text-base lg:text-xl font-black text-slate-800 tracking-tight mb-4 lg:mb-8">Stock de Sécurité</h3>
                                <div className="space-y-4 lg:space-y-8 flex-1">
                                    {[
                                        { name: 'Banane Plantain', level: 12, max: 100, color: 'bg-red-500' },
                                        { name: 'Ananas Pain', level: 8, max: 100, color: 'bg-orange-500' },
                                        { name: 'Papaye Solo', level: 35, max: 100, color: 'bg-emerald-500' },
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-2 lg:space-y-3">
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <h4 className="text-xs lg:text-sm font-black text-slate-800">{item.name}</h4>
                                                    <span className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.level < 15 ? 'Critique' : 'OK'}</span>
                                                </div>
                                                <span className={`text-[10px] lg:text-sm font-black ${item.level < 15 ? 'text-red-500' : 'text-emerald-500'}`}>{item.level}%</span>
                                            </div>
                                            <div className="h-2 bg-slate-50 rounded-full overflow-hidden p-0.5">
                                                <div 
                                                    className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-sm`} 
                                                    style={{ width: `${item.level}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-6 py-3.5 lg:py-4 bg-slate-900 text-white rounded-xl lg:rounded-[24px] font-black uppercase tracking-widest text-[9px] lg:text-[10px] hover:bg-black transition-all shadow-lg">Catalogue</button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="space-y-8">
                <h2 className="text-3xl font-bold capitalize">Manage {activePage}</h2>
                <div className="p-8 border-2 border-dashed border-gray-300 rounded-3xl flex flex-col items-center gap-4 text-gray-500">
                    <Upload className="w-12 h-12" />
                    <p>Drag & drop content to update {activePage}</p>
                    <button className="px-6 py-3 bg-gray-900 text-white rounded-full font-bold">Browse Files</button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#F4F7FE] text-slate-800 font-sans overflow-hidden">
            {/* Sidebar following the reference aesthetic */}
            <aside id="admin-sidebar" className="hidden lg:flex w-60 bg-white m-3 rounded-[28px] shadow-sm flex-col overflow-hidden shrink-0 border border-slate-100 relative z-40">
                <div className="p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#1E8C45] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#1E8C45]/20">
                            <Store size={20} />
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tight text-slate-800">Djapero</h1>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Admin</p>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-2 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="h-[1px] bg-slate-50 mb-6 mx-2"></div>
                    <nav className="flex flex-col gap-2">
                        {[
                            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                            { id: 'welcome', label: 'Bienvenue', icon: Sparkles },
                            { id: 'store', label: 'Boutique', icon: ShoppingBasket },
                            { id: 'localites', label: 'Localités', icon: MapPin },
                            { id: 'basket_settings', label: 'Panier Vide', icon: ShoppingBasket },
                            { id: 'team', label: 'Équipe', icon: Users },
                            { id: 'registrations', label: 'Inscriptions', icon: Users },
                            { id: 'portfolio_posts', label: 'Affiches Portfolio', icon: ImageIcon },
                            { id: 'notifications', label: 'Notifications', icon: Bell },
                            { id: 'settings', label: 'Paramètres', icon: Settings },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActivePage(item.id);
                                    setIsAddingProduct(false);
                                }}
                                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
                                    activePage === item.id 
                                    ? 'bg-[#1E8C45] text-white shadow-xl shadow-[#1E8C45]/20' 
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                <item.icon size={18} className={activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-[#1E8C45] transition-colors'} />
                                <span className="font-bold text-xs tracking-tight">{item.label}</span>
                                {activePage === item.id && (
                                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    <button 
                        onClick={onBack}
                        className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-2xl bg-white border border-slate-100 text-slate-400 font-bold hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all active:scale-95 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Exit Admin
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden flex flex-col pt-20 lg:pt-0">
                {/* Mobile Header */}
                <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between z-50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E8C45] rounded-lg flex items-center justify-center text-white">
                            <Store size={18} />
                        </div>
                        <span className="font-black text-slate-800 tracking-tight">Admin</span>
                    </div>
                    <button 
                        className="p-2 text-slate-400 bg-slate-50 rounded-xl"
                        onClick={() => {
                            const sidebar = document.getElementById('admin-sidebar');
                            if (sidebar) sidebar.classList.toggle('hidden');
                        }}
                    >
                        <LayoutDashboard size={20} />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 lg:p-8 custom-scrollbar">
                    <div className="max-w-[1600px] mx-auto pb-12">
                        {renderManagement()}
                    </div>
                </div>
            </main>
        </div>
    );
};
