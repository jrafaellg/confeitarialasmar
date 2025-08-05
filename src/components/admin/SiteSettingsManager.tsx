'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SiteConfig } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

// Schema for form validation
const settingsSchema = z.object({
  aboutStory: z.string().optional(),
  socialInstagram: z.string().url({ message: 'URL do Instagram inválida' }).optional().or(z.literal('')),
  socialFacebook: z.string().url({ message: 'URL do Facebook inválida' }).optional().or(z.literal('')),
  socialWhatsapp: z.string().optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SiteSettingsManager() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, userRole } = useAuth();

  const [homeBannerFile, setHomeBannerFile] = useState<File | null>(null);
  const [aboutImageFile, setAboutImageFile] = useState<File | null>(null);
  
  const [homeBannerPreview, setHomeBannerPreview] = useState<string | null>(null);
  const [aboutImagePreview, setAboutImagePreview] = useState<string | null>(null);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      aboutStory: '',
      socialInstagram: '',
      socialFacebook: '',
      socialWhatsapp: '',
    },
  });

  useEffect(() => {
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/site-config');
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          form.reset({
            aboutStory: data.aboutStory || '',
            socialInstagram: data.socialInstagram || '',
            socialFacebook: data.socialFacebook || '',
            socialWhatsapp: data.socialWhatsapp || '',
          });
          if(data.homeBannerUrl) setHomeBannerPreview(data.homeBannerUrl);
          if(data.aboutImageUrl) setAboutImagePreview(data.aboutImageUrl);
        }
      } catch (error) {
        console.log("No initial site config found. Will create one on save.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, [form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'banner' | 'about') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'banner') {
        setHomeBannerFile(file);
        setHomeBannerPreview(URL.createObjectURL(file));
      } else {
        setAboutImageFile(file);
        setAboutImagePreview(URL.createObjectURL(file));
      }
    }
  };

  const uploadImage = async (file: File, path: string): Promise<string> => {
    const uniqueFileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`;
    const storageRef = ref(storage, `${path}/${uniqueFileName}`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  };
  
  const onSubmit = async (data: SettingsFormData) => {
    setIsSubmitting(true);
    try {
      let updatedData: Partial<SiteConfig> = { ...data };

      if (userRole === 'admin') {
        if (homeBannerFile) {
          updatedData.homeBannerUrl = await uploadImage(homeBannerFile, 'site');
        }
        if (aboutImageFile) {
          updatedData.aboutImageUrl = await uploadImage(aboutImageFile, 'site');
        }
        
        const payload = { ...config, ...updatedData };

        const response = await fetch('/api/site-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.details || "Falha ao salvar configurações");
        }
        
        toast({ title: 'Configurações salvas com sucesso!' });
        setHomeBannerFile(null);
        setAboutImageFile(null);
        setConfig(payload);

      } else if (userRole === 'socialMedia') {
        const payload = {
            type: 'site_config_update',
            // Envia apenas os dados que o social media pode mudar, sobrepostos à config existente
            data: { ...config, ...updatedData }, 
            submittedBy: user?.email || 'unknown',
            changeSummary: 'Atualização de textos e links do site.',
        };
        const response = await fetch('/api/pending-changes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error('Falha ao enviar para aprovação');
        toast({ title: 'Enviado para Aprovação!', description: 'As alterações de texto e links foram enviadas para um administrador.' });
      }

    } catch (error: any) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading && !config) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações do Site</CardTitle>
        <CardDescription>Gerencie as imagens, textos e links principais do seu site.</CardDescription>
         {userRole === 'socialMedia' && (
            <p className="text-orange-600 font-bold">
                Atenção: Suas alterações serão enviadas para aprovação de um administrador. A edição de imagens está desabilitada para este perfil.
            </p>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {userRole === 'admin' && (
              <div className="grid md:grid-cols-2 gap-8">
                <FormItem>
                  <FormLabel>Banner da Página Inicial</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                  </FormControl>
                  {homeBannerPreview && (
                    <div className="mt-4 relative aspect-video w-full">
                      <Image src={homeBannerPreview} alt="Pré-visualização do Banner" fill className="rounded-md object-cover" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
                <FormItem>
                  <FormLabel>Imagem da Página "Sobre"</FormLabel>
                  <FormControl>
                    <Input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'about')} />
                  </FormControl>
                  {aboutImagePreview && (
                    <div className="mt-4 relative aspect-square w-full">
                      <Image src={aboutImagePreview} alt="Pré-visualização da imagem Sobre" fill className="rounded-md object-cover" />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              </div>
            )}
            
            <FormField
              control={form.control}
              name="aboutStory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>História da Página "Sobre"</FormLabel>
                  <FormControl>
                    <Textarea rows={8} placeholder="Escreva a doce história da sua confeitaria aqui..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

             <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Links e Contato</CardTitle>
                    <CardDescription>Insira os links completos (incluindo https://) e o número de contato.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <FormField
                        control={form.control}
                        name="socialInstagram"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Instagram</FormLabel>
                            <FormControl>
                                <Input placeholder="https://www.instagram.com/seu-usuario" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="socialFacebook"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Facebook</FormLabel>
                            <FormControl>
                                <Input placeholder="https://www.facebook.com/sua-pagina" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="socialWhatsapp"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>WhatsApp (Número ou Link)</FormLabel>
                            <FormControl>
                                <Input placeholder="5511999998888 ou https://wa.me/5511..." {...field} />
                            </FormControl>
                             <p className="text-xs text-muted-foreground pt-1">Usado no rodapé e página de contato.</p>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
             </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 {userRole === 'socialMedia' ? 'Enviar para Aprovação' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
