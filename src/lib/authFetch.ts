/**
 * authFetch — wrapper de `fetch` que adjunta el Firebase ID token como
 * `Authorization: Bearer <token>` automáticamente.
 *
 * Uso:
 *   const res = await authFetch("/api/proxy/unidades-proyecto");
 *   const data = await res.json();
 *
 * Notas:
 *  - Espera a `authStateReady()` antes de pedir el token.
 *  - Si no hay usuario autenticado, lanza un Error con `status = 401`.
 *  - Si ya viene un header `Authorization` en `init.headers`, no lo
 *    sobreescribe (permite calls customizados).
 */
import { auth as firebaseAuth } from "@/lib/firebase";

export class AuthFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "AuthFetchError";
  }
}

export async function getFirebaseIdToken(
  forceRefresh = false,
): Promise<string> {
  if (!firebaseAuth)
    throw new AuthFetchError("Firebase Auth no disponible", 401);
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user) {
    throw new AuthFetchError("Sesión no iniciada", 401);
  }
  return user.getIdToken(forceRefresh);
}

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  // Detectar si ya viene Authorization
  const incomingHeaders = new Headers(init.headers || {});
  if (!incomingHeaders.has("Authorization")) {
    const token = await getFirebaseIdToken(false);
    incomingHeaders.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers: incomingHeaders });
}
