import { Injectable } from '@angular/core';
import { GameMap, MapTile, TerrainType, FeatureType, ImprovementType } from '../models/map.model';
import { Unit } from '../models/unit.model';

export interface TileImprovement {
  type: ImprovementType;
  name: string;
  description: string;
  turnsToComplete: number;
  requiredTech?: string;
  validTerrains: TerrainType[];
  invalidFeatures: FeatureType[];
  yields: {
    food?: number;
    production?: number;
    gold?: number;
  };
  removesFeature?: FeatureType;
}

@Injectable({
  providedIn: 'root'
})
export class TileImprovementService {
  private improvements: Record<ImprovementType, TileImprovement> = {
    'farm': {
      type: 'farm',
      name: 'Granja',
      description: 'Mejora la producción de alimentos en casillas de llanura y pradera.',
      turnsToComplete: 5,
      validTerrains: ['plains', 'grassland'],
      invalidFeatures: ['mountain', 'none'],
      yields: {
        food: 1
      }
    },
    'mine': {
      type: 'mine',
      name: 'Mina',
      description: 'Mejora la producción en casillas de montaña y colina.',
      turnsToComplete: 6,
      requiredTech: 'mining',
      validTerrains: ['plains', 'grassland', 'desert', 'rocky'],
      invalidFeatures: ['none'],
      yields: {
        production: 1
      }
    },
    'plantation': {
      type: 'plantation',
      name: 'Plantación',
      description: 'Obtiene beneficio de recursos como plátanos o especias.',
      turnsToComplete: 5,
      requiredTech: 'calendar',
      validTerrains: ['plains', 'grassland', 'desert'],
      invalidFeatures: ['mountain', 'none'],
      yields: {
        food: 1,
        gold: 1
      }
    },
    'camp': {
      type: 'camp',
      name: 'Campamento',
      description: 'Aprovecha los recursos de caza.',
      turnsToComplete: 4,
      requiredTech: 'trapping',
      validTerrains: ['plains', 'grassland', 'desert', 'rocky'],
      invalidFeatures: ['mountain', 'none'],
      yields: {
        gold: 1
      }
    },
    'pasture': {
      type: 'pasture',
      name: 'Pastizal',
      description: 'Aprovecha recursos como caballos y ganado.',
      turnsToComplete: 4,
      requiredTech: 'animal_husbandry',
      validTerrains: ['plains', 'grassland', 'desert'],
      invalidFeatures: ['mountain', 'none'],
      yields: {
        food: 1,
        production: 1
      }
    },
    'fishing_boats': {
      type: 'fishing_boats',
      name: 'Barcos de Pesca',
      description: 'Mejora las casillas de agua con recursos de pesca.',
      turnsToComplete: 4,
      requiredTech: 'sailing',
      validTerrains: ['water', 'waterocean', 'coast_top', 'coast_right', 'coast_down', 'coast_left', 
                      'coast15', 'coast16', 'coast17', 'coast18', 'coast19', 'coast20', 
                      'coast21', 'coast22', 'coast23', 'coast24', 'coast25', 'coast26',
                      'coast27', 'coast28', 'coast29', 'coast30', 'coast31', 'coast32', 
                      'coast33', 'coast34', 'water_ocean1', 'water_ocean2', 'water_ocean3',
                      'water_ocean4', 'water_ocean5', 'water_ocean6', 'water_ocean7', 'water_ocean8'],
      invalidFeatures: ['mountain', 'none'],
      yields: {
        food: 1,
        gold: 1
      }
    },
    'none': {
      type: 'none',
      name: 'Sin mejora',
      description: 'Terreno sin mejoras',
      turnsToComplete: 0,
      validTerrains: [] as TerrainType[],
      invalidFeatures: [] as FeatureType[],
      yields: {}
    }
  };

  // Tipos de mejoras que requieren eliminar características específicas
  private terrainModifications = {
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
  getAvailableImprovements(): TileImprovement[] {
    return Object.values(this.improvements).filter(imp => imp.type !== 'none');
  }

  // Comprobar si una casilla puede recibir una mejora específica
  canBuildImprovement(improvement: ImprovementType, tile: MapTile): boolean {
    if (!tile || improvement === 'none') {
      return false;
    }

    const imp = this.improvements[improvement];
    
    // Comprobar si el terreno es válido para esta mejora
    if (!imp.validTerrains.includes(tile.terrain)) {
      return false;
    }

    // Comprobar si hay características del terreno que impidan la mejora
    if (tile.featureType && imp.invalidFeatures.includes(tile.featureType)) {
      return false;
    }

    // Si ya existe la misma mejora en la casilla, no se puede construir de nuevo
    if (tile.improvement === improvement) {
      return false;
    }

    return true;
  }

  // Obtener mejoras válidas para una casilla específica
  getValidImprovements(tile: MapTile): TileImprovement[] {
    if (!tile) {
      return [];
    }

    return Object.values(this.improvements)
      .filter(imp => imp.type !== 'none' && this.canBuildImprovement(imp.type, tile));
  }

  // Comprobar si es posible eliminar una característica de terreno
  canRemoveFeature(tile: MapTile): boolean {
    if (!tile || !tile.featureType || tile.featureType === 'none' || tile.featureType === 'mountain') {
      return false;
    }
    
    return true;
  }

  // Aplicar una mejora a una casilla
  applyImprovement(improvement: ImprovementType, tile: MapTile): void {
    if (!this.canBuildImprovement(improvement, tile)) {
      console.warn('No se puede aplicar la mejora a esta casilla');
      return;
    }
    
    // Si ya había una mejora anteriormente, quitar sus beneficios
    if (tile.improvement && tile.improvement !== 'none') {
      const oldImp = this.improvements[tile.improvement];
      if (oldImp) {
        if (oldImp.yields.food) {
          tile.yields.food -= oldImp.yields.food;
        }
        if (oldImp.yields.production) {
          tile.yields.production -= oldImp.yields.production;
        }
        if (oldImp.yields.gold) {
          tile.yields.gold -= oldImp.yields.gold;
        }
      }
    }
    
    // Asignar la mejora a la casilla
    tile.improvement = improvement;
    
    // Actualizar rendimientos de la casilla
    const imp = this.improvements[improvement];
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
  }

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
  getImprovementInfo(type: ImprovementType): TileImprovement | null {
    return this.improvements[type] || null;
  }
  
  // Obtener el tiempo estimado para completar una mejora
  getImprovementTime(improvement: ImprovementType): number {
    return this.improvements[improvement]?.turnsToComplete || 0;
  }
  
  // Verificar si una unidad trabajadora puede aplicar una mejora específica
  canWorkerBuildImprovement(unit: Unit, improvement: ImprovementType, tile: MapTile): boolean {
    // Verificar que la unidad sea de tipo trabajador y esté en la misma posición que la casilla
    if (unit.type !== 'worker' || unit.position.x !== tile.x || unit.position.y !== tile.y) {
      return false;
    }
    
    // Verificar que la unidad no esté ya construyendo algo
    if (unit.currentAction === 'build' && unit.turnsToComplete !== undefined && unit.turnsToComplete > 0) {
      return false;
    }
    
    // Verificar si la casilla puede recibir la mejora
    return this.canBuildImprovement(improvement, tile);
  }
}
