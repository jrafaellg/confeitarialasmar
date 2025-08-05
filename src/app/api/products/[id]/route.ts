// src/app/api/products/[id]/route.ts
/**
 * Este arquivo define as rotas da API para um produto específico (por ID),
 * utilizando o Firebase Admin SDK para garantir acesso privilegiado.
 */
import { NextResponse } from 'next/server';
import type { Product } from '@/lib/types';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

type RouteParams = {
  params: {
    id: string;
  }
}

// Função auxiliar para excluir uma imagem do Firebase Storage pela sua URL.
const deleteImageByUrl = async (imageUrl: string) => {
  const { adminStorage } = await import('@/lib/firebase-admin');
  if (!imageUrl || !imageUrl.startsWith('https://firebasestorage.googleapis.com')) {
    console.warn(`URL de imagem inválida ou não é do Firebase, pulando exclusão: ${imageUrl}`);
    return;
  }
  try {
    const bucket = adminStorage.bucket();
    // Extrai o nome do arquivo da URL. A URL tem o formato:
    // https://firebasestorage.googleapis.com/v0/b/BUCKET_NAME/o/FILE_PATH?alt=media
    const decodedUrl = decodeURIComponent(imageUrl);
    const filePath = decodedUrl.substring(
        decodedUrl.indexOf('/o/') + 3,
        decodedUrl.indexOf('?alt=media')
    );
    
    const file = bucket.file(filePath);
    await file.delete();
  } catch (error: any) {
    // Ignora o erro se o objeto não for encontrado (pode já ter sido excluído).
    if (error.code !== 404) {
      console.error("Erro ao excluir imagem do storage via Admin SDK:", error);
    }
  }
};

/**
 * GET: Busca os dados de um único produto pelo seu ID.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const { id } = params;
    const productDoc = await adminDb.collection('products').doc(id).get();

    if (!productDoc.exists) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ id: productDoc.id, ...productDoc.data() });
  } catch (error: any) {
    console.error(`Erro ao buscar produto ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao buscar produto', details: error.message }, { status: 500 });
  }
}

/**
 * PUT: Atualiza um produto existente, usando o Admin SDK.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { adminDb, adminStorage } = await import('@/lib/firebase-admin');
    const { id } = params;
    const formData = await request.formData();
    const productData: any = {};
    const newImageFiles: File[] = [];

    formData.forEach((value, key) => {
      if (key === 'images') newImageFiles.push(value as File);
      else productData[key] = value;
    });

    const existingImageUrls = JSON.parse(productData.existingImageUrls || '[]');
    delete productData.existingImageUrls;

    const originalDoc = await adminDb.collection('products').doc(id).get();
    if (!originalDoc.exists) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }
    const originalImageUrls = originalDoc.data()?.images || [];

    const imagesToDelete = originalImageUrls.filter((url: string) => !existingImageUrls.includes(url));
    await Promise.all(imagesToDelete.map(deleteImageByUrl));

    const bucket = adminStorage.bucket();
    const newImageUrls: string[] = [];
    for (const file of newImageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uniqueFileName = `products/${Date.now()}-${file.name.replace(/\s/g, '_')}`;
      const blob = bucket.file(uniqueFileName);
      const blobStream = blob.createWriteStream({ metadata: { contentType: file.type } });
      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', resolve);
        blobStream.end(buffer);
      });
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
      newImageUrls.push(publicUrl);
    }

    const finalImageUrls = [...existingImageUrls, ...newImageUrls];
    if (finalImageUrls.length === 0) {
      return NextResponse.json({ error: 'O produto deve ter pelo menos uma imagem.' }, { status: 400 });
    }

    const finalProductData = {
      ...productData,
      price: Number(productData.price),
      featured: productData.featured === 'true',
      images: finalImageUrls,
    };

    await adminDb.collection('products').doc(id).update(finalProductData);
    return NextResponse.json({ id, ...finalProductData });

  } catch (error: any) {
    console.error(`Erro ao atualizar produto ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao atualizar produto', details: error.message }, { status: 500 });
  }
}

/**
 * DELETE: Exclui um produto e suas imagens associadas.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const { id } = params;
    const docRef = adminDb.collection('products').doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const product = docSnap.data() as Product;
      if (product.images && Array.isArray(product.images)) {
        await Promise.all(product.images.map(deleteImageByUrl));
      }
    } else {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    await docRef.delete();
    return NextResponse.json({ message: 'Produto excluído com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error(`Erro ao excluir produto ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao excluir produto', details: error.message }, { status: 500 });
  }
}
