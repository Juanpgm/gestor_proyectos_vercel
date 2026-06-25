'use client'

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react'
import {
  Mail,
  Building,
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  Power,
  PlusCircle,
  MinusCircle,
  Shield,
  Trash2,
  MoreHorizontal,
  Users,
  AlertTriangle
} from 'lucide-react'
import { AdminUser, RoleId, getRoleInfo } from '@/types/admin'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface UserListProps {
  users: AdminUser[]
  loading: boolean
  onEdit: (user: AdminUser) => void
  onAssignRoles: (user: AdminUser) => void
  onViewPermissions: (user: AdminUser) => void
  onToggleStatus: (user: AdminUser) => void
  onDeleteUser: (user: AdminUser) => void
  onGrantTemporaryPermission: (user: AdminUser) => void
  onRevokeTemporaryPermission: (user: AdminUser) => void
  canEdit: boolean
}

export default function UserList({
  users,
  loading,
  onEdit,
  onAssignRoles,
  onViewPermissions,
  onToggleStatus,
  onDeleteUser,
  onGrantTemporaryPermission,
  onRevokeTemporaryPermission,
  canEdit
}: UserListProps) {
  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const toggleMenu = (uid: string, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openMenuUid === uid) {
      setOpenMenuUid(null)
      setAnchorRect(null)
      setMenuPos(null)
    } else {
      // Store the anchor button's viewport rect; final position is computed in a
      // layout effect once the menu is mounted and its real size is known.
      setOpenMenuUid(uid)
      setAnchorRect(e.currentTarget.getBoundingClientRect())
      setMenuPos(null)
    }
  }

  const closeMenu = () => {
    setOpenMenuUid(null)
    setAnchorRect(null)
    setMenuPos(null)
  }

  // Position the floating menu so it is ALWAYS fully visible inside the viewport.
  // Measures the rendered menu, opens upward when there isn't enough room below,
  // and clamps both axes so it can never land off-screen (e.g. bottom corner).
  useLayoutEffect(() => {
    if (!openMenuUid || !anchorRect || !menuRef.current) return

    const margin = 8
    const gap = 4
    const menu = menuRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    // Horizontal: align the menu's right edge with the button, then clamp.
    let left = anchorRect.right - menu.width
    left = Math.min(Math.max(margin, left), vw - menu.width - margin)
    if (left < margin) left = margin

    // Vertical: prefer below the button; flip above when it would overflow the
    // bottom; if it fits neither way, clamp within the viewport.
    let top = anchorRect.bottom + gap
    if (top + menu.height + margin > vh) {
      const aboveTop = anchorRect.top - gap - menu.height
      top = aboveTop >= margin ? aboveTop : Math.max(margin, vh - menu.height - margin)
    }

    setMenuPos({ top, left })
  }, [openMenuUid, anchorRect])

  // Close the menu on scroll/resize so its fixed position never goes stale.
  useEffect(() => {
    if (!openMenuUid) return

    const handleDismiss = () => {
      setOpenMenuUid(null)
      setAnchorRect(null)
      setMenuPos(null)
    }

    window.addEventListener('scroll', handleDismiss, true)
    window.addEventListener('resize', handleDismiss)
    return () => {
      window.removeEventListener('scroll', handleDismiss, true)
      window.removeEventListener('resize', handleDismiss)
    }
  }, [openMenuUid])

  const withClose = (fn: () => void) => () => {
    fn()
    closeMenu()
  }

  const openUser = openMenuUid ? users.find((u) => u.uid === openMenuUid) : null

  const formatLogin = (value?: string) => {
    if (!value) return null
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return null
    return format(date, 'dd MMM yyyy', { locale: es })
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Cargando usuarios...</span>
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron usuarios con los filtros seleccionados.</p>
        </div>
      </div>
    )
  }

  const normalizeRoles = (user: AdminUser): string[] =>
    Array.isArray(user.roles)
      ? user.roles
      : typeof (user as any).roles === 'string'
        ? (user as any).roles.split(',').map((r: string) => r.trim()).filter(Boolean)
        : []

  return (
    <>
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40">
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Centro Gestor</th>
              <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Último acceso</th>
              <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {users.map((user) => {
              const userRoles = normalizeRoles(user)
              const lastLogin = formatLogin(user.last_login_at)
              const menuOpen = openMenuUid === user.uid

              return (
                <tr
                  key={user.uid}
                  className="group hover:bg-gray-50/60 dark:hover:bg-gray-700/20 transition-colors"
                >
                  {/* User info */}
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                        {user.photo_url ? (
                          <img className="h-8 w-8 rounded-full object-cover" src={user.photo_url} alt="" />
                        ) : (
                          (user.full_name || user.email).charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.full_name || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Roles */}
                  <td className="px-4 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length > 0 ? userRoles.map((roleId) => {
                        const info = getRoleInfo(roleId as RoleId)
                        return (
                          <span
                            key={roleId}
                            className="inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight"
                            style={{ backgroundColor: `${info.color}18`, color: info.color }}
                          >
                            {info.name}
                          </span>
                        )
                      }) : (
                        <span className="text-xs text-gray-400 italic">Sin rol</span>
                      )}
                    </div>
                  </td>

                  {/* Centro Gestor */}
                  <td className="px-4 py-2.5">
                    {user.centro_gestor_assigned ? (
                      <span className="text-sm text-gray-700 dark:text-gray-300">{user.centro_gestor_assigned}</span>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No asignado</span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-2.5 text-center">
                    <div className="inline-flex flex-col items-center gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        user.is_active
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {!user.email_verified && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          No verificado
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last login */}
                  <td className="px-4 py-2.5">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lastLogin || <span className="italic">Nunca</span>}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={(e) => toggleMenu(user.uid, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-700/50">
        {users.map((user) => {
          const userRoles = normalizeRoles(user)
          const lastLogin = formatLogin(user.last_login_at)
          const menuOpen = openMenuUid === user.uid

          return (
            <div key={user.uid} className="px-4 py-3 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                    {user.photo_url ? (
                      <img className="h-9 w-9 rounded-full object-cover" src={user.photo_url} alt="" />
                    ) : (
                      (user.full_name || user.email).charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {user.full_name || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    user.is_active
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {user.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {user.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  <div className="relative">
                    <button onClick={(e) => toggleMenu(user.uid, e)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap pl-12 text-xs">
                <div className="flex flex-wrap gap-1">
                  {userRoles.length > 0 ? userRoles.map((roleId) => {
                    const info = getRoleInfo(roleId as RoleId)
                    return (
                      <span key={roleId} className="px-1.5 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: `${info.color}18`, color: info.color }}>
                        {info.name}
                      </span>
                    )
                  }) : <span className="text-gray-400 italic">Sin rol</span>}
                </div>
                {user.centro_gestor_assigned && (
                  <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Building className="w-3 h-3" /> {user.centro_gestor_assigned}
                  </span>
                )}
                {lastLogin && (
                  <span className="text-gray-400 dark:text-gray-500">{lastLogin}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>

    {/* Floating action menu — rendered OUTSIDE overflow-hidden container */}
    {openUser && anchorRect && (
      <>
        <div className="fixed inset-0 z-[9998]" onClick={closeMenu} />
        <div
          ref={menuRef}
          className="fixed z-[9999] w-52 max-h-[calc(100vh-1rem)] overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-xl py-1 text-left"
          style={
            menuPos
              ? { top: menuPos.top, left: menuPos.left }
              : { top: anchorRect.bottom + 4, left: anchorRect.right - 208, visibility: 'hidden' }
          }
        >
          <button onClick={withClose(() => onViewPermissions(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Eye className="w-4 h-4 text-blue-500" /> Ver detalle
          </button>
          {canEdit && (
            <>
              <button onClick={withClose(() => onEdit(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Edit className="w-4 h-4 text-emerald-500" /> Editar usuario
              </button>
              <button onClick={withClose(() => onAssignRoles(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Shield className="w-4 h-4 text-purple-500" /> Asignar roles
              </button>
              <button onClick={withClose(() => onToggleStatus(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Power className="w-4 h-4 text-amber-500" /> {openUser.is_active ? 'Desactivar' : 'Activar'}
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button onClick={withClose(() => onGrantTemporaryPermission(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <PlusCircle className="w-4 h-4 text-cyan-500" /> Permiso temporal
              </button>
              <button onClick={withClose(() => onRevokeTemporaryPermission(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <MinusCircle className="w-4 h-4 text-slate-500" /> Revocar permiso
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button onClick={withClose(() => onDeleteUser(openUser))} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </>
          )}
        </div>
      </>
    )}
    </>
  )
}
