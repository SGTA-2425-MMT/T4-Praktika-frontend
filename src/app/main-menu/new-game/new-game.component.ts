import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService, GameSettings } from '../../core/services/game.service';

type GameStep = 'civilization' | 'leader' | 'mapSetup' | 'difficulty' | 'summary';

interface Civilization {
  value: string;
  label: string;
  description: string;
  flagImage: string;
  leaderImage: string;
}

@Component({
  selector: 'app-new-game',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './new-game.component.html',
  styleUrl: './new-game.component.scss'
})
export class NewGameComponent {
  newGameForm: FormGroup;
  currentStep: GameStep = 'civilization';

  mapSizes = [
    { value: 'small', label: 'Pequeño (2 jugadores)' },
    { value: 'medium', label: 'Medio (4 jugadores)' },
    { value: 'large', label: 'Grande (6 jugadores)' },
    { value: 'huge', label: 'Enorme (8 jugadores)' }
  ];

  civilizations: Civilization[] = [
    {
      value: 'spain',
      label: 'España',
      description: 'Una potencia colonial con bonificaciones en exploración y comercio.',
      flagImage: 'assets/images/civilizations/spain_flag.png',
      leaderImage: 'assets/images/civilizations/spain_leader.png'
    },
    {
      value: 'rome',
      label: 'Roma',
      description: 'Un imperio militar con ventajas en la expansión y el entrenamiento de unidades.',
      flagImage: 'assets/images/civilizations/rome_flag.png',
      leaderImage: 'assets/images/civilizations/rome_leader.png'
    },
    {
      value: 'egypt',
      label: 'Egipto',
      description: 'Una antigua civilización con fortalezas en la construcción de maravillas.',
      flagImage: 'assets/images/civilizations/egypt_flag.png',
      leaderImage: 'assets/images/civilizations/egypt_leader.png'
    },
    {
      value: 'china',
      label: 'China',
      description: 'Una potencia cultural con ventajas en ciencia y población.',
      flagImage: 'assets/images/civilizations/china_flag.png',
      leaderImage: 'assets/images/civilizations/china_leader.png'
    },

    {
      value: 'france',
      label: 'Francia',
      description: 'Una nación cultural con bonificaciones diplomáticas y turísticas.',
      flagImage: 'assets/images/civilizations/france_flag.png',
      leaderImage: 'assets/images/civilizations/france_leader.png'
    },
    {
      value: 'greece',
      label: 'Grecia',
      description: 'Una civilización clásica con ventajas en cultura y ciudad-estado.',
      flagImage: 'assets/images/civilizations/greece_flag.png',
      leaderImage: 'assets/images/civilizations/greece_leader.png'
    }
  ];

  difficultyDescriptions = {
    'easy': 'Perfecto para principiantes. Los oponentes son pasivos y te permiten desarrollar tu civilización sin mucha presión.',
    'normal': 'Equilibrado para la mayoría de jugadores. Los oponentes compiten pero sin ventajas injustas.',
    'hard': 'Para jugadores experimentados. Los oponentes reciben ligeras ventajas y son más agresivos.',
    'expert': 'El mayor desafío. Los oponentes reciben importantes bonificaciones y utilizan estrategias avanzadas.'
  };

  get selectedCivilizationImage(): string | null {
    const civValue = this.newGameForm.get('civilization')?.value;
    const selectedCiv = this.civilizations.find(civ => civ.value === civValue);
    return selectedCiv ? selectedCiv.flagImage : null;
  }

  get selectedLeaderImage(): string | null {
    const civValue = this.newGameForm.get('civilization')?.value;
    const selectedCiv = this.civilizations.find(civ => civ.value === civValue);
    return selectedCiv ? selectedCiv.leaderImage : null;
  }

  get currentStepDescription(): string {
    switch (this.currentStep) {
      case 'civilization': return 'Elige tu pueblo y comienza tu legado';
      case 'leader': return 'Nombra al líder de tu civilización';
      case 'mapSetup': return 'Configura el mundo donde conquistarás';
      case 'difficulty': return 'Elige qué tan desafiante será tu partida';
      case 'summary': return 'Revisa tu configuración y comienza la aventura';
      default: return 'Configura tu próxima conquista';
    }
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly gameService: GameService
  ) {
    this.newGameForm = this.fb.group({
      gameName: ['', [Validators.required, Validators.minLength(3)]],
      mapSize: ['medium'],
      civilization: ['spain'],
      difficulty: ['normal'],
      numberOfOpponents: [3, [Validators.min(1), Validators.max(7)]]
    });
  }

  selectCivilization(value: string): void {
    this.newGameForm.get('civilization')?.setValue(value);
  }

  nextStep(): void {
    switch (this.currentStep) {
      case 'civilization':
        this.currentStep = 'leader';
        break;
      case 'leader':
        this.currentStep = 'mapSetup';
        break;
      case 'mapSetup':
        this.currentStep = 'difficulty';
        break;
      case 'difficulty':
        this.currentStep = 'summary';
        break;
      case 'summary':
        this.startGame();
        break;
    }
  }

  previousStep(): void {
    switch (this.currentStep) {
      case 'leader':
        this.currentStep = 'civilization';
        break;
      case 'mapSetup':
        this.currentStep = 'leader';
        break;
      case 'difficulty':
        this.currentStep = 'mapSetup';
        break;
      case 'summary':
        this.currentStep = 'difficulty';
        break;
    }
  }

  getSelectedCivilizationName(): string {
    const civValue = this.newGameForm.get('civilization')?.value;
    const selectedCiv = this.civilizations.find(civ => civ.value === civValue);
    return selectedCiv ? selectedCiv.label : '';
  }

  getSelectedCivilizationDescription(): string {
    const civValue = this.newGameForm.get('civilization')?.value;
    const selectedCiv = this.civilizations.find(civ => civ.value === civValue);
    return selectedCiv ? selectedCiv.description : '';
  }

  getDifficultyName(): string {
    const difficultyValue = this.newGameForm.get('difficulty')?.value;
    switch (difficultyValue) {
      case 'easy': return 'Fácil';
      case 'normal': return 'Normal';
      case 'hard': return 'Difícil';
      case 'expert': return 'Experto';
      default: return 'Normal';
    }
  }

  getDifficultyDescription(): string {
    const difficultyValue = this.newGameForm.get('difficulty')?.value;
    return this.difficultyDescriptions[difficultyValue as keyof typeof this.difficultyDescriptions] || '';
  }

  getMapSizeName(): string {
    const mapSizeValue = this.newGameForm.get('mapSize')?.value;
    const selectedSize = this.mapSizes.find(size => size.value === mapSizeValue);
    return selectedSize ? selectedSize.label : '';
  }

  startGame(): void {
    if (this.newGameForm.invalid) {
      return;
    }

    // Crear la configuración del juego desde el formulario
    const gameSettings: GameSettings = {
      gameName: this.newGameForm.get('gameName')?.value,
      mapSize: this.newGameForm.get('mapSize')?.value,
      civilization: this.newGameForm.get('civilization')?.value,
      difficulty: this.newGameForm.get('difficulty')?.value,
      numberOfOpponents: this.newGameForm.get('numberOfOpponents')?.value
    };

    // Crear una nueva partida con el servicio
    this.gameService.createNewGame(gameSettings);

    // Navegar a la pantalla de juego con el parámetro 'new'
    this.router.navigate(['/game'], { queryParams: { new: 'true' } });
  }

  returnToMainMenu(): void {
    this.router.navigate(['/main-menu']);
  }
}
