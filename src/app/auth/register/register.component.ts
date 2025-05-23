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
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly authService: AuthService
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
      const response = await this.authService.register(username, email, password);
      this.successMessage = `¡Registro completado! ${response.message}\nSerás redirigido a la página de inicio de sesión en 5 segundos.`;
      setTimeout(() => this.router.navigate(['/auth/login']), 5000);
    } catch (err: any) {
      // Manejar errores del nuevo backend
      let msg = 'Error al registrar usuario.';
      if (err.error?.detail) {
        msg = err.error.detail;
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
