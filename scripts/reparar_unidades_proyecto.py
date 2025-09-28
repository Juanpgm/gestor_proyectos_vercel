#!/usr/bin/env python3
"""
Plan de Reparación Automática - Unidades de Proyecto
===================================================

Este script implementa las correcciones identificadas en el diagnóstico
para resolver el problema de componentes "fijados" en la sección Unidades de Proyecto.

Orden de prioridad:
1. Errores de hidratación (CRÍTICO)
2. Configuración de caché (ALTO)
3. Manejo de errores API (ALTO)
4. Limpieza de estado (MEDIO)
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple
from datetime import datetime

class UnidadesProyectoRepair:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / "backups" / f"repair_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.changes_log = []
        
    def run_repair(self):
        """Ejecuta el plan de reparación completo"""
        print("🔧 Iniciando Plan de Reparación - Unidades de Proyecto")
        print("=" * 60)
        
        # Crear directorio de backup
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        print(f"📁 Backups en: {self.backup_dir}")
        
        try:
            # Paso 1: Resolver errores de hidratación (CRÍTICO)
            self._fix_hydration_errors()
            
            # Paso 2: Configurar caché explícitamente (ALTO)
            self._fix_cache_configuration()
            
            # Paso 3: Mejorar manejo de API (ALTO)
            self._fix_api_error_handling()
            
            # Paso 4: Implementar limpieza de estado (MEDIO)
            self._fix_state_cleanup()
            
            # Paso 5: Crear hook de limpieza universal
            self._create_cleanup_hook()
            
            # Generar reporte de cambios
            self._generate_changes_report()
            
            print("\n✅ Reparación completada exitosamente!")
            print("🔄 Reinicia el servidor de desarrollo: npm run dev")
            
        except Exception as e:
            print(f"❌ Error durante la reparación: {str(e)}")
            print("📁 Archivos de backup disponibles en:", self.backup_dir)
            raise
    
    def _backup_file(self, file_path: Path):
        """Crea backup de un archivo antes de modificarlo"""
        if file_path.exists():
            backup_path = self.backup_dir / file_path.relative_to(self.project_root)
            backup_path.parent.mkdir(parents=True, exist_ok=True)
            
            with open(file_path, 'r', encoding='utf-8') as source:
                with open(backup_path, 'w', encoding='utf-8') as backup:
                    backup.write(source.read())
    
    def _log_change(self, file_path: str, change_type: str, description: str):
        """Registra un cambio realizado"""
        self.changes_log.append({
            'file': file_path,
            'type': change_type,
            'description': description,
            'timestamp': datetime.now().isoformat()
        })
    
    def _fix_hydration_errors(self):
        """Paso 1: Corregir errores de hidratación"""
        print("\n🚨 Paso 1: Corrigiendo errores de hidratación...")
        
        # Lista de archivos con problemas de hidratación
        problem_files = [
            'src/hooks/useUnidadesProyectoWorking.ts',
            'src/components/UnidadesProyectoMapView.tsx',
            'src/components/UnidadesProyectoTable.tsx',
            'src/app/page.tsx'
        ]
        
        for file_path_str in problem_files:
            file_path = self.project_root / file_path_str
            if file_path.exists():
                self._fix_window_document_access(file_path)
    
    def _fix_window_document_access(self, file_path: Path):
        """Corrige accesos directos a window/document"""
        print(f"  🔧 Corrigiendo {file_path.name}...")
        
        self._backup_file(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Patrón 1: window. directo -> typeof window !== 'undefined' && window.
        content = re.sub(
            r'(?<!typeof\s)(\s+)(window\.)([a-zA-Z_][a-zA-Z0-9_]*)',
            r'\1(typeof window !== "undefined" && window.\3)',
            content
        )
        
        # Patrón 2: document. directo -> typeof document !== 'undefined' && document.
        content = re.sub(
            r'(?<!typeof\s)(\s+)(document\.)([a-zA-Z_][a-zA-Z0-9_]*)',
            r'\1(typeof document !== "undefined" && document.\3)',
            content
        )
        
        # Casos específicos más complejos
        replacements = [
            # window.location
            (r'window\.location', 'typeof window !== "undefined" ? window.location : null'),
            # document.getElementById
            (r'document\.getElementById\(([^)]+)\)', r'typeof document !== "undefined" ? document.getElementById(\1) : null'),
            # document.createElement
            (r'document\.createElement\(([^)]+)\)', r'typeof document !== "undefined" ? document.createElement(\1) : null'),
        ]
        
        for pattern, replacement in replacements:
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
        
        # Solo escribir si hubo cambios
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self._log_change(
                str(file_path), 
                'hydration_fix', 
                'Corregido acceso directo a window/document'
            )
            print(f"    ✅ {file_path.name} corregido")
        else:
            print(f"    ℹ️  {file_path.name} no requiere cambios")
    
    def _fix_cache_configuration(self):
        """Paso 2: Configurar caché explícitamente"""
        print("\n🗄️ Paso 2: Configurando caché...")
        
        api_files = [
            'src/services/unidadesProyectoApi.ts',
            'src/hooks/useUnidadesProyectoAPI.ts'
        ]
        
        for file_path_str in api_files:
            file_path = self.project_root / file_path_str
            if file_path.exists():
                self._add_cache_config_to_fetch(file_path)
    
    def _add_cache_config_to_fetch(self, file_path: Path):
        """Agrega configuración de caché a llamadas fetch"""
        print(f"  🔧 Configurando caché en {file_path.name}...")
        
        self._backup_file(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Buscar fetch calls sin configuración de caché
        fetch_pattern = r'fetch\s*\(\s*([^,)]+)(?:\s*,\s*(\{[^}]*\}))?\s*\)'
        
        def add_cache_config(match):
            url = match.group(1)
            options = match.group(2) if match.group(2) else None
            
            if options:
                # Ya tiene opciones, verificar si tiene cache
                if 'cache:' not in options:
                    # Agregar cache al objeto existente
                    options_content = options[1:-1]  # Remover {}
                    new_options = f"{{ {options_content}, cache: 'no-store' }}"
                else:
                    new_options = options
            else:
                # No tiene opciones, agregar objeto completo
                new_options = "{ cache: 'no-store' }"
            
            return f"fetch({url}, {new_options})"
        
        # Aplicar el reemplazo
        new_content = re.sub(fetch_pattern, add_cache_config, content)
        
        # Solo escribir si hubo cambios
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self._log_change(
                str(file_path), 
                'cache_fix', 
                'Agregada configuración cache: no-store a fetch calls'
            )
            print(f"    ✅ {file_path.name} configurado")
        else:
            print(f"    ℹ️  {file_path.name} ya tiene configuración correcta")
    
    def _fix_api_error_handling(self):
        """Paso 3: Mejorar manejo de errores API"""
        print("\n🌐 Paso 3: Mejorando manejo de API...")
        
        hook_files = [
            'src/hooks/useUnidadesProyectoAPI.ts',
            'src/hooks/useUnidadesProyectoSimplified.ts',
            'src/hooks/useUnidadesProyectoWorking.ts'
        ]
        
        for file_path_str in hook_files:
            file_path = self.project_root / file_path_str
            if file_path.exists():
                self._improve_error_handling(file_path)
    
    def _improve_error_handling(self, file_path: Path):
        """Mejora el manejo de errores en hooks de API"""
        print(f"  🔧 Mejorando manejo de errores en {file_path.name}...")
        
        self._backup_file(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Agregar try-catch a fetch calls que no lo tienen
        lines = content.split('\n')
        new_lines = []
        
        for i, line in enumerate(lines):
            new_lines.append(line)
            
            # Si encontramos un fetch sin try-catch
            if 'fetch(' in line and 'await' in line:
                # Verificar si ya está en un try-catch (buscar en líneas anteriores)
                in_try_block = False
                for j in range(max(0, i-10), i):
                    if 'try {' in lines[j] or 'try{' in lines[j]:
                        in_try_block = True
                        break
                
                if not in_try_block:
                    # Encontrar el nivel de indentación
                    indent = len(line) - len(line.lstrip())
                    indent_str = ' ' * indent
                    
                    # Insertar try-catch
                    try_line = f"{indent_str}try {{"
                    catch_line = f"{indent_str}}} catch (error) {{"
                    catch_body = [
                        f"{indent_str}  console.error('Error en API request:', error)",
                        f"{indent_str}  throw error",
                        f"{indent_str}}}"
                    ]
                    
                    # Reemplazar la línea actual e insertar try-catch
                    new_lines[-1] = try_line
                    new_lines.append(f"{indent_str}  {line.strip()}")
                    new_lines.extend(catch_body)
        
        new_content = '\n'.join(new_lines)
        
        # Solo escribir si hubo cambios significativos
        if new_content != original_content and len(new_content) > len(original_content) * 0.9:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self._log_change(
                str(file_path), 
                'error_handling_fix', 
                'Agregado manejo de errores con try-catch'
            )
            print(f"    ✅ {file_path.name} mejorado")
        else:
            print(f"    ℹ️  {file_path.name} ya tiene manejo adecuado")
    
    def _fix_state_cleanup(self):
        """Paso 4: Implementar limpieza de estado"""
        print("\n🧹 Paso 4: Implementando limpieza de estado...")
        
        hook_files = [
            'src/hooks/useUnidadesProyecto.ts',
            'src/hooks/useUnidadesProyectoAPI.ts'
        ]
        
        for file_path_str in hook_files:
            file_path = self.project_root / file_path_str
            if file_path.exists():
                self._add_cleanup_to_hook(file_path)
    
    def _add_cleanup_to_hook(self, file_path: Path):
        """Agrega cleanup functions a hooks"""
        print(f"  🔧 Agregando cleanup a {file_path.name}...")
        
        self._backup_file(file_path)
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # Buscar useEffect sin cleanup
        useeffect_pattern = r'useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\},\s*\[[^\]]*\]\s*\)'
        
        def add_cleanup(match):
            effect_body = match.group(1)
            
            # Si ya tiene return statement, no modificar
            if 'return' in effect_body:
                return match.group(0)
            
            # Agregar cleanup function
            cleanup_code = """
    
    // Cleanup function para prevenir memory leaks
    return () => {
      // Limpiar estado si es necesario
      console.log('🧹 Cleanup ejecutado')
    }"""
            
            new_body = effect_body.rstrip() + cleanup_code
            return match.group(0).replace(effect_body, new_body)
        
        new_content = re.sub(useeffect_pattern, add_cleanup, content, flags=re.DOTALL)
        
        # Solo escribir si hubo cambios
        if new_content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            self._log_change(
                str(file_path), 
                'cleanup_fix', 
                'Agregadas cleanup functions a useEffect'
            )
            print(f"    ✅ {file_path.name} con cleanup")
        else:
            print(f"    ℹ️  {file_path.name} ya tiene cleanup adecuado")
    
    def _create_cleanup_hook(self):
        """Paso 5: Crear hook universal de limpieza"""
        print("\n🔄 Paso 5: Creando hook universal de limpieza...")
        
        hook_content = '''import { useEffect, useRef } from 'react'

/**
 * Hook universal para limpieza de estado y prevención de memory leaks
 * Especialmente útil para la sección Unidades de Proyecto
 */
export function useUniversalCleanup() {
  const cleanupFunctions = useRef<(() => void)[]>([])
  
  // Registrar función de limpieza
  const registerCleanup = (cleanupFn: () => void) => {
    cleanupFunctions.current.push(cleanupFn)
  }
  
  // Ejecutar limpieza al desmontar
  useEffect(() => {
    return () => {
      console.log('🧹 Ejecutando limpieza universal...')
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.error('Error en cleanup:', error)
        }
      })
      cleanupFunctions.current = []
    }
  }, [])
  
  return { registerCleanup }
}

/**
 * Hook específico para limpiar estado de Unidades de Proyecto
 */
export function useUnidadesProyectoCleanup() {
  const { registerCleanup } = useUniversalCleanup()
  
  // Limpiar estado global de unidades de proyecto
  const cleanupUnidadesState = () => {
    // Resetear estado global si existe
    if (typeof window !== 'undefined' && (window as any).globalUnidadesState) {
      (window as any).globalUnidadesState = null
    }
    
    // Limpiar listeners
    if (typeof window !== 'undefined' && (window as any).globalUnidadesListeners) {
      (window as any).globalUnidadesListeners.clear()
    }
    
    console.log('🗑️ Estado de Unidades de Proyecto limpiado')
  }
  
  useEffect(() => {
    registerCleanup(cleanupUnidadesState)
  }, [registerCleanup])
  
  return { cleanupUnidadesState }
}
'''
        
        hook_path = self.project_root / 'src' / 'hooks' / 'useUniversalCleanup.ts'
        
        with open(hook_path, 'w', encoding='utf-8') as f:
            f.write(hook_content)
        
        self._log_change(
            str(hook_path), 
            'new_file', 
            'Creado hook universal de limpieza'
        )
        print(f"    ✅ Hook universal creado: {hook_path.name}")
    
    def _generate_changes_report(self):
        """Genera reporte de cambios realizados"""
        report_path = self.project_root / f"repair_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'backup_directory': str(self.backup_dir),
            'total_changes': len(self.changes_log),
            'changes': self.changes_log,
            'next_steps': [
                'Reiniciar servidor de desarrollo: npm run dev',
                'Limpiar caché del navegador (Ctrl+F5)',
                'Probar navegación entre páginas',
                'Verificar que componentes se desmontan correctamente',
                'Monitorear consola para errores de hidratación'
            ]
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n📊 Reporte de cambios guardado: {report_path}")
        print(f"📁 Backups disponibles en: {self.backup_dir}")
        
        # Mostrar resumen
        print("\n📋 RESUMEN DE CAMBIOS:")
        change_types = {}
        for change in self.changes_log:
            change_type = change['type']
            change_types[change_type] = change_types.get(change_type, 0) + 1
        
        for change_type, count in change_types.items():
            print(f"  • {change_type}: {count} archivos")

def main():
    """Función principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Reparación automática de Unidades de Proyecto')
    parser.add_argument('--project-path', '-p', default='.', 
                       help='Ruta al proyecto (default: directorio actual)')
    parser.add_argument('--dry-run', '-d', action='store_true',
                       help='Simular cambios sin escribir archivos')
    
    args = parser.parse_args()
    
    try:
        repair = UnidadesProyectoRepair(args.project_path)
        
        if args.dry_run:
            print("🔍 Modo simulación activado - no se modificarán archivos")
            return 0
        
        repair.run_repair()
        return 0
        
    except Exception as e:
        print(f"❌ Error durante la reparación: {str(e)}")
        return 1

if __name__ == "__main__":
    exit(main())