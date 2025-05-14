import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface GameNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  icon?: string;
  timestamp: Date;
  duration?: number; // Duración en ms, si es undefined la notificación permanece hasta ser descartada
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<GameNotification[]>([]);
  private readonly DEFAULT_DURATION = 5000; // 5 segundos por defecto

  constructor() {}

  // Obtener todas las notificaciones activas
  get notifications$(): Observable<GameNotification[]> {
    return this.notificationsSubject.asObservable();
  }

  // Obtener notificaciones actuales
  get currentNotifications(): GameNotification[] {
    return this.notificationsSubject.value;
  }

  // Añadir una nueva notificación
  addNotification(notification: Partial<GameNotification>): string {
    const id = `notification_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    const newNotification: GameNotification = {
      id,
      title: notification.title || '',
      message: notification.message || '',
      type: notification.type || 'info',
      icon: notification.icon,
      timestamp: new Date(),
      duration: notification.duration || this.DEFAULT_DURATION,
      details: notification.details
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Si tiene duración definida, programar su eliminación automática
    if (newNotification.duration) {
      setTimeout(() => {
        this.removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }

  // Eliminar una notificación por su ID
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next(
      currentNotifications.filter(notification => notification.id !== id)
    );
  }

  // Limpiar todas las notificaciones
  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  // Métodos de conveniencia para crear diferentes tipos de notificaciones
  
  success(title: string, message: string, options: Partial<GameNotification> = {}): string {
    return this.addNotification({
      title,
      message,
      type: 'success',
      icon: '✅',
      ...options
    });
  }

  info(title: string, message: string, options: Partial<GameNotification> = {}): string {
    return this.addNotification({
      title,
      message,
      type: 'info',
      icon: 'ℹ️',
      ...options
    });
  }

  warning(title: string, message: string, options: Partial<GameNotification> = {}): string {
    return this.addNotification({
      title,
      message,
      type: 'warning',
      icon: '⚠️',
      ...options
    });
  }

  error(title: string, message: string, options: Partial<GameNotification> = {}): string {
    return this.addNotification({
      title,
      message,
      type: 'error',
      icon: '❌',
      ...options
    });
  }

  // Método específico para notificaciones de investigación completada
  researchComplete(techName: string, unlockedBuildings?: string[], unlockedUnits?: string[]): string {
    let message = `Has completado la investigación de ${techName}.`;
    
    console.log(`[NotificationService] Creando notificación de investigación completada: ${techName}`);
    console.log(`[NotificationService] Edificios desbloqueados:`, unlockedBuildings);
    console.log(`[NotificationService] Unidades desbloqueadas:`, unlockedUnits);
    
    if (unlockedBuildings && unlockedBuildings.length > 0) {
      message += `\nEdificios desbloqueados: ${unlockedBuildings.join(', ')}`;
    }
    
    if (unlockedUnits && unlockedUnits.length > 0) {
      message += `\nUnidades desbloqueadas: ${unlockedUnits.join(', ')}`;
    }
    
    const notificationId = this.success('¡Investigación Completada!', message, {
      icon: '🔬',
      duration: 8000, // Mostrar por más tiempo (8 segundos) para que el jugador tenga tiempo de leer
      details: {
        type: 'research',
        technology: techName,
        unlockedBuildings,
        unlockedUnits
      }
    });
    
    console.log(`[NotificationService] Notificación creada con ID: ${notificationId}`);
    return notificationId;
  }
}
