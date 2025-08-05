// src/app/carrinho/page.tsx
/**
 * Este arquivo define a página do carrinho de compras.
 * É um Client Component, pois lida com estado que muda com a interação do usuário
 * (adicionar/remover itens, atualizar quantidades) e interage com APIs e o localStorage.
 */
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function CartPage() {
  // Hooks para acessar o contexto do carrinho, estado local e toasts.
  const { cartItems, updateQuantity, removeFromCart, subtotal, cartCount, clearCart } = useCart();
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5512982398984'; // Número de WhatsApp para finalizar o pedido.
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  /**
   * Lida com a finalização do pedido.
   * 1. Valida se o telefone foi preenchido.
   * 2. Salva o pedido no banco de dados via API.
   * 3. Gera uma mensagem formatada para o WhatsApp.
   * 4. Limpa o carrinho e redireciona o usuário para o WhatsApp.
   */
  const handleFinalizeOrder = async () => {
    // 1. Validação
    if (!customerPhone) {
        toast({
            title: 'Campo obrigatório',
            description: 'Por favor, informe seu número de WhatsApp para continuar.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsSubmitting(true);
    
    // 2. Formata os dados do pedido para enviar à API.
    const orderData = {
      customerPhone,
      items: cartItems.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
      })),
      subtotal: subtotal,
    };

    try {
      // Salva o pedido no Firestore através da nossa API.
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Falha ao registrar o pedido.');
      }

      // 3. Gera a mensagem para o WhatsApp.
      const message = cartItems.map(item =>
        `- ${item.quantity}x ${item.product.name} (R$ ${item.product.price.toFixed(2).replace('.', ',')})`
      ).join('\n');
      
      const finalMessage = `Olá! Gostaria de fazer o seguinte pedido:\n\n${message}\n\n*Total: R$ ${subtotal.toFixed(2).replace('.', ',')}*`;
      
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(finalMessage)}`;
      
      // 4. Limpa o carrinho e redireciona para o WhatsApp.
      clearCart();
      window.open(whatsappUrl, '_blank');

    } catch (error) {
       toast({
        title: 'Erro ao finalizar pedido',
        description: 'Não foi possível salvar seu pedido. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline">Sua Cesta de Compras</h1>
        </div>

        {/* Renderização condicional: mostra o carrinho ou a mensagem de cesta vazia. */}
        {cartCount > 0 ? (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {/* Mapeia os itens do carrinho para renderizar cada um. */}
              {cartItems.map(item => (
                <Card key={item.product.id} className="flex items-center p-4">
                  <div className="relative h-24 w-24 rounded-md overflow-hidden">
                    <Image 
                      src={item.product.images && item.product.images.length > 0 ? item.product.images[0] : "https://placehold.co/600x600.png"} 
                      alt={item.product.name} 
                      fill 
                      className="object-cover" 
                    />
                  </div>
                  <div className="ml-4 flex-grow">
                    <Link href={`/produtos/${item.product.slug}`} className="font-semibold hover:text-primary">{item.product.name}</Link>
                    <p className="text-sm text-muted-foreground">R$ {item.product.price.toFixed(2).replace('.', ',')}</p>
                  </div>
                  {/* Controles de quantidade */}
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Input type="number" value={item.quantity} readOnly className="h-8 w-12 text-center" />
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Subtotal do item */}
                  <div className="ml-4 font-semibold w-24 text-right">
                    R$ {(item.product.price * item.quantity).toFixed(2).replace('.', ',')}
                  </div>
                  {/* Botão para remover o item */}
                  <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </Card>
              ))}
            </div>

            {/* Card de Resumo do Pedido */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <div className="space-y-2">
                    <Label htmlFor="whatsapp-number">Seu WhatsApp</Label>
                    <Input 
                        id="whatsapp-number"
                        type="tel"
                        placeholder="(99) 99999-9999"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        required
                    />
                    <p className="text-xs text-muted-foreground">Usado para identificar seus pedidos.</p>
                   </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entrega</span>
                    <span className="text-muted-foreground text-sm">A combinar</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button size="lg" className="w-full" onClick={handleFinalizeOrder} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Finalizar Pedido via WhatsApp
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        ) : (
          // Mensagem de cesta vazia.
          <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
            <h2 className="mt-6 text-2xl font-semibold">Sua cesta está vazia</h2>
            <p className="mt-2 text-muted-foreground">Adicione alguns doces para começar.</p>
            <Button asChild className="mt-6">
              <Link href="/produtos">Explorar produtos</Link>
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
