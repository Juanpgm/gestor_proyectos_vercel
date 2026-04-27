/**
 * Design System Showcase — CaliTrack
 *
 * Página de inspección visual de todos los átomos y moléculas del Design System.
 * Acceso: http://localhost:3000/test-design-system
 *
 * NO importar en producción — solo uso dev/QA.
 */

import {
  FolderKanban,
  Activity,
  Package,
  FileText,
  Building2,
  Search,
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Briefcase,
  X,
  Layers,
} from "lucide-react";

import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/atoms/Card";
import { MobileKPICard } from "@/components/atoms/MobileKPICard";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { StatCard } from "@/components/molecules/StatCard";
import { SearchBar } from "@/components/molecules/SearchBar";
import { MapToolbar } from "@/components/molecules/MapToolbar";

// ─────────────────────────────────────────────
// Sección helper
// ─────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-12">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

// ─────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────

export default function DesignSystemShowcase() {
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center">
              <span className="text-white text-xs font-bold tracking-tight">
                CT
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Design System</h1>
            <Badge color="blue" size="sm">
              v1.0 GovTech
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Átomos y moléculas — CaliTrack · Govtech · Analítica de datos
          </p>
        </div>

        {/* ── ATOMS ── */}

        {/* Button variants */}
        <Section title="Button — variantes">
          <Row>
            <Button variant="primary">Guardar</Button>
            <Button variant="secondary">Cancelar</Button>
            <Button variant="outline">Exportar</Button>
            <Button variant="ghost">Ver más</Button>
            <Button variant="danger">Eliminar</Button>
          </Row>
        </Section>

        <Section title="Button — tamaños">
          <Row>
            <Button size="sm">Pequeño</Button>
            <Button size="md">Mediano</Button>
            <Button size="lg">Grande</Button>
          </Row>
        </Section>

        <Section title="Button — estados">
          <Row>
            <Button loading>Procesando...</Button>
            <Button disabled>Deshabilitado</Button>
            <Button variant="primary" fullWidth>
              Ancho completo
            </Button>
          </Row>
        </Section>

        {/* Badge */}
        <Section title="Badge — colores">
          <Row>
            <Badge>Default</Badge>
            <Badge color="blue" dot>
              Activo
            </Badge>
            <Badge color="green" dot>
              Completado
            </Badge>
            <Badge color="red" dot>
              Vencido
            </Badge>
            <Badge color="orange">Alerta</Badge>
            <Badge color="violet">Proceso</Badge>
            <Badge color="teal">Empréstito</Badge>
            <Badge color="amber">Pendiente</Badge>
            <Badge color="gray">Inactivo</Badge>
          </Row>
        </Section>

        <Section title="Badge — tamaños">
          <Row>
            <Badge color="blue" size="sm">
              Pequeño
            </Badge>
            <Badge color="blue" size="md">
              Mediano
            </Badge>
            <Badge color="blue" dot size="sm">
              Con punto SM
            </Badge>
            <Badge color="blue" dot size="md">
              Con punto MD
            </Badge>
          </Row>
        </Section>

        {/* Spinner */}
        <Section title="Spinner — tamaños y colores">
          <Row>
            <Spinner size="sm" label="sm" />
            <Spinner size="md" label="md" />
            <Spinner size="lg" label="lg" />
            <Spinner size="xl" label="xl" />
            <div className="flex items-center gap-1 bg-gray-900 px-3 py-2 rounded-lg">
              <Spinner size="md" color="white" label="Cargando..." />
              <span className="text-white text-xs ml-2">white</span>
            </div>
            <Spinner size="md" color="gray" label="gray" />
          </Row>
        </Section>

        {/* Input */}
        <Section title="Input — variantes">
          <div className="grid gap-4 max-w-md">
            <Input
              label="Nombre del proyecto"
              placeholder="Ej: Mejoramiento vial carrera 1"
            />
            <Input
              label="Buscar"
              placeholder="Búsqueda..."
              leadingIcon={<Search size={14} />}
            />
            <Input
              label="Email"
              error="El formato del email es inválido"
              placeholder="usuario@cali.gov.co"
            />
            <Input
              label="Descripción"
              helper="Máximo 256 caracteres"
              placeholder="Descripción breve..."
            />
            <Input
              label="Campo deshabilitado"
              disabled
              defaultValue="No editable"
            />
          </div>
        </Section>

        <Section title="Select — filtros estandarizados">
          <div className="grid gap-4 max-w-md">
            <Select
              label="Estado"
              options={[
                { value: "all", label: "Todos" },
                { value: "active", label: "Activos" },
                { value: "paused", label: "Suspendidos" },
              ]}
            />
            <Select
              label="Comuna"
              size="sm"
              options={[
                { value: "all", label: "Todas" },
                { value: "1", label: "Comuna 1" },
                { value: "2", label: "Comuna 2" },
              ]}
            />
          </div>
        </Section>

        {/* Card */}
        <Section title="Card — composición">
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
            <Card>
              <Card.Header>Título de la tarjeta</Card.Header>
              <Card.Body>
                Contenido principal de la tarjeta con texto de ejemplo para
                probar la composición.
              </Card.Body>
              <Card.Footer>
                <Button size="sm" variant="outline">
                  Acción
                </Button>
              </Card.Footer>
            </Card>

            <Card hover shadow="md">
              <Card.Header>Tarjeta interactiva</Card.Header>
              <Card.Body>
                Con hover y shadow-md. Haz hover para ver la elevación.
              </Card.Body>
            </Card>

            <Card border={false} shadow="none" padding="sm">
              <Card.Body>
                Sin borde ni sombra (border=false, shadow=none)
              </Card.Body>
            </Card>

            <Card padding="lg">
              <Card.Body>Padding grande (lg = 1.5rem)</Card.Body>
            </Card>
          </div>
        </Section>

        {/* ── MOLECULES ── */}

        {/* StatCard */}
        <Section title="StatCard — moléculas de estadísticas">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Proyectos activos"
              value={128}
              icon={<FolderKanban size={18} strokeWidth={1.5} />}
              color="blue"
              trend={5}
              trendLabel="este mes"
            />
            <StatCard
              label="Actividades"
              value={3420}
              icon={<Activity size={18} strokeWidth={1.5} />}
              color="red"
              trend={-12}
              trendLabel="vs. mes anterior"
            />
            <StatCard
              label="Contratos"
              value={47}
              icon={<FileText size={18} strokeWidth={1.5} />}
              color="violet"
            />
            <StatCard label="Cargando..." value={0} loading color="gray" />
          </div>
        </Section>

        {/* SearchBar */}
        <Section title="SearchBar — barra de búsqueda">
          <div className="grid gap-4 max-w-md">
            <SearchBar placeholder="Buscar proyectos..." size="sm" />
            <SearchBar placeholder="Buscar contratos..." size="md" />
            <SearchBar placeholder="Búsqueda ampliada..." size="lg" />
            <SearchBar disabled placeholder="Deshabilitada" />
          </div>
        </Section>

        <Section title="IconButton + MapToolbar">
          <div className="grid gap-4">
            <Row>
              <IconButton
                icon={<Search size={14} strokeWidth={1.5} />}
                label="Buscar"
              />
              <IconButton
                icon={<Info size={14} strokeWidth={1.5} />}
                label="Detalles"
                variant="ghost"
              />
              <IconButton
                icon={<AlertCircle size={14} strokeWidth={1.5} />}
                label="Alertas"
                variant="primary"
              />
              <IconButton
                icon={<X size={14} strokeWidth={1.5} />}
                label="Cerrar"
                variant="danger"
              />
            </Row>

            <MapToolbar
              title="Mapa Territorial"
              subtitle="Controles estandarizados"
              actions={
                <>
                  <IconButton
                    icon={<Layers size={14} strokeWidth={1.5} />}
                    label="Capas"
                  />
                  <IconButton
                    icon={<Search size={14} strokeWidth={1.5} />}
                    label="Buscar"
                  />
                </>
              }
            />
          </div>
        </Section>

        {/* MobileKPICard */}
        <Section title="MobileKPICard — KPIs para Mobile LITE">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-sm">
            <MobileKPICard
              label="Proyectos"
              value={128}
              icon={<FolderKanban size={18} strokeWidth={1.5} />}
              color="blue"
              href="/m/proyectos"
            />
            <MobileKPICard
              label="Actividades"
              value={3420}
              icon={<Activity size={18} strokeWidth={1.5} />}
              color="red"
              href="/m/actividades"
            />
            <MobileKPICard
              label="Productos"
              value={291}
              icon={<Package size={18} strokeWidth={1.5} />}
              color="orange"
            />
            <MobileKPICard
              label="Contratos"
              value={47}
              icon={<FileText size={18} strokeWidth={1.5} />}
              color="violet"
            />
            <MobileKPICard
              label="Unidades"
              value={null}
              icon={<Building2 size={18} strokeWidth={1.5} />}
              color="green"
            />
            <MobileKPICard
              label="Empréstito"
              value={12}
              icon={<BarChart3 size={18} strokeWidth={1.5} />}
              color="teal"
            />
          </div>
        </Section>

        {/* Tokens palette */}
        <Section title="Paleta de colores — dominios">
          <div className="flex flex-wrap gap-2">
            {[
              { name: "Proyectos", bg: "bg-blue-600" },
              { name: "Actividades", bg: "bg-red-600" },
              { name: "Productos", bg: "bg-orange-600" },
              { name: "Contratos", bg: "bg-violet-600" },
              { name: "Unidades", bg: "bg-emerald-600" },
              { name: "Empréstito", bg: "bg-teal-600" },
              { name: "Procesos", bg: "bg-rose-600" },
              { name: "Navy (nav)", bg: "bg-[#1e3a5f]" },
            ].map(({ name, bg }) => (
              <div
                key={name}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white"
              >
                <span className={`w-3 h-3 rounded-sm ${bg}`} />
                <span className="text-xs text-gray-600">{name}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400">
            CaliTrack Design System · GovTech · Solo uso interno dev/QA
          </p>
        </div>
      </div>
    </main>
  );
}
