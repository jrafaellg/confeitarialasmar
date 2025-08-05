'use client';

import { useRequireAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // A rota de login não precisa de proteção.
  // A verificação de autenticação é feita pelo hook useRequireAuth.
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // O hook gerencia a lógica de redirecionamento e proteção para todas as outras rotas /admin.
  const { user, loading, userRole } = useRequireAuth();
  
  // Exibe um spinner de carregamento global para o painel de admin enquanto
  // a autenticação está sendo verificada.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  // Se, após o carregamento, não houver usuário ou perfil válido,
  // o hook já terá iniciado o redirecionamento. Mostramos uma mensagem.
  if (!user || (userRole !== 'admin' && userRole !== 'socialMedia')) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Redirecionando...</p>
        </div>
       </div>
    );
  }

  // Se o usuário está autenticado e tem o perfil correto, renderiza o conteúdo do painel.
  return <>{children}</>;
}
