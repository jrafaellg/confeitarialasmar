// src/app/produtos/page.tsx
/**
 * Este arquivo define a página do catálogo de produtos.
 * Ele atua como um invólucro para o `ProductsPageClient`, que é um Client Component.
 * A responsabilidade de buscar e filtrar os produtos é delegada ao componente de cliente,
 * pois a filtragem é uma ação interativa do usuário.
 */
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ProductsPageClient } from '@/components/ProductsPageClient';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';


// A página em si é um Server Component simples.
export default function ProdutosPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        {/* 
          Suspense é usado para lidar com o carregamento de componentes que dependem de dados do lado do cliente.
          Enquanto o ProductsPageClient busca seus dados, um spinner de carregamento é exibido.
          Isso melhora a experiência do usuário, fornecendo feedback visual imediato.
        */}
        <Suspense fallback={
             <div className="flex justify-center items-center h-96">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
          {/* O Client Component é responsável por buscar e renderizar a lista de produtos. */}
          <ProductsPageClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
