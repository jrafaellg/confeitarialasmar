
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product, Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { PlusCircle, Edit, Trash2, Loader2, Upload, Copy, Share2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useAuth } from '@/context/AuthContext';


const productSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  description: z.string().min(10, { message: 'A descrição deve ter pelo menos 10 caracteres.' }),
  price: z.coerce.number().positive({ message: 'O preço deve ser um número positivo.' }),
  categorySlug: z.string().min(1, { message: 'Por favor, selecione uma categoria.' }),
  featured: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', description: '', price: 0, categorySlug: '', featured: false },
  });


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodResponse, catResponse] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
      ]);
      if (!prodResponse.ok || !catResponse.ok) throw new Error('Falha ao buscar dados do servidor.');
      
      const prods = await prodResponse.json();
      const cats = await catResponse.json();

      setProducts(prods);
      setCategories(cats);
    } catch (error) {
      toast({ title: 'Erro ao buscar dados', description: 'Não foi possível carregar os dados mais recentes.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const copyToClipboard = (text: string, type: 'link' | 'text') => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: `${type === 'link' ? 'Link' : 'Texto'} copiado para a área de transferência!` });
    }).catch(err => {
      toast({ title: 'Erro ao copiar', description: 'Não foi possível copiar o conteúdo.', variant: 'destructive' });
    });
  };

  const handleShare = (product: Product) => {
    const productUrl = `${window.location.origin}/produtos/${product.slug}`;
    const shareText = `Confira esta delícia da Confeitaria Lasmar: ${product.name}! Perfeito para qualquer ocasião. Saiba mais e peça já o seu: ${productUrl}`;
    copyToClipboard(shareText, 'text');
  };
  
  const handleCopyLink = (product: Product) => {
      const productUrl = `${window.location.origin}/produtos/${product.slug}`;
      copyToClipboard(productUrl, 'link');
  };

  const onSubmit = async (data: ProductFormData) => {
    if (userRole === 'admin') {
      await handleAdminSubmit(data);
    } else if (userRole === 'socialMedia') {
      await handleSocialMediaSubmit(data);
    }
  };

  const handleAdminSubmit = async (data: ProductFormData) => {
     if (!editingProduct && imageFiles.length === 0) {
        toast({ title: 'Erro de Validação', description: 'É necessário enviar pelo menos uma imagem para um novo produto.', variant: 'destructive' });
        return;
    }
    if (editingProduct && existingImageUrls.length === 0 && imageFiles.length === 0) {
        toast({ title: 'Erro de Validação', description: 'O produto deve ter pelo menos uma imagem.', variant: 'destructive' });
        return;
    }

    setIsSubmitting(true);
    
    const formData = new FormData();
    const categoryName = categories.find(c => c.slug === data.categorySlug)?.name || '';

    Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
    });
    
    formData.append('slug', createSlug(data.name));
    formData.append('category', categoryName);
    
    formData.append('existingImageUrls', JSON.stringify(existingImageUrls));
    imageFiles.forEach(file => {
        formData.append('images', file);
    });
    
    const apiEndpoint = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    const method = editingProduct ? 'PUT' : 'POST';

    try {
      const response = await fetch(apiEndpoint, {
        method,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to save product');
      }

      toast({ title: `Produto ${editingProduct ? 'atualizado' : 'criado'} com sucesso!` });
      await fetchData();
      handleDialogClose();
    } catch (error: any) {
      toast({ title: 'Erro ao salvar produto', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialMediaSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
        const changeType = editingProduct ? 'product_update' : 'product_create';
        const changeSummary = editingProduct ? `Edição do produto: ${data.name}` : `Criação do produto: ${data.name}`;
        const categoryName = categories.find(c => c.slug === data.categorySlug)?.name || '';
        
        let productData: any = { 
            ...data, 
            slug: createSlug(data.name),
            category: categoryName,
        };

        if (editingProduct) {
             productData.images = editingProduct.images || [];
        } else {
            // Para novos produtos, o social media não pode adicionar imagens.
            // O admin precisará adicionar depois.
            productData.images = []; 
        }
        
        const payload = {
            type: changeType,
            targetId: editingProduct?.id,
            data: productData,
            submittedBy: user?.email || 'unknown',
            changeSummary: changeSummary
        };
    
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
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (userRole !== 'admin') {
      toast({ title: 'Ação não permitida', description: 'Você não tem permissão para excluir produtos.', variant: 'destructive' });
      return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const response = await fetch(`/api/products/${productId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete product');
      toast({ title: 'Produto excluído com sucesso!' });
      await fetchData();
    } catch (error) {
      toast({ title: 'Erro ao excluir produto', variant: 'destructive' });
    }
  };
  
  const handleRemoveImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description,
      price: product.price,
      categorySlug: product.categorySlug,
      featured: product.featured || false,
    });
    setExistingImageUrls(product.images || []);
    setImageFiles([]);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    form.reset({ name: '', description: '', price: 0, categorySlug: '', featured: false });
    setExistingImageUrls([]);
    setImageFiles([]);
    setIsDialogOpen(true);
  };
  
  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    form.reset();
    setImageFiles([]);
    setExistingImageUrls([]);
  };

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gerenciar Produtos</CardTitle>
              <CardDescription>Adicione, edite ou remova os produtos da sua loja.</CardDescription>
            </div>
             <Button onClick={handleAddNew}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Novo</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={(open) => !isSubmitting && (open ? (editingProduct ? handleEdit(editingProduct) : handleAddNew()) : handleDialogClose())}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => { if (isSubmitting) e.preventDefault(); }} onEscapeKeyDown={() => !isSubmitting && handleDialogClose()}>
              <DialogHeader>
                <DialogTitle>{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
                 {userRole === 'socialMedia' && (
                    <DialogDescription className="text-orange-600 font-bold">
                        Atenção: Suas alterações serão enviadas para aprovação de um administrador. Para novos produtos, as imagens deverão ser adicionadas depois por um admin.
                    </DialogDescription>
                )}
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                  <div className="grid md:grid-cols-2 gap-4">
                      <FormField name="name" control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Nome</FormLabel><FormControl><Input placeholder="Ex: Bolo de Chocolate" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField name="price" control={form.control} render={({ field }) => (
                          <FormItem><FormLabel>Preço</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ex: 59.90" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                  </div>
                  <FormField name="description" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva os detalhes do produto..." {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid md:grid-cols-2 gap-4 items-center">
                      <FormField name="categorySlug" control={form.control} render={({ field }) => (
                          <FormItem>
                              <FormLabel>Categoria</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      {categories.map(cat => <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )} />
                      <FormField name="featured" control={form.control} render={({ field }) => (
                          <FormItem className="flex flex-row items-end space-x-2 space-y-0 pt-8">
                               <FormControl>
                                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                  <FormLabel>Produto em Destaque?</FormLabel>
                              </div>
                          </FormItem>
                      )} />
                  </div>

                  {userRole === 'admin' && (
                  <FormItem>
                      <FormLabel>Imagens</FormLabel>
                      <FormControl>
                          <div className="border-dashed border-2 border-input p-6 rounded-md text-center hover:border-primary transition-colors">
                              <label htmlFor="image-upload" className="flex flex-col items-center gap-2 cursor-pointer">
                                  <Upload className="h-8 w-8 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">Arraste e solte arquivos ou <span className="text-primary underline">clique para enviar</span></span>
                              </label>
                              <Input id="image-upload" type="file" multiple accept="image/*" onChange={(e) => setImageFiles(prev => [...prev, ...Array.from(e.target.files || [])])} className="hidden" />
                          </div>
                      </FormControl>
                      <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                          {existingImageUrls.map((url, index) => (
                               <div key={url} className="relative group aspect-square">
                                  <Image src={url} alt="Imagem existente" width={100} height={100} className="rounded-md w-full h-full object-cover"/>
                                  <Button type="button" size="sm" variant="destructive" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(index, true)}>&times;</Button>
                              </div>
                          ))}
                          {imageFiles.map((file, index) => (
                               <div key={URL.createObjectURL(file)} className="relative group aspect-square">
                                  <Image src={URL.createObjectURL(file)} alt="Nova imagem" width={100} height={100} className="rounded-md w-full h-full object-cover"/>
                                  <Button type="button" size="sm" variant="destructive" className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveImage(index, false)}>&times;</Button>
                              </div>
                          ))}
                      </div>
                  </FormItem>
                  )}

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={handleDialogClose} disabled={isSubmitting}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {userRole === 'socialMedia' ? 'Enviar para Aprovação' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <div className="border rounded-lg w-full">
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Categoria</TableHead><TableHead>Preço</TableHead><TableHead>Destaque</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? (
                  products.map((prod) => (
                    <TableRow key={prod.id}>
                      <TableCell className="font-medium flex items-center gap-3">
                        <Image src={prod.images?.[0] || 'https://placehold.co/40x40.png'} alt={prod.name} width={40} height={40} className="rounded-md object-cover" />
                        {prod.name}
                      </TableCell>
                      <TableCell>{prod.category}</TableCell>
                      <TableCell>R$ {prod.price.toFixed(2).replace('.', ',')}</TableCell>
                      <TableCell>{prod.featured ? 'Sim' : 'Não'}</TableCell>
                      <TableCell className="text-right space-x-0">
                        <Tooltip><TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => handleShare(prod)}><Share2 className="h-4 w-4" /></Button>
                        </TooltipTrigger><TooltipContent><p>Copiar Texto para Divulgação</p></TooltipContent></Tooltip>
                        
                        <Tooltip><TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => handleCopyLink(prod)}><Copy className="h-4 w-4" /></Button>
                        </TooltipTrigger><TooltipContent><p>Copiar Link do Produto</p></TooltipContent></Tooltip>
                        
                        <Tooltip><TooltipTrigger asChild>
                           <Button variant="ghost" size="icon" onClick={() => handleEdit(prod)}><Edit className="h-4 w-4" /></Button>
                        </TooltipTrigger><TooltipContent><p>Editar Produto</p></TooltipContent></Tooltip>
                        
                        {userRole === 'admin' && (
                          <Tooltip><TooltipTrigger asChild>
                             <Button variant="ghost" size="icon" onClick={() => handleDelete(prod.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TooltipTrigger><TooltipContent><p>Excluir Produto</p></TooltipContent></Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                   <TableRow>
                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                      Nenhum produto encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
           </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
