/**
 * Script de Verificación del Módulo de Gestión de Usuarios
 *
 * Este script verifica que todos los componentes y servicios del módulo
 * de gestión de usuarios estén correctamente implementados.
 */

const fs = require("fs");
const path = require("path");

console.log(
  "🔍 Verificando implementación del módulo de Gestión de Usuarios...\n"
);

// Lista de archivos que deben existir
const requiredFiles = [
  // Tipos
  {
    path: "src/types/admin.ts",
    description: "Tipos TypeScript de administración",
  },

  // Servicios
  {
    path: "src/services/admin.service.ts",
    description: "Servicio de API de administración",
  },

  // Componentes
  {
    path: "src/components/admin/UserManagementPage.tsx",
    description: "Página principal de gestión",
  },
  {
    path: "src/components/admin/UserList.tsx",
    description: "Lista de usuarios",
  },
  {
    path: "src/components/admin/UserEditModal.tsx",
    description: "Modal de edición",
  },
  {
    path: "src/components/admin/RoleAssignmentModal.tsx",
    description: "Modal de asignación de roles",
  },
  {
    path: "src/components/admin/PermissionViewer.tsx",
    description: "Visor de permisos",
  },

  // Integración
  { path: "src/components/Sidebar.tsx", description: "Sidebar actualizado" },
  {
    path: "src/components/MainLayout.tsx",
    description: "MainLayout actualizado",
  },
  { path: "src/app/admin/usuarios/page.tsx", description: "Ruta protegida" },
];

let allFilesExist = true;
let totalLines = 0;

console.log("📁 Verificando archivos:\n");

requiredFiles.forEach((file) => {
  const fullPath = path.join(process.cwd(), file.path);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const content = fs.readFileSync(fullPath, "utf-8");
    const lines = content.split("\n").length;
    totalLines += lines;
    console.log(`✅ ${file.path.padEnd(60)} (${lines} líneas)`);
    console.log(`   ${file.description}`);
  } else {
    console.log(`❌ ${file.path.padEnd(60)} FALTA`);
    console.log(`   ${file.description}`);
    allFilesExist = false;
  }
  console.log();
});

console.log("━".repeat(80));
console.log();

// Verificar integraciones específicas
console.log("🔗 Verificando integraciones:\n");

// 1. Verificar que Sidebar importa RoleId
const sidebarContent = fs.readFileSync(
  path.join(process.cwd(), "src/components/Sidebar.tsx"),
  "utf-8"
);
const hasRoleIdImport =
  sidebarContent.includes("import { RoleId }") ||
  sidebarContent.includes("import type { RoleId }");
const hasUsersIcon =
  sidebarContent.includes("Users") && sidebarContent.includes("lucide-react");
const hasUserRoleProp = sidebarContent.includes("userRole?:");
const hasGestionarUsuarios = sidebarContent.includes("gestionar-usuarios");

console.log(`${hasRoleIdImport ? "✅" : "❌"} Sidebar importa RoleId`);
console.log(`${hasUsersIcon ? "✅" : "❌"} Sidebar tiene icono Users`);
console.log(`${hasUserRoleProp ? "✅" : "❌"} Sidebar tiene prop userRole`);
console.log(
  `${
    hasGestionarUsuarios ? "✅" : "❌"
  } Sidebar tiene item "Gestionar Usuarios"`
);
console.log();

// 2. Verificar que MainLayout carga el rol
const mainLayoutContent = fs.readFileSync(
  path.join(process.cwd(), "src/components/MainLayout.tsx"),
  "utf-8"
);
const hasAdminServiceImport = mainLayoutContent.includes("adminService");
const hasGetHighestRole = mainLayoutContent.includes("getHighestRole");
const hasLoadUserRole = mainLayoutContent.includes("loadUserRole");
const passesUserRoleToSidebar = mainLayoutContent.includes(
  "userRole={userRole}"
);

