import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
  
  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    // Precargar credenciales como solicitado
    this.loginForm.setValue({
      username: 'pepe',
      password: 'pepepe'
    });
  }
  
  async onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    const { username, password } = this.loginForm.value;
    try {
      const success = await this.authService.login(username, password);
      if (success) {
        this.router.navigate(['/main-menu']);
      } else {
        this.errorMessage = 'Nombre de usuario o contraseña incorrectos.';
      }
    } catch (err: any) {
      // Manejar errores del nuevo backend
      let msg = 'Error de inicio de sesión.';
      if (err.error && err.error.detail) {
        msg = err.error.detail;
      }
      this.errorMessage = msg;
    } finally {
      this.isSubmitting = false;
    }
  }
  
  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
