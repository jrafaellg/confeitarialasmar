'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';
import { Product, Order } from '@/lib/types';
import Papa from 'papaparse';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';

export function ReportsManager() {
  const { toast } = useToast();
  const { userRole } = useAuth();
  const [isProductsLoading, setIsProductsLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);

  // O perfil 'socialMedia' não pode baixar relatórios.
  const canDownload = userRole === 'admin';

  // Helper function to trigger file download
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handler for exporting products
  const handleExportProducts = async () => {
    if (!canDownload) return;
    setIsProductsLoading(true);
    try {
      const response = await fetch('/api/products');
      if (!response.ok) throw new Error('Falha ao buscar produtos.');
      const products: Product[] = await response.json();
      
      if(products.length === 0){
          toast({ title: 'Nenhum produto', description: 'Ainda não há produtos para exportar.' });
          return;
      }

      const formattedProducts = products.map(p => ({
        'ID do Produto': p.id,
        Nome: p.name,
        Slug: p.slug,
        Descrição: p.description,
        Preço: p.price.toFixed(2).replace('.',','),
        Categoria: p.category,
        'Slug da Categoria': p.categorySlug,
        Destaque: p.featured ? 'Sim' : 'Não',
        'Data de Criação': p.createdAt ? format(new Date(p.createdAt), "dd/MM/yyyy HH:mm") : '',
        'URLs das Imagens': p.images ? p.images.join(', ') : '',
      }));

      const csv = Papa.unparse(formattedProducts);
      downloadCSV(csv, `catalogo-produtos-${format(new Date(), 'yyyy-MM-dd')}.csv`);

      toast({ title: 'Sucesso!', description: 'O download do catálogo de produtos foi iniciado.' });
    } catch (error: any) {
      toast({ title: 'Erro ao exportar', description: error.message, variant: 'destructive' });
    } finally {
      setIsProductsLoading(false);
    }
  };

  // Handler for exporting orders
  const handleExportOrders = async () => {
    if (!canDownload) return;
    setIsOrdersLoading(true);
    try {
      const response = await fetch('/api/orders');
      if (!response.ok) throw new Error('Falha ao buscar pedidos.');
      const orders: Order[] = await response.json();

       const formattedOrders = orders.flatMap(order => {
        if (!order.items || order.items.length === 0) {
            return []; // Skip orders with no items
        }
        return order.items.map(item => ({
            'ID do Pedido': order.id,
            'Telefone Cliente': order.customerPhone || 'N/A',
            'Data do Pedido': order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy HH:mm") : '',
            'Subtotal do Pedido (R$)': order.subtotal.toFixed(2).replace('.',','),
            'ID do Produto': item.productId,
            'Nome do Produto': item.name,
            'Quantidade': item.quantity,
            'Preço Unitário (R$)': item.price.toFixed(2).replace('.',','),
            'Total do Item (R$)': (item.quantity * item.price).toFixed(2).replace('.',','),
        }))
       }
      );

      if(formattedOrders.length === 0){
          toast({ title: 'Nenhum pedido', description: 'Ainda não há pedidos registrados para exportar.' });
          return;
      }

      const csv = Papa.unparse(formattedOrders, {
          header: true,
      });
      downloadCSV(csv, `historico-pedidos-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      
      toast({ title: 'Sucesso!', description: 'O download do histórico de pedidos foi iniciado.' });
    } catch (error: any) {
      toast({ title: 'Erro ao exportar', description: error.message, variant: 'destructive' });
    } finally {
      setIsOrdersLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportação de Dados (CSV)</CardTitle>
        <CardDescription>
          Faça o download dos dados da sua loja em formato CSV para análise de marketing e negócios.
          { !canDownload && <span className="font-bold text-destructive block mt-2"> Apenas administradores podem baixar relatórios.</span> }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Card className="p-4 bg-background">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Catálogo de Produtos</h3>
              <p className="text-sm text-muted-foreground">
                Exporte uma lista completa de todos os produtos cadastrados na loja.
              </p>
            </div>
            <Button onClick={handleExportProducts} disabled={isProductsLoading || !canDownload}>
              {isProductsLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar Produtos
            </Button>
          </div>
        </Card>
        <Card className="p-4 bg-background">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-semibold">Histórico de Pedidos</h3>
              <p className="text-sm text-muted-foreground">
                Exporte o registro de todas as cestas finalizadas via WhatsApp.
              </p>
            </div>
            <Button onClick={handleExportOrders} disabled={isOrdersLoading || !canDownload}>
              {isOrdersLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Exportar Pedidos
            </Button>
          </div>
        </Card>
      </CardContent>
    </Card>
  );
}
