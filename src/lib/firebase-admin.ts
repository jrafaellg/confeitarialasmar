// src/lib/firebase-admin.ts
import admin from 'firebase-admin';
import type { App } from 'firebase-admin/app';

// Define uma estrutura para armazenar as instâncias dos serviços inicializados.
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
 * Este padrão previne que o código de inicialização seja executado durante o
 * processo de build do Next.js. A inicialização agora ocorre de forma "lazy", 
 * apenas quando um serviço é efetivamente requisitado pela primeira vez em tempo de execução.
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
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
    
    if (!serviceAccountJson) {
      throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_BASE64 não está definida.');
    }

    const decodedServiceAccount = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
    const serviceAccount = JSON.parse(decodedServiceAccount);

    // Validação básica da chave de serviço para fornecer erros mais claros.
    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('O JSON da chave de serviço do Firebase é inválido ou está incompleto.');
    }

    // Inicializa o app do Firebase Admin.
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.appspot.com`,
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
    // Trata especificamente erros de parsing do JSON.
    if (error instanceof SyntaxError) {
      console.error('Falha na inicialização do Firebase Admin: O JSON da chave de serviço é inválido.', error);
      throw new Error(`Falha ao analisar o JSON da chave de serviço: ${error.message}`);
    }
    console.error('Falha na inicialização do Firebase Admin:', error);
    throw new Error(`Falha ao conectar-se aos serviços do Firebase no servidor: ${error.message}`);
  }
}

// Exporta getters para cada serviço. Ao chamar, por exemplo, `adminDb`,
// a função `getFirebaseAdmin` será executada, garantindo que a inicialização ocorra de forma segura.
export const adminDb = getFirebaseAdmin().db;
export const adminStorage = getFirebaseAdmin().storage;
export const adminAuth = getFirebaseAdmin().auth;
