// src/app/api/featured-products/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

/**
 * GET: Busca os produtos em destaque do Firestore usando o Admin SDK.
 */
export async function GET(request: Request) {
  try {
    const q = adminDb.collection('products').where('featured', '==', true);
    const featuredProductsSnapshot = await q.get();
    
    const featuredProducts = featuredProductsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(featuredProducts);
  } catch (error: any) {
    console.error("Erro ao buscar produtos em destaque com Admin SDK: ", error);
    return NextResponse.json({ error: 'Falha ao buscar produtos em destaque', details: error.message }, { status: 500 });
  }
}
