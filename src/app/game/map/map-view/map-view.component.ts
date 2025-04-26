import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovementService } from '../../../core/services/movement.service';
import { FogOfWarService } from '../../../core/services/fog-of-war.service';
import { TileComponent } from '../tile/tile.component';
import { GameMap, MapTile, MapCoordinate } from '../../../core/models/map.model';
import { Unit } from '../../../core/models/unit.model';
import { GameSession } from '../../../core/services/game.service';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, TileComponent],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss'
})
export class MapViewComponent implements OnInit, AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() gameSession: GameSession | null = null;
  @Output() endTurn = new EventEmitter<void>();
  
  tileSize: number = 64;
  selectedUnit: Unit | null = null;
  highlightedTile: MapTile | null = null;
  currentPath: MapCoordinate[] = [];
  viewportX: number = 0;
  viewportY: number = 0;
  viewportWidth: number = 0;
  viewportHeight: number = 0;
  isDragging: boolean = false;
  lastMouseX: number = 0;
  lastMouseY: number = 0;
  
  constructor(
    private movementService: MovementService,
    private fogOfWarService: FogOfWarService
  ) {}
  
  ngOnInit(): void {
    // Suscribirse a cambios en la ruta actual
    this.movementService.currentPath$.subscribe(path => {
      this.currentPath = path;
    });
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['gameSession'] && this.gameSession) {
      // Centrar el mapa en la unidad del jugador (colono o cualquier otra)
      setTimeout(() => {
        this.centerMapOnPlayerUnit();
      }, 500);
    }
  }
  
  ngAfterViewInit(): void {
    this.updateViewportSize();
  }

  // Centrar el mapa en una unidad del jugador
  centerMapOnPlayerUnit(): void {
    if (!this.gameSession) return;
    
    const playerUnit = this.gameSession.units.find(u => u.owner === this.gameSession?.currentPlayerId);
    if (playerUnit) {
      this.centerViewportOn(playerUnit.position.x, playerUnit.position.y);
    }
  }

  // Centrar la vista en coordenadas específicas
  centerViewportOn(x: number, y: number): void {
    if (!this.mapContainer) return;

    this.viewportX = (x * this.tileSize) - (this.viewportWidth / 2) + (this.tileSize / 2);
    this.viewportY = (y * this.tileSize) - (this.viewportHeight / 2) + (this.tileSize / 2);
    
    this.constrainViewport();
  }
  
  updateViewportSize(): void {
    if (this.mapContainer) {
      this.viewportWidth = this.mapContainer.nativeElement.offsetWidth;
      this.viewportHeight = this.mapContainer.nativeElement.offsetHeight;
    }
  }
  
  @HostListener('window:resize')
  onResize(): void {
    this.updateViewportSize();
  }
  
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    // Solo iniciar el arrastre con clic derecho o clic central
    if (event.button === 2 || event.button === 1) {
      this.isDragging = true;
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
      
      // Prevenir comportamiento predeterminado de arrastre
      event.preventDefault();
    }
  }
  
  @HostListener('window:mouseup')
  onMouseUp(): void {
    this.isDragging = false;
  }
  
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      const dx = event.clientX - this.lastMouseX;
      const dy = event.clientY - this.lastMouseY;
      
      this.viewportX -= dx;
      this.viewportY -= dy;
      
      // Limitar el viewport para que no se salga del mapa
      this.constrainViewport();
      
      this.lastMouseX = event.clientX;
      this.lastMouseY = event.clientY;
    }
  }
  
  // Limita el viewport a los límites del mapa
  constrainViewport(): void {
    if (!this.gameSession) return;
    
    const map = this.gameSession.map;
    const maxX = map.width * this.tileSize - this.viewportWidth;
    const maxY = map.height * this.tileSize - this.viewportHeight;
    
    this.viewportX = Math.max(0, Math.min(this.viewportX, maxX));
    this.viewportY = Math.max(0, Math.min(this.viewportY, maxY));
  }
  
  // Control del zoom
  @HostListener('wheel', ['$event'])
  onScroll(event: WheelEvent): void {
    const zoomSpeed = 0.1;
    const minTileSize = 32;
    const maxTileSize = 96;
    
    const oldTileSize = this.tileSize;
    
    if (event.deltaY < 0) {
      // Zoom in
      this.tileSize = Math.min(this.tileSize * (1 + zoomSpeed), maxTileSize);
    } else {
      // Zoom out
      this.tileSize = Math.max(this.tileSize * (1 - zoomSpeed), minTileSize);
    }
    
    // Ajustar la posición del viewport para mantener el punto bajo el cursor
    const scaleFactor = this.tileSize / oldTileSize;
    
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    
    const mapRect = this.mapContainer.nativeElement.getBoundingClientRect();
    const mouseMapX = mouseX - mapRect.left + this.viewportX;
    const mouseMapY = mouseY - mapRect.top + this.viewportY;
    
    this.viewportX = mouseMapX - (mouseMapX - this.viewportX) * scaleFactor;
    this.viewportY = mouseMapY - (mouseMapY - this.viewportY) * scaleFactor;
    
    // Asegurarse de que el viewport esté dentro de los límites
    this.constrainViewport();
    
    // Prevenir el scroll de la página
    event.preventDefault();
  }
  
  // Maneja el clic en una casilla
  onTileClick(tile: MapTile): void {
    if (!this.gameSession || !tile.isExplored) {
      // No permitir interacción con casillas inexploradas
      return;
    }
    
    // Si hay una unidad seleccionada y la casilla es visible
    if (this.selectedUnit && tile.isVisible) {
      // Intentar mover la unidad seleccionada a la casilla
      if (this.selectedUnit.movementPoints > 0) {
        this.moveSelectedUnit(tile);
      } else {
        this.showMessage('Esta unidad no tiene más puntos de movimiento');
      }
    } else {
      // Seleccionar unidad si hay una en esta casilla
      const unitOnTile = this.findUnitAt(tile.x, tile.y);
      if (unitOnTile && unitOnTile.owner === this.gameSession.currentPlayerId) {
        this.selectUnit(unitOnTile);
      } else {
        this.clearSelection();
      }
    }
    
    // Destacar la casilla seleccionada
    this.highlightedTile = tile;
  }
  
  // Mueve la unidad seleccionada a una casilla
  moveSelectedUnit(targetTile: MapTile): void {
    if (!this.selectedUnit || !this.gameSession) return;
    
    // Si la unidad ya está en esta casilla, no hacer nada
    if (this.selectedUnit.position.x === targetTile.x && 
        this.selectedUnit.position.y === targetTile.y) {
      return;
    }
    
    const success = this.movementService.moveUnit(
      this.selectedUnit,
      { x: targetTile.x, y: targetTile.y },
      this.gameSession.map,
      (unit) => this.updateUnitVisibility(unit)
    );
    
    if (success) {
      // Actualizar la niebla de guerra después del movimiento
      this.updateAllUnitsVisibility();
      
      // Limpiar la ruta
      this.movementService.setCurrentPath([]);
      
      // Si la unidad ya no tiene movimientos, desseleccionarla
      if (this.selectedUnit.movementPoints <= 0) {
        this.clearSelection();
      }
    } else {
      this.showMessage('No se puede mover a esa casilla');
    }
  }
  
  // Selecciona una unidad
  selectUnit(unit: Unit): void {
    if (!this.gameSession) return;
    
    if (unit.owner !== this.gameSession.currentPlayerId || !unit.canMove) {
      return;
    }
    
    this.selectedUnit = unit;
    this.highlightedTile = this.gameSession.map.tiles[unit.position.y][unit.position.x];
    
    // Calcular las casillas a las que se puede mover
    this.showPossibleMoves(unit);
  }
  
  // Muestra las posibles casillas a las que se puede mover una unidad
  showPossibleMoves(unit: Unit): void {
    // En un juego real, aquí calcularíamos todas las casillas alcanzables
    // Por simplificación, no lo implementamos en detalle
  }
  
  // Limpia la selección actual
  clearSelection(): void {
    this.selectedUnit = null;
    this.movementService.setCurrentPath([]);
  }
  
  // Encuentra una unidad en unas coordenadas determinadas
  findUnitAt(x: number, y: number): Unit | null {
    if (!this.gameSession) return null;
    
    return this.gameSession.units.find(unit => 
      unit.position.x === x && unit.position.y === y
    ) || null;
  }
  
  // Actualiza la visibilidad para una unidad
  updateUnitVisibility(unit: Unit): void {
    if (!this.gameSession) return;
    
    if (unit.owner === this.gameSession.currentPlayerId) {
      this.fogOfWarService.updateVisibility(this.gameSession.map, unit, this.gameSession.currentPlayerId);
    }
  }
  
  // Actualiza la visibilidad para todas las unidades del jugador actual
  updateAllUnitsVisibility(): void {
    if (!this.gameSession) return;
    
    const playerUnits = this.gameSession.units.filter(unit => 
      unit.owner === this.gameSession?.currentPlayerId && this.gameSession
    );
    
    if (this.gameSession) {
      this.fogOfWarService.updateFogOfWarForPlayer(
        this.gameSession.map, 
        playerUnits, 
        this.gameSession.currentPlayerId
      );
    }
  }
  
  // Terminar el turno
  finishTurn(): void {
    this.endTurn.emit();
    this.clearSelection();
  }
  
  // Muestra un mensaje al usuario
  showMessage(message: string): void {
    console.log(message); // En un juego real, mostraríamos una notificación en la UI
    alert(message); // Solución temporal
  }
  
  // Verifica si una casilla está en la ruta calculada
  isInPath(x: number, y: number): boolean {
    return this.currentPath.some(pos => pos.x === x && pos.y === y);
  }
  
  // Devuelve las unidades visibles que están en el viewport
  getVisibleUnits(): Unit[] {
    if (!this.gameSession) return [];
    
    return this.gameSession.units.filter(unit => {
      const tile = this.gameSession?.map.tiles[unit.position.y]?.[unit.position.x];
      return tile && tile.isVisible;
    });
  }
  
  // Devuelve todas las casillas que están actualmente visibles en el viewport
  getVisibleTiles(): MapTile[] {
    if (!this.gameSession) return [];
    
    const map = this.gameSession.map;
    const startX = Math.floor(this.viewportX / this.tileSize);
    const startY = Math.floor(this.viewportY / this.tileSize);
    const endX = Math.ceil((this.viewportX + this.viewportWidth) / this.tileSize);
    const endY = Math.ceil((this.viewportY + this.viewportHeight) / this.tileSize);
    
    const visibleTiles: MapTile[] = [];
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          visibleTiles.push(map.tiles[y][x]);
        }
      }
    }
    
    return visibleTiles;
  }
}
