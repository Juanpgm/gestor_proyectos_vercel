"use client";

import React, { useState } from "react";
import { Bell, Sun, Moon, Menu } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { UserProfile } from "@/components/AuthWrapper";
import { useRecentNotificationCount } from "@/hooks/useNotifications";
import NotificationPanel from "@/components/NotificationPanel";
import { useAuth } from "@/context/AuthContext";
import RoleFeatureTour from "@/components/RoleFeatureTour";
import GearMenu from "@/components/GearMenu";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { theme, setTheme } = useTheme();
  const { state, getHighestRole } = useAuth();
  const unreadCount = useRecentNotificationCount(5);
  const [showNotifications, setShowNotifications] = useState(false);
  const highestRole = getHighestRole();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="h-14 bg-white dark:bg-[#0d1f36] border-b border-gray-200 dark:border-[#0a1829] flex items-center px-3 sm:px-4 shrink-0 z-[100]">
      <div className="flex items-center justify-between w-full gap-2">
        {/* ── Izquierda: toggle + brand ── */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors duration-[120ms] shrink-0"
              title="Abrir menú de navegación"
              data-tour-id="header-menu"
            >
              <Menu size={18} strokeWidth={1.5} />
            </button>
          )}

          <div className="flex items-center gap-2.5 min-w-0">
            {/* Monograma institucional */}
            <div className="w-9 h-9 rounded-md bg-[#1d4ed8] flex items-center justify-center shrink-0 select-none ring-1 ring-[#3b82f6]/50">
              <span className="text-white text-[13px] font-bold tracking-tight">
                CT
              </span>
            </div>

            {/* Título institucional */}
            <div className="hidden sm:block min-w-0">
              <h1
                className="text-gray-900 dark:text-white text-[18px] sm:text-[20px] font-bold truncate leading-tight tracking-tight m-0"
                style={{ fontFamily: 'var(--font-display, Outfit, system-ui, sans-serif)' }}
              >
                Sistema de Gestión de Proyectos
              </h1>
              <div className="text-blue-700 dark:text-[#64a0d4] text-[10px] uppercase tracking-widest leading-none mt-1">
                Alcaldía · Santiago de Cali
              </div>
            </div>
            <div
              className="sm:hidden text-gray-900 dark:text-white font-bold text-lg leading-none tracking-tight"
              style={{ fontFamily: 'var(--font-display, Outfit, system-ui, sans-serif)' }}
            >
              CaliTrack
            </div>
          </div>
        </div>

        {/* ── Derecha: acciones ── */}
        <div className="flex items-center gap-0.5 shrink-0 border-l border-gray-200 dark:border-white/10 pl-2 ml-1">
          <RoleFeatureTour
            highestRole={highestRole}
            userId={state.user?.uid || state.user?.email}
          />

          {/* Tema */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors duration-[120ms]"
            title={
              theme === "dark"
                ? "Cambiar a modo claro"
                : "Cambiar a modo oscuro"
            }
            data-tour-id="header-theme"
          >
            {theme === "dark" ? (
              <Sun size={16} strokeWidth={1.5} />
            ) : (
              <Moon size={16} strokeWidth={1.5} />
            )}
          </button>

          {/* Notificaciones */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 transition-colors duration-[120ms]"
            title="Notificaciones"
            data-tour-id="header-notifications"
          >
            <Bell size={16} strokeWidth={1.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
            )}
          </button>

          {/* Configuración */}
          <GearMenu />

          {/* Perfil de usuario */}
          <div data-tour-id="header-profile">
            <UserProfile />
          </div>
        </div>
      </div>

      {/* Panel de Notificaciones */}
      <NotificationPanel
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  );
};

export default Header;
