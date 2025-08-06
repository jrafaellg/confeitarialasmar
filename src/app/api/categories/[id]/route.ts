// src/app/api/categories/[id]/route.ts
/**
 * Este arquivo define as rotas da API para uma categoria específica (por ID).
 * Ele lida com as operações GET (buscar), PUT (atualizar) e DELETE (excluir).
 */
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

// Define o tipo dos parâmetros da rota, garantindo que `params.id` esteja disponível.
type RouteParams = {
  params: {
    id: string;
  }
}

/**
 * GET: Busca os dados de uma única categoria pelo seu ID.
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é inválido ou está ausente' }, { status: 400 });
    }

    const categoryDoc = await adminDb.collection('categories').doc(id).get();

    if (!categoryDoc.exists) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    // Retorna os dados da categoria com seu ID.
    return NextResponse.json({ id: categoryDoc.id, ...categoryDoc.data() });
  } catch (error: any) {
    console.error(`Erro ao buscar categoria ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao buscar categoria', details: error.message || 'Erro desconhecido no servidor' }, { status: 500 });
  }
}

/**
 * PUT: Atualiza os dados de uma categoria existente.
 */
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;
    const { name, slug } = await request.json(); // Extrai nome e slug do corpo da requisição.

    if (!id || !name || !slug) {
      return NextResponse.json({ error: 'ID, nome e slug são obrigatórios' }, { status: 400 });
    }
    
    const categoryDocRef = adminDb.collection('categories').doc(id);
    await categoryDocRef.update({ name, slug });

    return NextResponse.json({ id, name, slug });
  } catch (error: any) {
    console.error(`Error updating category ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao atualizar categoria', details: error.message || 'Erro desconhecido no servidor' }, { status: 500 });
  }
}

/**
 * DELETE: Exclui uma categoria.
 * Inclui uma verificação para impedir a exclusão se a categoria estiver em uso por algum produto.
 */
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é inválido ou está ausente' }, { status: 400 });
    }
    
    // Primeiro, busca o slug da categoria para poder procurar produtos associados.
    const categoryDoc = await adminDb.collection('categories').doc(id).get();
    if (!categoryDoc.exists) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }
    const categorySlug = categoryDoc.data()?.slug;
    
    // Consulta a coleção de produtos para ver se algum produto usa esta categoria.
    const productsQuery = adminDb.collection('products').where('categorySlug', '==', categorySlug).limit(1);
    const productsSnapshot = await productsQuery.get();

    // Se a consulta retornar algum produto, retorna um erro de conflito (409).
    if (!productsSnapshot.empty) {
        return NextResponse.json(
            { error: 'Categoria em uso', details: 'Não é possível excluir esta categoria pois ela está associada a um ou mais produtos.' },
            { status: 409 } // 409 Conflict é o status HTTP apropriado para este caso.
        );
    }
    
    // Se não houver produtos, exclui a categoria.
    await adminDb.collection('categories').doc(id).delete();

    return NextResponse.json({ message: 'Categoria excluída com sucesso' }, { status: 200 });
  } catch (error: any) {
    console.error(`Error deleting category ${params.id}:`, error);
    return NextResponse.json({ error: 'Falha ao excluir categoria', details: error.message || 'Erro desconhecido no servidor' }, { status: 500 });
  }
}
