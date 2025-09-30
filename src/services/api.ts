// Centralized API service to handle connections with the backend
import { fetchWithErrorHandling } from '../utils/errorHandler';

// API base URL
export const API_BASE_URL = 'https://gestorproyectoapi-production.up.railway.app';

// Timeout for API requests (30 seconds)
export const DEFAULT_TIMEOUT = 30000;

// Note: Unidades de Proyecto API calls have been removed as requested
// The Proyectos section now uses data directly from public/data/ejecucion_presupuestal