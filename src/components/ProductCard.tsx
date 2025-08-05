// src/components/ProductCard.tsx
/**
 * Este é um Client Component que representa um único card de produto.
 * Ele lida com a interatividade do usuário, como adicionar o produto ao carrinho,
 * e exibe as informações básicas do produto de forma visualmente atraente.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  // Hooks para acessar o contexto do carrinho e o sistema de toasts.
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Função para lidar com o clique no botão "Adicionar".
  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado à sua cesta.`,
    });
  };

  // Define a URL da imagem, usando um placeholder caso nenhuma imagem seja fornecida.
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : 'https://placehold.co/600x600.png';

  return (
    <Card className="flex flex-col overflow-hidden h-full transition-all duration-300 hover:shadow-xl">
      {/* O card inteiro, exceto o botão, é um link para a página de detalhes do produto. */}
      <Link href={`/produtos/${product.slug}`} className="block flex flex-col flex-grow">
        <CardHeader className="p-0">
          <div className="aspect-square relative w-full">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Otimização de imagem para diferentes tamanhos de tela.
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 flex-grow">
            <CardTitle className="text-lg font-headline leading-tight hover:text-primary transition-colors">
              {product.name}
            </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{product.category}</p>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-semibold text-foreground">
          {/* Formata o preço para o padrão brasileiro (ex: 59,90). */}
          R$ {product.price.toFixed(2).replace('.', ',')}
        </p>
        <Button size="sm" onClick={handleAddToCart}>
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </CardFooter>
    </Card>
  );
}
