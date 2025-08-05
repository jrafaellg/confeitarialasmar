// src/app/produtos/[slug]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import type { Product } from '@/lib/types';
import { ProductPageClient } from '@/components/ProductPageClient';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        // Fetch the main product by slug
        const res = await fetch(`/api/products?slug=${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
             notFound();
          }
          throw new Error(`Falha ao buscar produto: ${res.statusText}`);
        }
        const products: Product[] = await res.json();
        if (products.length === 0) {
          notFound();
          return;
        }
        const currentProduct = products[0];
        setProduct(currentProduct);

        // Fetch related products from the same category
        if (currentProduct.categorySlug) {
            const relatedRes = await fetch(`/api/products?categorySlug=${currentProduct.categorySlug}`);
            if(relatedRes.ok) {
                const allRelated: Product[] = await relatedRes.json();
                // Filter out the current product and take the first 4
                const filteredRelated = allRelated.filter(p => p.id !== currentProduct.id).slice(0, 4);
                setRelatedProducts(filteredRelated);
            }
        }

      } catch (err: any) {
        console.error("Fetch product error:", err);
        setError(err.message);
        toast({
          title: 'Erro ao carregar produto',
          description: "Não foi possível buscar os detalhes do produto. Tente novamente.",
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, toast]);


  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex justify-center items-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow flex justify-center items-center text-center p-4">
          <div>
            <h2 className="text-xl font-semibold text-destructive">Ocorreu um erro</h2>
            <p className="text-muted-foreground mt-2">Não foi possível carregar o produto. <br/>Por favor, tente recarregar a página.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
      return notFound();
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <ProductPageClient product={product} relatedProducts={relatedProducts} />
      </main>
      <Footer />
    </div>
  );
}
