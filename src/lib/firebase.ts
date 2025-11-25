import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithCustomToken } from 'firebase/auth';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'dummy-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy-domain.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy-bucket.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abc123'
};

// Verificar que las variables de entorno estén configuradas (solo warnings, no errores)
const hasRealConfig = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN && 
                      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!hasRealConfig && typeof window !== 'undefined') {
  console.warn('⚠️ Firebase configuration is using dummy values. Authentication will not work.');
  console.warn('Please configure Firebase environment variables in Vercel.');
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

try {
  // Solo inicializar Firebase si tenemos configuración real
  if (hasRealConfig) {
    try {
      // Intentar obtener la app existente o crear una nueva
      app = getApp();
    } catch (error) {
      // Si no existe, inicializar Firebase
      app = initializeApp(firebaseConfig);
      if (typeof window !== 'undefined') {
        console.log('✅ Firebase initialized with WIF support');
      }
    }

    // Obtener instancia de Auth
    auth = getAuth(app);
  }
} catch (error) {
  // Silenciar errores durante el build
  if (typeof window !== 'undefined') {
    console.error('Error initializing Firebase:', error);
  }
}

/**
 * Workload Identity Federation (WIF) - Autenticación Automática
 * 
 * Esta función implementa WIF para autenticación automática con Firebase.
 * El backend genera un custom_token que se convierte automáticamente en id_token.
 * 
 * Flujo WIF:
 * 1. Usuario se autentica con backend (email/password)
 * 2. Backend valida credenciales y genera custom_token de Firebase
 * 3. Frontend usa signInWithCustomToken para autenticación automática
 * 4. Firebase Auth mantiene la sesión activa automáticamente
 * 5. Los tokens se renuevan automáticamente sin intervención del usuario
 * 
 * @param customToken - Token personalizado del backend
 * @returns Promise<string> - ID token de Firebase para usar en API calls
 */
export async function authenticateWithWIF(customToken: string): Promise<string> {
  if (!auth || !hasRealConfig) {
    throw new Error('Firebase Auth no está configurado. Por favor, configura las variables de entorno de Firebase.');
  }

  try {
    console.log('🔐 WIF: Iniciando autenticación automática...');
    
    // Usar signInWithCustomToken para autenticación automática (WIF)
    const userCredential = await signInWithCustomToken(auth, customToken);
    
    // Obtener el ID token automáticamente
    const idToken = await userCredential.user.getIdToken();
    
    console.log('✅ WIF: Autenticación exitosa');
    console.log('👤 Usuario autenticado:', userCredential.user.uid);
    
    // El token se renueva automáticamente por Firebase Auth
    return idToken;
  } catch (error: any) {
    console.error('❌ WIF: Error en autenticación automática:', error);
    
    // Proporcionar mensajes de error específicos
    if (error.code === 'auth/invalid-custom-token') {
      throw new Error('Token de autenticación inválido. Por favor, inicia sesión nuevamente.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Error de red. Verifica tu conexión a internet.');
    } else {
      throw new Error('Error en autenticación automática: ' + error.message);
    }
  }
}

/**
 * Obtiene el token actual de autenticación con renovación automática
 * Esta función es parte del sistema WIF y renueva el token automáticamente si está próximo a expirar
 * 
 * @param forceRefresh - Si es true, fuerza la renovación del token
 * @returns Promise<string | null> - ID token actual o null si no hay usuario autenticado
 */
export async function getCurrentIdToken(forceRefresh: boolean = false): Promise<string | null> {
  if (!auth || !hasRealConfig) {
    return null;
  }
  
  try {
    const user = auth?.currentUser;
    if (!user) {
      return null;
    }

    // WIF: Renovación automática de token
    const idToken = await user.getIdToken(forceRefresh);
    return idToken;
  } catch (error) {
    console.error('❌ WIF: Error obteniendo token:', error);
    return null;
  }
}

/**
 * Verifica si hay un usuario autenticado actualmente
 * Parte del sistema WIF para validación de sesión
 */
export function isAuthenticated(): boolean {
  return !!auth?.currentUser && hasRealConfig;
}

/**
 * Cierra la sesión de Firebase Auth
 * Limpia completamente la sesión WIF
 */
export async function signOutWIF(): Promise<void> {
  if (!auth || !hasRealConfig) {
    console.warn('Firebase Auth no está configurado');
    return;
  }
  
  try {
    await auth.signOut();
    console.log('✅ WIF: Sesión cerrada correctamente');
  } catch (error) {
    console.error('❌ WIF: Error cerrando sesión:', error);
    throw error;
  }
}

// Configurar persistencia de sesión
// Por defecto, Firebase usa 'local' que persiste incluso después de cerrar el navegador
// Esto es parte del sistema WIF para mantener la autenticación automática

export { app, auth };
export default app;
