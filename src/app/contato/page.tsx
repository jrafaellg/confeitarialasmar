import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold font-headline">Fale Conosco</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Tem alguma dúvida, sugestão ou quer fazer uma encomenda especial? Adoraríamos ouvir você!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mt-16">
            <div className="space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Phone className="h-8 w-8 text-primary" />
                  <CardTitle className="font-headline">Telefone e WhatsApp</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Para pedidos e informações rápidas.</p>
                  <a href="tel:+5512982398984" className="text-lg font-semibold text-foreground hover:text-primary transition-colors block mt-2">+55 (12) 98239-8984</a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Mail className="h-8 w-8 text-primary" />
                  <CardTitle className="font-headline">E-mail</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Para orçamentos de eventos e parcerias.</p>
                  <a href="mailto:jrafael.lg@hotmail.com" className="text-lg font-semibold text-foreground hover:text-primary transition-colors block mt-2">jrafael.lg@hotmail.com</a>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <MapPin className="h-8 w-8 text-primary" />
                  <CardTitle className="font-headline">Atendimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Nosso ateliê funciona apenas para retirada de encomendas.</p>
                  <p className="text-lg font-semibold text-foreground mt-2">Taubaté, SP</p>
                  <p className="text-sm text-muted-foreground mt-1">Retiradas a combinar.</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-card p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold font-headline mb-6">Ou envie uma mensagem</h2>
                <form className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">Nome</label>
                        <input type="text" id="name" name="name" className="block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Seu nome completo" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">E-mail</label>
                        <input type="email" id="email" name="email" className="block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="seu@email.com" />
                    </div>
                    <div>
                        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-1">Mensagem</label>
                        <textarea id="message" name="message" rows={5} className="block w-full px-3 py-2 bg-input border border-border rounded-md shadow-sm placeholder-muted-foreground focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Escreva sua mensagem aqui..."></textarea>
                    </div>
                    <div>
                        <Button type="submit" className="w-full">Enviar Mensagem</Button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
