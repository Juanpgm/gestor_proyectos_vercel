'use client';
import { Component, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: import('react').ErrorInfo) {
    console.error('ErrorBoundary caught:', error.message, info.componentStack?.slice(0, 200));
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="text-gray-400 text-4xl mb-4">!</div>
          <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Error al cargar este modulo
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {this.state.error?.message ?? 'Error inesperado. Recarga la pagina.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
