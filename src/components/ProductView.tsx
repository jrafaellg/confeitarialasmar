// src/components/ProductView.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/lib/types';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface ProductViewProps {
  product: Product;
}

export function ProductView({ product }: ProductViewProps) {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado à sua cesta.`,
    });
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % (product.images?.length || 1));
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + (product.images?.length || 1)) % (product.images?.length || 1));
  };

  // Ensure price is a number
  const productPrice = typeof product.price === 'number' ? product.price : 0;

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-lg shadow-lg">
          {product.images && product.images.length > 0 ? (
            <Image
              src={product.images[selectedImageIndex]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <Image
              src="https://placehold.co/600x600.png"
              alt="Placeholder"
              fill
              className="object-cover"
            />
          )}

          {product.images && product.images.length > 1 && (
            <>
              <Button onClick={prevImage} variant="outline" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button onClick={nextImage} variant="outline" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {product.images && product.images.length > 1 && (
          <div className="flex gap-2 mt-4">
            {product.images.map((img, index) => (
              <button key={index} onClick={() => setSelectedImageIndex(index)} className={`w-1/4 aspect-square relative rounded-md overflow-hidden ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring ${selectedImageIndex === index ? 'ring-2 ring-primary' : ''}`}>
                <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-center">
        <span className="text-sm font-medium text-primary">{product.category}</span>
        <h1 className="text-4xl font-bold font-headline mt-1">{product.name}</h1>
        <p className="text-2xl font-semibold mt-4">R$ {productPrice.toFixed(2).replace('.', ',')}</p>
        <Separator className="my-6" />
        <p className="text-muted-foreground leading-relaxed">{product.description}</p>
        <Button size="lg" className="mt-8" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-5 w-5" /> Adicionar à Cesta
        </Button>
      </div>
    </div>
  );
}
