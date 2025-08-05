// src/app/api/setup-admin/route.ts
/**
 * Rota de API para configurar os usuários iniciais (admin e social media).
 * ATENÇÃO: Esta rota deve ser usada com cuidado, idealmente apenas uma vez.
 * Em um ambiente de produção real, a criação de usuários e perfis
 * seria feita através de um painel de gerenciamento de usuários.
 */
import { NextResponse } from 'next/server';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

// Defina os e-mails dos usuários aqui.
// IMPORTANTE: Estes usuários já devem existir no seu "Firebase Authentication".
const ADMIN_EMAIL = 'jrafael.lg@hotmail.com';
const SOCIAL_MEDIA_EMAIL = 'socialmedia@confeitaria.com';

// Função auxiliar para configurar um perfil de usuário.
async function setUserRole(email: string, role: 'admin' | 'socialMedia'): Promise<string> {
  const { adminAuth, adminDb } = await import('@/lib/firebase-admin');
  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    const { uid } = userRecord;

    if (!uid) {
      return `Usuário ${email} não encontrado no Firebase Auth.`;
    }

    const roleDocRef = adminDb.collection('userRoles').doc(uid);
    const docSnap = await roleDocRef.get();

    if (docSnap.exists) {
      // Se o perfil já existe, apenas atualiza para garantir que está correto.
      await roleDocRef.update({ email, role });
      return `O perfil '${role}' para ${email} foi verificado e atualizado.`;
    }

    await roleDocRef.set({ email, role });
    return `Perfil '${role}' criado com sucesso para ${email}.`;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      return `ERRO: Usuário ${email} não encontrado no Firebase Authentication. Crie-o primeiro no painel do Firebase.`;
    }
    return `ERRO ao configurar ${email}: ${error.message}`;
  }
}

export async function GET(request: Request) {
  try {
    const adminResult = await setUserRole(ADMIN_EMAIL, 'admin');
    const socialMediaResult = await setUserRole(SOCIAL_MEDIA_EMAIL, 'socialMedia');

    return NextResponse.json({
      success: true,
      results: [
        { user: ADMIN_EMAIL, status: adminResult },
        { user: SOCIAL_MEDIA_EMAIL, status: socialMediaResult },
      ]
    });

  } catch (error: any) {
    console.error("Erro geral ao configurar perfis:", error);
    return NextResponse.json({ error: 'Falha ao executar o script de configuração.', details: error.message }, { status: 500 });
  }
}
