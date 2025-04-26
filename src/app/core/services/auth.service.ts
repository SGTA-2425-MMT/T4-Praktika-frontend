import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Simulación muy simple sin backend
  private isAuthenticated = false;
  
  constructor(private router: Router) {}
  
  // Siempre devuelve true, no hay validación real
  login(username: string, password: string): boolean {
    this.isAuthenticated = true;
    return true;
  }
  
  // Método de logout simplificado
  logout(): void {
    this.isAuthenticated = false;
    this.router.navigate(['/auth/login']);
  }
  
  // Siempre consideramos autenticado al usuario
  isLoggedIn(): boolean {
    return true;
  }
}
