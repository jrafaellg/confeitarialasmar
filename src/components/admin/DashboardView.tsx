'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Order } from '@/lib/types';
import { Loader2, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

export function DashboardView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const totalOrders = orders.length;

  const totalRevenue = useMemo(() => {
    return orders.reduce((acc, order) => acc + order.subtotal, 0);
  }, [orders]);

  const mostSoldProductsData = useMemo(() => {
    const productCounts: { [key: string]: number } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        productCounts[item.name] = (productCounts[item.name] || 0) + item.quantity;
      });
    });

    return Object.entries(productCounts)
      .map(([name, quantity]) => ({ name, Quantidade: quantity }))
      .sort((a, b) => b.Quantidade - a.Quantidade)
      .slice(0, 5);
  }, [orders]);
  
  const ordersByDayData = useMemo(() => {
    const dailyCounts: { [key: string]: { pedidos: number } } = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return format(d, "dd/MM", { locale: ptBR });
    }).reverse();
    
    last7Days.forEach(day => {
        dailyCounts[day] = { pedidos: 0 };
    });

    orders.forEach(order => {
        if (order.createdAt) {
            const day = format(new Date(order.createdAt), "dd/MM", { locale: ptBR });
            if(dailyCounts[day]) {
              dailyCounts[day].pedidos += 1;
            }
        }
    });
    
    return Object.entries(dailyCounts)
        .map(([date, data]) => ({ date, ...data }));
  }, [orders]);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalRevenue.toFixed(2).replace('.', ',')}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os pedidos finalizados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos Finalizados</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total de cliques em "Finalizar Pedido"
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produto mais vendido</CardTitle>
                 <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
             <CardContent>
                <div className="text-2xl font-bold truncate">
                    {mostSoldProductsData.length > 0 ? mostSoldProductsData[0].name : "N/A"}
                </div>
                <p className="text-xs text-muted-foreground">
                    O item mais popular nas cestas
                </p>
            </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top 5 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
             <ChartContainer config={{}} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={mostSoldProductsData} margin={{ top: 5, right: 20, left: -10, bottom: 60 }}>
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      angle={-45}
                      textAnchor="end"
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12}
                      allowDecimals={false}
                    />
                    <Tooltip 
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="Quantidade" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
         <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Pedidos nos Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ChartContainer config={{}} className="min-h-[300px] w-full">
                <BarChart accessibilityLayer data={ordersByDayData}>
                    <XAxis 
                      dataKey="date" 
                      tickLine={false} 
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false}
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      allowDecimals={false}
                    />
                     <Tooltip 
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={4} />
                </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}