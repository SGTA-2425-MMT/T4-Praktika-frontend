import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Simular usuarios almacenados
  private users: {username: string, email: string, password: string}[] = [];

  constructor(private router: Router) {
    // Intentar recuperar el usuario del localStorage al iniciar
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUserSubject.next(JSON.parse(storedUser));
    }
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(loginData: LoginRequest): Observable<User> {
    // Simulamos una llamada a API
    return of({
      id: '1',
      username: 'usuario_demo',
      email: loginData.email
    }).pipe(
      delay(800), // Simular latencia de red
      tap(user => {
        // Almacenar usuario en localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  register(registerData: RegisterRequest): Observable<User> {
    // Simulamos registro
    this.users.push({
      username: registerData.username,
      email: registerData.email,
      password: registerData.password
    });
    
    // Simulamos una respuesta exitosa
    return of({
      id: (this.users.length).toString(),
      username: registerData.username,
      email: registerData.email
    }).pipe(
      delay(800), // Simular latencia de red
      tap(user => {
        // Almacenar usuario en localStorage
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
      })
    );
  }

  logout(): void {
    // Eliminar usuario del localStorage
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }
}
