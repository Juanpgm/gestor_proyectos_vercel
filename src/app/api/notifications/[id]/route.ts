/**
 * API Routes para Notificaciones Individuales
 * Endpoints para gestionar notificaciones específicas por ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

/**
 * GET /api/notifications/[id]
 * Obtener una notificación específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = notificationService.getById(params.id);
    
    if (!notification) {
      return NextResponse.json(
        { success: false, error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error fetching notification:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificación' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications/[id]
 * Actualizar una notificación (marcar como leída)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    if (body.read === true) {
      notificationService.markAsRead(params.id);
    }
    
    const notification = notificationService.getById(params.id);
    
    return NextResponse.json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar notificación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Eliminar una notificación específica
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    notificationService.delete(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}
