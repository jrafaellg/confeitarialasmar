'use client';

import Image from 'next/image';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check user role
      const roleDocRef = doc(db, 'userRoles', user.uid);
      const roleDocSnap = await getDoc(roleDocRef);

      if (roleDocSnap.exists()) {
        const userRole = roleDocSnap.data().role;
        if (userRole === 'admin' || userRole === 'socialMedia') {
          toast({ title: "Login bem-sucedido!" });
          router.push('/admin/dashboard');
        } else {
          auth.signOut();
          toast({ title: "Acesso não permitido", description: "Você não tem permissão para acessar esta área.", variant: 'destructive'});
        }
      } else {
        auth.signOut();
        toast({ title: "Acesso negado", description: "Sua conta não tem um perfil de acesso definido.", variant: 'destructive'});
      }

    } catch (error: any) {
        let description = "Ocorreu um erro desconhecido. Tente novamente.";
        // Simplificando a verificação de erros de credenciais
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
            description = "E-mail ou senha inválidos. Verifique e tente novamente.";
        }
        
        toast({
            title: "Erro no login",
            description: description,
            variant: "destructive",
        });
        // Limpa a senha para nova tentativa
        setPassword('');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Image 
            src="/logo.png"
            alt="Confeitaria Lasmar Logo" 
            width={160} 
            height={160}
            className="mx-auto h-40 w-40 mb-4"
          />
          <CardTitle className="text-2xl font-headline">Painel Administrativo</CardTitle>
          <CardDescription>
            Acesso restrito. Use suas credenciais para entrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
          </form>
           <Separator className="my-4" />
           <Button variant="outline" className="w-full" asChild>
              <Link href="/">Voltar para a loja</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
