import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/context/ThemeContext'
import { DashboardProvider } from '@/context/DashboardContext'

const inter = Inter({ 
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Dashboard Alcaldía de Cali',
  description: 'Sistema de Gestión de Proyectos - Alcaldía de Santiago de Cali',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <DashboardProvider>
            {children}
          </DashboardProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}