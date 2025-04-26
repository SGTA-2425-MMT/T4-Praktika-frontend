import { type CanActivateFn } from '@angular/router';

// Guard simplificado que siempre permite acceso
export const authGuard: CanActivateFn = () => {
  return true; // Siempre permite acceso sin validación
};
