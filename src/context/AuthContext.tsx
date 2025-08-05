// src/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  userRole: 'admin' | 'socialMedia' | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'socialMedia' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const roleDocRef = doc(db, 'userRoles', user.uid);
        const roleDocSnap = await getDoc(roleDocRef);
        setUserRole(roleDocSnap.exists() ? roleDocSnap.data().role : null);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, userRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Este hook agora é usado dentro do `AdminLayout` para proteger todo o painel.
export const useRequireAuth = () => {
    const { user, userRole, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Não faz nada enquanto os dados de autenticação estão carregando.
        if (loading) return;

        const isLoginPage = pathname === '/admin/login';
        
        // Se o usuário está logado...
        if (user) {
            // E tenta acessar a página de login, redireciona para o dashboard.
            if (isLoginPage) {
                router.replace('/admin/dashboard');
            } 
            // Se o usuário logado não tem um perfil válido, ele é deslogado e enviado para o login.
            else if (userRole !== 'admin' && userRole !== 'socialMedia') {
                 auth.signOut(); 
                 router.replace('/admin/login');
            }
        } 
        // Se não há usuário logado e a rota não é a de login, redireciona para o login.
        else if (!isLoginPage) {
            router.replace('/admin/login');
        }

    }, [user, userRole, loading, router, pathname]);

    // Retorna o status para que o layout possa exibir uma tela de carregamento ou conteúdo.
    return { user, userRole, loading };
}
