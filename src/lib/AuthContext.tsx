import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  googleProvider, 
  auth, 
  firebaseSignOut 
} from './firebase';
import { Language } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  activeVehicleId: string | null;
  setActiveVehicleId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    return localStorage.getItem('sijil_is_guest') === 'true';
  });
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('sijil_lang');
    return (saved === 'en' || saved === 'ar') ? saved : 'ar';
  });
  const [activeVehicleId, setActiveVehicleIdState] = useState<string | null>(() => {
    return localStorage.getItem('sijil_active_vehicle');
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsGuest(false);
        localStorage.removeItem('sijil_is_guest');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sijil_lang', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  };

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setActiveVehicleId = (id: string | null) => {
    setActiveVehicleIdState(id);
    if (id) {
      localStorage.setItem('sijil_active_vehicle', id);
    } else {
      localStorage.removeItem('sijil_active_vehicle');
    }
  };

  const signInGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setIsGuest(false);
      localStorage.removeItem('sijil_is_guest');
    } catch (error: any) {
      console.error('Google sign-in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setIsGuest(false);
      localStorage.removeItem('sijil_is_guest');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    localStorage.setItem('sijil_is_guest', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest,
        signInGoogle,
        signOut,
        continueAsGuest,
        language,
        setLanguage,
        activeVehicleId,
        setActiveVehicleId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
