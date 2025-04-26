import { Injectable } from '@angular/core';
import { MapCoordinate, MapTile, GameMap } from '../models/map.model';
import { Unit } from '../models/unit.model';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private path = new BehaviorSubject<MapCoordinate[]>([]);
  currentPath$ = this.path.asObservable();

  constructor() {}

  // Encuentra la ruta más corta usando el algoritmo A*
  findPath(map: GameMap, start: MapCoordinate, end: MapCoordinate, unit: Unit): MapCoordinate[] {
    const startTile = map.tiles[start.y][start.x];
    const endTile = map.tiles[end.y][end.x];
    
    // Verificar si el destino es alcanzable
    if (!this.canMoveTo(endTile, unit)) {
      console.log('Destino inalcanzable');
      return [];
    }
    
    // Estructura para el algoritmo A*
    const openSet: MapCoordinate[] = [start];
    const closedSet: Set<string> = new Set();
    const gScore: Record<string, number> = {}; // Costo desde el inicio hasta el nodo
    const fScore: Record<string, number> = {}; // Costo estimado desde el inicio hasta la meta
    const cameFrom: Record<string, MapCoordinate> = {}; // Para reconstruir el camino
    
    const getKey = (pos: MapCoordinate) => `${pos.x},${pos.y}`;
    
    // Inicializar
    gScore[getKey(start)] = 0;
    fScore[getKey(start)] = this.heuristic(start, end);
    
    while (openSet.length > 0) {
      // Encontrar el nodo con menor fScore
      let current = openSet[0];
      let currentIndex = 0;
      
      for (let i = 0; i < openSet.length; i++) {
        const nodeKey = getKey(openSet[i]);
        const currentKey = getKey(current);
        
        if (fScore[nodeKey] < fScore[currentKey]) {
          current = openSet[i];
          currentIndex = i;
        }
      }
      
      // Si hemos llegado al destino
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(cameFrom, current);
      }
      
      // Eliminamos el nodo actual del conjunto abierto
      openSet.splice(currentIndex, 1);
      closedSet.add(getKey(current));
      
      // Explorar los vecinos
      for (const neighbor of this.getNeighbors(current, map)) {
        const neighborKey = getKey(neighbor);
        
        // Saltar si ya está en el conjunto cerrado
        if (closedSet.has(neighborKey)) continue;
        
        const neighborTile = map.tiles[neighbor.y][neighbor.x];
        
        // Saltar si la unidad no puede moverse a esta casilla
        if (!this.canMoveTo(neighborTile, unit)) continue;
        
        // Calcular el costo del movimiento
        const movementCost = neighborTile.movementCost;
        const tentativeGScore = gScore[getKey(current)] + movementCost;
        
        // Si no está en el conjunto abierto, añadirlo
        if (!openSet.some(pos => pos.x === neighbor.x && pos.y === neighbor.y)) {
          openSet.push(neighbor);
        } else if (tentativeGScore >= (gScore[neighborKey] || Infinity)) {
          // Este no es un mejor camino
          continue;
        }
        
        // Este camino es el mejor hasta ahora
        cameFrom[neighborKey] = current;
        gScore[neighborKey] = tentativeGScore;
        fScore[neighborKey] = gScore[neighborKey] + this.heuristic(neighbor, end);
      }
    }
    
    // No se encontró camino
    return [];
  }
  
  // Función heurística para A* (distancia Manhattan)
  private heuristic(a: MapCoordinate, b: MapCoordinate): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }
  
  // Obtiene las casillas vecinas válidas
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
    // Unidades terrestres no pueden moverse al océano
    if ((unit.type !== 'worker' && unit.type !== 'settler') && 
        (tile.terrain === 'ocean' || tile.terrain === 'coast')) {
      return false;
    }
    
    // Nadie puede moverse a las montañas
    if (tile.terrain === 'mountains') {
      return false;
    }
    
    // Verificar si hay otra unidad del mismo tipo (terrestre/naval)
    return true; // Simplificado, en un caso real habría que verificar las unidades en la casilla
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
