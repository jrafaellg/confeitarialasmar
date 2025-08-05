'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Esta página agora serve apenas para redirecionar para o dashboard principal.
// A lógica de proteção e redirecionamento agora está centralizada no AdminLayout.
export default function SocialMediaRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      Redirecionando para o painel...
    </div>
  );
}
