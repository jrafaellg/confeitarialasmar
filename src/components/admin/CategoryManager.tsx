// src/components/admin/CategoryManager.tsx
/**
 * Este é um Client Component para gerenciar categorias no painel de administração.
 * Ele permite criar, ler, atualizar e excluir (CRUD) categorias.
 * A busca inicial de dados e todas as mutações são feitas através de chamadas à API,
 * garantindo que a lógica de negócios permaneça no backend.
 */
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

// Define o schema de validação para o formulário de categoria usando Zod.
const categorySchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
});

type CategoryFormData = z.infer<typeof categorySchema>;

// Função auxiliar para criar um "slug" (URL amigável) a partir de um nome.
const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .normalize("NFD") // Separa acentos dos caracteres base.
        .replace(/[\u0300-\u036f]/g, "") // Remove os acentos.
        .replace(/[^a-z0-9 -]/g, '') // Remove caracteres inválidos.
        .replace(/\s+/g, '-') // Substitui espaços por hífens.
        .replace(/-+/g, '-'); // Remove hífens duplicados.
}

export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const { user, userRole } = useAuth();


  // Inicializa o formulário com react-hook-form e o resolver do Zod.
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '' },
  });

  // Função para buscar as categorias da API.
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Falha ao buscar categorias');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      toast({ title: 'Erro ao buscar categorias', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Busca as categorias quando o componente é montado.
  useEffect(() => {
    fetchCategories();
  }, []);

  // Função chamada ao submeter o formulário (criar ou editar).
  const onSubmit = async (data: CategoryFormData) => {
    if (userRole === 'socialMedia') {
      await submitForApproval(data);
      return;
    }

    const slug = createSlug(data.name);
    const apiEndpoint = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
    const method = editingCategory ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: data.name, slug }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Falha na comunicação com a API.' }));
        throw new Error(errorData.details || errorData.error || 'Erro desconhecido ao salvar categoria');
      }

      toast({ title: `Categoria ${editingCategory ? 'atualizada' : 'criada'} com sucesso!` });
      await fetchCategories(); // Recarrega a lista de categorias.
      handleDialogClose();
    } catch (error: any) {
      toast({ 
        title: 'Erro ao salvar categoria', 
        description: error.message, 
        variant: 'destructive',
      });
    }
  };

  const submitForApproval = async (data: CategoryFormData) => {
    const changeType = editingCategory ? 'category_update' : 'category_create';
    const changeSummary = editingCategory ? `Edição da categoria: ${data.name}` : `Criação da categoria: ${data.name}`;

    const payload = {
        type: changeType,
        targetId: editingCategory?.id,
        data: { name: data.name, slug: createSlug(data.name) },
        submittedBy: user?.email || 'unknown',
        changeSummary: changeSummary,
    };
    
    try {
        const response = await fetch('/api/pending-changes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || 'Falha ao enviar para aprovação.');
        }

        toast({
            title: 'Enviado para Aprovação',
            description: 'Suas alterações foram enviadas para um administrador revisar.',
        });
        handleDialogClose();

    } catch (error: any) {
        toast({ title: 'Erro ao Enviar', description: error.message, variant: 'destructive' });
    }
  };

  // Função para excluir uma categoria.
  const handleDelete = async (categoryId: string) => {
    if (userRole === 'socialMedia') {
      toast({ title: 'Ação não permitida', description: 'Você não tem permissão para excluir categorias.', variant: 'destructive' });
      return;
    }
     if (!window.confirm('Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita e só funcionará se nenhum produto estiver usando-a.')) return;
    try {
      const response = await fetch(`/api/categories/${categoryId}`, { method: 'DELETE' });
      if (!response.ok) {
         const errorData = await response.json().catch(() => ({ error: 'Falha na comunicação com a API.' }));
        throw new Error(errorData.details || errorData.error || 'Erro desconhecido ao excluir categoria');
      }
      toast({ title: 'Categoria excluída com sucesso!' });
      await fetchCategories(); // Recarrega a lista.
    } catch (error: any) {
      toast({ 
          title: 'Erro ao excluir categoria', 
          description: error.message, 
          variant: 'destructive',
        });
    }
  };

  // Prepara o formulário para edição.
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.reset({ name: category.name });
    setIsDialogOpen(true);
  };
  
  // Prepara o formulário para criação de uma nova categoria.
  const handleAddNew = () => {
      setEditingCategory(null);
      form.reset({ name: '' });
      setIsDialogOpen(true);
  }

  // Fecha o dialog e reseta o estado do formulário.
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    form.reset({ name: '' });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle>Gerenciar Categorias</CardTitle>
                <CardDescription>Adicione, edite ou remova as categorias dos seus produtos.</CardDescription>
            </div>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Nova
            </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Dialog para Adicionar/Editar Categoria */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={handleDialogClose} onEscapeKeyDown={handleDialogClose}>
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}</DialogTitle>
              {userRole === 'socialMedia' ? (
                <DialogDescription className="text-orange-600 font-bold">
                    Atenção: Suas alterações serão enviadas para aprovação de um administrador.
                </DialogDescription>
              ) : (
                <DialogDescription>
                    Preencha o nome da categoria abaixo. O "slug" (URL) será gerado automaticamente.
                </DialogDescription>
              )}
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Nome da Categoria</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Bolos de Aniversário" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleDialogClose}>Cancelar</Button>
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          {userRole === 'socialMedia' ? 'Enviar para Aprovação' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Tabela de Categorias */}
        {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        ) : (
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categories.length > 0 ? categories.map((cat) => (
                        <TableRow key={cat.id}>
                            <TableCell className="font-medium">{cat.name}</TableCell>
                            <TableCell>{cat.slug}</TableCell>
                            <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                    Nenhuma categoria encontrada.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
