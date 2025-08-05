// src/components/ProductsPageClient.tsx
/**
 * Este é um Client Component que gerencia a página do catálogo de produtos.
 * Ele é responsável por buscar os produtos e categorias da API,
 * e por lidar com a interatividade do usuário, como a filtragem por categoria.
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function ProductsPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Estados para armazenar os dados e o estado de carregamento.
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // O estado da categoria selecionada é inicializado a partir do parâmetro da URL.
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('categoria') || 'todos');

  // Efeito para buscar os dados iniciais (produtos e categorias) da API quando o componente monta.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Busca produtos e categorias em paralelo para otimizar o tempo de carregamento.
        const [prodResponse, catResponse] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/categories'),
        ]);

        if (!prodResponse.ok || !catResponse.ok) {
          throw new Error('Falha ao buscar dados do servidor.');
        }

        const prods = await prodResponse.json();
        const cats = await catResponse.json();
        
        setProducts(prods);
        setCategories(cats);

      } catch (error: any) {
        toast({
          title: 'Erro ao carregar dados',
          description: error.message || 'Não foi possível buscar os produtos e categorias. Tente novamente mais tarde.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]); // A dependência `toast` é estável, então o fetch só roda uma vez.

  // Efeito para sincronizar o estado `selectedCategory` com a URL.
  // Isso garante que, se o usuário navegar usando os botões de voltar/avançar do navegador, a UI será atualizada.
  useEffect(() => {
    const categoryFromUrl = searchParams.get('categoria') || 'todos';
    if (categoryFromUrl !== selectedCategory) {
      setSelectedCategory(categoryFromUrl);
    }
  }, [searchParams, selectedCategory]);

  // Função para lidar com a mudança de categoria pelo clique do usuário.
  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    // Atualiza o parâmetro 'categoria' na URL.
    if (slug === 'todos') {
      params.delete('categoria');
    } else {
      params.set('categoria', slug);
    }
    // Empurra o novo estado para o histórico do navegador sem recarregar a página.
    router.push(`${pathname}?${params.toString()}`);
  };

  // Memoriza a lista de produtos filtrados para evitar recálculos desnecessários.
  // A filtragem só é refeita se `products` ou `selectedCategory` mudarem.
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'todos') {
      return products;
    }
    return products.filter(p => p.categorySlug === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Nosso Catálogo</h1>
        <p className="text-muted-foreground mt-2">Explore nossas delícias e encontre seu novo doce favorito.</p>
      </div>

      {/* Exibe um spinner de carregamento enquanto os dados estão sendo buscados. */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        <>
            {/* Renderiza os botões de filtro de categoria. */}
            {categories.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    <Button
                    variant={selectedCategory === 'todos' ? 'default' : 'outline'}
                    onClick={() => handleCategoryChange('todos')}
                    >
                    Todos
                    </Button>
                    {categories.map(category => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.slug ? 'default' : 'outline'}
                        onClick={() => handleCategoryChange(category.slug)}
                    >
                        {category.name}
                    </Button>
                    ))}
                </div>
            )}

            {/* Renderiza a grade de produtos ou uma mensagem se não houver produtos. */}
            {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))
                    ) : (
                    // Mensagem se nenhum produto for encontrado na categoria selecionada.
                    <p className="col-span-full text-center text-muted-foreground py-16">
                        Nenhum produto encontrado nesta categoria.
                    </p>
                    )}
                </div>
            ) : (
                // Mensagem se a busca inicial de produtos falhar.
                <div className="text-center py-16">
                    <p className="text-muted-foreground">
                        Não foi possível carregar os produtos no momento. <br/>
                        Por favor, tente novamente mais tarde.
                    </p>
                </div>
            )}
        </>
      )}
    </div>
  );
}
