//
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * Register a new user by sending a POST request to /api/auth/register with username, email, and password as URL parameters.
   * Returns true if registration is successful, otherwise throws an error.
   */
  async register(username: string, email: string, password: string): Promise<boolean> {
    try {
      // Build URL with query parameters
      const params = new URLSearchParams({ username, email, password });
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/register?${params.toString()}`, {})
      );
      return true;
    } catch (err: any) {
      throw err;
    }
  }
  private isAuthenticated = false;
  private token: string | null = null;
  private readonly apiUrl = '/api/auth';

  constructor(private readonly router: Router, private readonly http: HttpClient) {}

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/login`, { username, password })
      );
      this.isAuthenticated = true;
      this.token = res.access_token;
      // Guardar ambos tokens
      if (this.token) {
        localStorage.setItem('access_token', this.token);
      }
      if (res.refresh_token) {
        localStorage.setItem('refresh_token', res.refresh_token);
      }
      return true;
    } catch (err: any) {
      this.isAuthenticated = false;
      this.token = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      throw err;
    }
  }

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    const accessToken = localStorage.getItem('access_token');
    try {
      if (refreshToken && accessToken) {
        await firstValueFrom(
          this.http.post(
            `${this.apiUrl}/logout`,
            { refresh_token: refreshToken },
            { headers: { Authorization: `Bearer ${accessToken}` } }
          )
        );
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      this.isAuthenticated = false;
      this.token = null;
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      this.router.navigate(['/auth/login']);
    }
  }

  isLoggedIn(): boolean {
    return !!this.token || !!localStorage.getItem('access_token');
  }
}
