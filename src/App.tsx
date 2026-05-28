import { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { SignUp } from './components/SignUp';
import { Dashboard } from './components/Dashboard';
import { AdminPortal } from './components/AdminPortal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { RegistrationExtension } from './components/RegistrationExtension';
import { auth, logOut } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { downloadAllFromFirestore } from './lib/firestoreSync';
import { checkConnection } from './lib/firebase';

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [showRegistrationExtension, setShowRegistrationExtension] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [view, setView] = useState<'dashboard' | 'admin'>(() => (localStorage.getItem('djapero_view') as 'dashboard' | 'admin') || 'dashboard');

  useEffect(() => {
    localStorage.setItem('djapero_view', view);
  }, [view]);

  useEffect(() => {
    // Safety timeout to ensure we don't stay on splash forever if Auth/Firestore hangs
    const timeout = setTimeout(() => {
      setIsAuthChecking(false);
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(timeout);
      setUser(firebaseUser);
      setIsAuthChecking(false);
      
      if (firebaseUser) {
        // Run background download of all Firestore configs to localStorage/IndexedDB
        try {
          if (await checkConnection()) {
            await downloadAllFromFirestore();
          }
        } catch (err) {
          console.error("Initial Firestore Sync failed:", err);
        }

        // If logged in and no identity, show registration
        if (!localStorage.getItem('djapero_identity')) {
          setShowRegistrationExtension(true);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = (emailOrProvider: string) => {
    // This will be handled inside SignUp now
  };

  useEffect(() => {
    if (user && !isAuthChecking) {
      const isRegistered = !!localStorage.getItem('djapero_identity');
      if (!isRegistered && !showRegistrationExtension && !showWelcome) {
        setShowRegistrationExtension(true);
      }
    }
  }, [user, isAuthChecking, showRegistrationExtension, showWelcome]);

  if (isSplashVisible || isAuthChecking) {
    return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
  }

  if (!user) {
    return (
      <SignUp />
    );
  }

  const userEmail = user.email || "";
  const isAdmin = userEmail.toLowerCase() === 'jirehstar6@gmail.com';

  if (showRegistrationExtension) {
    return <RegistrationExtension onFinish={() => {
      setShowRegistrationExtension(false);
      setShowWelcome(true);
    }} />;
  }

  if (showWelcome) {
    return (
      <WelcomeScreen 
        onContinue={() => setShowWelcome(false)} 
        isAdmin={isAdmin}
        onGoToAdmin={() => {
          setShowWelcome(false);
          setView('admin');
        }}
      />
    );
  }

  if (view === 'admin' && isAdmin) {
    return <AdminPortal onBack={() => setView('dashboard')} />;
  }

  const handleLogout = async () => {
    try {
      await logOut();
      localStorage.removeItem('djapero_auth');
      localStorage.removeItem('djapero_user_email');
      localStorage.removeItem('djapero_identity');
      localStorage.removeItem('djapero_phone');
      localStorage.removeItem('djapero_source');
      localStorage.removeItem('djapero_view');
      setView('dashboard');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return <Dashboard userEmail={userEmail} onNavigate={(page) => setView(page as 'dashboard' | 'admin')} isAdmin={isAdmin} onLogout={handleLogout} />;
}
