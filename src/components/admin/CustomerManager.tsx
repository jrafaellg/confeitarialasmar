'use client';

import { useState, useEffect, useMemo } from 'react';
import { Order } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, User, ShoppingCart, DollarSign } from 'lucide-react';

interface CustomerData {
    phone: string;
    totalOrders: number;
    totalSpent: number;
}

export function CustomerManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        setOrders(data);
      } catch (error) {
        toast({ title: 'Erro ao buscar pedidos', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [toast]);

  const customerData = useMemo(() => {
    const data: { [phone: string]: { totalOrders: number; totalSpent: number } } = {};

    orders.forEach(order => {
        const phone = order.customerPhone || 'Não informado';
        if (!data[phone]) {
            data[phone] = { totalOrders: 0, totalSpent: 0 };
        }
        data[phone].totalOrders += 1;
        data[phone].totalSpent += order.subtotal;
    });

    return Object.entries(data)
        .map(([phone, values]) => ({ phone, ...values }))
        .sort((a, b) => b.totalSpent - a.totalSpent); // Sort by most spent
  }, [orders]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Clientes</CardTitle>
        <CardDescription>
          Veja o histórico de pedidos e o valor total gasto por cada cliente, agrupados por número de WhatsApp.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead><User className="inline-block mr-2 h-4 w-4" />Cliente (WhatsApp)</TableHead>
                        <TableHead className="text-center"><ShoppingCart className="inline-block mr-2 h-4 w-4" />Total de Pedidos</TableHead>
                        <TableHead className="text-right"><DollarSign className="inline-block mr-2 h-4 w-4" />Valor Total Gasto</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {customerData.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                Nenhum cliente encontrado. Os dados aparecerão aqui após o primeiro pedido finalizado com um número de telefone.
                            </TableCell>
                        </TableRow>
                    ) : (
                        customerData.map((customer) => (
                            <TableRow key={customer.phone}>
                                <TableCell className="font-medium">{customer.phone}</TableCell>
                                <TableCell className="text-center">{customer.totalOrders}</TableCell>
                                <TableCell className="text-right">R$ {customer.totalSpent.toFixed(2).replace('.', ',')}</TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}
