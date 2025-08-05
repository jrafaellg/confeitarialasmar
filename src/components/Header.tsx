'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu } from 'lucide-react';
import { CartIcon } from './CartIcon';

export function Header() {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/produtos', label: 'Produtos' },
    { href: '/sobre', label: 'Sobre Nós' },
    { href: '/contato', label: 'Contato' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png" 
            alt="Confeitaria Lasmar Logo" 
            width={56} 
            height={56}
            className="h-14 w-14"
          />
          <span className="font-bold text-xl font-headline text-foreground">
            Confeitaria Lasmar
          </span>
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <CartIcon />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="grid gap-6 text-lg font-medium mt-8">
                {navLinks.map(link => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
