'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SiteConfig } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AboutPage() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/site-config');
        if (!response.ok) throw new Error('Failed to fetch site configuration');
        const data = await response.json();
        setConfig(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative w-full aspect-square rounded-lg overflow-hidden shadow-lg">
              {loading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <Image 
                  src={config?.aboutImageUrl || "https://placehold.co/800x800.png"}
                  alt="Confeiteira sorrindo"
                  fill
                  className="object-cover"
                  data-ai-hint="smiling baker"
                />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-headline mb-6">Nossa Doce História</h1>
              <div className="space-y-4 text-lg text-foreground/80">
                {loading ? (
                  <>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-11/12" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/5" />
                  </>
                ) : (
                  config?.aboutStory?.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph || '\u00A0'}</p> 
                  )) || <p>Carregando história...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
