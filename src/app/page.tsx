// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProductCard } from '@/components/ProductCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ArrowRight, Cake, Dessert, CakeSlice, Loader2 } from 'lucide-react';
import type { Category, Product, SiteConfig } from '@/lib/types';

const categoryIcons: { [key: string]: React.ReactNode } = {
  'Bolo de Aniversário': <Cake className="h-8 w-8" />,
  'Bolos Individuais': <CakeSlice className="h-8 w-8" />,
  'Brownies': <Dessert className="h-8 w-8" />,
};

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [catResponse, prodResponse, configResponse] = await Promise.all([
          fetch('/api/categories'),
          fetch('/api/featured-products'),
          fetch('/api/site-config'),
        ]);

        if (!catResponse.ok || !prodResponse.ok || !configResponse.ok) {
          throw new Error('Falha ao buscar dados');
        }

        const catData = await catResponse.json();
        const prodData = await prodResponse.json();
        const configData = await configResponse.json();

        setCategories(catData);
        setFeaturedProducts(prodData);
        setSiteConfig(configData);

      } catch (error) {
        console.error(error);
        // Opcional: Adicionar toast de erro para o usuário
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* Seção do Banner Principal */}
        <section className="relative h-[60vh] min-h-[400px] w-full flex items-center justify-center text-center text-white bg-blue-100">
          <Image
            src={siteConfig.homeBannerUrl || "https://placehold.co/1920x1080.png"}
            alt="Banner de bolos decorados"
            fill
            className="absolute z-0 object-cover"
            priority
            data-ai-hint="cake banner"
          />
          <div className="relative z-10 p-4 bg-black bg-opacity-50 rounded-lg">
            <h1 className="text-4xl md:text-6xl font-bold font-headline drop-shadow-lg">Confeitaria Lasmar</h1>
            <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
              A arte da confeitaria em cada detalhe. Bolos, doces e sobremesas que transformam momentos em doces memórias.
            </p>
            <Button asChild size="lg" className="mt-8 font-bold">
              <Link href="/produtos">Ver nosso catálogo <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </section>

        {/* Seção de Categorias */}
        <section id="categories" className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline text-foreground">Nossas Categorias</h2>
            {loading ? (
              <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : categories.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {categories.map((category) => (
                  <Link href={`/produtos?categoria=${category.slug}`} key={category.id}>
                    <Card className="text-center hover:shadow-lg transition-shadow duration-300 transform hover:-translate-y-1 cursor-pointer">
                      <CardContent className="p-6 flex flex-col items-center">
                        <div className="p-4 bg-primary/20 rounded-full mb-4 text-primary">
                          {categoryIcons[category.name] || <Cake className="h-8 w-8" />}
                        </div>
                        <h3 className="text-xl font-semibold font-headline">{category.name}</h3>
                        <p className="text-muted-foreground mt-2">Ver todos os produtos</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Não foi possível carregar as categorias no momento.</p>
            )}
          </div>
        </section>

        {/* Seção de Produtos em Destaque */}
        <section id="featured-products" className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12 font-headline text-foreground">Produtos em Destaque</h2>
            {loading ? (
              <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : featuredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {featuredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground">Não há produtos em destaque no momento.</p>
            )}
            <div className="text-center mt-12">
              <Button asChild variant="outline">
                <Link href="/produtos">Ver todos os produtos</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
