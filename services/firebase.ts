
import * as firebaseApp from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';

// TODO: Substitua pelos dados do seu projeto Firebase (Firebase Console -> Project Settings)
// Esta configuração é necessária para sincronizar com a App Flutter.
const firebaseConfig = {
  apiKey: "AIzaSyA3ySaIc78Mmx4_qizkChbVVKNC8Z4RN1Q",
  authDomain: "nurufit-ed.firebaseapp.com",
  projectId: "nurufit-ed",
  storageBucket: "nurufit-ed.firebasestorage.app",
  messagingSenderId: "306693979941",
  appId: "1:306693979941:web:442694191462128f0aa4cc",
  measurementId: "G-P27ZF90MJ2"
};

// Inicialização segura
let app;
let auth;
let db;
let googleProvider;

try {
    // Verifica se a chave não é a placeholder padrão ou string vazia
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE") {
        app = firebaseApp.initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
        console.log("Firebase conectado com sucesso.");
    } else {
        console.warn("Firebase não configurado. A app está usando LocalStorage.");
    }
} catch (e) {
    console.error("Erro ao inicializar Firebase:", e);
}

export { auth, db, googleProvider };

/**
 * Função para sincronizar o perfil do usuário com o Firestore.
 * Salva tudo: Onboarding, Plano JSON, Progresso (Streak, Logs).
 */
export const syncUserProfile = async (user: UserProfile) => {
    if (!db || !user.id || user.isVisitor) return;

    try {
        await setDoc(doc(db, "users", user.id), user, { merge: true });
        console.log("Perfil sincronizado com Firestore.");
    } catch (error) {
        console.error("Erro ao sincronizar com Firebase:", error);
    }
};

/**
 * Função para carregar dados iniciais (substitui o localStorage no futuro)
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!db) return null;
    try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as UserProfile;
        }
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
    }
    return null;
};
