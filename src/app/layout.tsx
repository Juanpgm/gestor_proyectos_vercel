import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@/styles/ipad-10-optimizations.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { DashboardProvider } from "@/context/DashboardContext";
import { AuthProvider } from "@/context/AuthContext";
import AuthWrapper from "@/components/AuthWrapper";
import NotificationInitializer from "@/components/NotificationInitializer";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProductionConsoleGuard from "@/components/ProductionConsoleGuard";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CaliTrack",
  description: "Sistema de Gestión de Proyectos - Alcaldía de Santiago de Cali",
  generator: "Next.js",
  applicationName: "CaliTrack",
  referrer: "origin-when-cross-origin",
  keywords: ["gestión", "proyectos", "alcaldía", "cali", "dashboard"],
  authors: [{ name: "Alcaldía de Santiago de Cali" }],
  creator: "Alcaldía de Santiago de Cali",
  publisher: "Alcaldía de Santiago de Cali",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.className}>
      <body className="min-h-screen bg-gray-50 antialiased overflow-x-hidden">
        <AuthProvider>
          <ThemeProvider>
            <DashboardProvider>
              <ErrorBoundary>
                <ProductionConsoleGuard />
                <NotificationInitializer />
                <AuthWrapper>{children}</AuthWrapper>
              </ErrorBoundary>
            </DashboardProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
