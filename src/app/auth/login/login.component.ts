import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h1>Civilization UPV EHU</h1>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input type="text" id="username" formControlName="username" placeholder="Introduce tu usuario">
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" formControlName="password" placeholder="Introduce tu contraseña">
          </div>
          <div class="form-actions">
            <button type="submit">Entrar</button>
            <button type="button" (click)="skipLogin()">Jugar sin iniciar sesión</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: url('/assets/images/background.jpg') no-repeat center center;
      background-size: cover;
    }
    .login-card {
      background-color: rgba(0, 0, 0, 0.8);
      padding: 2rem;
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
      color: white;
    }
    h1 {
      text-align: center;
      color: #f1c40f;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #bdc3c7;
    }
    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #34495e;
      border-radius: 4px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
    }
    .form-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    button {
      width: 100%;
      padding: 0.75rem;
      background-color: #f1c40f;
      border: none;
      border-radius: 4px;
      color: black;
      font-weight: bold;
      cursor: pointer;
    }
    button:disabled {
      background-color: #7f8c8d;
      cursor: not-allowed;
    }
    button[type="button"] {
      background-color: #3498db;
      color: white;
    }
    .error-message {
      color: #e74c3c;
      margin-bottom: 1rem;
    }
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['jugador', [Validators.required]],
      password: ['password', [Validators.required]]
    });
  }
  
  onSubmit() {
    this.authService.login('', '');
    this.router.navigate(['/main-menu']);
  }
  
  skipLogin() {
    this.authService.login('', '');
    this.router.navigate(['/main-menu']);
  }
}
