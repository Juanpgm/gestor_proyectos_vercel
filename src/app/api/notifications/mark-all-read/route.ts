/**
 * API Route para Marcar Todas las Notificaciones como Leídas
 */

import { NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

/**
 * POST /api/notifications/mark-all-read
 * Marcar todas las notificaciones como leídas
 */
export async function POST() {
  try {
    notificationService.markAllAsRead();
    
    return NextResponse.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
    return NextResponse.json(
      { success: false, error: 'Error al marcar notificaciones' },
      { status: 500 }
    );
  }
}
