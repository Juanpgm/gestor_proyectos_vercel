/**
 * Unit tests: Design System Atoms
 *
 * Verifica renderizado, variantes, accesibilidad y props de cada átomo.
 * Stack: Vitest + @testing-library/react + jsdom
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

import { Button } from "@/components/atoms/Button";
import { Badge } from "@/components/atoms/Badge";
import { Spinner } from "@/components/atoms/Spinner";
import { Input } from "@/components/atoms/Input";
import { Card } from "@/components/atoms/Card";
import { MobileKPICard } from "@/components/atoms/MobileKPICard";
import { cn } from "@/lib/cn";

// ─────────────────────────────────────────────
// cn() utility
// ─────────────────────────────────────────────

describe("cn()", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("deduplicates Tailwind conflicting classes (twMerge)", () => {
    // px-2 y px-4 — twMerge debe mantener solo el último
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles conditional classes (clsx)", () => {
    expect(cn("base", false && "skipped", "included")).toBe("base included");
  });

  it("handles undefined and null gracefully", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles object syntax", () => {
    expect(cn({ active: true, disabled: false })).toBe("active");
  });
});

// ─────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Guardar</Button>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("applies primary variant classes by default", () => {
    render(<Button>Click</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-blue-700");
  });

  it("applies danger variant", () => {
    render(<Button variant="danger">Eliminar</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-red-600");
  });

  it("applies ghost variant", () => {
    render(<Button variant="ghost">Cancel</Button>);
    const btn = screen.getByRole("button");
    expect(btn.className).toContain("bg-transparent");
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>No click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows aria-busy when loading", () => {
    render(<Button loading>Loading...</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
  });

  it("applies fullWidth class", () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole("button").className).toContain("w-full");
  });

  it("fires onClick", () => {
    let clicked = false;
    render(
      <Button
        onClick={() => {
          clicked = true;
        }}
      >
        Click me
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(clicked).toBe(true);
  });

  it("renders sm size classes", () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole("button").className).toContain("h-8");
  });

  it("renders lg size classes", () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole("button").className).toContain("h-11");
  });
});

// ─────────────────────────────────────────────
// Badge
// ─────────────────────────────────────────────

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Activo</Badge>);
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("renders blue color variant", () => {
    render(<Badge color="blue">Info</Badge>);
    const el = screen.getByText("Info");
    expect(el.className).toContain("blue");
  });

  it("renders red color variant", () => {
    render(<Badge color="red">Error</Badge>);
    expect(screen.getByText("Error").className).toContain("red");
  });

  it("renders green color variant", () => {
    render(<Badge color="green">OK</Badge>);
    expect(screen.getByText("OK").className).toContain("emerald");
  });

  it("renders dot indicator when dot=true", () => {
    const { container } = render(
      <Badge color="blue" dot>
        Estado
      </Badge>,
    );
    // El dot es un span con aria-hidden
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });

  it("does not render dot when dot=false (default)", () => {
    const { container } = render(<Badge>Sin dot</Badge>);
    expect(
      container.querySelector('[aria-hidden="true"]'),
    ).not.toBeInTheDocument();
  });

  it("renders sm size", () => {
    render(<Badge size="sm">Pequeño</Badge>);
    expect(screen.getByText("Pequeño").className).toContain("text-[10px]");
  });
});

// ─────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────

describe("Spinner", () => {
  it('renders with role="status"', () => {
    render(<Spinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it('has default aria-label "Cargando…"', () => {
    render(<Spinner />);
    expect(screen.getByLabelText("Cargando…")).toBeInTheDocument();
  });

  it("uses custom aria-label", () => {
    render(<Spinner label="Procesando datos..." />);
    expect(screen.getByLabelText("Procesando datos...")).toBeInTheDocument();
  });

  it("applies animate-spin class", () => {
    render(<Spinner />);
    expect(screen.getByRole("status").className).toContain("animate-spin");
  });

  it("applies xl size classes", () => {
    render(<Spinner size="xl" />);
    expect(screen.getByRole("status").className).toContain("w-10");
  });

  it("applies white color", () => {
    render(<Spinner color="white" />);
    expect(screen.getByRole("status").className).toContain("border-white");
  });
});

// ─────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────

describe("Input", () => {
  it("renders a text input", () => {
    render(<Input placeholder="Escribe aquí" />);
    expect(screen.getByPlaceholderText("Escribe aquí")).toBeInTheDocument();
  });

  it("renders label and associates it with input via id", () => {
    render(<Input label="Nombre de proyecto" />);
    expect(screen.getByLabelText("Nombre de proyecto")).toBeInTheDocument();
  });

  it('renders error message with role="alert"', () => {
    render(<Input label="Email" error="Formato inválido" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Formato inválido");
  });

  it("sets aria-invalid when error is present", () => {
    render(<Input label="Campo" error="Requerido" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("renders helper text when no error", () => {
    render(<Input helper="Mín. 8 caracteres" />);
    expect(screen.getByText("Mín. 8 caracteres")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Input disabled />);
    expect(screen.getByRole("textbox")).toBeDisabled();
  });

  it("fires onChange events", () => {
    let value = "";
    render(
      <Input
        onChange={(e) => {
          value = e.target.value;
        }}
      />,
    );
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "CaliTrack" },
    });
    expect(value).toBe("CaliTrack");
  });
});

// ─────────────────────────────────────────────
// Card
// ─────────────────────────────────────────────

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Contenido de la tarjeta</Card>);
    expect(screen.getByText("Contenido de la tarjeta")).toBeInTheDocument();
  });

  it("renders with border by default", () => {
    const { container } = render(<Card>X</Card>);
    expect(container.firstChild?.className).toContain("border");
  });

  it("renders without border when border=false", () => {
    const { container } = render(<Card border={false}>X</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).not.toContain("border border-gray");
  });

  it("renders Card.Header sub-component", () => {
    render(
      <Card>
        <Card.Header>Título</Card.Header>
        <Card.Body>Cuerpo</Card.Body>
      </Card>,
    );
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByText("Cuerpo")).toBeInTheDocument();
  });

  it("renders Card.Footer sub-component", () => {
    render(
      <Card>
        <Card.Footer>Acción</Card.Footer>
      </Card>,
    );
    expect(screen.getByText("Acción")).toBeInTheDocument();
  });

  it("applies hover class when hover=true", () => {
    const { container } = render(<Card hover>X</Card>);
    expect(container.firstChild?.className).toContain("hover:shadow-sm");
  });
});

// ─────────────────────────────────────────────
// MobileKPICard
// ─────────────────────────────────────────────

describe("MobileKPICard", () => {
  const icon = React.createElement("span", { "data-testid": "kpi-icon" }, "▣");

  it("renders label", () => {
    render(
      <MobileKPICard label="Proyectos" value={42} icon={icon} color="blue" />,
    );
    expect(screen.getByText("Proyectos")).toBeInTheDocument();
  });

  it("renders numeric value formatted", () => {
    render(
      <MobileKPICard
        label="Contratos"
        value={1234}
        icon={icon}
        color="violet"
      />,
    );
    // es-CO locale: 1.234
    expect(screen.getByText(/1.234|1,234/)).toBeInTheDocument();
  });

  it("renders loading skeleton when value is null", () => {
    const { container } = render(
      <MobileKPICard
        label="Actividades"
        value={null}
        icon={icon}
        color="red"
      />,
    );
    // El skeleton es un span con animate-pulse
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("renders as a link when href is provided", () => {
    render(
      <MobileKPICard
        label="Proyectos"
        value={10}
        icon={icon}
        color="blue"
        href="/m/proyectos"
      />,
    );
    const link = screen.getByRole("link", { name: /Proyectos/i });
    expect(link).toHaveAttribute("href", "/m/proyectos");
  });

  it("renders as a div when no href", () => {
    const { container } = render(
      <MobileKPICard label="Sin link" value={5} icon={icon} color="green" />,
    );
    expect(container.querySelector("a")).not.toBeInTheDocument();
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("renders the icon", () => {
    render(<MobileKPICard label="Test" value={1} icon={icon} color="teal" />);
    expect(screen.getByTestId("kpi-icon")).toBeInTheDocument();
  });
});
