import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "__session";
// Firebase idTokens last 1 hour; set same lifetime so they expire together.
const MAX_AGE_SECONDS = 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const idToken = body?.idToken;

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "idToken required" }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE_SECONDS,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
