'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { Button } from './ui/button';

export function CartIcon() {
  const { cartCount } = useCart();

  return (
    <Button asChild variant="ghost" size="icon">
      <Link href="/carrinho" className="relative">
        <ShoppingBag className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {cartCount}
          </span>
        )}
        <span className="sr-only">Ver carrinho de compras</span>
      </Link>
    </Button>
  );
}
