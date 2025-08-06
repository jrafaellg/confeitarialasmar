// src/app/api/site-config/route.ts
import { NextResponse } from 'next/server';
import type { SiteConfig } from '@/lib/types';
import { adminDb } from '@/lib/firebase-admin';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';


/**
 * GET: Busca a configuração do site.
 */
export async function GET() {
  try {
    const configDocRef = adminDb.collection('siteConfig').doc('main');
    const docSnap = await configDocRef.get();
    if (!docSnap.exists) {
      // Se não existir, retorna um objeto vazio para o front-end lidar.
      return NextResponse.json({});
    }
    return NextResponse.json(docSnap.data());
  } catch (error: any) {
    console.error("Error fetching site config:", error);
    return NextResponse.json({ error: 'Failed to fetch site config', details: error.message }, { status: 500 });
  }
}

/**
 * POST: Atualiza a configuração do site.
 */
export async function POST(request: Request) {
  try {
    const configDocRef = adminDb.collection('siteConfig').doc('main');
    const data: SiteConfig = await request.json();
    
    // Usando set com a opção de merge para criar ou atualizar o documento.
    await configDocRef.set(data, { merge: true });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error updating site config:", error);
    return NextResponse.json({ error: 'Failed to update site config', details: error.message }, { status: 500 });
  }
}
