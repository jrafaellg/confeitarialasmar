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

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check user role
      const roleDocRef = doc(db, 'userRoles', user.uid);
      const roleDocSnap = await getDoc(roleDocRef);

      if (roleDocSnap.exists()) {
        const userRole = roleDocSnap.data().role;
        toast({ title: "Login bem-sucedido!" });
        if (userRole === 'admin' || userRole === 'socialMedia') {
          // Redireciona ambos para o dashboard principal.
          router.push('/admin/dashboard');
        } else {
          // Default redirect if role is not recognized, or logout
          toast({ title: "Acesso não permitido", description: "Você não tem permissão para acessar esta área.", variant: 'destructive'});
          auth.signOut();
        }
      } else {
        // No role found for this user
        toast({ title: "Acesso negado", description: "Sua conta não tem um perfil de acesso definido.", variant: 'destructive'});
        auth.signOut();
      }

    } catch (error: any) {
        let description = "Verifique seu e-mail e senha e tente novamente.";
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            description = "Credenciais inválidas. Verifique seu e-mail e senha.";
        }
        
        toast({
            title: "Erro no login",
            description: description,
            variant: "destructive",
        });
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
              />
            </div>
            <Button type="submit" className="w-full">
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
