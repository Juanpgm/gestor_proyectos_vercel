"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import { ROLES_CONFIG } from "@/types/admin";
import { LogOut } from "lucide-react";

/** Routes that bypass auth in development — never reaches production */
const DEV_PUBLIC_ROUTES = ["/test-design-system"];

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const { state, validateSession } = useAuth();
  const sessionCheckRef = useRef<string | null>(null);
  const [isRevalidatingSession, setIsRevalidatingSession] = useState(false);

  const isDevBypassRoute =
    process.env.NODE_ENV === "development" &&
    DEV_PUBLIC_ROUTES.some((r) => pathname?.startsWith(r));

  useEffect(() => {
    if (isDevBypassRoute) return;

    const shouldHydrate =
      state.isAuthenticated &&
      !!state.user &&
      state.user.session_valid !== true;

    if (!shouldHydrate) {
      sessionCheckRef.current = null;
      setIsRevalidatingSession(false);
      return;
    }

    const userId = state.user?.uid || "__unknown__";
    if (sessionCheckRef.current === userId) {
      return;
    }

    sessionCheckRef.current = userId;
    setIsRevalidatingSession(true);
    validateSession().finally(() => {
      setIsRevalidatingSession(false);
    });
  }, [
    isDevBypassRoute,
    state.isAuthenticated,
    state.user?.uid,
    state.user?.session_valid,
    validateSession,
  ]);

  // Dev-only showcase bypass — no auth needed
  if (isDevBypassRoute) {
    return <>{children}</>;
  }

  // Si está cargando, mostrar loading
  if (state.isLoading || isRevalidatingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6f9]">
        <div className="w-7 h-7 rounded-md bg-[#1d4ed8] flex items-center justify-center mb-5">
          <span className="text-white text-[11px] font-bold tracking-tight">
            CT
          </span>
        </div>
        <div className="w-5 h-5 rounded-full border-2 border-[#1d4ed8]/20 border-t-[#1d4ed8] animate-spin" />
        <p className="mt-4 text-[13px] text-gray-500 tracking-wide">
          Validando sesión...
        </p>
      </div>
    );
  }

  // Si no está autenticado, mostrar login
  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  // Si no se confirmó la sesión luego de revalidar, volver a login para evitar loop
  if (state.user?.session_valid !== true) {
    return <LoginPage />;
  }

  // Si está autenticado, mostrar la aplicación
  return <>{children}</>;
}

// Componente para mostrar información del usuario autenticado
export function UserProfile() {
  const { state, signOut, getHighestRole } = useAuth();

  if (!state.user) return null;

  const highestRole = getHighestRole();
  const nombreCentroGestor =
    state.user.nombre_centro_gestor || state.user.centro_gestor_assigned;
  const roleAliasMap: Record<string, string> = {
    admin: "admin_general",
    gestor_master: "admin_centro_gestor",
    gestor: "editor_datos",
    consultor_master: "analista",
    consultor: "visualizador",
  };

  const normalizedRole = roleAliasMap[highestRole || ""] || highestRole || "";
  const profileColor =
    ROLES_CONFIG[normalizedRole as keyof typeof ROLES_CONFIG]?.color ||
    "#2563EB";

  const initials = (state.user.displayName || state.user.email || "U")
    .charAt(0)
    .toUpperCase();
  const displayName =
    state.user.displayName || state.user.email?.split("@")[0] || "Usuario";

  return (
    <div className="flex items-center gap-2 pl-1">
      {/* Avatar */}
      {state.user.photoURL ? (
        <img
          src={state.user.photoURL}
          alt={displayName}
          className="w-7 h-7 rounded-full object-cover ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#0d1f36] shrink-0"
          style={{ "--tw-ring-color": profileColor } as React.CSSProperties}
        />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#0d1f36]"
          style={{ backgroundColor: profileColor, outlineColor: profileColor }}
        >
          <span className="text-white text-[11px] font-semibold leading-none">
            {initials}
          </span>
        </div>
      )}

      {/* Name + role label (md+) */}
      <div className="hidden md:block min-w-0 leading-tight">
        <p className="text-[12px] font-medium text-gray-800 dark:text-white/90 truncate max-w-[200px]">
          {displayName}
        </p>
        {nombreCentroGestor && (
          <p className="text-[10px] text-gray-500 dark:text-white/40 truncate max-w-[200px]">
            {nombreCentroGestor}
          </p>
        )}
      </div>

      {/* Logout icon */}
      <button
        onClick={signOut}
        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-white/40 dark:hover:text-white/80 dark:hover:bg-white/10 transition-colors duration-[120ms]"
        title="Cerrar sesión"
      >
        <LogOut size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
