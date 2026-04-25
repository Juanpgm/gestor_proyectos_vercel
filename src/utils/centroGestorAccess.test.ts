import { beforeEach, describe, expect, it } from 'vitest'
import { getCentroGestorAccessFromSession } from './centroGestorAccess'

const OPEN_CENTROS = [
  'Calitrack',
  'Otro',
  'Secretaría de Gobierno',
  'Departamento Administrativo de Gestión Jurídica Pública',
  'Departamento Administrativo de Control Interno',
  'Departamento Administrativo de Control Disciplinario Interno de Instrucción',
  'Departamento Administrativo de Hacienda',
  'Departamento Administrativo de Planeación',
  'Departamento Administrativo de Gestión del Medio Ambiente',
  'Departamento Administrativo de Tecnologías de la Información y las Comunicaciones',
  'Departamento Administrativo de Contratación Pública',
  'Departamento Administrativo de Desarrollo e Innovación Institucional'
]

describe('centroGestorAccess', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it.each(OPEN_CENTROS)('permite ver todo cuando el centro gestor es %s', (centro) => {
    localStorage.setItem(
      'auth_session',
      JSON.stringify({
        user: {
          nombre_centro_gestor: centro
        }
      })
    )

    const access = getCentroGestorAccessFromSession()

    expect(access.userCentroGestor).toBe(centro)
    expect(access.canViewAll).toBe(true)
    expect(access.isRestricted).toBe(false)
  })

  it('restringe cuando el centro gestor no está en la lista abierta', () => {
    localStorage.setItem(
      'auth_session',
      JSON.stringify({
        user: {
          nombre_centro_gestor: 'Secretaría de Infraestructura'
        }
      })
    )

    const access = getCentroGestorAccessFromSession()

    expect(access.canViewAll).toBe(false)
    expect(access.isRestricted).toBe(true)
  })

  it.each(['super_admin', 'admin_general'])(
    'permite ver todo para rol privilegiado %s aunque el centro gestor sea restringido',
    (role) => {
      localStorage.setItem(
        'auth_session',
        JSON.stringify({
          user: {
            nombre_centro_gestor: 'Secretaría de Infraestructura',
            roles: [role]
          }
        })
      )

      const access = getCentroGestorAccessFromSession()

      expect(access.userCentroGestor).toBe('Secretaría de Infraestructura')
      expect(access.canViewAll).toBe(true)
      expect(access.isRestricted).toBe(false)
    }
  )
})
