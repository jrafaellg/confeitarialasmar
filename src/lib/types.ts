// src/lib/types.ts
/**
 * Este arquivo centraliza a definição de tipos e interfaces TypeScript para todo o projeto.
 * Ter um local único para as estruturas de dados garante consistência e facilita a manutenção.
 */

/**
 * Representa a estrutura de um produto na loja.
 */
export interface Product {
  id: string; // ID do documento no Firestore.
  slug: string; // Versão do nome amigável para URL (ex: "bolo-de-chocolate").
  name: string; // Nome do produto (ex: "Bolo de Chocolate").
  description: string; // Descrição detalhada do produto.
  price: number; // Preço do produto.
  category: string; // Nome da categoria (ex: "Bolos de Aniversário").
  categorySlug: string; // Slug da categoria (ex: "bolos-de-aniversario").
  images: string[]; // Array de URLs das imagens do produto.
  featured?: boolean; // Se o produto deve aparecer na seção de destaques.
  createdAt: string; // Data de criação como uma string no formato ISO (garante serialização).
}

/**
 * Representa a estrutura de uma categoria de produtos.
 */
export interface Category {
  id: string; // ID do documento no Firestore.
  name: string; // Nome da categoria (ex: "Bolos de Aniversário").
  slug: string; // Slug da categoria (ex: "bolos-de-aniversario").
}

/**
 * Representa um item dentro do carrinho de compras.
 * Combina um objeto Product com a quantidade desejada.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Representa um pedido finalizado pelo cliente.
 * Estes dados são salvos no Firestore para fins de histórico e análise.
 */
export interface Order {
    id: string; // ID do documento do pedido no Firestore.
    customerPhone?: string; // Número de WhatsApp do cliente.
    items: {
        productId: string; // ID do produto comprado.
        name: string; // Nome do produto.
        quantity: number; // Quantidade comprada.
        price: number; // Preço unitário no momento da compra.
    }[];
    subtotal: number; // Valor total do pedido.
    createdAt: string; // Data da criação do pedido como uma string no formato ISO.
}


/**
 * Representa a estrutura das configurações gerais do site, gerenciáveis via painel admin.
 */
export interface SiteConfig {
    homeBannerUrl?: string;
    aboutImageUrl?: string;
    aboutStory?: string;
    socialInstagram?: string;
    socialFacebook?: string;
    socialWhatsapp?: string;
}

/**
 * Representa uma alteração pendente feita por um usuário que requer aprovação.
 */
export interface PendingChange {
  id: string;
  type: 'product_create' | 'product_update' | 'category_create' | 'category_update' | 'site_config_update';
  targetId?: string; // ID do documento a ser alterado (para updates)
  data: Partial<Product | Category | SiteConfig>; // Os novos dados
  submittedBy: string; // Email do usuário que enviou
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  changeSummary: string; // Um resumo do que foi alterado.
}
