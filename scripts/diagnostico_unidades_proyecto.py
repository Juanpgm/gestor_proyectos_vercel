#!/usr/bin/env python3
"""
Diagnóstico Completo de Unidades de Proyecto - Next.js App
=========================================================

Este script analiza todos los problemas potenciales en la sección "Unidades de Proyecto"
relacionados con caché, estado, conexión API, SSR/CSR, y hot reload.

Problemas comunes analizados:
- Estado persistente no limpiado
- Caché de fetch/API
- Errores de hidratación
- Componentes fijados en layout
- Problemas de Hot Reload
- Estados globales no sincronizados
- Memory leaks en hooks
"""

import os
import json
import re
import ast
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, field
from datetime import datetime
import subprocess
import tempfile

# Colores para output
class Colors:
    RED = '\033[91m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

@dataclass
class Issue:
    severity: str  # 'critical', 'high', 'medium', 'low'
    category: str  # 'cache', 'state', 'api', 'hydration', 'layout', 'hotreload'
    title: str
    description: str
    file_path: str
    line_number: int = 0
    code_snippet: str = ""
    solution: str = ""
    impact: str = ""

@dataclass
class DiagnosticReport:
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())
    project_path: str = ""
    total_issues: int = 0
    critical_issues: int = 0
    high_issues: int = 0
    medium_issues: int = 0
    low_issues: int = 0
    issues: List[Issue] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    repair_plan: List[Dict[str, Any]] = field(default_factory=list)

