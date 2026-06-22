"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Shield,
  AlertCircle,
  ArrowLeft,
  X,
  Bug,
  ShieldAlert,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/navigation";
import adminService from "@/services/admin.service";
import {
  AdminUser,
  Role,
  RoleId,
  ROLES_CONFIG,
  getHighestRole,
  getRoleInfo,
  SystemStats,
  ReporteBugRecord,
  SolicitudEscaladaRecord,
  RecomendacionRecord,
} from "@/types/admin";
import { useAuth } from "@/context/AuthContext";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import UserList from "./UserList";
import UserEditModal from "./UserEditModal";
import RoleAssignmentModal from "./RoleAssignmentModal";
import UserDetailsViewer from "./UserDetailsViewer";
import ManagementFeatureTour from "@/components/ManagementFeatureTour";
import RecordsCrudPanel, { CrudFieldConfig } from "./RecordsCrudPanel";
import ComunicacionesPanel from "./comunicaciones/ComunicacionesPanel";

interface UserManagementPageProps {
  currentUserRole?: RoleId;
  currentUserCentroGestor?: string;
}

interface EndpointDiagnosticItem {
  endpoint: string;
  ok: boolean;
  status: number | null;
  message: string;
}

type AdminTab =
  | "permisos"
  | "bugs"
  | "escaladas"
  | "recomendaciones"
  | "comunicaciones";

// Pure helpers — no component state, safe to define outside
function normalizePermissionList(value: any): string[] {
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, any>)
      .filter(
        ([key, enabled]) =>
          Boolean(key) &&
          (enabled === true || enabled === 1 || enabled === "true"),
      )
      .map(([key]) => key);
  }
  return [];
}

