import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  loginForm: FormGroup;
  isSubmitting = false;
  errorMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }
    
    this.isSubmitting = true;
    this.errorMessage = null;
    
    // Redirigir siempre al main-menu, sin esperar a la respuesta del servicio
    this.router.navigate(['/main-menu']);
    this.isSubmitting = false;

    // Si quieres mantener la lógica original para el futuro, puedes comentarla:
    /*
    this.authService.login(this.loginForm.value)
      .subscribe({
        next: () => {
          this.router.navigate(['/main-menu']);
        },
        error: (error) => {
          this.errorMessage = 'Credenciales incorrectas. Por favor, inténtalo de nuevo.';
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    */
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
