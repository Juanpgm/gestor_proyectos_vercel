"use client";

import React from "react";
import Link from "next/link";

/**
 * Full-screen "out of service" state shown while the app is in maintenance
 * mode for every visitor except super_admin. Mirrors the CT-branded loading
 * screen in AuthWrapper for visual consistency. A discreet link routes staff
 * to the sign-in form at /acceso.
 */
export default function MaintenanceScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d1f36] px-6 text-center">
      <div className="w-10 h-10 rounded-md bg-[#2563eb] flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
        <span className="text-white text-sm font-bold tracking-tight">CT</span>
      </div>

      <h1 className="text-[19px] font-bold text-white max-w-md">
        Lo sentimos, CaliTrack se encuentra temporalmente fuera de servicio
      </h1>

      <p className="mt-3 text-[14px] text-gray-300 max-w-sm leading-relaxed">
        Estamos realizando tareas de mantenimiento. Por favor, vuelve a
        intentarlo más tarde.
      </p>

      <Link
        href="/acceso"
        className="mt-10 text-[12px] font-medium text-gray-400 hover:text-white underline underline-offset-2 transition-colors"
      >
        Acceso de administración
      </Link>
    </div>
  );
}