console.log(
  `${hasAdminServiceImport ? "✅" : "❌"} MainLayout importa adminService`
);
console.log(`${hasGetHighestRole ? "✅" : "❌"} MainLayout usa getHighestRole`);
console.log(
  `${hasLoadUserRole ? "✅" : "❌"} MainLayout tiene efecto loadUserRole`
);
console.log(
  `${passesUserRoleToSidebar ? "✅" : "❌"} MainLayout pasa userRole a Sidebar`
);
console.log();

// 3. Verificar la página de usuarios
const usuariosPageContent = fs.readFileSync(
  path.join(process.cwd(), "src/app/admin/usuarios/page.tsx"),
  "utf-8"
);
const hasUserManagementPageImport =
  usuariosPageContent.includes("UserManagementPage");
const hasRoleVerification = usuariosPageContent.includes("super_admin");
const hasRedirection = usuariosPageContent.includes("router.push");

console.log(
  `${
    hasUserManagementPageImport ? "✅" : "❌"
  } Página importa UserManagementPage`
);
console.log(
  `${hasRoleVerification ? "✅" : "❌"} Página verifica rol super_admin`
);
console.log(`${hasRedirection ? "✅" : "❌"} Página redirige si no autorizado`);
console.log();

console.log("━".repeat(80));
console.log();

// Verificar package.json
console.log("📦 Verificando dependencias:\n");

const packageJson = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8")
);
const hasDateFns = !!packageJson.dependencies["date-fns"];
const hasFramerMotion = !!packageJson.dependencies["framer-motion"];
const hasLucideReact = !!packageJson.dependencies["lucide-react"];

console.log(
  `${hasDateFns ? "✅" : "❌"} date-fns instalado (para formateo de fechas)`
);
console.log(
  `${hasFramerMotion ? "✅" : "❌"} framer-motion instalado (para animaciones)`
);
console.log(
  `${hasLucideReact ? "✅" : "❌"} lucide-react instalado (para iconos)`
);
console.log();

console.log("━".repeat(80));
console.log();

// Resumen final
console.log("📊 RESUMEN DE LA IMPLEMENTACIÓN:\n");
console.log(`   Archivos verificados: ${requiredFiles.length}`);
console.log(
  `   Archivos existentes: ${
    requiredFiles.filter((f) => fs.existsSync(path.join(process.cwd(), f.path)))
      .length
  }`
);
console.log(`   Total de líneas de código: ${totalLines.toLocaleString()}`);
console.log();

const integrationChecks = [
  hasRoleIdImport,
  hasUsersIcon,
  hasUserRoleProp,
  hasGestionarUsuarios,
  hasAdminServiceImport,
  hasGetHighestRole,
  hasLoadUserRole,
  passesUserRoleToSidebar,
  hasUserManagementPageImport,
  hasRoleVerification,
  hasRedirection,
  hasDateFns,
  hasFramerMotion,
  hasLucideReact,
];

const passedChecks = integrationChecks.filter(Boolean).length;
const totalChecks = integrationChecks.length;

console.log(`   Verificaciones pasadas: ${passedChecks}/${totalChecks}`);
console.log();

if (allFilesExist && passedChecks === totalChecks) {
  console.log("✨ ¡IMPLEMENTACIÓN COMPLETA Y VERIFICADA!\n");
  console.log("🚀 Próximos pasos:");
  console.log("   1. Ejecutar: npm run dev");
  console.log("   2. Autenticarse como super_admin");
  console.log('   3. Verificar que "Gestionar Usuarios" aparece en el sidebar');
  console.log("   4. Navegar a /admin/usuarios");
  console.log("   5. Probar las funcionalidades del módulo");
  console.log();
  process.exit(0);
} else {
  console.log("⚠️  Hay algunos problemas que requieren atención.\n");
  if (!allFilesExist) {
    console.log("   • Algunos archivos no existen");
  }
  if (passedChecks < totalChecks) {
    console.log(
      `   • ${
        totalChecks - passedChecks
      } verificaciones de integración fallaron`
    );
  }
  console.log();
  process.exit(1);
}
