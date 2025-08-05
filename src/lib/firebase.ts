// src/lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, Timestamp } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// A configuração do Firebase é carregada a partir de variáveis de ambiente
// para segurança e flexibilidade entre ambientes (desenvolvimento, produção).
// O Next.js substitui `process.env.NEXT_PUBLIC_*` pelos valores corretos no momento do build.
const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Inicializa o Firebase apenas uma vez para evitar erros de "app já existe".
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Exporta as instâncias dos serviços do Firebase para serem usadas em todo o aplicativo.
export { app, auth, db, storage, Timestamp };
