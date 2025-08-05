// src/components/ProductPageClient.tsx
/**
 * Este é um Client Component puro, focado em renderizar a UI da página de detalhes do produto.
 * Ele recebe todos os dados necessários (produto e produtos relacionados) como props
 * do seu Server Component pai (`src/app/produtos/[slug]/page.tsx`).
 * Isso separa a busca de dados (servidor) da renderização interativa (cliente).
 */
'use client';

import { ProductView } from '@/components/ProductView';
import { ProductCard } from '@/components/ProductCard';
import type { Product } from '@/lib/types';

// Interface para definir as props que este componente espera receber.
interface ProductPageClientProps {
  product: Product;
  relatedProducts: Product[];
}

export function ProductPageClient({ product, relatedProducts }: ProductPageClientProps) {
  // Garante que `relatedProducts` seja sempre um array para evitar erros de renderização
  // caso a prop venha como `undefined` ou `null`.
  const safeRelatedProducts = relatedProducts || [];

  return (
    <>
      {/* O ProductView é outro Client Component que cuida da exibição do produto principal e do carrossel. */}
      <ProductView product={product} />

      {/* Seção de produtos relacionados, renderizada apenas se houver produtos na lista. */}
      {safeRelatedProducts.length > 0 && (
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12 font-headline">Você também pode gostar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Renderiza um ProductCard para cada produto relacionado. */}
            {safeRelatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
