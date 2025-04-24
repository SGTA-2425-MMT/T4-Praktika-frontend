import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/game-state.service';
import { IaService } from '../../../core/ia.service';
import { TileComponent } from '../tile/tile.component';
import { ResourceIconComponent } from '../resource-icon/resource-icon.component';
import { FogOfWarComponent } from '../fog-of-war/fog-of-war.component';
import { Tile } from '../../../core/models/tile.model';
import { Unit } from '../../../core/models/unit.model';

@Component({
  selector: 'app-map-view',
  standalone: true,
  imports: [CommonModule, TileComponent, ResourceIconComponent, FogOfWarComponent],
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss'
})
export class MapViewComponent implements OnInit {
  tiles: { [id: string]: Tile } = {};
  units: { [id: string]: Unit } = {};
  visibleTiles: string[] = [];
  selectedUnit: Unit | null = null;
  tileSize = 64; // Tamaño en píxeles de cada casilla
  mapWidth = 0;
  mapHeight = 0;
  viewportWidth = 800;
  viewportHeight = 600;
  viewportX = 0;
  viewportY = 0;
  isAiTurn = false;

  constructor(
    private gameStateService: GameStateService,
    private iaService: IaService
  ) {}

  ngOnInit(): void {
    this.gameStateService.observeGameState().subscribe(state => {
      this.tiles = state.map.tiles;
      this.units = state.units;
      this.mapWidth = state.map.width * this.tileSize;
      this.mapHeight = state.map.height * this.tileSize;
      this.visibleTiles = this.gameStateService.getVisibleTilesForCurrentPlayer();
    });
  }
}
