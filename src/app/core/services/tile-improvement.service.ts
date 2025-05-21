import { Injectable } from '@angular/core';
import { MapTile, FeatureType } from '../models/map.model';
import { Unit } from '../models/unit.model';
import { BUILDING_TEMPLATES, Building, BuildingType, BuildingUtils } from '../models/building.model';


@Injectable({
  providedIn: 'root'
})
export class TileImprovementService {


  // Tipos de mejoras que requieren eliminar características específicas
  private readonly terrainModifications = {
    'clear_forest': {
      name: 'Talar Bosque',
      description: 'Elimina el bosque de la casilla.',
      turnsToComplete: 3,
      requiredTech: 'mining',
      removesFeature: 'forest' as FeatureType
    },
    'clear_jungle': {
      name: 'Despejar Jungla',
      description: 'Elimina la jungla de la casilla.',
      turnsToComplete: 4,
      requiredTech: 'bronze_working',
      removesFeature: 'jungle' as FeatureType
    },
    'build_road': {
      name: 'Construir Camino',
      description: 'Construye un camino que reduce el costo de movimiento.',
      turnsToComplete: 3,
      requiredTech: 'wheel'
    }
  };

  constructor() { }

  // Obtener todas las mejoras disponibles
  getAvailableImprovements(): Building[] {
    return BUILDING_TEMPLATES;
  }

  static getBuildingByType(type: string): Building | undefined {
    return BUILDING_TEMPLATES.find(b => b.type === type);
  }

  // Comprobar si una casilla puede recibir una mejora específica
  canBuildImprovement(Building: BuildingType, tile: MapTile): boolean {
    if (!tile) {
      console.log(`No se puede construir ${Building}: tile inválida o mejora es 'none'`);
      return false;
    }

    const imp = Building;
    if (!Object.values(BuildingType).includes(imp)) {
      console.log(`La mejora ${imp} no está definida`);
      return false;
    }

    // Comprobar si el terreno es válido para esta mejora
    if (!BuildingUtils.validTerrain(tile.terrain, imp)) {
      console.log(`No se puede construir ${imp} en terreno ${tile.terrain}`);
      return false;
    }

    // Comprobar si hay características del terreno que impidan la mejora
    if (tile.featureType && !BuildingUtils.validFeature(tile.featureType, imp)) {
      console.log(`No se puede construir ${imp} debido a característica inválida: ${tile.featureType}`);
      return false;
    }

    // Verificar si hay bosques o junglas que deben eliminarse primero
    if (tile.featureType === 'forest' || tile.featureType === 'jungle') {
      console.log(`No se puede construir ${imp}: hay ${tile.featureType} que debe eliminarse primero`);
      return false; // No se puede construir hasta eliminar el bosque o jungla
    }

    // Si ya existe la misma mejora en la casilla, no se puede construir de nuevo
    if (tile.building !== 'none') {
      console.log(`No se puede construir ${imp}: ya existe la misma mejora en la casilla`);
      return false;
    }

    console.log(`Se puede construir ${imp} en esta casilla`);

    return true;
  }

  // Obtener mejoras válidas para una casilla específica
  getValidImprovements(tile: MapTile): Building[] {
    if (!tile) {
      return [];
    }

    return Object.values(BUILDING_TEMPLATES)
      .filter(imp => this.canBuildImprovement(imp.type, tile));
  }

  // Comprobar si es posible eliminar una característica de terreno
  canRemoveFeature(tile: MapTile): boolean {
    if (!tile) {
      console.log("No se puede eliminar característica: tile es nulo");
      return false;
    }

    if (!tile.featureType) {
      console.log("No se puede eliminar característica: no hay featureType");
      return false;
    }

    if (tile.featureType === 'none' || tile.featureType === 'mountain') {
      console.log(`No se puede eliminar característica ${tile.featureType}`);
      return false;
    }

    console.log(`Se puede eliminar la característica ${tile.featureType}`);
    return true;
  }

  /*
  applyImprovement(Building: Building, tile: MapTile): void {
    if (!this.canBuildImprovement(Building, tile)) {
      console.warn('No se puede aplicar la mejora a esta casilla');
      return;
    }
    }

    // Asignar la mejora a la casilla
    tile.Building = 'build';

    // Actualizar rendimientos de la casilla
    const imp = this.improvements[improvement];
    if (!imp) return;
    if (imp.yields.food) {
      tile.yields.food += imp.yields.food;
    }
    if (imp.yields.production) {
      tile.yields.production += imp.yields.production;
    }
    if (imp.yields.gold) {
      tile.yields.gold += imp.yields.gold;
    }

    // Si la mejora elimina alguna característica, aplicarlo
    if (imp.removesFeature && tile.featureType === imp.removesFeature) {
      tile.featureType = 'none';
      console.log(`Característica ${imp.removesFeature} eliminada al aplicar la mejora ${improvement}`);
    }


    console.log(`Mejora ${improvement} aplicada a casilla (${tile.x}, ${tile.y}) con rendimientos: `, tile.yields);
    return;
  }*/

  // Remover una característica del terreno
  removeFeature(tile: MapTile): void {
    if (!this.canRemoveFeature(tile)) {
      console.warn('No se puede eliminar la característica de esta casilla');
      return;
    }

    const previousFeature = tile.featureType;

    // Ajustar rendimientos según la característica que se elimina
    switch (previousFeature) {
      case 'forest':
        // Eliminar bosque aumenta producción pero reduce comida
        tile.yields.production += 1;
        if (tile.yields.food > 0) tile.yields.food -= 1;
        break;
      case 'jungle':
        // Eliminar jungla aumenta comida pero reduce defensa
        tile.yields.food += 1;
        if (tile.defense > 1) tile.defense -= 1;
        break;
      case 'oasis':
        // Eliminar oasis aumenta producción pero reduce oro
        tile.yields.production += 1;
        if (tile.yields.gold > 0) tile.yields.gold -= 1;
        break;
      default:
        // Para otras características, no hacer cambios específicos
        break;
    }

    // Establecer la característica a 'none'
    tile.featureType = 'none';

    console.log(`Característica ${previousFeature} eliminada de casilla (${tile.x}, ${tile.y}). Nuevos rendimientos:`, tile.yields);
  }

  // Obtener información sobre una mejora específica
  getImprovementInfo(Building: Building): BuildingType | null {
    return Building.type || null;
  }

  // Obtener el tiempo estimado para completar una mejora
  getImprovementTime(building: Building): number {
    return building.turnsToBuild || 0;
  }

  // Verificar si una unidad trabajadora puede aplicar una mejora específica
  canWorkerBuildImprovement(unit: Unit, improvement: Building, tile: MapTile): boolean {
    // Verificar que la unidad sea de tipo trabajador y esté en la misma posición que la casilla
    if (unit.type !== 'worker' || unit.position.x !== tile.x || unit.position.y !== tile.y) {
      return false;
    }

    // Verificar que la unidad no esté ya construyendo algo
    if (unit.currentAction === 'build' && unit.turnsToComplete !== undefined && unit.turnsToComplete > 0) {
      return false;
    }

    // Verificar si la casilla puede recibir la mejora
    return this.canBuildImprovement(improvement.type, tile);
  }
}
