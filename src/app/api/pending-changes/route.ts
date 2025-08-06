// src/app/api/pending-changes/route.ts
import { NextResponse } from 'next/server';
import type { PendingChange } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

/**
 * GET: Busca todas as alterações pendentes, ordenadas pela mais recente.
 */
export async function GET() {
  try {
    const snapshot = await adminDb.collection('pendingChanges').orderBy('submittedAt', 'desc').get();
    const changes = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            submittedAt: data.submittedAt.toDate().toISOString(), // Converte timestamp para string
        }
    });
    return NextResponse.json(changes);
  } catch (error: any) {
    console.error("Error fetching pending changes:", error);
    return NextResponse.json({ error: 'Failed to fetch pending changes', details: error.message }, { status: 500 });
  }
}

/**
 * POST: Cria uma nova solicitação de alteração.
 */
export async function POST(request: Request) {
  try {
    const changeData: Omit<PendingChange, 'id' | 'status' | 'submittedAt'> = await request.json();

    if (!changeData.type || !changeData.data || !changeData.submittedBy) {
      return NextResponse.json({ error: 'Dados inválidos para a solicitação de alteração' }, { status: 400 });
    }

    const newChangeRequest = {
      ...changeData,
      status: 'pending', // O status inicial é sempre pendente
      submittedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb.collection('pendingChanges').add(newChangeRequest);

    return NextResponse.json({ id: docRef.id, ...newChangeRequest }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating pending change:", error);
    return NextResponse.json({ error: 'Failed to create pending change', details: error.message }, { status: 500 });
  }
}
