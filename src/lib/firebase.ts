import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithCustomToken } from 'firebase/auth';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificar que las variables de entorno estén configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is missing. Please check your .env.local file.');
  console.error('Required variables:');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY:', !!firebaseConfig.apiKey);
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', !!firebaseConfig.authDomain);
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID:', !!firebaseConfig.projectId);
  console.error('');
  console.error('🔧 See INSTRUCCIONES_FIREBASE.md for setup instructions.');
}

let app: FirebaseApp;
let auth: Auth;

try {
  // Intentar obtener la app existente o crear una nueva
  app = getApp();
} catch (error) {
  // Si no existe, inicializar Firebase
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized with WIF support');
}

// Obtener instancia de Auth
auth = getAuth(app);

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
  if (!auth) {
    throw new Error('Firebase Auth no está inicializado');
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
  return !!auth?.currentUser;
}

/**
 * Cierra la sesión de Firebase Auth
 * Limpia completamente la sesión WIF
 */
export async function signOutWIF(): Promise<void> {
  try {
    if (auth) {
      await auth.signOut();
      console.log('✅ WIF: Sesión cerrada correctamente');
    }
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
