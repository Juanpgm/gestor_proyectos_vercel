"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import UserManagementPage from "@/components/admin/UserManagementPage";
import { Loader, RefreshCw } from "lucide-react";

export default function UsuariosPage() {
  const router = useRouter();
  const { state, isSuperAdmin, getHighestRole, validateSession } = useAuth();

  const canAccessUsersModule = isSuperAdmin();

  useEffect(() => {
    // Esperar a que initAuth termine antes de verificar acceso.
    // Sin esta guarda, el effect dispara router.push("/") mientras
    // state.isAuthenticated es todavía false durante la carga inicial.
    if (state.isLoading) return;

    if (!state.isAuthenticated) {
      router.push("/");
      return;
    }

    if (!canAccessUsersModule) {
      router.push("/");
      return;
    }
  }, [state.isLoading, state.isAuthenticated, canAccessUsersModule, router]);

  // Only block on initial app load (no user yet). If revalidation fires while
  // a user is already known, don't show the full-page spinner.
  if (state.isLoading && !state.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-purple-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">
            Cargando módulo de administración...
          </p>
        </div>
      </div>
    );
  }

  // Backend falló transitoriamente al iniciar (Firebase tiene usuario, pero
  // la sesión aún no está validada). Mostrar error con botón de reintento
  // en lugar de redirigir silenciosamente al home.
  if (!state.isLoading && !state.isAuthenticated && state.error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">
            No se pudo verificar la sesión con el servidor
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {state.error}
          </p>
          <button
            onClick={() => validateSession()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Si no está autenticado o no tiene permisos, no renderizar nada (se redirige)
  if (!state.isAuthenticated || !canAccessUsersModule) {
    return null;
  }

  const userRole = getHighestRole();
  const centroCestor = state.user?.centro_gestor_assigned;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <UserManagementPage
        currentUserRole={userRole as any}
        currentUserCentroGestor={centroCestor || undefined}
      />
    </div>
  );
}
