/**
 * API Route para Estadísticas de Notificaciones
 */

import { NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

/**
 * GET /api/notifications/stats
 * Obtener estadísticas de notificaciones
 */
export async function GET() {
  try {
    const stats = notificationService.getStats();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
