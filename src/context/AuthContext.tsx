"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthState, User } from "@/types/auth";
import authService from "@/services/authService";
import { safeConsole } from "@/lib/safe-console";
import {
  hasRole as rbacHasRole,
  hasPermission as rbacHasPermission,
  hasAnyRole as rbacHasAnyRole,
  getHighestRole as rbacGetHighestRole,
  ROLES,
} from "@/utils/rbac";

// Estado inicial optimizado - comenzar con isLoading false para mostrar UI más rápido
const initialState: AuthState = {
  user: null,
  firebaseUser: null,
  isAuthenticated: false,
  isLoading: true, // Mostrar loading mientras se verifica la sesión
  error: null,
};

// Tipos de acciones
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "CLEAR_ERROR" }
  | { type: "SIGN_OUT" };

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };
    case "SET_USER":
      safeConsole.debug("AuthReducer SET_USER:", {
        hasUser: !!action.payload,
        email: action.payload?.email,
        roles: action.payload?.roles,
        rolesLength: action.payload?.roles?.length,
      });
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SIGN_OUT":
      return {
        ...initialState,
        isLoading: false,
      };
    default:
      return state;
  }
}

// Contexto
interface AuthContextType {
  state: AuthState;
  signIn: (
    email: string,
    password: string,
    remember?: boolean,
  ) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    cellphone: string,
    nombre_centro_gestor: string,
  ) => Promise<void>;
  signInWithGoogle: (remember?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  validateSession: () => Promise<void>;
  /** Refresca los datos del usuario desde el backend de forma silenciosa,
   *  sin disparar SET_LOADING ni mostrar el spinner global. */
  refreshUserSilently: () => Promise<void>;
  // Helpers para roles y permisos
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
  canModifyOrDeleteRecords: () => boolean;
  getHighestRole: () => string | null;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const isUserSessionReady = (candidate: User | null | undefined): boolean => {
    if (!candidate) return false;
    const hasRoles =
      Array.isArray(candidate.roles) && candidate.roles.length > 0;
    return candidate.session_valid === true && hasRoles;
  };

  // Inicialización simplificada
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        dispatch({ type: "SET_LOADING", payload: true });

        // Inicializar servicio primero para configurar persistencia
        await authService.initialize();

        // Esperar a que Firebase restaure su estado desde IndexedDB.
        // Sin esto, auth.currentUser es null durante unos 100-500ms en el boot,
        // haciendo que validateSession use el token expirado de localStorage y
        // falle con 401 → clearSession() → logout innecesario.
        const firebaseAuth = auth;
        if (firebaseAuth) {
          await new Promise<void>((resolve) => {
            const unsub = onAuthStateChanged(firebaseAuth, () => {
              unsub();
              resolve();
            });
          });
        }

        if (!isMounted) return;

        // Verificar sesión almacenada
        const storedSession = authService.getStoredSession();

        if (storedSession?.user) {
          try {
            // Si Firebase tiene usuario activo, usar su token fresco (evita usar el
            // token expirado de localStorage que causa 401 → clearSession).
            const firebaseUser = auth?.currentUser;
            const freshToken = firebaseUser
              ? await firebaseUser.getIdToken(false).catch(() => null)
              : null;

            const updatedUser = await authService.validateSession(
              freshToken ?? undefined,
            );
            if (isMounted && isUserSessionReady(updatedUser)) {
              dispatch({ type: "SET_USER", payload: updatedUser });
              return;
            }
          } catch (error) {
            safeConsole.debug("Error validando sesión almacenada:", error);
          }

          if (!isMounted) return;

          // Solo cerrar sesión si Firebase tampoco tiene usuario activo.
          // Esto evita logout agresivo por errores transitorios del backend.
          const firebaseUser = auth?.currentUser;
          if (!firebaseUser) {
            await authService.signOut();
            dispatch({ type: "SIGN_OUT" });
          } else {
            // Firebase tiene usuario pero el backend falló transitoriamente.
            // Mantener la sesión almacenada y dejar que el usuario reintente.
            safeConsole.debug(
              "Backend no disponible al inicio, conservando sesión Firebase.",
            );
            dispatch({ type: "SET_LOADING", payload: false });
          }
          return;
        }

        // Si no hay sesión almacenada, terminar loading
        if (isMounted) dispatch({ type: "SET_LOADING", payload: false });
      } catch (error) {
        safeConsole.debug("Auth init error:", error);
        if (isMounted) dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initAuth();

    // Keep httpOnly session cookie in sync with Firebase token refreshes.
    const stopTokenSync = authService.startTokenRefreshSync();

    return () => {
      isMounted = false;
      stopTokenSync();
    };
  }, []);

  // Funciones de autenticación
  const signIn = async (
    email: string,
    password: string,
    remember: boolean = true,
  ) => {
    try {
      dispatch({ type: "CLEAR_ERROR" });
      let user = await authService.signInWithEmail({
        email,
        password,
        remember,
      });

      if (!isUserSessionReady(user)) {
        const refreshedUser = await authService.validateSession();
        if (isUserSessionReady(refreshedUser)) {
          user = refreshedUser as User;
        }
      }

      if (!isUserSessionReady(user)) {
        throw new Error(
          "No se pudo validar la sesión completa. Intenta nuevamente.",
        );
      }

      safeConsole.debug("AuthContext - User received from authService:", {
        email: user.email,
        roles: user.roles,
        permissions: user.permissions,
        hasRoles: user.roles && user.roles.length > 0,
      });

      dispatch({ type: "SET_USER", payload: user });
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al iniciar sesión",
      });
      throw error;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string,
    cellphone: string,
    nombre_centro_gestor: string,
  ) => {
    try {
      dispatch({ type: "CLEAR_ERROR" });

      const user = await authService.registerWithEmail({
        name,
        email,
        password,
        confirmPassword,
        cellphone,
        nombre_centro_gestor,
      });

      if (!isUserSessionReady(user)) {
        const refreshedUser = await authService.validateSession();
        if (!isUserSessionReady(refreshedUser)) {
          throw new Error(
            "Registro completado, pero la sesión aún no está lista. Intenta iniciar sesión nuevamente.",
          );
        }
        dispatch({ type: "SET_USER", payload: refreshedUser });
        return;
      }

      dispatch({ type: "SET_USER", payload: user });
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al registrar usuario",
      });
      throw error;
    }
  };

  const signInWithGoogle = async (remember: boolean = true) => {
    try {
      dispatch({ type: "CLEAR_ERROR" });

      let user = await authService.signInWithGoogle(remember);
      if (!isUserSessionReady(user)) {
        const refreshedUser = await authService.validateSession();
        if (isUserSessionReady(refreshedUser)) {
          user = refreshedUser as User;
        }
      }

      if (!isUserSessionReady(user)) {
        throw new Error(
          "No se pudo validar sesión completa con Google. Intenta nuevamente.",
        );
      }

      dispatch({ type: "SET_USER", payload: user });
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al iniciar sesión con Google",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      dispatch({ type: "SIGN_OUT" });
    } catch (error: any) {
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Error al cerrar sesión",
      });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const validateSession = async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      // Intentar validar con el backend para obtener roles actualizados
      const user = await authService.validateSession();
      if (isUserSessionReady(user)) {
        dispatch({ type: "SET_USER", payload: user });
      } else {
        dispatch({ type: "SET_USER", payload: null });
      }
    } catch (error: any) {
      dispatch({ type: "SET_USER", payload: null });
      dispatch({ type: "SET_ERROR", payload: "Error validando sesión" });
    }
  };

  /**
   * Refresca roles, permisos y centro_gestor del usuario desde el backend
   * SIN despachar SET_LOADING:true, por lo que no activa el spinner global.
   * Falla silenciosamente: si el backend no responde, conserva el usuario actual.
   */
  const refreshUserSilently = async (): Promise<void> => {
    if (!state.isAuthenticated || !state.user) return;
    try {
      const user = await authService.validateSession();
      if (user && isUserSessionReady(user)) {
        dispatch({ type: "SET_USER", payload: user });
      }
      // Si el backend falla o devuelve datos incompletos, mantener el estado actual
    } catch {
      // Falla silenciosa — no cerrar sesión por un error de red transitorio
    }
  };

  // Helper: Verificar si el usuario tiene un rol específico (normalizado)
  const hasRole = (role: string): boolean => {
    return rbacHasRole(state.user?.roles, role);
  };

  // Helper: Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    return rbacHasPermission(state.user?.permissions, permission);
  };

  // Helper: Verificar si el usuario puede modificar o borrar registros
  const canModifyOrDeleteRecords = (): boolean => {
    return rbacHasAnyRole(state.user?.roles, [
      ROLES.ADMIN_CENTRO_GESTOR,
      ROLES.ADMIN_GENERAL,
      ROLES.SUPER_ADMIN,
      ROLES.EDITOR_DATOS,
    ]);
  };

  // Helper: Obtener el rol con mayor jerarquía del usuario (jerarquía real)
  const getHighestRole = (): string | null => {
    return rbacGetHighestRole(state.user?.roles);
  };

  // Helper: Verificar si es super admin
  const isSuperAdmin = (): boolean => {
    const result = hasRole("super_admin");
    safeConsole.debug("isSuperAdmin() called:", {
      result,
      userRoles: state.user?.roles,
      hasUser: !!state.user,
      isAuthenticated: state.isAuthenticated,
    });
    return result;
  };

  const contextValue: AuthContextType = {
    state,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    clearError,
    validateSession,
    refreshUserSilently,
    hasRole,
    hasPermission,
    canModifyOrDeleteRecords,
    getHighestRole,
    isSuperAdmin,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