function wrapLabel(value: string, maxCharsPerLine: number = 24): string[] {
  if (!value) return [""];
  const words = value.split(" ");
  const lines: string[] = [];
  let currentLine = "";
  words.forEach((word) => {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (candidate.length <= maxCharsPerLine) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [value];
}

const BUG_FIELDS: CrudFieldConfig[] = [
  { key: "reportado_por", label: "Reportado por" },
  { key: "descripcion_bug", label: "Descripcion del bug", multiline: true },
  {
    key: "contexto_adicional_bug",
    label: "Contexto adicional",
    multiline: true,
  },
];

const ESCALADA_FIELDS: CrudFieldConfig[] = [
  { key: "reportado_por", label: "Solicitante" },
  { key: "rol_solicitado", label: "Rol solicitado" },
  { key: "motivo_solicitud", label: "Motivo", multiline: true },
  { key: "justificacion_escalada", label: "Justificacion", multiline: true },
];

const RECOMENDACION_FIELDS: CrudFieldConfig[] = [
  { key: "reportado_por", label: "Reportado por", requiredOnCreate: true },
  {
    key: "recomendacion_sugerencia",
    label: "Recomendacion",
    requiredOnCreate: true,
    multiline: true,
  },
  {
    key: "beneficio_esperado",
    label: "Beneficio esperado",
    requiredOnCreate: true,
    multiline: true,
  },
];

function renderWrappedCategoryTick(maxCharsPerLine: number) {
  return function WrappedTick(props: any) {
    const { x, y, payload } = props;
    const value = String(payload?.value || "");
    const lines = wrapLabel(value, maxCharsPerLine);
    return (
      <text x={x} y={y} textAnchor="end" fill="currentColor" fontSize={11}>
        {lines.map((line, index) => (
          <tspan key={`${value}-${index}`} x={x} dy={index === 0 ? 4 : 12}>
            {line}
          </tspan>
        ))}
      </text>
    );
  };
}

export default function UserManagementPage({
  currentUserRole,
}: UserManagementPageProps) {
  const USERS_PAGE_SIZE = 20;

  const router = useRouter();
  const { state, validateSession } = useAuth();

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [hasBearerToken, setHasBearerToken] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("");
  const [filterCentroGestor, setFilterCentroGestor] = useState("");
  const [filterActive, setFilterActive] = useState<boolean | undefined>(
    undefined,
  );

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionViewer, setShowPermissionViewer] = useState(false);
  const [deleteUserTarget, setDeleteUserTarget] = useState<AdminUser | null>(
    null,
  );

  const [grantPermissionTarget, setGrantPermissionTarget] =
    useState<AdminUser | null>(null);
  const [grantPermissionValue, setGrantPermissionValue] = useState("");
  const [grantPermissionReason, setGrantPermissionReason] = useState("");
  const [grantPermissionExpiresAt, setGrantPermissionExpiresAt] = useState("");

  const [revokePermissionTarget, setRevokePermissionTarget] =
    useState<AdminUser | null>(null);
  const [revokePermissionValue, setRevokePermissionValue] = useState("");
  const [revokePermissionOptions, setRevokePermissionOptions] = useState<
    string[]
  >([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [centrosGestores, setCentrosGestores] = useState<string[]>([]);
  const [rolesCatalog, setRolesCatalog] = useState<Role[]>([]);
  const [connectedUserPermissions, setConnectedUserPermissions] = useState<
    string[]
  >([]);
  const [endpointDiagnostics, setEndpointDiagnostics] = useState<
    EndpointDiagnosticItem[]
  >([]);
  const [endpointDiagnosticsLoading, setEndpointDiagnosticsLoading] =
    useState(false);
  const [endpointDiagnosticsUpdatedAt, setEndpointDiagnosticsUpdatedAt] =
    useState<string | null>(null);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("permisos");

  const [bugReports, setBugReports] = useState<ReporteBugRecord[]>([]);

  const [escalationRequests, setEscalationRequests] = useState<
    SolicitudEscaladaRecord[]
  >([]);

  const [recommendations, setRecommendations] = useState<RecomendacionRecord[]>(
    [],
  );

  // field configs are defined as module-level constants (BUG_FIELDS, ESCALADA_FIELDS, RECOMENDACION_FIELDS)

  const centroGestorOptions = useMemo(() => {
    const normalize = (value: any): string =>
      typeof value === "string" ? value.trim() : "";

    const fromEndpoint = centrosGestores.map(normalize);
    const fromGlobalUsers = allUsers.map((user) =>
      normalize(
        user.centro_gestor_assigned || (user as any).nombre_centro_gestor,
      ),
    );
    const fromSession = [
      normalize(state.user?.centro_gestor_assigned),
      normalize((state.user as any)?.nombre_centro_gestor),
    ];

    return Array.from(
      new Set(
        [...fromEndpoint, ...fromGlobalUsers, ...fromSession].filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b, "es"));
  }, [centrosGestores, allUsers, state.user]);

  const detectedUserRole =
    currentUserRole ||
    getHighestRole((state.user?.roles as RoleId[] | undefined) || []) ||
    "publico";
  const isPublicRoleTheme = (state.user?.roles || []).includes("publico");
  const isSuperAdmin = detectedUserRole === "super_admin";
  const isAdminGeneral = detectedUserRole === "admin_general";
  const canManageUsers = isSuperAdmin;

  const inferPermissionsFromRoles = useCallback((): string[] => {
    const userRoles = (state.user?.roles as RoleId[] | undefined) || [];
    if (userRoles.length === 0) return [];

    return userRoles.flatMap((roleId) => {
      const backendRole = rolesCatalog.find((role) => role.id === roleId);
      if (backendRole?.permissions?.length) return backendRole.permissions;
      return getRoleInfo(roleId).permissions || [];
    });
  }, [state.user?.roles, rolesCatalog]);

  const roleFilterOptions = useMemo(() => {
    const fromCatalog = rolesCatalog.map((role) => String(role.id));
    const fromStats = Object.keys(
      (systemStats?.users_by_role || {}) as Record<string, number>,
    );
    const fromUsers = allUsers.flatMap((user) =>
      (Array.isArray(user.roles) ? user.roles : []).map(String),
    );
    const fromConfig = Object.keys(ROLES_CONFIG);

    return Array.from(
      new Set([...fromCatalog, ...fromStats, ...fromUsers, ...fromConfig]),
    )
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es"));
  }, [rolesCatalog, systemStats?.users_by_role, allUsers]);

  const getRoleMeta = useCallback(
    (roleId: string) => {
      const roleFromCatalog = rolesCatalog.find(
        (role) => String(role.id) === roleId,
      );
      const roleFromConfig = (ROLES_CONFIG as Record<string, any>)[roleId];
      const fallbackName = roleId
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());

      return {
        label: roleFromCatalog?.name || roleFromConfig?.name || fallbackName,
        // ROLES_CONFIG is the source of truth for colors (backend never sends color).
        // Catalog color is always the #64748B fallback set by normalizeRole, so
        // it must not take priority over the real palette in ROLES_CONFIG.
        color: roleFromConfig?.color || roleFromCatalog?.color || "#64748B",
        description:
          roleFromCatalog?.description ||
          roleFromConfig?.description ||
          `Rol ${fallbackName}`,
      };
    },
    [rolesCatalog],
  );

  const effectivePermissions = useMemo(
    () =>
      Array.from(
        new Set([
          ...normalizePermissionList(connectedUserPermissions),
          ...normalizePermissionList(state.user?.permissions),
          ...inferPermissionsFromRoles(),
        ]),
      ),
    [
      connectedUserPermissions,
      state.user?.permissions,
      inferPermissionsFromRoles,
    ],
  );
  const roleNameMap = useMemo(
    () =>
      new Map(
        roleFilterOptions.map((roleId) => [roleId, getRoleMeta(roleId).label]),
      ),
    [roleFilterOptions, getRoleMeta],
  );
  const hasToken = hasBearerToken;
  const isUserActive = state.user?.is_active !== false;
  const hasManageUsers = useMemo(
    () =>
      isSuperAdmin ||
      effectivePermissions.includes("manage:users") ||
      effectivePermissions.includes("*"),
    [isSuperAdmin, effectivePermissions],
  );
  const hasManageRoles = useMemo(
    () =>
      isSuperAdmin ||
      effectivePermissions.includes("manage:roles") ||
      effectivePermissions.includes("*"),
    [isSuperAdmin, effectivePermissions],
  );
  const hasViewAuditLogs = useMemo(
    () =>
      isSuperAdmin ||
      effectivePermissions.includes("view:audit_logs") ||
      effectivePermissions.includes("*"),
    [isSuperAdmin, effectivePermissions],
  );

  const roleAggregations = useMemo(
    () =>
      roleFilterOptions.map((roleId) => {
        const roleInfo = getRoleMeta(roleId);
        const usersByRole = (systemStats?.users_by_role || {}) as Record<
          string,
          number
        >;

        const countFromStats = usersByRole[roleId];
        const countFromUsers = allUsers.reduce((count, user) => {
          const roles = Array.isArray(user.roles) ? user.roles : [];
          return roles.map(String).includes(roleId) ? count + 1 : count;
        }, 0);

        const count =
          typeof countFromStats === "number" ? countFromStats : countFromUsers;

        return {
          id: roleId,
          label: roleInfo.label,
          value: count,
          color: roleInfo.color,
          description: roleInfo.description,
        };
      }),
    [roleFilterOptions, systemStats?.users_by_role, allUsers, getRoleMeta],
  );

  const roleChartData = useMemo(
    () =>
      roleAggregations
        .filter((item) => item.value > 0)
        .sort((a, b) => b.value - a.value),
    [roleAggregations],
  );

  const centroGestorDistribution = useMemo(() => {
    const normalize = (value: any): string => {
      if (typeof value !== "string") return "Sin centro gestor";
      const normalized = value.trim();
      return normalized || "Sin centro gestor";
    };

    const fromStats = (systemStats?.users_by_centro_gestor || {}) as Record<
      string,
      number
    >;
    const statsEntries = Object.entries(fromStats)
      .filter(([key]) => Boolean(key))
      .map(([key, value]) => ({
        centro_gestor: normalize(key),
        total: typeof value === "number" ? value : 0,
      }));

    if (statsEntries.length > 0) {
      return statsEntries.sort((a, b) => b.total - a.total);
    }

    const grouped = allUsers.reduce<Record<string, number>>((acc, user) => {
      const centro = normalize(
        user.centro_gestor_assigned || (user as any).nombre_centro_gestor,
      );
      acc[centro] = (acc[centro] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([centro_gestor, total]) => ({ centro_gestor, total }))
      .sort((a, b) => b.total - a.total);
  }, [systemStats?.users_by_centro_gestor, allUsers]);

  const centroGestorChartData = centroGestorDistribution;

  const totalUsersForMetrics = systemStats?.total_users ?? allUsers.length;

  // wrapLabel and renderWrappedCategoryTick are defined as module-level helpers

  const roleBarsHeight = Math.max(320, roleChartData.length * 48);
  const centrosBarsHeight = Math.max(320, centroGestorChartData.length * 44);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const syncTheme = () => setIsDarkTheme(root.classList.contains("dark"));

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  const chartTooltipStyle = {
    contentStyle: {
      backgroundColor: isDarkTheme ? "#111827" : "#FFFFFF",
      border: `1px solid ${isDarkTheme ? "#374151" : "#E5E7EB"}`,
      borderRadius: "8px",
      color: isDarkTheme ? "#F9FAFB" : "#111827",
      fontSize: "12px",
    },
    labelStyle: {
      color: isDarkTheme ? "#F9FAFB" : "#111827",
      fontWeight: 600,
    },
    itemStyle: {
      color: isDarkTheme ? "#F3F4F6" : "#1F2937",
    },
  };

  const endpointChecks = useMemo(
    () => [
      {
        endpoint: "GET /auth/admin/roles",
        allowed: hasToken && isUserActive && hasManageRoles,
        reason: !hasToken
          ? "Sin Bearer token"
          : !isUserActive
            ? "Usuario inactivo (is_active=false)"
            : !hasManageRoles
              ? "Falta permiso manage:roles"
              : "Permitido",
      },
      {
        endpoint: "GET /auth/admin/roles/{role_id}",
        allowed: hasToken && isUserActive && hasManageRoles,
        reason: !hasToken
          ? "Sin Bearer token"
          : !isUserActive
            ? "Usuario inactivo (is_active=false)"
            : !hasManageRoles
              ? "Falta permiso manage:roles"
              : "Permitido",
      },
      {
        endpoint: "GET /auth/admin/audit-logs",
        allowed: hasToken && isUserActive && hasViewAuditLogs,
        reason: !hasToken
          ? "Sin Bearer token"
          : !isUserActive
            ? "Usuario inactivo (is_active=false)"
            : !hasViewAuditLogs
              ? "Falta permiso view:audit_logs"
              : "Permitido",
      },
      {
        endpoint: "GET /auth/admin/system/stats",
        allowed: hasToken && isUserActive && hasManageUsers,
        reason: !hasToken
          ? "Sin Bearer token"
          : !isUserActive
            ? "Usuario inactivo (is_active=false)"
            : !hasManageUsers
              ? "Falta permiso manage:users"
              : "Permitido",
      },
      {
        endpoint: "GET /auth/admin/users/super-admins",
        allowed: hasToken && isUserActive && hasManageUsers,
        reason: !hasToken
          ? "Sin Bearer token"
          : !isUserActive
            ? "Usuario inactivo (is_active=false)"
            : !hasManageUsers
              ? "Falta permiso manage:users"
              : "Permitido",
      },
    ],
    [hasToken, isUserActive, hasManageRoles, hasManageUsers, hasViewAuditLogs],
  );

  useEffect(() => {
    let isMounted = true;

    const resolveHasBearerToken = async (): Promise<boolean> => {
      try {
        if (typeof window === "undefined") return false;

        const { getCurrentIdToken } = await import("@/lib/firebase");

        // Primer intento: token en caché (rápido)
        const firebaseToken = await getCurrentIdToken(false);
        if (firebaseToken) return true;

        // Segundo intento: forzar renovación por si Firebase aún no se inicializó
        const refreshedToken = await getCurrentIdToken(true);
        if (refreshedToken) return true;

        return false;
      } catch {
        return false;
      }
    };

    const ensureAuthenticatedSession = async () => {
      if (!state.isAuthenticated || !state.user) {
        if (isMounted) {
          setAuthReady(false);
          setHasBearerToken(false);
          setLoading(false);
          setError(
            "No hay una sesión activa para ejecutar endpoints administrativos",
          );
        }
        return;
      }

      const tokenAvailable = await resolveHasBearerToken();

      if (isMounted) {
        setAuthReady(true);
        setHasBearerToken(tokenAvailable);
        setError(null);
        setAuthNotice(null);
      }
      // NOTA: refreshUserSilently() fue eliminado de este efecto intencionalmente.
      // authService.validateSession() llama clearSession() ante cualquier error del
      // backend (reinicio, red, etc.), borrando localStorage y rompiendo la sesión
      // en el siguiente reload. loadConnectedUserContext ya refresca los datos del
      // usuario de forma segura sin riesgo de perder la sesión.
    };

    ensureAuthenticatedSession();

    return () => {
      isMounted = false;
    };
    // state.user es intencionalmente omitido: el objeto user puede cambiar frecuentemente
    // sin que cambie el estado de autenticación. Re-ejecutar en uid/isAuthenticated es suficiente.
    // validateSession es intencionalmente omitido: llamarlo aquí despacha SET_LOADING:true
    // en AuthContext, lo que hace que la página padre muestre el spinner global en cada navegación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isAuthenticated, state.user?.uid]);

  // ─── Single coordinated data load ─────────────────────────────────────────
  // All page-level data is fetched in parallel via Promise.allSettled on first
  // auth-ready render. The adminService caches every response (2-10 min TTL)
  // so tab-switches and consecutive reads are instant with no extra network calls.

  const allDataLoadedRef = useRef(false);
  const diagnosticsLoadedRef = useRef(false);

  const loadAllData = useCallback(
    async (force = false) => {
      if (!authReady) return;
      setLoading(true);
      setError(null);

      // Resolve permissions from session immediately — avoids an extra round-trip
      // for super_admin whose "*" wildcard is already in state.user.permissions.
      const statePerms = normalizePermissionList(state.user?.permissions);
      if (statePerms.length > 0) setConnectedUserPermissions(statePerms);

      const [
        usersRes,
        rolesRes,
        centrosRes,
        statsRes,
        bugsRes,
        escalRes,
        recsRes,
      ] = await Promise.allSettled([
        adminService.listAllUsers(500, force),
        adminService.getRolesCatalog(),
        adminService.getCentrosGestores(),
        adminService.getSystemStats(),
        adminService.listReportesBug(undefined, 200),
        adminService.listSolicitudesEscalada(undefined, 200),
        adminService.listRecomendaciones(undefined, 200),
      ]);

      if (usersRes.status === "fulfilled") setAllUsers(usersRes.value);
      else
        setError(
          (usersRes as PromiseRejectedResult).reason?.message ||
            "Error al cargar usuarios",
        );

      if (rolesRes.status === "fulfilled") setRolesCatalog(rolesRes.value);
      if (centrosRes.status === "fulfilled")
        setCentrosGestores(centrosRes.value);
      if (statsRes.status === "fulfilled") {
        setSystemStats(statsRes.value);
        setAuthNotice(null);
      }
      if (bugsRes.status === "fulfilled") setBugReports(bugsRes.value);
      if (escalRes.status === "fulfilled")
        setEscalationRequests(escalRes.value);
      if (recsRes.status === "fulfilled") setRecommendations(recsRes.value);

      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [authReady, state.user?.permissions],
  );

  useEffect(() => {
    if (!authReady || allDataLoadedRef.current) return;
    allDataLoadedRef.current = true;
    loadAllData();
  }, [authReady, loadAllData]);

  // Simplified per-collection reload used only after CRUD mutations on a tab panel
  const loadBugReports = useCallback(async () => {
    if (!authReady) return;
    try {
      const data = await adminService.listReportesBug(undefined, 200);
      setBugReports(data);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar reportes de bug");
    }
  }, [authReady]);

  const loadEscalationRequests = useCallback(async () => {
    if (!authReady) return;
    try {
      const data = await adminService.listSolicitudesEscalada(undefined, 200);
      setEscalationRequests(data);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar solicitudes de escalada");
    }
  }, [authReady]);

  const loadRecommendations = useCallback(async () => {
    if (!authReady) return;
    try {
      const data = await adminService.listRecomendaciones(undefined, 200);
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || "No se pudieron cargar recomendaciones");
    }
  }, [authReady]);

  const loadEndpointDiagnostics = useCallback(async () => {
    if (!authReady) return;

    try {
      setEndpointDiagnosticsLoading(true);
      const diagnostics = await adminService.diagnoseUsersEndpoints(
        state.user?.uid,
      );
      setEndpointDiagnostics(diagnostics);
      setEndpointDiagnosticsUpdatedAt(new Date().toISOString());
    } catch {
      setEndpointDiagnostics([
        {
          endpoint: "Diagnóstico endpoints usuarios",
          ok: false,
          status: null,
          message: "No se pudo ejecutar el diagnóstico de endpoints",
        },
      ]);
      setEndpointDiagnosticsUpdatedAt(new Date().toISOString());
    } finally {
      setEndpointDiagnosticsLoading(false);
    }
  }, [authReady, state.user?.uid]);

  const handleRefresh = useCallback(async () => {
    if (!authReady) {
      setError("No hay sesión autenticada para recargar datos");
      return;
    }
    adminService.invalidateAllCaches();
    allDataLoadedRef.current = false;
    const tasks: Promise<void>[] = [loadAllData(true)];
    if (diagnosticsLoadedRef.current) tasks.push(loadEndpointDiagnostics());
    await Promise.all(tasks);
  }, [authReady, loadAllData, loadEndpointDiagnostics]);

  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    const filteredUsers = allUsers.filter((user) => {
      const userRoles = Array.isArray(user.roles) ? user.roles : [];

      if (term) {
        const searchable = [
          user.email,
          user.full_name,
          user.uid,
          user.phone_number,
          user.centro_gestor_assigned,
        ]
          .filter(Boolean)
          .map((value) => String(value).toLowerCase());

        const match = searchable.some((value) => value.includes(term));
        if (!match) return false;
      }

      if (filterRole && !userRoles.map(String).includes(filterRole)) {
        return false;
      }

      if (filterCentroGestor) {
        const centro = (user.centro_gestor_assigned || "").toLowerCase();
        if (centro !== filterCentroGestor.toLowerCase()) {
          return false;
        }
      }

      if (
        typeof filterActive === "boolean" &&
        user.is_active !== filterActive
      ) {
        return false;
      }

      return true;
    });

    const computedTotalPages = Math.max(
      1,
      Math.ceil(filteredUsers.length / USERS_PAGE_SIZE),
    );

    if (currentPage > computedTotalPages) {
      setCurrentPage(computedTotalPages);
      return;
    }

    const start = (currentPage - 1) * USERS_PAGE_SIZE;
    const end = start + USERS_PAGE_SIZE;

    setTotalPages(computedTotalPages);
    setUsers(filteredUsers.slice(start, end));
  }, [
    allUsers,
    currentPage,
    searchTerm,
    filterRole,
    filterCentroGestor,
    filterActive,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, filterCentroGestor, filterActive]);

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleAssignRoles = (user: AdminUser) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const handleViewPermissions = (user: AdminUser) => {
    setSelectedUser(user);
    setShowPermissionViewer(true);
  };

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      await adminService.toggleUserStatus(user.uid, {
        is_active: !user.is_active,
        reason: `Cambio de estado desde tabla de gobernanza: ${user.is_active ? "desactivar" : "activar"}`,
      });
      adminService.invalidateAllCaches();
      const [usersRes, statsRes] = await Promise.allSettled([
        adminService.listAllUsers(500, true),
        adminService.getSystemStats(),
      ]);
      if (usersRes.status === "fulfilled") setAllUsers(usersRes.value);
      if (statsRes.status === "fulfilled") setSystemStats(statsRes.value);
    } catch (err: any) {
      setError(err.message || "No se pudo cambiar el estado del usuario");
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    setDeleteUserTarget(user);
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserTarget) return;

    try {
      await adminService.deleteUser(deleteUserTarget.uid, true);
      setDeleteUserTarget(null);
      adminService.invalidateAllCaches();
      const [usersRes, statsRes] = await Promise.allSettled([
        adminService.listAllUsers(500, true),
        adminService.getSystemStats(),
      ]);
      if (usersRes.status === "fulfilled") setAllUsers(usersRes.value);
      if (statsRes.status === "fulfilled") setSystemStats(statsRes.value);
    } catch (err: any) {
      setError(err.message || "No se pudo eliminar el usuario");
    }
  };

  const handleGrantTemporaryPermission = async (user: AdminUser) => {
    setGrantPermissionTarget(user);
    setGrantPermissionValue("");
    setGrantPermissionReason("");

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const localInputValue = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}T${String(tomorrow.getHours()).padStart(2, "0")}:${String(tomorrow.getMinutes()).padStart(2, "0")}`;
    setGrantPermissionExpiresAt(localInputValue);
  };

  const confirmGrantTemporaryPermission = async () => {
    if (!grantPermissionTarget) return;

    const permission = grantPermissionValue.trim();
    if (!permission) {
      setError("Debes ingresar un permiso temporal");
      return;
    }

    const expiresAt = new Date(grantPermissionExpiresAt).toISOString();
    if (
      !grantPermissionExpiresAt ||
      Number.isNaN(new Date(expiresAt).getTime())
    ) {
      setError("Fecha de expiración inválida");
      return;
    }

    try {
      await adminService.grantTemporaryPermission(grantPermissionTarget.uid, {
        permission,
        expires_at: expiresAt,
        reason: grantPermissionReason.trim() || undefined,
      });
      setGrantPermissionTarget(null);
      setGrantPermissionValue("");
      setGrantPermissionReason("");
      setGrantPermissionExpiresAt("");
      adminService.invalidateUsersCache();
      const loadedUsers = await adminService
        .listAllUsers(500, true)
        .catch(() => null);
      if (loadedUsers) setAllUsers(loadedUsers);
    } catch (err: any) {
      setError(err.message || "No se pudo otorgar el permiso temporal");
    }
  };

  const handleRevokeTemporaryPermission = async (user: AdminUser) => {
    try {
      const detailedUser = await adminService.getUser(user.uid);
      const options = (detailedUser.temporary_permissions || []).map(
        (tp) => tp.permission,
      );
      const first = options[0] || "";

      setRevokePermissionTarget(user);
      setRevokePermissionOptions(options);
      setRevokePermissionValue(first);
    } catch (err: any) {
      setError(
        err.message || "No se pudieron cargar permisos temporales para revocar",
      );
    }
  };

  const confirmRevokeTemporaryPermission = async () => {
    if (!revokePermissionTarget) return;
    const permission = revokePermissionValue.trim();
    if (!permission) {
      setError("Debes seleccionar o escribir el permiso a revocar");
      return;
    }

    try {
      await adminService.revokeTemporaryPermission(
        revokePermissionTarget.uid,
        permission,
      );
      setRevokePermissionTarget(null);
      setRevokePermissionValue("");
      setRevokePermissionOptions([]);
      adminService.invalidateUsersCache();
      const loadedUsers = await adminService
        .listAllUsers(500, true)
        .catch(() => null);
      if (loadedUsers) setAllUsers(loadedUsers);
    } catch (err: any) {
      setError(err.message || "No se pudo revocar el permiso temporal");
    }
  };

  const handleUserUpdated = async () => {
    adminService.invalidateUsersCache();
    if (selectedUser) {
      try {
        const updatedUser = await adminService.getUser(selectedUser.uid);
        setAllUsers((prev) =>
          prev.map((u) => (u.uid === updatedUser.uid ? updatedUser : u)),
        );
      } catch {
        const loadedUsers = await adminService
          .listAllUsers(500, true)
          .catch(() => null);
        if (loadedUsers) setAllUsers(loadedUsers);
      }
    } else {
      const loadedUsers = await adminService
        .listAllUsers(500, true)
        .catch(() => null);
      if (loadedUsers) setAllUsers(loadedUsers);
    }
    setShowEditModal(false);
    setShowRoleModal(false);
    setSelectedUser(null);
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Acceso Restringido
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No tienes permisos para acceder a este módulo.
            <br />
            Solo los super administradores pueden gestionar usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        data-tour-id="mgmt-usuarios-header"
      >
        <div
          className={
            isPublicRoleTheme
              ? "bg-gray-700 border border-gray-600 rounded-xl px-4 py-3"
              : ""
          }
        >
          <h1
            className={`text-2xl font-bold flex items-center gap-2 ${isPublicRoleTheme ? "text-white" : "text-gray-900 dark:text-white"}`}
          >
            <Users className="w-8 h-8" />
            Gestionar Usuarios
          </h1>
          <p
            className={`text-sm mt-1 ${isPublicRoleTheme ? "text-gray-200" : "text-gray-600 dark:text-gray-400"}`}
          >
            Gobernanza de datos por roles, privilegios y auditoría
          </p>
          <p
            className={`text-xs mt-1 ${isPublicRoleTheme ? "text-gray-300" : "text-gray-500 dark:text-gray-400"}`}
          >
            Sesión activa: {state.user?.email || "No detectada"} · Rol:{" "}
            {detectedUserRole}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ManagementFeatureTour
            moduleKey="usuarios"
            highestRole={detectedUserRole}
            userId={state.user?.uid || state.user?.email}
          />
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
          </button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </motion.button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {(
            [
              {
                key: "permisos",
                label: "Permisos y Privilegios",
                visible: true,
              },
              { key: "bugs", label: "Reportes de Bugs", visible: true },
              {
                key: "escaladas",
                label: "Solicitudes de Aumento de Privilegios",
                visible: true,
              },
              {
                key: "recomendaciones",
                label: "Recomendaciones",
                visible: true,
              },
              {
                key: "comunicaciones",
                label: "Comunicaciones",
                visible: isSuperAdmin || isAdminGeneral,
              },
            ] as Array<{ key: string; label: string; visible: boolean }>
          )
            .filter((tab) => tab.visible)
            .map((tab) => {
              const selected = activeTab === tab.key;

              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as AdminTab)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
        </div>
      </div>

      {activeTab === "bugs" && (
        <RecordsCrudPanel
          title="Reportes de Bugs"
          subtitle="Reportes enviados por los usuarios del sistema"
          icon={<Bug className="w-6 h-6" />}
          accentColor="red"
          emptyMessage="No se han reportado bugs aún."
          records={bugReports as Array<Record<string, unknown>>}
          fields={BUG_FIELDS}
          loading={loading}
          canManage={isSuperAdmin}
          onRefresh={loadBugReports}
          onUpdate={async (registroId, payload) => {
            await adminService.updateReporteBug(registroId, {
              reportado_por: payload.reportado_por
                ? String(payload.reportado_por)
                : undefined,
              descripcion_bug: payload.descripcion_bug
                ? String(payload.descripcion_bug)
                : undefined,
              contexto_adicional_bug: payload.contexto_adicional_bug
                ? String(payload.contexto_adicional_bug)
                : undefined,
            });
            await loadBugReports();
          }}
          onDelete={async (registroId) => {
            await adminService.deleteReporteBug(registroId);
            await loadBugReports();
          }}
        />
      )}

      {activeTab === "escaladas" && (
        <RecordsCrudPanel
          title="Solicitudes de Aumento de Privilegios"
          subtitle="Solicitudes de escalada enviadas por los usuarios"
          icon={<ShieldAlert className="w-6 h-6" />}
          accentColor="amber"
          emptyMessage="No hay solicitudes de escalada pendientes."
          records={escalationRequests as Array<Record<string, unknown>>}
          fields={ESCALADA_FIELDS}
          loading={loading}
          canManage={isSuperAdmin}
          onRefresh={loadEscalationRequests}
          onUpdate={async (registroId, payload) => {
            await adminService.updateSolicitudEscalada(registroId, {
              reportado_por: payload.reportado_por
                ? String(payload.reportado_por)
                : undefined,
              rol_solicitado: payload.rol_solicitado
                ? String(payload.rol_solicitado)
                : undefined,
              motivo_solicitud: payload.motivo_solicitud
                ? String(payload.motivo_solicitud)
                : undefined,
              justificacion_escalada: payload.justificacion_escalada
                ? String(payload.justificacion_escalada)
                : undefined,
            });
            await loadEscalationRequests();
          }}
          onDelete={async (registroId) => {
            await adminService.deleteSolicitudEscalada(registroId);
            await loadEscalationRequests();
          }}
        />
      )}

      {activeTab === "recomendaciones" && (
        <RecordsCrudPanel
          title="Recomendaciones"
          subtitle="Sugerencias y recomendaciones de mejora del sistema"
          icon={<Lightbulb className="w-6 h-6" />}
          accentColor="emerald"
          emptyMessage="No se han enviado recomendaciones aún."
          records={recommendations as Array<Record<string, unknown>>}
          fields={RECOMENDACION_FIELDS}
          loading={loading}
          canManage={isSuperAdmin}
          onRefresh={loadRecommendations}
          onUpdate={async (registroId, payload) => {
            await adminService.updateRecomendacion(registroId, {
              reportado_por: payload.reportado_por
                ? String(payload.reportado_por)
                : undefined,
              recomendacion_sugerencia: payload.recomendacion_sugerencia
                ? String(payload.recomendacion_sugerencia)
                : undefined,
              beneficio_esperado: payload.beneficio_esperado
                ? String(payload.beneficio_esperado)
                : undefined,
            });
            await loadRecommendations();
          }}
          onDelete={async (registroId) => {
            await adminService.deleteRecomendacion(registroId);
            await loadRecommendations();
          }}
        />
      )}

      {activeTab === "comunicaciones" && (isSuperAdmin || isAdminGeneral) && (
        <ComunicacionesPanel />
      )}

      {activeTab === "permisos" && (
        <>
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
            data-tour-id="mgmt-usuarios-stats"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500">Usuarios Totales</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalUsersForMetrics}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Fuente: sistema + fallback listado usuarios
              </p>
            </div>

            {roleAggregations.map((aggregation) => (
              <div
                key={aggregation.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <p className="text-xs text-gray-500">{aggregation.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: aggregation.color }}
                  />
                  {aggregation.value}
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {aggregation.description}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Lógica de gestión de usuarios
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Las agregaciones por rol cuentan usuarios según los roles
              asignados en backend. Si está disponible, se priorizan métricas de
              `GET /auth/admin/system/stats`; en caso contrario, se calculan
              desde el listado consolidado de usuarios (`GET /auth/admin/users`
              con fallback a `GET /admin/users`). Cuando un usuario tiene más de
              un rol, se contabiliza en cada rol correspondiente.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Usuarios por rol (barras)
              </h3>
              <div className="max-h-[30rem] overflow-y-auto text-gray-700 dark:text-gray-200">
                <div
                  style={{ height: `${roleBarsHeight}px`, minHeight: "320px" }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={roleChartData}
                      layout="vertical"
                      margin={{ top: 8, right: 20, bottom: 8, left: 34 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        allowDecimals={false}
                        tick={{ fill: "currentColor", fontSize: 11 }}
                      />
                      <YAxis
                        dataKey="label"
                        type="category"
                        width={220}
                        tick={renderWrappedCategoryTick(28)}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle.contentStyle}
                        labelStyle={chartTooltipStyle.labelStyle}
                        itemStyle={chartTooltipStyle.itemStyle}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {roleChartData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                        <LabelList
                          dataKey="value"
                          position="right"
                          fill="currentColor"
                          fontSize={11}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Distribución de roles
                </h3>
                <div className="h-72 text-gray-700 dark:text-gray-200">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={roleChartData}
                        dataKey="value"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={88}
                        label={false}
                        labelLine={false}
                      >
                        {roleChartData.map((entry) => (
                          <Cell key={`pie-${entry.id}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={chartTooltipStyle.contentStyle}
                        labelStyle={chartTooltipStyle.labelStyle}
                        itemStyle={chartTooltipStyle.itemStyle}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {roleChartData.map((item) => (
                    <div
                      key={`legend-${item.id}`}
                      className="text-xs text-gray-700 dark:text-gray-200 flex items-start gap-2"
                    >
                      <span
                        className="inline-block mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="leading-4 break-words">
                        {item.label}: <strong>{item.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Distribución por nombre_centro_gestor
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                  {centroGestorChartData.length} centros gestores con usuarios
                </p>
                <div className="max-h-[30rem] overflow-y-auto text-gray-700 dark:text-gray-200">
                  <div
                    style={{
                      height: `${centrosBarsHeight}px`,
                      minHeight: "320px",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={centroGestorChartData}
                        layout="vertical"
                        margin={{ top: 8, right: 20, bottom: 8, left: 34 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fill: "currentColor", fontSize: 11 }}
                        />
                        <YAxis
                          dataKey="centro_gestor"
                          type="category"
                          width={220}
                          tick={renderWrappedCategoryTick(30)}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle.contentStyle}
                          labelStyle={chartTooltipStyle.labelStyle}
                          itemStyle={chartTooltipStyle.itemStyle}
                        />
                        <Bar
                          dataKey="total"
                          fill="#0EA5E9"
                          radius={[0, 6, 6, 0]}
                        >
                          <LabelList
                            dataKey="total"
                            position="right"
                            fill="currentColor"
                            fontSize={11}
                          />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Check rápido de autenticación y permisos
              </h3>
              <button
                onClick={() => validateSession()}
                className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Revalidar sesión
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div className="text-xs rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-gray-700 dark:text-gray-300">
                Token:{" "}
                <span className="font-semibold">{hasToken ? "Sí" : "No"}</span>
              </div>
              <div className="text-xs rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-gray-700 dark:text-gray-300">
                Usuario activo:{" "}
                <span className="font-semibold">
                  {isUserActive ? "Sí" : "No"}
                </span>
              </div>
              <div className="text-xs rounded-md bg-gray-50 dark:bg-gray-700/40 px-3 py-2 text-gray-700 dark:text-gray-300">
                Permisos:{" "}
                <span className="font-semibold">
                  {effectivePermissions.length}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {effectivePermissions.length > 0 ? (
                effectivePermissions.map((permission) => (
                  <span
                    key={permission}
                    className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    {permission}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">
                  No se detectaron permisos efectivos en sesión
                </span>
              )}
            </div>

            <div className="space-y-2">
              {endpointChecks.map((check) => (
                <div
                  key={check.endpoint}
                  className={`text-xs rounded-md px-3 py-2 border ${
                    check.allowed
                      ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                  }`}
                >
                  <span className="font-semibold">{check.endpoint}</span> ·{" "}
                  {check.reason}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Diagnóstico de endpoints de usuarios
              </h3>
              <button
                onClick={() => {
                  diagnosticsLoadedRef.current = true;
                  loadEndpointDiagnostics();
                }}
                disabled={endpointDiagnosticsLoading}
                className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                {endpointDiagnosticsLoading
                  ? "Probando..."
                  : !diagnosticsLoadedRef.current
                    ? "Ejecutar diagnóstico"
                    : "Reprobar endpoints"}
              </button>
            </div>

            <div className="space-y-2">
              {endpointDiagnostics.map((item) => (
                <div
                  key={item.endpoint}
                  className={`text-xs rounded-md px-3 py-2 border ${
                    item.ok
                      ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800"
                  }`}
                >
                  <span className="font-semibold">{item.endpoint}</span>
                  {" · "}
                  Estado: {item.status ?? "N/A"}
                  {" · "}
                  {item.message}
                </div>
              ))}

              {!endpointDiagnosticsLoading &&
                endpointDiagnostics.length === 0 && (
                  <div className="text-xs rounded-md px-3 py-2 border bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700">
                    Sin diagnóstico aún. Usa &quot;Reprobar endpoints&quot;.
                  </div>
                )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">
              Última verificación:{" "}
              {endpointDiagnosticsUpdatedAt
                ? new Date(endpointDiagnosticsUpdatedAt).toLocaleString()
                : "No ejecutada"}
            </p>
          </div>

          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            data-tour-id="mgmt-usuarios-filters"
          >
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Filtros (aplicación automática)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Email, nombre..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rol
                </label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Todos los roles</option>
                  {roleFilterOptions.map((roleId) => (
                    <option key={roleId} value={roleId}>
                      {roleNameMap.get(roleId) || roleId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Centro Gestor
                </label>
                <select
                  value={filterCentroGestor}
                  onChange={(e) => setFilterCentroGestor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Todos los centros</option>
                  {centroGestorOptions.map((centro) => (
                    <option key={centro} value={centro}>
                      {centro}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Estado
                </label>
                <select
                  value={
                    filterActive === undefined
                      ? ""
                      : filterActive
                        ? "true"
                        : "false"
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setFilterActive(
                      value === "" ? undefined : value === "true",
                    );
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Todos</option>
                  <option value="true">Activos</option>
                  <option value="false">Inactivos</option>
                </select>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-900 dark:text-red-100">
                  {error}
                </p>
              </div>
            </div>
          )}

          {authNotice && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  {authNotice}
                </p>
              </div>
            </div>
          )}

          <div data-tour-id="mgmt-usuarios-table">
            <UserList
              users={users}
              loading={loading}
              onEdit={handleEditUser}
              onAssignRoles={handleAssignRoles}
              onViewPermissions={handleViewPermissions}
              onToggleStatus={handleToggleStatus}
              onDeleteUser={handleDeleteUser}
              onGrantTemporaryPermission={handleGrantTemporaryPermission}
              onRevokeTemporaryPermission={handleRevokeTemporaryPermission}
              canEdit={isSuperAdmin}
            />
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}

      {showEditModal && selectedUser && activeTab === "permisos" && (
        <UserEditModal
          user={selectedUser}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleUserUpdated}
          centrosGestores={centroGestorOptions}
        />
      )}

      {showRoleModal && selectedUser && activeTab === "permisos" && (
        <RoleAssignmentModal
          user={selectedUser}
          rolesCatalog={rolesCatalog}
          currentUserRole={detectedUserRole as RoleId}
          onClose={() => setShowRoleModal(false)}
          onSuccess={handleUserUpdated}
        />
      )}

      {showPermissionViewer && selectedUser && activeTab === "permisos" && (
        <UserDetailsViewer
          user={selectedUser}
          onClose={() => setShowPermissionViewer(false)}
        />
      )}

      {deleteUserTarget && activeTab === "permisos" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirmar eliminación
              </h3>
              <button
                onClick={() => setDeleteUserTarget(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
              ¿Deseas eliminar al usuario{" "}
              <span className="font-semibold">{deleteUserTarget.email}</span>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteUserTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteUser}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {grantPermissionTarget && activeTab === "permisos" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Otorgar permiso temporal
              </h3>
              <button
                onClick={() => setGrantPermissionTarget(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Usuario: {grantPermissionTarget.email}
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permiso
                </label>
                <input
                  type="text"
                  value={grantPermissionValue}
                  onChange={(e) => setGrantPermissionValue(e.target.value)}
                  placeholder="write:proyectos"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expira en
                </label>
                <input
                  type="datetime-local"
                  value={grantPermissionExpiresAt}
                  onChange={(e) => setGrantPermissionExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Razón (opcional)
                </label>
                <textarea
                  value={grantPermissionReason}
                  onChange={(e) => setGrantPermissionReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setGrantPermissionTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmGrantTemporaryPermission}
                className="px-4 py-2 text-sm rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                Otorgar
              </button>
            </div>
          </div>
        </div>
      )}

      {revokePermissionTarget && activeTab === "permisos" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Revocar permiso temporal
              </h3>
              <button
                onClick={() => setRevokePermissionTarget(null)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Usuario: {revokePermissionTarget.email}
            </p>

            <div className="space-y-3">
              {revokePermissionOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Permisos detectados
                  </label>
                  <select
                    value={revokePermissionValue}
                    onChange={(e) => setRevokePermissionValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {revokePermissionOptions.map((permission) => (
                      <option key={permission} value={permission}>
                        {permission}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Permiso a revocar
                </label>
                <input
                  type="text"
                  value={revokePermissionValue}
                  onChange={(e) => setRevokePermissionValue(e.target.value)}
                  placeholder="write:proyectos"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setRevokePermissionTarget(null)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmRevokeTemporaryPermission}
                className="px-4 py-2 text-sm rounded-lg bg-slate-700 hover:bg-slate-800 text-white"
              >
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
