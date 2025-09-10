/**
 * Función utilitaria para abrir URLs de manera segura
 * Valida que la URL tenga un protocolo correcto antes de abrirla
 */
export const openUrlSafely = (url: string, errorMessage?: string) => {
  try {
    console.log('Navegando a:', url);
    const cleanUrl = url.trim();
    
    if (!cleanUrl) {
      console.error('URL vacía');
      alert('URL no disponible');
      return false;
    }
    
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      window.open(cleanUrl, '_blank', 'noopener,noreferrer');
      return true;
    } else {
      console.error('URL inválida:', cleanUrl);
      alert(errorMessage || `URL inválida: ${cleanUrl}`);
      return false;
    }
  } catch (error) {
    console.error('Error al abrir URL:', error);
    alert(errorMessage || 'Error al abrir la URL');
    return false;
  }
}

/**
 * Función específica para abrir links de SECOP
 */
export const openSecopLink = (url: string) => {
  return openUrlSafely(url, 'Error al abrir la URL del proceso en SECOP');
}

/**
 * Valida si una URL es válida
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  const cleanUrl = url.trim();
  return cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://');
}
