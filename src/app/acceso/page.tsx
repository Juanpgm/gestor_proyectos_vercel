"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";

/**
 * Discreet staff sign-in route. During maintenance this is the only entry to
 * the login form; only super_admin passes the server-side gate. Authenticated
 * users are redirected to the app root.
 */
export default function AccesoPage() {
  const { state } = useAuth();
  const router = useRouter();
  const authenticated =
    state.isAuthenticated && state.user?.session_valid === true;

  useEffect(() => {
    if (authenticated) {
      router.replace("/");
    }
  }, [authenticated, router]);

  return <LoginPage />;
}