class UnidadesProyectoDiagnostic:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.report = DiagnosticReport(project_path=str(self.project_root))
        
        # Patrones para buscar problemas específicos
        self.patterns = {
            'state_persistence': [
                r'useState.*(?:UnidadProyecto|unidades)',
                r'useEffect.*(?:UnidadProyecto|unidades).*\[\]',
                r'globalUnidadesState',
                r'setState.*(?:UnidadProyecto|unidades)'
            ],
            'cache_issues': [
                r'fetch.*unidades.*cache',
                r'cache:\s*[\'"](?:force-cache|only-if-cached)[\'"]',
                r'revalidate:\s*(?:false|0)',
                r'getServerSideProps',
                r'getStaticProps'
            ],
            'hydration_problems': [
                r'window\.',
                r'localStorage',
                r'sessionStorage',
                r'document\.',
                r'useEffect.*\[\]'
            ],
            'hot_reload_issues': [
                r'if\s*\(\s*module\.hot\s*\)',
                r'process\.env\.NODE_ENV',
                r'__DEV__'
            ],
            'api_connection': [
                r'API_BASE_URL',
                r'fetch.*unidades-proyecto',
                r'AbortController',
                r'setTimeout.*fetch'
            ]
        }
    
    def run_diagnosis(self) -> DiagnosticReport:
        """Ejecuta el diagnóstico completo"""
        print(f"{Colors.BOLD}{Colors.BLUE}🔍 Iniciando Diagnóstico de Unidades de Proyecto{Colors.END}")
        print(f"Proyecto: {self.project_root}")
        print("-" * 80)
        
        # Analizar archivos clave
        self._analyze_hooks()
        self._analyze_components()
        self._analyze_pages()
        self._analyze_services()
        self._analyze_middleware()
        self._analyze_package_json()
        self._analyze_next_config()
        
        # Verificar conexión API
        self._test_api_connection()
        
        # Generar recomendaciones
        self._generate_recommendations()
        
        # Generar plan de reparación
        self._generate_repair_plan()
        
        # Calcular estadísticas
        self._calculate_statistics()
        
        return self.report
    
    def _analyze_hooks(self):
        """Analiza hooks relacionados con Unidades de Proyecto"""
        print(f"{Colors.CYAN}📋 Analizando hooks...{Colors.END}")
        
        hooks_dir = self.project_root / "src" / "hooks"
        if not hooks_dir.exists():
            return
        
        unidades_hooks = list(hooks_dir.glob("**/useUnidades*"))
        
        for hook_file in unidades_hooks:
            self._analyze_file_for_issues(hook_file, "hook")
    
    def _analyze_components(self):
        """Analiza componentes relacionados con Unidades de Proyecto"""
        print(f"{Colors.CYAN}🧩 Analizando componentes...{Colors.END}")
        
        components_dir = self.project_root / "src" / "components"
        if not components_dir.exists():
            return
        
        unidades_components = list(components_dir.glob("**/UnidadesProyecto*"))
        
        for component_file in unidades_components:
            self._analyze_file_for_issues(component_file, "component")
    
    def _analyze_pages(self):
        """Analiza páginas que incluyen Unidades de Proyecto"""
        print(f"{Colors.CYAN}📄 Analizando páginas...{Colors.END}")
        
        # App Router
        app_dir = self.project_root / "src" / "app"
        if app_dir.exists():
            for page_file in app_dir.rglob("**/page.tsx"):
                self._analyze_file_for_issues(page_file, "page")
        
        # Pages Router (si existe)
        pages_dir = self.project_root / "pages"
        if pages_dir.exists():
            for page_file in pages_dir.rglob("**/*.tsx"):
                self._analyze_file_for_issues(page_file, "page")
    
    def _analyze_services(self):
        """Analiza servicios de API"""
        print(f"{Colors.CYAN}🌐 Analizando servicios de API...{Colors.END}")
        
        services_dir = self.project_root / "src" / "services"
        if not services_dir.exists():
            return
        
        for service_file in services_dir.glob("**/*unidades*"):
            self._analyze_file_for_issues(service_file, "service")
    
    def _analyze_middleware(self):
        """Analiza middleware"""
        print(f"{Colors.CYAN}⚙️ Analizando middleware...{Colors.END}")
        
        middleware_file = self.project_root / "src" / "middleware.ts"
        if middleware_file.exists():
            self._analyze_file_for_issues(middleware_file, "middleware")
    
    def _analyze_file_for_issues(self, file_path: Path, file_type: str):
        """Analiza un archivo específico buscando problemas"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Analizar patrones problemáticos
            self._check_state_persistence_issues(file_path, content, file_type)
            self._check_cache_issues(file_path, content, file_type)
            self._check_hydration_issues(file_path, content, file_type)
            self._check_api_issues(file_path, content, file_type)
            self._check_hot_reload_issues(file_path, content, file_type)
            self._check_layout_persistence(file_path, content, file_type)
            
        except Exception as e:
            self._add_issue(
                severity="medium",
                category="analysis",
                title=f"Error analizando archivo: {file_path.name}",
                description=f"No se pudo analizar el archivo: {str(e)}",
                file_path=str(file_path)
            )
    
    def _check_state_persistence_issues(self, file_path: Path, content: str, file_type: str):
        """Busca problemas de estado persistente"""
        lines = content.split('\n')
        
        # Buscar useEffect sin cleanup
        for i, line in enumerate(lines):
            if re.search(r'useEffect.*unidades.*\[\]', line, re.IGNORECASE):
                # Verificar si hay cleanup function
                if not self._has_cleanup_function(lines, i):
                    self._add_issue(
                        severity="high",
                        category="state",
                        title="useEffect sin función de limpieza",
                        description="Hook useEffect sin función de cleanup que puede causar memory leaks",
                        file_path=str(file_path),
                        line_number=i + 1,
                        code_snippet=line.strip(),
                        solution="Agregar función de cleanup en useEffect",
                        impact="Memoria persistente, componente 'fijado'"
                    )
        
        # Buscar estado global no sincronizado
        if 'globalUnidadesState' in content:
            if 'subscribeToUnidadesProyectoChanges' not in content:
                self._add_issue(
                    severity="critical",
                    category="state",
                    title="Estado global sin sincronización",
                    description="Estado global utilizado sin suscripción a cambios",
                    file_path=str(file_path),
                    solution="Implementar suscripción a cambios globales",
                    impact="Datos desactualizados, componente fijado"
                )
        
        # Buscar useState que nunca se resetea
        state_vars = re.findall(r'const\s+\[(\w+),\s*set\w+\]\s*=\s*useState', content)
        for var in state_vars:
            if 'unidades' in var.lower() or 'proyecto' in var.lower():
                if f'set{var.title()}(null)' not in content and f'set{var.title()}([])' not in content:
                    self._add_issue(
                        severity="medium",
                        category="state",
                        title=f"Estado {var} nunca se resetea",
                        description=f"Variable de estado {var} no tiene limpieza explícita",
                        file_path=str(file_path),
                        solution=f"Agregar set{var.title()}(null) en cleanup",
                        impact="Estado persistente entre navegaciones"
                    )
    
    def _check_cache_issues(self, file_path: Path, content: str, file_type: str):
        """Busca problemas de caché"""
        lines = content.split('\n')
        
        for i, line in enumerate(lines):
            # Fetch sin no-cache
            if re.search(r'fetch.*unidades.*(?!.*cache.*no)', line, re.IGNORECASE):
                if 'cache:' not in line and 'no-store' not in line:
                    self._add_issue(
                        severity="high",
                        category="cache",
                        title="Fetch sin configuración de caché",
                        description="Llamada fetch sin configuración explícita de caché",
                        file_path=str(file_path),
                        line_number=i + 1,
                        code_snippet=line.strip(),
                        solution="Agregar { cache: 'no-store' } o { cache: 'no-cache' }",
                        impact="Datos obsoletos de caché"
                    )
            
            # getServerSideProps o getStaticProps
            if re.search(r'get(?:ServerSide|Static)Props', line):
                self._add_issue(
                    severity="medium",
                    category="cache",
                    title="Uso de getServerSideProps/getStaticProps",
                    description="Función de pre-renderizado que puede causar caché persistente",
                    file_path=str(file_path),
                    line_number=i + 1,
                    solution="Considerar migrar a App Router con fetch directo",
                    impact="Datos pre-renderizados obsoletos"
                )
    
    def _check_hydration_issues(self, file_path: Path, content: str, file_type: str):
        """Busca problemas de hidratación"""
        lines = content.split('\n')
        
        # Buscar acceso directo a window/document sin verificación
        for i, line in enumerate(lines):
            if re.search(r'(?<!typeof\s)window\.', line) and 'typeof window' not in line:
                self._add_issue(
                    severity="high",
                    category="hydration",
                    title="Acceso directo a window sin verificación",
                    description="Acceso a window sin verificar si está disponible",
                    file_path=str(file_path),
                    line_number=i + 1,
                    code_snippet=line.strip(),
                    solution="Usar typeof window !== 'undefined' antes del acceso",
                    impact="Error de hidratación, componente congelado"
                )
            
            if re.search(r'(?<!typeof\s)document\.', line) and 'typeof document' not in line:
                self._add_issue(
                    severity="high",
                    category="hydration",
                    title="Acceso directo a document sin verificación",
                    description="Acceso a document sin verificar si está disponible",
                    file_path=str(file_path),
                    line_number=i + 1,
                    code_snippet=line.strip(),
                    solution="Usar typeof document !== 'undefined' antes del acceso",
                    impact="Error de hidratación"
                )
        
        # Buscar localStorage/sessionStorage sin verificación
        if 'localStorage' in content and 'typeof Storage' not in content:
            self._add_issue(
                severity="medium",
                category="hydration",
                title="Uso de localStorage sin verificación",
                description="localStorage usado sin verificar disponibilidad",
                file_path=str(file_path),
                solution="Verificar disponibilidad antes de usar",
                impact="Error en SSR/hidratación"
            )
    
    def _check_api_issues(self, file_path: Path, content: str, file_type: str):
        """Busca problemas de conexión API"""
        # Verificar timeout en fetch
        if 'fetch(' in content and 'AbortController' not in content:
            self._add_issue(
                severity="medium",
                category="api",
                title="Fetch sin timeout",
                description="Llamadas fetch sin mecanismo de timeout",
                file_path=str(file_path),
                solution="Implementar AbortController con timeout",
                impact="Requests colgados, UI bloqueada"
            )
        
        # Verificar manejo de errores
        if 'fetch(' in content and '.catch(' not in content:
            self._add_issue(
                severity="high",
                category="api",
                title="Fetch sin manejo de errores",
                description="Llamadas fetch sin manejo de errores",
                file_path=str(file_path),
                solution="Agregar .catch() o try/catch",
                impact="Errores no manejados, estado inconsistente"
            )
    
    def _check_hot_reload_issues(self, file_path: Path, content: str, file_type: str):
        """Busca problemas de Hot Reload"""
        # Verificar si hay lógica que podría interferir con hot reload
        if 'process.env.NODE_ENV' in content and 'development' in content:
            if 'module.hot' not in content:
                self._add_issue(
                    severity="low",
                    category="hotreload",
                    title="Lógica de desarrollo sin Hot Module Replacement",
                    description="Código específico de desarrollo sin soporte HMR",
                    file_path=str(file_path),
                    solution="Considerar soporte para module.hot",
                    impact="Hot reload no funciona correctamente"
                )
    
    def _check_layout_persistence(self, file_path: Path, content: str, file_type: str):
        """Busca componentes persistentes en layouts"""
        if file_type == "page" and file_path.name in ["layout.tsx", "_app.tsx"]:
            if "UnidadesProyecto" in content:
                self._add_issue(
                    severity="critical",
                    category="layout",
                    title="Componente UnidadesProyecto en layout persistente",
                    description="Componente incluido en layout que persiste entre navegaciones",
                    file_path=str(file_path),
                    solution="Mover componente a página específica",
                    impact="Componente aparece en todas las rutas"
                )
    
    def _has_cleanup_function(self, lines: List[str], effect_line: int) -> bool:
        """Verifica si un useEffect tiene función de cleanup"""
        # Buscar return statement en las próximas líneas
        for i in range(effect_line, min(effect_line + 20, len(lines))):
            if 'return ()' in lines[i] or 'return function' in lines[i]:
                return True
        return False
    
    def _test_api_connection(self):
        """Prueba la conexión con la API"""
        print(f"{Colors.CYAN}🌐 Analizando configuración de API...{Colors.END}")
        
        # Buscar URL de API específicas para Unidades de Proyecto
        api_urls = self._find_api_urls()
        real_api_urls = [url for url in api_urls if 'gestorproyectoapi' in url.lower() or 'unidades-proyecto' in url.lower()]
        
        if not real_api_urls:
            self._add_issue(
                severity="medium",
                category="api",
                title="No se encontraron URLs de API específicas",
                description="No se detectaron URLs de API para Unidades de Proyecto",
                file_path="API Configuration",
                solution="Verificar configuración de NEXT_PUBLIC_API_URL",
                impact="Posible configuración incorrecta"
            )
        else:
            for url in real_api_urls:
                print(f"{Colors.GREEN}✅ API URL encontrada: {url}{Colors.END}")
                # Solo verificar si la URL está bien formada
                if not url.startswith('https://'):
                    self._add_issue(
                        severity="medium",
                        category="api",
                        title=f"URL de API no segura: {url}",
                        description="URL de API no usa HTTPS",
                        file_path="API Configuration",
                        solution="Usar HTTPS para todas las APIs",
                        impact="Seguridad comprometida"
                    )
    
    def _find_api_urls(self) -> List[str]:
        """Encuentra URLs de API en el código"""
        urls = []
        
        # Buscar en archivos de configuración específicos
        target_files = ['useUnidadesProyectoAPI.ts', 'unidadesProyectoApi.ts', '.env', '.env.local']
        
        for file_path in self.project_root.rglob("*"):
            if file_path.name in target_files or 'unidades' in file_path.name.lower():
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Buscar patrones de URL específicos
                    url_patterns = re.findall(r'https?://[^\s\'"]+', content)
                    for url in url_patterns:
                        if any(keyword in url.lower() for keyword in ['gestorproyecto', 'unidades-proyecto', 'railway']):
                            clean_url = url.rstrip('",;')
                            if clean_url not in urls:
                                urls.append(clean_url)
                    
                    # Buscar variables de entorno
                    env_patterns = re.findall(r'API_BASE_URL.*?[\'"]([^\'"]+)[\'"]', content)
                    urls.extend(env_patterns)
                            
                except:
                    continue
        
        return list(set(urls))  # Eliminar duplicados
    
    def _analyze_package_json(self):
        """Analiza package.json para dependencias problemáticas"""
        print(f"{Colors.CYAN}📦 Analizando package.json...{Colors.END}")
        
        package_json = self.project_root / "package.json"
        if not package_json.exists():
            return
        
        try:
            with open(package_json, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            dependencies = {**data.get('dependencies', {}), **data.get('devDependencies', {})}
            
            # Verificar versiones de Next.js
            if 'next' in dependencies:
                version = dependencies['next']
                if version.startswith('^13.') or version.startswith('13.'):
                    self._add_issue(
                        severity="medium",
                        category="cache",
                        title="Next.js 13 con App Router",
                        description="Next.js 13+ cachea fetch por defecto",
                        file_path="package.json",
                        solution="Usar { cache: 'no-store' } en fetch calls",
                        impact="Caché agresivo de datos"
                    )
            
            # Verificar dependencias relacionadas con estado
            state_deps = ['redux', 'zustand', 'recoil', 'jotai']
            for dep in state_deps:
                if dep in dependencies:
                    self._add_issue(
                        severity="low",
                        category="state",
                        title=f"Dependencia de estado global: {dep}",
                        description="Librería de estado global que podría tener datos persistentes",
                        file_path="package.json",
                        solution="Verificar limpieza de estado en navegación",
                        impact="Estado persistente entre páginas"
                    )
                    
        except Exception as e:
            self._add_issue(
                severity="low",
                category="analysis",
                title="Error analizando package.json",
                description=str(e),
                file_path="package.json"
            )
    
    def _analyze_next_config(self):
        """Analiza next.config.js para configuraciones problemáticas"""
        print(f"{Colors.CYAN}⚙️ Analizando next.config.js...{Colors.END}")
        
        next_config = self.project_root / "next.config.js"
        if not next_config.exists():
            next_config = self.project_root / "next.config.mjs"
        
        if not next_config.exists():
            return
        
        try:
            with open(next_config, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if 'experimental' in content and 'appDir' in content:
                self._add_issue(
                    severity="medium",
                    category="cache",
                    title="App Router experimental habilitado",
                    description="App Router en modo experimental puede tener comportamiento de caché impredecible",
                    file_path="next.config.js",
                    solution="Actualizar a Next.js estable o ajustar configuración de caché",
                    impact="Comportamiento de caché inconsistente"
                )
                
        except Exception as e:
            self._add_issue(
                severity="low",
                category="analysis",
                title="Error analizando next.config.js",
                description=str(e),
                file_path="next.config.js"
            )
    
    def _add_issue(self, severity: str, category: str, title: str, description: str, 
                   file_path: str, line_number: int = 0, code_snippet: str = "", 
                   solution: str = "", impact: str = ""):
        """Agrega un issue al reporte"""
        issue = Issue(
            severity=severity,
            category=category,
            title=title,
            description=description,
            file_path=file_path,
            line_number=line_number,
            code_snippet=code_snippet,
            solution=solution,
            impact=impact
        )
        self.report.issues.append(issue)
    
    def _generate_recommendations(self):
        """Genera recomendaciones basadas en los issues encontrados"""
        # Agrupar issues por categoría
        by_category = {}
        for issue in self.report.issues:
            if issue.category not in by_category:
                by_category[issue.category] = []
            by_category[issue.category].append(issue)
        
        # Generar recomendaciones específicas
        recommendations = []
        
        if 'state' in by_category:
            recommendations.append(
                "🧹 Implementar limpieza de estado: Agregar cleanup functions en useEffect "
                "y resetear estados al desmontar componentes"
            )
        
        if 'cache' in by_category:
            recommendations.append(
                "🗄️ Configurar caché explícitamente: Usar { cache: 'no-store' } en fetch calls "
                "para evitar datos obsoletos"
            )
        
        if 'hydration' in by_category:
            recommendations.append(
                "💧 Resolver errores de hidratación: Verificar disponibilidad de window/document "
                "antes de usarlos y usar useEffect para lógica client-side"
            )
        
        if 'api' in by_category:
            recommendations.append(
                "🌐 Mejorar manejo de API: Implementar timeouts, manejo de errores y "
                "loading states apropiados"
            )
        
        if 'layout' in by_category:
            recommendations.append(
                "🏗️ Revisar layouts persistentes: Mover componentes específicos fuera de "
                "layouts globales para evitar persistencia no deseada"
            )
        
        # Recomendación general
        recommendations.append(
            "🔄 Reiniciar servidor de desarrollo: npm run dev para limpiar hot reload cache"
        )
        
        self.report.recommendations = recommendations
    
    def _generate_repair_plan(self):
        """Genera un plan de reparación paso a paso"""
        plan = []
        
        # Paso 1: Issues críticos
        critical_issues = [i for i in self.report.issues if i.severity == 'critical']
        if critical_issues:
            plan.append({
                "step": 1,
                "title": "Resolver Issues Críticos",
                "description": "Estos problemas pueden estar causando el comportamiento 'fijado'",
                "actions": [i.solution for i in critical_issues if i.solution],
                "files": list(set([i.file_path for i in critical_issues])),
                "priority": "INMEDIATO"
            })
        
        # Paso 2: Limpieza de estado
        state_issues = [i for i in self.report.issues if i.category == 'state']
        if state_issues:
            plan.append({
                "step": 2,
                "title": "Limpieza de Estado",
                "description": "Implementar proper cleanup para evitar memoria persistente",
                "actions": [
                    "Agregar cleanup functions en useEffect",
                    "Resetear estados al desmontar componentes",
                    "Implementar unsuscribe en listeners globales"
                ],
                "files": list(set([i.file_path for i in state_issues])),
                "priority": "ALTO"
            })
        
        # Paso 3: Configuración de caché
        cache_issues = [i for i in self.report.issues if i.category == 'cache']
        if cache_issues:
            plan.append({
                "step": 3,
                "title": "Configuración de Caché",
                "description": "Evitar datos obsoletos mediante configuración explícita",
                "actions": [
                    "Agregar { cache: 'no-store' } a fetch calls",
                    "Verificar middleware de caché",
                    "Limpiar caché del navegador durante desarrollo"
                ],
                "files": list(set([i.file_path for i in cache_issues])),
                "priority": "ALTO"
            })
        
        # Paso 4: Hidratación
        hydration_issues = [i for i in self.report.issues if i.category == 'hydration']
        if hydration_issues:
            plan.append({
                "step": 4,
                "title": "Resolver Hidratación",
                "description": "Prevenir errores de hidratación que congelan componentes",
                "actions": [
                    "Verificar typeof window !== 'undefined'",
                    "Mover lógica client-side a useEffect",
                    "Usar estado condicional para client-side rendering"
                ],
                "files": list(set([i.file_path for i in hydration_issues])),
                "priority": "MEDIO"
            })
        
        # Paso 5: API y networking
        api_issues = [i for i in self.report.issues if i.category == 'api']
        if api_issues:
            plan.append({
                "step": 5,
                "title": "Optimizar API",
                "description": "Mejorar robustez de conexiones API",
                "actions": [
                    "Implementar timeouts en requests",
                    "Agregar manejo de errores comprehensivo",
                    "Implementar retry logic para requests fallidos"
                ],
                "files": list(set([i.file_path for i in api_issues])),
                "priority": "MEDIO"
            })
        
        # Paso final: Testing
        plan.append({
            "step": len(plan) + 1,
            "title": "Testing y Verificación",
            "description": "Verificar que los cambios resuelven el problema",
            "actions": [
                "Reiniciar servidor de desarrollo",
                "Limpiar caché del navegador",
                "Probar navegación entre páginas",
                "Verificar que componentes se desmontan correctamente",
                "Probar en modo production build"
            ],
            "files": ["Toda la aplicación"],
            "priority": "VERIFICACIÓN"
        })
        
        self.report.repair_plan = plan
    
    def _calculate_statistics(self):
        """Calcula estadísticas del reporte"""
        self.report.total_issues = len(self.report.issues)
        self.report.critical_issues = len([i for i in self.report.issues if i.severity == 'critical'])
        self.report.high_issues = len([i for i in self.report.issues if i.severity == 'high'])
        self.report.medium_issues = len([i for i in self.report.issues if i.severity == 'medium'])
        self.report.low_issues = len([i for i in self.report.issues if i.severity == 'low'])
    
    def print_report(self):
        """Imprime el reporte en consola"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}📊 REPORTE DE DIAGNÓSTICO - UNIDADES DE PROYECTO{Colors.END}")
        print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}")
        
        print(f"\n{Colors.BOLD}📍 Proyecto:{Colors.END} {self.report.project_path}")
        print(f"{Colors.BOLD}⏰ Timestamp:{Colors.END} {self.report.timestamp}")
        
        # Estadísticas
        print(f"\n{Colors.BOLD}{Colors.YELLOW}📈 ESTADÍSTICAS{Colors.END}")
        print(f"Total de Issues: {self.report.total_issues}")
        print(f"{Colors.RED}Críticos: {self.report.critical_issues}{Colors.END}")
        print(f"{Colors.YELLOW}Altos: {self.report.high_issues}{Colors.END}")
        print(f"{Colors.BLUE}Medios: {self.report.medium_issues}{Colors.END}")
        print(f"{Colors.GREEN}Bajos: {self.report.low_issues}{Colors.END}")
        
        # Issues por categoría
        categories = {}
        for issue in self.report.issues:
            if issue.category not in categories:
                categories[issue.category] = 0
            categories[issue.category] += 1
        
        print(f"\n{Colors.BOLD}{Colors.CYAN}📂 ISSUES POR CATEGORÍA{Colors.END}")
        for category, count in sorted(categories.items()):
            print(f"  {category}: {count}")
        
        # Issues críticos y altos
        critical_and_high = [i for i in self.report.issues if i.severity in ['critical', 'high']]
        if critical_and_high:
            print(f"\n{Colors.BOLD}{Colors.RED}🚨 ISSUES CRÍTICOS Y ALTOS{Colors.END}")
            for issue in critical_and_high[:10]:  # Solo los primeros 10
                color = Colors.RED if issue.severity == 'critical' else Colors.YELLOW
                print(f"\n{color}▶ {issue.title}{Colors.END}")
                print(f"  📁 {issue.file_path}:{issue.line_number}")
                print(f"  📝 {issue.description}")
                if issue.solution:
                    print(f"  💡 Solución: {issue.solution}")
                if issue.impact:
                    print(f"  ⚡ Impacto: {issue.impact}")
        
        # Recomendaciones
        if self.report.recommendations:
            print(f"\n{Colors.BOLD}{Colors.GREEN}💡 RECOMENDACIONES{Colors.END}")
            for i, rec in enumerate(self.report.recommendations, 1):
                print(f"{i}. {rec}")
        
        # Plan de reparación
        if self.report.repair_plan:
            print(f"\n{Colors.BOLD}{Colors.MAGENTA}🔧 PLAN DE REPARACIÓN{Colors.END}")
            for step in self.report.repair_plan:
                priority_color = {
                    'INMEDIATO': Colors.RED,
                    'ALTO': Colors.YELLOW,
                    'MEDIO': Colors.BLUE,
                    'VERIFICACIÓN': Colors.GREEN
                }.get(step['priority'], Colors.WHITE)
                
                print(f"\n{priority_color}Paso {step['step']}: {step['title']}{Colors.END}")
                print(f"  Prioridad: {priority_color}{step['priority']}{Colors.END}")
                print(f"  📝 {step['description']}")
                
                if step['actions']:
                    print(f"  🔧 Acciones:")
                    for action in step['actions']:
                        print(f"    • {action}")
                
                if step['files']:
                    print(f"  📁 Archivos afectados: {len(step['files'])}")
                    for file in step['files'][:3]:  # Solo los primeros 3
                        print(f"    • {file}")
                    if len(step['files']) > 3:
                        print(f"    • ... y {len(step['files']) - 3} más")
    
    def save_report(self, output_file: str = None):
        """Guarda el reporte en un archivo JSON"""
        if not output_file:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_file = f"diagnostico_unidades_proyecto_{timestamp}.json"
        
        # Convertir dataclasses a dict
        report_dict = {
            'timestamp': self.report.timestamp,
            'project_path': self.report.project_path,
            'total_issues': self.report.total_issues,
            'critical_issues': self.report.critical_issues,
            'high_issues': self.report.high_issues,
            'medium_issues': self.report.medium_issues,
            'low_issues': self.report.low_issues,
            'issues': [
                {
                    'severity': issue.severity,
                    'category': issue.category,
                    'title': issue.title,
                    'description': issue.description,
                    'file_path': issue.file_path,
                    'line_number': issue.line_number,
                    'code_snippet': issue.code_snippet,
                    'solution': issue.solution,
                    'impact': issue.impact
                }
                for issue in self.report.issues
            ],
            'recommendations': self.report.recommendations,
            'repair_plan': self.report.repair_plan
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_dict, f, indent=2, ensure_ascii=False)
        
        print(f"\n{Colors.GREEN}✅ Reporte guardado en: {output_file}{Colors.END}")

def main():
    """Función principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Diagnóstico de Unidades de Proyecto')
    parser.add_argument('--project-path', '-p', default='.', 
                       help='Ruta al proyecto (default: directorio actual)')
    parser.add_argument('--output', '-o', 
                       help='Archivo de salida para el reporte JSON')
    parser.add_argument('--quiet', '-q', action='store_true',
                       help='Modo silencioso (solo errores)')
    
    args = parser.parse_args()
    
    try:
        # Ejecutar diagnóstico
        diagnostic = UnidadesProyectoDiagnostic(args.project_path)
        report = diagnostic.run_diagnosis()
        
        # Mostrar reporte
        if not args.quiet:
            diagnostic.print_report()
        
        # Guardar reporte
        diagnostic.save_report(args.output)
        
        # Exit code basado en severidad de issues
        if report.critical_issues > 0:
            return 2
        elif report.high_issues > 0:
            return 1
        else:
            return 0
            
    except Exception as e:
        print(f"{Colors.RED}❌ Error ejecutando diagnóstico: {str(e)}{Colors.END}")
        return 3

if __name__ == "__main__":
    exit(main())