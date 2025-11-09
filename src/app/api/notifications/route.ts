/**
 * API Routes para Notificaciones
 * Endpoints para gestionar notificaciones desde el cliente
 */

import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/services/notificationService';

/**
 * GET /api/notifications
 * Obtener todas las notificaciones con filtros opcionales
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filter: any = {};
    
    // Filtro por estado de lectura
    const read = searchParams.get('read');
    if (read !== null) {
      filter.read = read === 'true';
    }
    
    // Filtro por tipo
    const types = searchParams.get('types');
    if (types) {
      filter.type = types.split(',');
    }
    
    // Filtro por categoría
    const categories = searchParams.get('categories');
    if (categories) {
      filter.category = categories.split(',');
    }
    
    // Filtro por prioridad
    const priorities = searchParams.get('priorities');
    if (priorities) {
      filter.priority = priorities.split(',');
    }
    
    const notifications = notificationService.getAll(filter);
    
    return NextResponse.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Crear una nueva notificación
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const notification = notificationService.create(body);
    
    return NextResponse.json({
      success: true,
      data: notification
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Error al crear notificación' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications
 * Eliminar notificaciones
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'all') {
      notificationService.deleteAll();
    } else if (action === 'read') {
      notificationService.deleteAllRead();
    } else {
      return NextResponse.json(
        { success: false, error: 'Acción no válida' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notificaciones eliminadas correctamente'
    });
  } catch (error) {
    console.error('Error deleting notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Error al eliminar notificaciones' },
      { status: 500 }
    );
  }
}
