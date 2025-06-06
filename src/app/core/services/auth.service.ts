import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, BehaviorSubject } from 'rxjs';

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RegisterResponse {
  id: string;
  message: string;
}

export interface UserProfile {
  _id: string;
  username: string;
  email: string;
  created_at: string;
  last_login: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = '/api/auth';
  private readonly currentUserSubject = new BehaviorSubject<UserProfile | null>(null);

  // Observable para que los componentes puedan suscribirse a cambios en el usuario actual
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private readonly router: Router, private readonly http: HttpClient) {
    // Intenta cargar el perfil del usuario si hay un token almacenado
    if (this.getToken()) {
      this.loadUserProfile().catch(err => {
        console.error('Error loading user profile:', err);
        this.logout();
      });
    }
  }

  /**
   * Registra un nuevo usuario
   * @returns Promise resuelto cuando el registro es exitoso
   */
  async register(username: string, email: string, password: string): Promise<RegisterResponse> {
    try {
      // Podemos enviar los datos como parámetros de consulta o como un JSON
      const response = await firstValueFrom(
        this.http.post<RegisterResponse>(`${this.apiUrl}/register`, {
          username,
          email,
          password
        })
      );
      return response;
    } catch (err: any) {
      throw err;
    }
  }

  /**
   * Inicia sesión con username y password
   * @returns Promise resuelto con true cuando el login es exitoso
   */
  async login(username: string, password: string): Promise<boolean> {
    try {
      // El endpoint espera un formulario URL-encoded, no un FormData
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await firstValueFrom(
        this.http.post<LoginResponse>(`${this.apiUrl}/token`, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );

      // Guardar el token
      localStorage.setItem('access_token', response.access_token);

      // Cargar el perfil del usuario
      await this.loadUserProfile();

      return true;
    } catch (err: any) {
      localStorage.removeItem('access_token');
      throw err;
    }
  }

  /**
   * Cierra la sesión del usuario
   */
  logout(): void {
    localStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  /**
   * Comprueba si el usuario está autenticado
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * Obtiene el token de acceso almacenado
   */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /**
   * Carga el perfil del usuario actual
   */
  async loadUserProfile(): Promise<UserProfile> {
    const response = await firstValueFrom(
      this.http.get<UserProfile>(`${this.apiUrl}/me`)
    );
    this.currentUserSubject.next(response);
    return response;
  }

  /**
   * Obtiene el perfil del usuario actual
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(userData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await firstValueFrom(
      this.http.put<UserProfile>(`${this.apiUrl}/me`, userData)
    );
    this.currentUserSubject.next(response);
    return response;
  }
}
