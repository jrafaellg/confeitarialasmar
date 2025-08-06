// src/app/api/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

type RouteParams = {
  params: {
    id: string;
  }
}

/**
 * GET: Busca os dados de um único pedido pelo seu ID.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const docSnap = await adminDb.collection('orders').doc(id).get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }
    const data = docSnap.data()!;
    const createdAt = data.createdAt;
    const createdAtString = createdAt ? new Date(createdAt._seconds * 1000).toISOString() : new Date().toISOString();

    return NextResponse.json({ id: docSnap.id, ...data, createdAt: createdAtString });
  } catch (error: any) {
    console.error(`Erro ao buscar pedido ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao buscar pedido', details: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Exclui um pedido.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    await adminDb.collection('orders').doc(id).delete();
    return NextResponse.json({ message: 'Pedido excluído com sucesso' }, { status: 200 });
  } catch (error: any)
{
    console.error(`Erro ao excluir pedido ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao excluir pedido', details: error.message }, { status: 500 });
  }
}
