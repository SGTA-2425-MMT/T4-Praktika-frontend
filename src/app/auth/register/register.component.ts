import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  
  get username() { return this.registerForm.get('username'); }
  get email() { return this.registerForm.get('email'); }
  get password() { return this.registerForm.get('password'); }
  get confirmPassword() { return this.registerForm.get('confirmPassword'); }
  
  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
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
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }
  
  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    const { username, email, password } = this.registerForm.value;
    try {
      await this.authService.register(username, email, password);
      this.successMessage = '¡Registro completado! Revisa tu correo electrónico para verificar tu cuenta.\nSerás redirigido a la página de inicio de sesión en 10 segundos.';
      setTimeout(() => this.router.navigate(['/auth/login']), 10000);
    } catch (err: any) {
      // Handle new backend error format (object) and legacy (string)
      let msg = 'Error al registrar usuario.';
      const detail = err?.error?.detail;
      if (detail && typeof detail === 'object' && detail !== null) {
        // New backend: JSON object with error_description or error
        if (typeof detail.error_description === 'string' && detail.error_description) {
          msg = detail.error_description;
        } else if (typeof detail.error === 'string' && detail.error) {
          msg = detail.error;
        } else {
          msg = JSON.stringify(detail, null, 2);
        }
      } else if (typeof detail === 'string') {
        // Legacy: try to extract JSON from string, fallback to string
        const match = detail.match(/\{.*\}/);
        if (match) {
          try {
            const json = JSON.parse(match[0]);
            msg = json.error_description || json.error || match[0];
          } catch {
            msg = detail;
          }
        } else {
          msg = detail;
        }
      }
      this.errorMessage = msg;
    } finally {
      this.isSubmitting = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
