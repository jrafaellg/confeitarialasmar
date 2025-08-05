'use client';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';
import { signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { AdminTabs } from '@/components/admin/AdminTabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from 'react';
import { KeyRound, Home, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: 'Você saiu com sucesso.' });
      router.push('/admin/login');
    } catch (error) {
      toast({
        title: 'Erro ao sair',
        description: 'Não foi possível fazer logout. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleChangePassword = async () => {
    setIsUpdating(true);
    const user = auth.currentUser;

    if (!user || !user.email) {
      toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
      setIsUpdating(false);
      return;
    }

    if (newPassword.length < 6) {
        toast({ title: "Senha muito curta", description: "A nova senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
        setIsUpdating(false);
        return;
    }

    try {
      // Re-authenticate the user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);

      toast({ title: "Sucesso!", description: "Sua senha foi alterada." });
      setIsPasswordDialogOpen(false);
      setCurrentPassword('');
      setNewPassword('');

    } catch (error: any) {
      let description = "Ocorreu um erro. Tente novamente.";
      if (error.code === 'auth/wrong-password') {
        description = "A senha atual está incorreta.";
      }
      toast({
        title: 'Erro ao alterar a senha',
        description: description,
        variant: 'destructive',
      });
    } finally {
        setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/50">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
         <h1 className="text-3xl font-bold font-headline">Painel de Controle</h1>
         <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" asChild>
                <Link href="/"><Home className="mr-2 h-4 w-4" />Voltar para a Loja</Link>
            </Button>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><KeyRound className="mr-2 h-4 w-4" />Alterar Senha</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Alterar Senha</DialogTitle>
                  <DialogDescription>
                    Digite sua senha atual e a nova senha desejada. A nova senha deve ter pelo menos 6 caracteres.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="current-password" className="text-right">
                      Senha Atual
                    </Label>
                    <Input
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="new-password" className="text-right">
                      Nova Senha
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" onClick={handleChangePassword} disabled={isUpdating}>
                    {isUpdating ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button onClick={handleLogout} variant="outline"><LogOut className="mr-2 h-4 w-4" />Sair</Button>
         </div>
      </header>
      <main className="flex-grow p-6">
        <AdminTabs />
      </main>
    </div>
  );
}