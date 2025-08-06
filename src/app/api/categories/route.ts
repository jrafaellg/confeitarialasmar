// src/app/api/categories/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

/**
 * GET: Busca todas as categorias do Firestore usando o Admin SDK.
 */
export async function GET(request: Request) {
  try {
    const categoriesSnapshot = await adminDb.collection('categories').orderBy('name', 'asc').get();
    
    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("Erro ao buscar categorias com Admin SDK: ", error);
    return NextResponse.json({ error: 'Falha ao buscar categorias', details: error.message }, { status: 500 });
  }
}

/**
 * POST: Cria uma nova categoria usando o Admin SDK.
 */
export async function POST(request: Request) {
  try {
    const { name, slug } = await request.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Nome e slug são obrigatórios' }, { status: 400 });
    }

    const newCategory = { 
        name, 
        slug, 
        createdAt: FieldValue.serverTimestamp() 
    };
    
    const docRef = await adminDb.collection('categories').add(newCategory);

    return NextResponse.json({ id: docRef.id, ...newCategory, createdAt: new Date().toISOString() }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating category: ", error);
    return NextResponse.json({ error: 'Falha ao criar categoria', details: error.message }, { status: 500 });
  }
}
