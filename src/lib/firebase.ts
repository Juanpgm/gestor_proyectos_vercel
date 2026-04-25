import { initializeApp, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInWithCustomToken, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore, doc, updateDoc, collection as firestoreCollection, query, where, getDocs, Firestore } from 'firebase/firestore';

// Configuración de Firebase desde variables de entorno
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ''
};

// Verificar que las variables de entorno estén configuradas
const hasRealConfig = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
  process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);
// Firebase initialization with improved error handling
if (!hasRealConfig) {
  console.warn('⚠️ Firebase: Configuración incompleta detectada');
  console.warn('Variables faltantes:', {
    apiKey: !process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: !process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  });
}

if (!hasRealConfig && typeof window !== 'undefined') {
  console.warn('⚠️ Firebase configuration is using dummy values. Authentication will not work.');
  console.warn('Please configure Firebase environment variables in Vercel.');
}

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

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

    // Obtener instancia de Firestore
    db = getFirestore(app);
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

/**
 * Actualiza el estado de decisión de una solicitud de cambio directamente en Firestore.
 * Colecciones: solicitudes_cambios_unidades_proyecto | solicitudes_cambios_intervenciones
 */
export async function actualizarEstadoSolicitud(
  collectionName: 'solicitudes_cambios_unidades_proyecto' | 'solicitudes_cambios_intervenciones',
  docId: string,
  estado: 'aprobada' | 'rechazada',
): Promise<void> {
  if (!db) {
    console.warn('Firestore no configurado, no se puede persistir estado de solicitud');
    return;
  }
  try {
    const ref = doc(db, collectionName, docId);
    await updateDoc(ref, {
      estado_decision: estado,
      decision_at: new Date().toISOString(),
    });
    console.log(`✅ Solicitud ${docId} marcada como ${estado}`);
  } catch (error) {
    console.error(`❌ Error actualizando solicitud ${docId}:`, error);
    throw error;
  }
}

/**
 * Aplica cambios a un documento de UP o Intervención directamente en Firestore.
 * Busca por upid o intervencion_id ya que el doc ID de Firestore puede no coincidir.
 */
export async function aplicarCambiosFirestore(
  tipo: 'unidad_proyecto' | 'intervencion',
  identificador: { upid?: string; intervencion_id?: string },
  cambios: Record<string, any>,
): Promise<void> {
  if (!db) {
    throw new Error('Firestore no configurado. No se pueden aplicar cambios.');
  }

  const collectionName = tipo === 'unidad_proyecto' ? 'unidades_proyecto' : 'intervenciones_unidades_proyecto';
  const fieldName = tipo === 'unidad_proyecto' ? 'upid' : 'intervencion_id';
  const fieldValue = tipo === 'unidad_proyecto' ? identificador.upid : identificador.intervencion_id;

  if (!fieldValue) {
    throw new Error(`Falta el ${fieldName} para identificar el documento`);
  }

  try {
    // Buscar el documento por campo identificador
    const colRef = firestoreCollection(db, collectionName);
    const q = query(colRef, where(fieldName, '==', fieldValue));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error(`No se encontró ${fieldName}=${fieldValue} en ${collectionName}`);
    }

    // Actualizar el primer documento encontrado
    const docRef = snapshot.docs[0].ref;
    // Filtrar campos vacíos/nulos para no sobreescribir con basura
    const updates: Record<string, any> = {};
    for (const [k, v] of Object.entries(cambios)) {
      if (v !== undefined && v !== null && v !== '') {
        updates[k] = v;
      }
    }

    if (Object.keys(updates).length === 0) {
      console.warn('No hay campos válidos para actualizar');
      return;
    }

    await updateDoc(docRef, updates);
    console.log(`✅ ${collectionName}/${fieldValue} actualizado:`, Object.keys(updates));
  } catch (error) {
    console.error(`❌ Error aplicando cambios a ${collectionName}/${fieldValue}:`, error);
    throw error;
  }
}

// Configurar persistencia de sesión
// Por defecto, Firebase usa 'local' que persiste incluso después de cerrar el navegador
// Esto es parte del sistema WIF para mantener la autenticación automática

export { app, auth, db };
export default app;
