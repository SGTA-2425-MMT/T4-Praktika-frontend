import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CheatLogEntry } from '../../core/services/cheat.service';

@Component({
  selector: 'app-cheat-console',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="cheat-console-overlay" *ngIf="visible" (click)="onOverlayClick($event)">
      <div class="cheat-console" (click)="onConsoleClick($event)">
        <div class="console-header">
          <h3>Panel de Trucos</h3>
          <button class="close-btn" (click)="closeConsole()">×</button>
        </div>

        <div class="console-body">
          <div class="console-output">
            <div *ngFor="let entry of consoleHistory" class="console-entry">
              <div [ngClass]="{'command': entry.isCommand, 'result': !entry.isCommand}">
                <span class="timestamp" *ngIf="showTimestamps">{{ formatTime(entry.timestamp) }}</span>
                <span class="icon">{{ entry.isCommand ? '>' : '←' }}</span>
                <span class="content" [ngClass]="{'error': entry.isError}">{{ entry.content }}</span>
              </div>
            </div>
          </div>

          <div class="console-help" *ngIf="showHelp">
            <h4>Trucos disponibles:</h4>
            <ul>
              <li *ngFor="let cheat of availableCheats">
                <strong>{{ cheat.code }}</strong>: {{ cheat.description }}
              </li>
            </ul>
          </div>

          <div class="console-logs" *ngIf="showLogs">
            <h4>Registro de trucos utilizados:</h4>
            <table>
              <thead>
                <tr>
                  <th>Hora</th>
                  <th>Código</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of cheatLogs">
                  <td>{{ formatTime(log.timestamp) }}</td>
                  <td>{{ log.code }}</td>
                  <td>{{ log.result }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="console-input">
          <span class="prompt">&gt;</span>
          <input
            type="text"
            [(ngModel)]="commandInput"
            placeholder="Escribe un comando o 'help' para ayuda"
            (keyup.enter)="executeCommand()"
            [disabled]="processing"
            #commandInputRef
          />
          <button class="execute-btn" (click)="executeCommand()" [disabled]="processing">Ejecutar</button>
        </div>

        <div class="console-footer">
          <button class="footer-btn" (click)="toggleHelp()">
            {{ showHelp ? 'Ocultar ayuda' : 'Mostrar ayuda' }}
          </button>
          <button class="footer-btn" (click)="toggleLogs()">
            {{ showLogs ? 'Ocultar registro' : 'Ver registro' }}
          </button>
          <button class="footer-btn" (click)="clearConsole()">Limpiar consola</button>
          <div class="timestamps-toggle">
            <input type="checkbox" id="showTimestamps" [(ngModel)]="showTimestamps" />
            <label for="showTimestamps">Mostrar hora</label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cheat-console-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .cheat-console {
      width: 700px;
      max-width: 90%;
      height: 500px;
      max-height: 85vh;
      background-color: #1e1e1e;
      border: 2px solid #ff5722;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      color: #e0e0e0;
      font-family: 'Courier New', monospace;
    }

    .console-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 15px;
      border-bottom: 1px solid #444;
      background-color: #333;
      border-radius: 6px 6px 0 0;
    }

    .console-header h3 {
      margin: 0;
      color: #ff5722;
      font-size: 16px;
    }

    .close-btn {
      background: none;
      border: none;
      color: #e0e0e0;
      font-size: 24px;
      cursor: pointer;
    }

    .console-body {
      flex-grow: 1;
      overflow-y: auto;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .console-output {
      flex-grow: 1;
      overflow-y: auto;
      padding-right: 5px;
      min-height: 100px;
    }

    .console-entry {
      margin-bottom: 6px;
    }

    .command {
      color: #64dd17;
    }

    .result {
      color: #e0e0e0;
    }

    .error {
      color: #ff5252;
    }

    .icon {
      display: inline-block;
      width: 20px;
      margin-right: 5px;
    }

    .timestamp {
      color: #888;
      margin-right: 10px;
      font-size: 0.8em;
    }

    .console-input {
      display: flex;
      padding: 10px;
      background-color: #2d2d2d;
    }

    .prompt {
      color: #ff5722;
      font-weight: bold;
      margin-right: 8px;
      font-size: 18px;
    }

    input {
      flex-grow: 1;
      background-color: #1e1e1e;
      color: #fff;
      border: 1px solid #444;
      padding: 8px;
      font-family: 'Courier New', monospace;
    }

    .execute-btn {
      background-color: #ff5722;
      color: #fff;
      border: none;
      padding: 0 15px;
      margin-left: 10px;
      cursor: pointer;
      border-radius: 4px;
    }

    .execute-btn:hover {
      background-color: #ff7043;
    }

    .execute-btn:disabled {
      background-color: #666;
      cursor: not-allowed;
    }

    .console-footer {
      display: flex;
      align-items: center;
      padding: 10px;
      border-top: 1px solid #444;
      gap: 10px;
      flex-wrap: wrap;
    }

    .footer-btn {
      background-color: #333;
      color: #e0e0e0;
      border: 1px solid #444;
      padding: 5px 10px;
      cursor: pointer;
      border-radius: 4px;
      font-size: 12px;
    }

    .footer-btn:hover {
      background-color: #444;
    }

    .timestamps-toggle {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .console-help {
      background-color: #2d2d2d;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }

    .console-help h4 {
      margin-top: 0;
      color: #ff5722;
    }

    .console-help ul {
      margin: 0;
      padding-left: 20px;
    }

    .console-help li {
      margin-bottom: 5px;
    }

    .console-logs {
      background-color: #2d2d2d;
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
      overflow-x: auto;
    }

    .console-logs h4 {
      margin-top: 0;
      color: #ff5722;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      text-align: left;
      padding: 6px;
      border-bottom: 1px solid #444;
    }

    th {
      color: #ff5722;
    }
  `]
})
export class CheatConsoleComponent implements OnInit {
  @Input() visible = false;
  @Output() execute = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  commandInput = '';
  processing = false;
  showHelp = false;
  showLogs = false;
  showTimestamps = false;

  consoleHistory: {
    content: string;
    timestamp: Date;
    isCommand: boolean;
    isError: boolean;
  }[] = [];

  // Logs de trucos recibidos del servicio
  @Input() cheatLogs: CheatLogEntry[] = [];

  // Definición de los trucos disponibles
  // tengo que cambiar el nobre de todos estos:
  // ponlos asi: /*[CHEAT] 2025-05-22T16:17:55.796Z - Código: help - Resultado:       Trucos disponibles:      - build_all: Construye todos los edificios en la ciudad        Uso: build_all (si solo tienes una ciudad)        Uso: build_all:NOMBRE_CIUDAD (si tienes varias ciudades)      - instant_defeat: Derrota inmediata      - instant_victory: Victoria inmediata      - add_tank_squad: Añade 5 tanques a la ciudad seleccionada      - give_advanced_tech: Desbloquea una tecnología avanzada      - level_up_city: Sube de nivel la ciudad seleccionada      - max_resources: Maximiza todos los recursos      - infinite_movement: Habilita movimiento infinito para todas las unidades      - maximize_happiness: Maximiza la felicidad de la ciudad seleccionada      - reveal_map: Revela todo el mapa (elimina la niebla de guerra)      - help: Muestra esta ayuda     */

  availableCheats = [
    { code: 'build_all', description: 'Construye todos los edificios en la ciudad seleccionada. Uso: build_all (si solo tienes una ciudad) o build_all:NOMBRE_CIUDAD (si tienes varias ciudades)' },
    { code: 'instant_defeat', description: 'Derrota inmediata' },
    { code: 'instant_victory', description: 'Victoria inmediata' },
    { code: 'add_tank_squad', description: 'Añade 5 tanques a la ciudad seleccionada' },
    { code: 'give_advanced_tech', description: 'Desbloquea una tecnología avanzada' },
    { code: 'level_up_city', description: 'Sube de nivel la ciudad seleccionada' },
    { code: 'max_resources', description: 'Maximiza todos los recursos' },
    { code: 'infinite_movement', description: 'Habilita movimiento infinito para todas las unidades' },
    { code: 'maximize_happiness', description: 'Maximiza la felicidad de la ciudad seleccionada' },
    { code: 'reveal_map', description: 'Revela todo el mapa (elimina la niebla de guerra)' },
    { code: 'help', description: 'Muestra esta ayuda' }
  ];
  constructor() {}

  ngOnInit(): void {
    this.addConsoleEntry('Bienvenido al sistema de trucos. Escribe "help" para ver los comandos disponibles.', false);
  }

  executeCommand(): void {
    if (!this.commandInput.trim() || this.processing) {
      return;
    }

    const command = this.commandInput.trim();
    this.addConsoleEntry(command, true);

    // Comando especial para limpiar la consola
    if (command.toLowerCase() === 'clear') {
      this.clearConsole();
      return;
    }

    this.processing = true;

    // Emitir el comando al componente padre para procesarlo
    this.execute.emit(command);

    // Limpiar el input
    this.commandInput = '';
  }

  // Método para ser llamado por el componente padre cuando hay una respuesta
  addResponse(response: string, isError = false): void {
    this.addConsoleEntry(response, false, isError);
    this.processing = false;
  }

  private addConsoleEntry(content: string, isCommand: boolean, isError = false): void {
    this.consoleHistory.push({
      content,
      timestamp: new Date(),
      isCommand,
      isError
    });

    // Programar un scroll a la última entrada
    setTimeout(() => {
      const outputElement = document.querySelector('.console-output');
      if (outputElement) {
        outputElement.scrollTop = outputElement.scrollHeight;
      }
    }, 0);
  }

  toggleHelp(): void {
    this.showHelp = !this.showHelp;
    this.showLogs = false; // Cerrar logs si están abiertos
  }

  toggleLogs(): void {
    this.showLogs = !this.showLogs;
    this.showHelp = false; // Cerrar ayuda si está abierta
  }

  clearConsole(): void {
    this.consoleHistory = [];
    this.addConsoleEntry('Consola limpiada.', false);
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  onConsoleClick(event: MouseEvent): void {
    // Evitar que el clic en la consola cierre la ventana
    event.stopPropagation();
  }

  onOverlayClick(event: MouseEvent): void {
    // Cerrar la consola cuando se hace clic en el overlay (fuera de la consola)
    this.closeConsole();
  }

  closeConsole(): void {
    this.close.emit();
  }
}
