import { Injectable } from '@angular/core';
import { MapCoordinate, MapTile, GameMap } from '../models/map.model';
import { Unit } from '../models/unit.model';
import { BehaviorSubject } from 'rxjs';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private readonly path = new BehaviorSubject<MapCoordinate[]>([]);
  currentPath$ = this.path.asObservable();

  constructor(private readonly gameService: GameService) {}

  isWaterTile(tile: MapTile): boolean {
    return (
      tile.terrain.includes('water')
    );
  }
findPath(map: GameMap, start: MapCoordinate, end: MapCoordinate, unit: Unit): MapCoordinate[] {
  const startTile = map.tiles[start.y][start.x];
  const endTile = map.tiles[end.y][end.x];

  if (!this.canMoveTo(endTile, unit)) {
    console.log('Destino inalcanzable');
    return [];
  }

  const openSet: {pos: MapCoordinate, landSteps: number}[] = [{pos: start, landSteps: 0}];
  const closedSet: Set<string> = new Set();
  const gScore: Record<string, number> = {};
  const fScore: Record<string, number> = {};
  const cameFrom: Record<string, MapCoordinate> = {};
  const landStepsMap: Record<string, number> = {};

  const getKey = (pos: MapCoordinate) => `${pos.x},${pos.y}`;

  gScore[getKey(start)] = 0;
  fScore[getKey(start)] = this.heuristic(start, end);
  landStepsMap[getKey(start)] = 0;

  while (openSet.length > 0) {
    // Encontrar el nodo con menor fScore
    let currentIdx = 0;
    for (let i = 1; i < openSet.length; i++) {
      if (fScore[getKey(openSet[i].pos)] < fScore[getKey(openSet[currentIdx].pos)]) {
        currentIdx = i;
      }
    }
    const current = openSet[currentIdx];
    const currentKey = getKey(current.pos);

    if (current.pos.x === end.x && current.pos.y === end.y) {
      return this.reconstructPath(cameFrom, current.pos);
    }

    openSet.splice(currentIdx, 1);
    closedSet.add(currentKey);

    for (const neighbor of this.getNeighbors(current.pos, map)) {
      const neighborKey = getKey(neighbor);
      if (closedSet.has(neighborKey)) continue;

      const neighborTile = map.tiles[neighbor.y][neighbor.x];

      // --- Lógica especial para unidades marinas ---
      let landSteps = current.landSteps;
      if (unit.canSwim) {
        const isCurrentLand = !this.isWaterTile(startTile);
        const isNeighborLand = !this.isWaterTile(neighborTile);
        if (isNeighborLand) {
          landSteps += 1;
        } else {
          landSteps = 0; // Reinicia si vuelve al agua
        }
        if (landSteps > 1) continue; // No puede avanzar más de 1 casilla en tierra
      }

      if (!this.canMoveTo(neighborTile, unit)) continue;

      const movementCost = neighborTile.movementCost;
      const tentativeGScore = gScore[currentKey] + movementCost;

      if (!(neighborKey in gScore) || tentativeGScore < gScore[neighborKey]) {
        cameFrom[neighborKey] = current.pos;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = tentativeGScore + this.heuristic(neighbor, end);
        landStepsMap[neighborKey] = landSteps;

        // Solo agregar si no está ya en openSet
        if (!openSet.some(n => getKey(n.pos) === neighborKey)) {
          openSet.push({pos: neighbor, landSteps});
        }
      }
    }
  }

  return [];
}
// ...existing code...

  // Función heurística para A* (distancia Manhattan)
  private heuristic(a: MapCoordinate, b: MapCoordinate): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  // Obtiene las casillas vecinas válidas en un grid cuadrado (4 direcciones)
  private getNeighbors(pos: MapCoordinate, map: GameMap): MapCoordinate[] {
    const directions = [
      { x: 0, y: -1 }, // Arriba
      { x: 1, y: 0 },  // Derecha
      { x: 0, y: 1 },  // Abajo
      { x: -1, y: 0 }  // Izquierda
    ];

    return directions
      .map(dir => ({
        x: pos.x + dir.x,
        y: pos.y + dir.y
      }))
      .filter(newPos =>
        newPos.x >= 0 &&
        newPos.x < map.width &&
        newPos.y >= 0 &&
        newPos.y < map.height
      );
  }

  // Verifica si una unidad puede moverse a una casilla
  canMoveTo(tile: MapTile, unit: Unit): boolean {

    if (!unit.canSwim && this.isWaterTile(tile)) {
      return false;
    }
    // Verificar si el terreno es adecuado según el tipo de unidad

    // Verificar si hay árboles (bosque o jungla) - Las unidades terrestres no pueden entrar a casillas con árboles
    // excepto los trabajadores que son los únicos que pueden quitar los árboles
    if ((tile.featureType === 'forest' || tile.featureType === 'jungle') &&
        unit.type !== 'worker') {
      console.log(`La unidad ${unit.type} no puede entrar en casillas con ${tile.featureType}`);
      return false;
    }

    // Verificar si hay una ciudad en la casilla
    if (tile.city && tile.city.id !== '0') {
      return false;
    }

    // Verificar si hay alguna unidad en la misma casilla
    const currentGame = this.gameService.currentGame;
    if (currentGame) {
      const unitInTile = currentGame.units.find(u =>
        u.position.x === tile.x &&
        u.position.y === tile.y &&
        u.id !== unit.id // No considerar la unidad que se está moviendo
      );

      if (unitInTile) {
        return false;
      }
    }

    return true;
  }

  // Reconstruye la ruta encontrada
  private reconstructPath(cameFrom: Record<string, MapCoordinate>, current: MapCoordinate): MapCoordinate[] {
    const totalPath = [current];
    const getKey = (pos: MapCoordinate) => `${pos.x},${pos.y}`;

    while (getKey(current) in cameFrom) {
      current = cameFrom[getKey(current)];
      totalPath.unshift(current);
    }

    return totalPath;
  }

  // Asigna una nueva ruta para destacarla en el mapa
  setCurrentPath(path: MapCoordinate[]): void {
    this.path.next(path);
  }

  // Mueve una unidad a un destino, actualizando las casillas exploradas/visibles
  moveUnit(unit: Unit, destination: MapCoordinate, map: GameMap, updateFogOfWar: (unit: Unit) => void): boolean {
    const path = this.findPath(
      map,
      { x: unit.position.x, y: unit.position.y },
      destination,
      unit
    );

    // Si no hay camino, no se puede mover
    if (path.length === 0) return false;

    // Determinar la dirección del movimiento
    const direction = destination.x > unit.position.x ? 'right' : 'left';

    // Mover la unidad
    unit.position = { x: destination.x, y: destination.y };

    // Actualizar puntos de movimiento
    // Simplificación: cada movimiento cuesta 1 punto
    unit.movementPoints -= path.length;
    if (unit.movementPoints < 0) unit.movementPoints = 0;

    // Actualizar la niebla de guerra
    updateFogOfWar(unit);

    return true;
  }
}
