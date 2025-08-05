'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Instagram, Facebook, MessageCircle } from 'lucide-react';
import { SiteConfig } from '@/lib/types';
import { useEffect, useState } from 'react';

export function Footer() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
        try {
            const response = await fetch('/api/site-config');
            if(response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error("Failed to fetch site config for footer", error);
        }
    }
    fetchConfig();
  }, []);
  
  // Helper to format WhatsApp link
  const getWhatsAppLink = () => {
    if (!config?.socialWhatsapp) return "#";
    if (config.socialWhatsapp.startsWith('http')) {
        return config.socialWhatsapp;
    }
    // Basic cleaning of non-numeric characters, except '+'
    const phoneNumber = config.socialWhatsapp.replace(/[^0-9+]/g, '');
    return `https://wa.me/${phoneNumber}`;
  }


  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Coluna do Logo */}
          <div className="flex flex-col items-start md:items-start text-left">
             <Link href="/" className="flex items-center gap-2 mb-4">
              <Image 
                src="/logo.png"
                alt="Confeitaria Lasmar Logo" 
                width={56} 
                height={56}
                className="h-14 w-14"
              />
              <span className="font-bold text-xl font-headline text-foreground">
                Confeitaria<br/>Lasmar
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">Feito com amor, para adoçar seus momentos.</p>
          </div>

          {/* Coluna de Navegação */}
          <div>
            <h4 className="font-semibold mb-4 font-headline">Navegação</h4>
            <ul className="space-y-2">
              <li><Link href="/" className="text-sm text-muted-foreground hover:text-primary">Home</Link></li>
              <li><Link href="/produtos" className="text-sm text-muted-foreground hover:text-primary">Produtos</Link></li>
              <li><Link href="/sobre" className="text-sm text-muted-foreground hover:text-primary">Sobre Nós</Link></li>
              <li><Link href="/contato" className="text-sm text-muted-foreground hover:text-primary">Contato</Link></li>
            </ul>
          </div>
          
          {/* Coluna Legal */}
          <div>
            <h4 className="font-semibold mb-4 font-headline">Legal</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Termos de Serviço</a></li>
              <li><a href="#" className="text-sm text-muted-foreground hover:text-primary">Política de Privacidade</a></li>
               <li><Link href="/admin/login" className="text-sm text-muted-foreground hover:text-primary">Painel do Administrador</Link></li>
            </ul>
          </div>
          
          {/* Coluna Siga-nos */}
          <div>
            <h4 className="font-semibold mb-4 font-headline">Siga-nos</h4>
            <div className="flex space-x-4">
              {config?.socialInstagram && <a href={config.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Instagram /></a>}
              {config?.socialFacebook && <a href={config.socialFacebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><Facebook /></a>}
              {config?.socialWhatsapp && <a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary"><MessageCircle /></a>}
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Confeitaria Lasmar. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
