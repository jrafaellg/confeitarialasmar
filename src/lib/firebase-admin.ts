// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';
import serviceAccount from '../../confeitaria-lasmar.json';

// Define a estrutura para armazenar as instâncias dos serviços inicializados.
interface FirebaseAdminServices {
  app: App;
  db: admin.firestore.Firestore;
  storage: admin.storage.Storage;
  auth: admin.auth.Auth;
}

// Guarda a instância dos serviços em cache para evitar reinicializações.
let services: FirebaseAdminServices | null = null;

/**
 * Garante que o Firebase Admin seja inicializado apenas uma vez (padrão Singleton).
 */
function getFirebaseAdmin(): FirebaseAdminServices {
  // Se os serviços já foram inicializados, retorna a instância em cache.
  if (services) {
    return services;
  }

  // Verifica se o app já foi inicializado em outro lugar (pouco provável com este padrão).
  if (admin.apps.length > 0 && admin.apps[0]) {
    const app = admin.apps[0];
    services = {
      app,
      db: admin.firestore(app),
      storage: admin.storage(app),
      auth: admin.auth(app),
    };
    return services;
  }
  
  try {
    // Para contornar o problema de snake_case vs camelCase,
    // usamos o tipo 'any' para a verificação, mas passamos o objeto
    // correto para a função 'cert' que sabe como lidar com ele.
    const serviceAccountCredentials = serviceAccount as admin.ServiceAccount;

    // Inicializa o app do Firebase Admin.
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccountCredentials),
      storageBucket: `${serviceAccountCredentials.projectId}.appspot.com`,
    });
    
    // Armazena os serviços inicializados na variável de cache.
    services = {
      app,
      db: admin.firestore(app),
      storage: admin.storage(app),
      auth: admin.auth(app),
    };
    
    return services;

  } catch (error: any) {
    console.error('Falha na inicialização do Firebase Admin:', error);
    throw new Error(`Falha ao conectar-se aos serviços do Firebase no servidor: ${error.message}`);
  }
}

// Exporta getters para cada serviço. Ao chamar, por exemplo, `adminDb`,
// a função `getFirebaseAdmin` será executada, garantindo que a inicialização ocorra de forma segura.
export const adminDb = getFirebaseAdmin().db;
export const adminStorage = getFirebaseAdmin().storage;
export const adminAuth = getFirebaseAdmin().auth;
