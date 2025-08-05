'use client';
import { useState, useEffect, useCallback } from 'react';
import { PendingChange } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '../ui/badge';

export function ApprovalsManager() {
  const [changes, setChanges] = useState<PendingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const fetchChanges = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pending-changes');
      if (!response.ok) throw new Error('Falha ao buscar aprovações pendentes.');
      const data = await response.json();
      setChanges(data);
    } catch (error: any) {
      toast({ title: 'Erro ao buscar alterações', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  const handleApprovalAction = async (changeId: string, status: 'approved' | 'rejected') => {
    try {
        const response = await fetch(`/api/pending-changes/${changeId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Falha ao processar a ação.');
        }
        toast({ title: 'Sucesso!', description: `A alteração foi ${status === 'approved' ? 'aprovada' : 'rejeitada'}.`});
        fetchChanges(); // Refresh list
    } catch (error: any) {
        toast({ title: 'Erro ao processar', description: error.message, variant: 'destructive' });
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
        case 'approved': return 'default';
        case 'rejected': return 'destructive';
        default: return 'secondary';
    }
  }

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
        <CardTitle>Aprovações Pendentes</CardTitle>
        <CardDescription>
          Revise e aprove ou rejeite as alterações enviadas pela equipe de social media.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Enviado por</TableHead>
                        <TableHead>Resumo da Alteração</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {changes.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                Nenhuma alteração pendente no momento.
                            </TableCell>
                        </TableRow>
                    ) : (
                        changes.map((change) => (
                            <TableRow key={change.id}>
                                <TableCell>
                                    {format(new Date(change.submittedAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                                </TableCell>
                                <TableCell>{change.submittedBy}</TableCell>
                                <TableCell className="font-medium">{change.changeSummary}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(change.status)}>
                                        {change.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {change.status === 'pending' && (
                                        <div className='space-x-2'>
                                            <Button size="sm" variant="outline" onClick={() => handleApprovalAction(change.id, 'approved')}>
                                                <Check className="mr-2 h-4 w-4" /> Aprovar
                                            </Button>
                                            <Button size="sm" variant="destructive" onClick={() => handleApprovalAction(change.id, 'rejected')}>
                                                <X className="mr-2 h-4 w-4" /> Rejeitar
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
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
