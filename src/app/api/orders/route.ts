// src/app/api/orders/route.ts
import { NextResponse } from 'next/server';

// Força a rota a ser sempre dinâmica, evitando erros de build estático.
export const dynamic = 'force-dynamic';

/**
 * GET: Busca todos os pedidos do Firestore, ordenados pela data de criação.
 */
export async function GET() {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const ordersSnapshot = await adminDb.collection('orders').orderBy('createdAt', 'desc').get();
    const orderList = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      // O Admin SDK retorna o timestamp, que precisa ser convertido para ser serializável.
      const createdAtString = createdAt ? new Date(createdAt._seconds * 1000).toISOString() : new Date().toISOString();
      return { id: doc.id, ...data, createdAt: createdAtString };
    });
    return NextResponse.json(orderList);
  } catch (error: any) {
    console.error("Error fetching orders with admin SDK: ", error);
    return NextResponse.json({ error: 'Failed to fetch orders', details: error.message }, { status: 500 });
  }
}

/**
 * POST: Cria um novo pedido no Firestore usando o Admin SDK.
 */
export async function POST(request: Request) {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    const { FieldValue } = await import('firebase-admin/firestore');
    const orderData = await request.json();

    if (!orderData.items || orderData.items.length === 0 || !orderData.subtotal || !orderData.customerPhone) {
      return NextResponse.json({ error: 'Invalid order data' }, { status: 400 });
    }
    
    const docRef = await adminDb.collection('orders').add({
      ...orderData,
      createdAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ id: docRef.id, ...orderData, createdAt: new Date().toISOString() }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order with admin SDK: ", error);
    return NextResponse.json({ error: 'Failed to create order', details: error.message }, { status: 500 });
  }
}
