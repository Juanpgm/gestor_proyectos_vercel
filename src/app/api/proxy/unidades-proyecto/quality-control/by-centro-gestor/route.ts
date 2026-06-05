import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${API_BASE_URL}/unidades-proyecto/quality-control/by-centro-gestor${queryString ? `?${queryString}` : ""}`;

    console.log("🔵 Proxy QC By Centro Gestor:", url);

    const incomingAuth = request.headers.get("authorization");
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(incomingAuth ? { Authorization: incomingAuth } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("❌ Error en API:", response.status, response.statusText);
      return NextResponse.json(
        { error: `Error ${response.status}: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("✅ QC By Centro Gestor response OK");

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("❌ Error en proxy QC By Centro Gestor:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
