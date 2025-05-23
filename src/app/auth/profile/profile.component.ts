import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  userProfile: UserProfile | null = null;
  isLoading = true;
  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {
    this.profileForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  async loadUserProfile(): Promise<void> {
    this.isLoading = true;
    try {
      const profile = await this.authService.loadUserProfile();
      this.userProfile = profile;

      // Actualizar el formulario con los datos del perfil
      this.profileForm.patchValue({
        username: profile.username,
        email: profile.email
      });
    } catch (error) {
      console.error('Error al cargar el perfil del usuario', error);
      this.errorMessage = 'No se pudo cargar el perfil. Por favor, intenta de nuevo más tarde.';
    } finally {
      this.isLoading = false;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';

    try {
      const updatedProfile = await this.authService.updateProfile({
        username: this.profileForm.value.username,
        email: this.profileForm.value.email
      });

      this.userProfile = updatedProfile;
      this.successMessage = 'Perfil actualizado correctamente';
    } catch (error: any) {
      console.error('Error al actualizar el perfil', error);
      this.errorMessage = error?.error?.detail ?? 'Error al actualizar el perfil. Por favor, intenta de nuevo más tarde.';
    } finally {
      this.isSubmitting = false;
    }
  }

  logout(): void {
    this.authService.logout();
  }
}
