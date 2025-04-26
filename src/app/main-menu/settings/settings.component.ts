import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  settingsForm: FormGroup;
  
  soundOptions = [
    { value: 'high', label: 'Alto' },
    { value: 'medium', label: 'Medio' },
    { value: 'low', label: 'Bajo' },
    { value: 'off', label: 'Apagado' }
  ];
  
  difficultyOptions = [
    { value: 'easy', label: 'Fácil' },
    { value: 'normal', label: 'Normal' },
    { value: 'hard', label: 'Difícil' },
    { value: 'expert', label: 'Experto' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.settingsForm = this.fb.group({
      soundVolume: ['medium'],
      musicVolume: ['medium'],
      difficulty: ['normal'],
      fullscreen: [false],
      showTutorials: [true]
    });
  }

  saveSettings(): void {
    // Aquí guardaríamos la configuración en el servicio o localStorage
    console.log('Configuración guardada:', this.settingsForm.value);
    alert('Configuración guardada correctamente');
  }

  returnToMainMenu(): void {
    this.router.navigate(['/main-menu']);
  }
}
