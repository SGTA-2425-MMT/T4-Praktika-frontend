import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <h1>Crear Cuenta</h1>
        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="username">Usuario</label>
            <input type="text" id="username" formControlName="username" placeholder="Elije un nombre de usuario">
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" formControlName="email" placeholder="Introduce tu email">
          </div>
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input type="password" id="password" formControlName="password" placeholder="Crea una contraseña">
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Contraseña</label>
            <input type="password" id="confirmPassword" formControlName="confirmPassword" placeholder="Confirma tu contraseña">
          </div>
          <div class="actions">
            <button type="button" class="btn-secondary" routerLink="/auth/login">Volver</button>
            <button type="submit" [disabled]="registerForm.invalid">Registrarse</button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: url('/assets/images/background.jpg') no-repeat center center;
      background-size: cover;
    }
    .register-card {
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
    .actions {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
    }
    button {
      flex: 1;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
    }
    button[type="submit"] {
      background-color: #f1c40f;
      color: black;
    }
    button.btn-secondary {
      background-color: transparent;
      border: 1px solid #7f8c8d;
      color: #7f8c8d;
    }
    button:disabled {
      background-color: #7f8c8d;
      cursor: not-allowed;
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }
  
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { mismatch: true };
  }
  
  onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    
    // En una implementación real, se haría una petición al backend
    alert('¡Registro completado! Por favor inicia sesión.');
    this.router.navigate(['/auth/login']);
  }
}
