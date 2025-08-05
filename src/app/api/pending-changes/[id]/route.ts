// src/app/api/pending-changes/[id]/route.ts
import { NextResponse } from 'next/server';
import type { PendingChange } from '@/lib/types';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

type RouteParams = {
  params: {
    id: string;
  }
}

/**
 * PUT: Processa uma aprovação ou rejeição.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const { id } = params;
    const { status } = await request.json();

    if (status !== 'approved' && status !== 'rejected') {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }
    
    const changeDocRef = adminDb.collection('pendingChanges').doc(id);
    const changeDocSnap = await changeDocRef.get();

    if (!changeDocSnap.exists) {
        return NextResponse.json({ error: 'Alteração não encontrada.' }, { status: 404 });
    }
    
    const changeData = changeDocSnap.data() as PendingChange;

    if (changeData.status !== 'pending') {
        return NextResponse.json({ error: 'Esta alteração já foi processada.' }, { status: 409 });
    }

    // Se aprovado, aplica a alteração no documento real
    if (status === 'approved') {
        switch(changeData.type) {
            case 'product_create':
                await adminDb.collection('products').add(changeData.data);
                break;
            case 'product_update':
                if(changeData.targetId) {
                    await adminDb.collection('products').doc(changeData.targetId).update(changeData.data);
                }
                break;
            case 'category_create':
                await adminDb.collection('categories').add(changeData.data);
                break;
            case 'category_update':
                if(changeData.targetId) {
                    await adminDb.collection('categories').doc(changeData.targetId).update(changeData.data);
                }
                break;
            case 'site_config_update':
                await adminDb.collection('siteConfig').doc('main').set(changeData.data, { merge: true });
                break;
            default:
                throw new Error('Tipo de alteração desconhecido.');
        }
    }

    // Atualiza o status da solicitação de alteração
    await changeDocRef.update({ status });

    return NextResponse.json({ message: `Alteração ${status === 'approved' ? 'aprovada' : 'rejeitada'} com sucesso.` });
  } catch (error: any) {
    console.error(`Error processing change ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao processar a alteração', details: error.message }, { status: 500 });
  }
}
