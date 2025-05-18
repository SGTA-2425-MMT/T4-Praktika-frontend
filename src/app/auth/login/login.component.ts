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
  
  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
  
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

  ngOnInit() {
    // Precargar credenciales como solicitado
    this.loginForm.setValue({
      email: 'prueba@gmail.com',
      password: '123456'
    });
  }
  
  onSubmit() {
    if (this.loginForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    
    // Simulando inicio de sesión
    setTimeout(() => {
      this.authService.login('', '');
      this.isSubmitting = false;
      this.router.navigate(['/main-menu']);
    }, 1000);
  }
  
  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
