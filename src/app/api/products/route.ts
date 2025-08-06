// src/app/api/products/route.ts
/**
 * Este arquivo define as rotas da API para a coleção de produtos,
 * utilizando o Firebase Admin SDK para garantir acesso privilegiado.
 */
import { NextResponse, NextRequest } from 'next/server';
import { adminDb, adminStorage } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

/**
 * GET: Busca uma lista de produtos com suporte a filtros, usando o Admin SDK.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const categorySlug = searchParams.get('categorySlug');

    // Declara a variável com o tipo correto
    let query: import('firebase-admin/firestore').Query = adminDb.collection('products');

    if (slug) {
      query = query.where('slug', '==', slug);
    } else if (categorySlug) {
      query = query.where('categorySlug', '==', categorySlug);
    }
    
    const productsSnapshot = await query.get();
    const products = productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Erro ao buscar produtos com Admin SDK: ", error);
    return NextResponse.json({ error: 'Falha ao buscar produtos', details: error.message }, { status: 500 });
  }
}

/**
 * POST: Cria um novo produto, incluindo upload de imagens, usando o Admin SDK.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const productData: any = {};
    const imageFiles: File[] = [];

    formData.forEach((value, key) => {
      if (key === 'images') imageFiles.push(value as File);
      else productData[key] = value;
    });

    if (imageFiles.length === 0) {
       return NextResponse.json({ error: 'Pelo menos uma imagem é necessária.' }, { status: 400 });
    }

    const imageUrls: string[] = [];
    const bucket = adminStorage.bucket();

    for (const file of imageFiles) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uniqueFileName = `products/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
        const blob = bucket.file(uniqueFileName);
        const blobStream = blob.createWriteStream({
            metadata: { contentType: file.type },
        });
        
        await new Promise((resolve, reject) => {
            blobStream.on('error', reject);
            blobStream.on('finish', resolve);
            blobStream.end(buffer);
        });

        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
        imageUrls.push(publicUrl);
    }
    
    const finalProductData = {
      ...productData,
      price: Number(productData.price),
      featured: productData.featured === 'true',
      images: imageUrls,
      createdAt: FieldValue.serverTimestamp(),
    };
    
    const docRef = await adminDb.collection('products').add(finalProductData);

    const createdProduct = {
      id: docRef.id,
      ...finalProductData,
      createdAt: new Date().toISOString()
    }

    return NextResponse.json(createdProduct, { status: 201 });
  } catch (error: any) {
    console.error("Error creating product: ", error);
    return NextResponse.json({ error: 'Failed to create product', details: error.message }, { status: 500 });
  }
}
