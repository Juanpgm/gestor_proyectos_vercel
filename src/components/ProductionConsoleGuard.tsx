"use client";

import { useEffect } from "react";

export default function ProductionConsoleGuard() {
  useEffect(() => {
    const isProduction = process.env.NODE_ENV === "production";
    const allowConsole = process.env.NEXT_PUBLIC_ENABLE_PROD_CONSOLE === "true";

    if (!isProduction || allowConsole) return;

    const noop = () => undefined;
    console.log = noop;
    console.info = noop;
    console.debug = noop;
    console.warn = noop;
  }, []);

  return null;
}
