import { Injectable } from '@angular/core';
import { City, Era, Building, BuildingCategory, CityBuilding } from '../models/city.model';
import { GameMap, MapTile } from '../models/map.model';
import { Unit } from '../models/unit.model';
import { TechnologyService } from './technology.service';

@Injectable({
  providedIn: 'root'
})
export class CityService {
  constructor(private technologyService: TechnologyService) {}

  // Función para crear una nueva ciudad a partir de un colono
  foundCity(
    name: string,
    settler: Unit,
    map: GameMap,
    currentTurn: number
  ): City {
    console.log(`CityService.foundCity: Creando ciudad "${name}" en (${settler.position.x}, ${settler.position.y})`);
    const x = settler.position.x;
    const y = settler.position.y;

    // Crear la estructura de la ciudad con todos los campos requeridos
    const city: City = {
      id: `${x}${y}`, // ID basada en la concatenación de las coordenadas x e y
      name: name,
      ownerId: settler.owner,
      position: { x, y },
      
      // Población y crecimiento
      population: 1,
      maxPopulation: 5, // Límite inicial de población
      populationGrowth: 0,
      citizens: {
        unemployed: 1, // Un ciudadano inicial desempleado
        farmers: 0,
        workers: 0,
        merchants: 0,
        scientists: 0,
        artists: 0,
      },
      
      // Recursos
      food: 0,
      foodPerTurn: 2, // Valor inicial básico
      foodToGrow: 20, // Valor inicial básico
      production: 0,
      productionPerTurn: 1, // Valor inicial básico
      gold: 0,
      goldPerTurn: 1, // Valor inicial básico
      science: 0,
      sciencePerTurn: 1, // Valor inicial básico
      culture: 0,
      culturePerTurn: 1, // Valor inicial básico
      happiness: 0,
      turnsFounded: currentTurn,

      // Era inicial
      era: Era.ANCIENT,

      // Edificios, comenzamos sin edificios
      buildings: [],
      workingTiles: [],
      defense: 5,
      health: 100,
      maxHealth: 100,
      cultureBorder: 1,
      cultureToExpand: 30,
      specialists: {
        scientists: 0,
        merchants: 0,
        artists: 0,
        engineers: 0
      },
      level: 'settlement', // Nivel inicial de la ciudad
    };

    // Marcar la casilla como que tiene una ciudad
    if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
      console.log(`Assigning city "${city.name}" to tile (${x}, ${y})`);
      const tile = map.tiles[y][x];
      tile.city = {
        id: city.id,
        name: city.name,
        level: city.level,
      };

      // Debug
      console.log('Tile updated with city:', tile);
    } else {
      console.error(`Coordinates out of map bounds: (${x}, ${y})`);
    }

    // Actualizar los rendimientos de la ciudad basados en las casillas circundantes
    this.updateCityYields(city, map);

    return city;
  }

  // Actualizar los rendimientos de la ciudad basándose en las casillas trabajadas
  updateCityYields(city: City, map: GameMap): void {
    // Obtener casillas trabajables
    const workableTiles = this.getWorkableTiles(city, map);
    
    // Valores base
    let baseFood = 1;
    let baseProduction = 1;
    let baseGold = 1;
    let baseScience = 1;
    let baseCulture = 1;
    
    // Añadir rendimientos de las casillas centrales (siempre trabajadas)
    const centerTile = map.tiles[city.position.y][city.position.x];
    if (centerTile) {
      // Valores por defecto si la casilla no tiene rendimientos definidos
      baseFood += centerTile.yields?.food || 1;
      baseProduction += centerTile.yields?.production || 1;
      baseGold += centerTile.yields?.gold || 1;
    }
    
    // Actualizar los valores base de la ciudad
    city.foodPerTurn = baseFood;
    city.productionPerTurn = baseProduction;
    city.goldPerTurn = baseGold;
    city.sciencePerTurn = baseScience;
    city.culturePerTurn = baseCulture;
    
    // Añadir los efectos de los edificios y los ciudadanos
    this.refreshCityBuildingEffects(city);
    this.updateCityYieldsBasedOnCitizens(city);
  }

  // Obtener las casillas que pueden ser trabajadas por una ciudad (para implementación futura)
  getWorkableTiles(city: City, map: GameMap): MapTile[] {
    const workableTiles: MapTile[] = [];
    const radius = 2; // Radio de trabajo de la ciudad

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = city.position.x + dx;
        const y = city.position.y + dy;

        if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
          workableTiles.push(map.tiles[y][x]);
        }
      }
    }

    return workableTiles;
  }

  // Disponibilidad de edificios según la era
  private getAvailableBuildingsForEra(era: Era): Building[] {
    // Lista de edificios disponibles para cada era
    const allBuildings: Building[] = [
      // Era Antigua
      {
        id: 'granary',
        name: 'Granero',
        category: BuildingCategory.FOOD,
        level: 1,
        maxLevel: 3,
        era: Era.ANCIENT,
        cost: 60,
        upgradeCost: 120,
        maintenance: 1,
        effects: { food: 2 },
        description: 'Almacena alimentos y mejora la producción de comida',
        icon: '🌾'
      },
      {
        id: 'monument',
        name: 'Monumento',
        category: BuildingCategory.CULTURE,
        level: 1,
        maxLevel: 2,
        era: Era.ANCIENT,
        cost: 40,
        upgradeCost: 80,
        maintenance: 1,
        effects: { culture: 1 },
        description: 'Aumenta la producción cultural de la ciudad',
        icon: '🗿'
      },
      {
        id: 'barracks',
        name: 'Cuartel',
        category: BuildingCategory.MILITARY,
        level: 1,
        maxLevel: 3,
        era: Era.ANCIENT,
        cost: 80,
        upgradeCost: 160,
        maintenance: 2,
        effects: { defense: 3 },
        description: 'Mejora la producción de unidades militares',
        icon: '⚔️'
      },

      // Era Clásica
      {
        id: 'library',
        name: 'Biblioteca',
        category: BuildingCategory.SCIENCE,
        level: 1,
        maxLevel: 3,
        era: Era.CLASSICAL,
        cost: 120,
        upgradeCost: 240,
        maintenance: 2,
        effects: { science: 3 },
        prerequisites: { technology: 'writing' },
        description: 'Aumenta la producción científica de la ciudad',
        icon: '📚'
      },
      {
        id: 'market',
        name: 'Mercado',
        category: BuildingCategory.GOLD,
        level: 1,
        maxLevel: 3,
        era: Era.CLASSICAL,
        cost: 100,
        upgradeCost: 200,
        maintenance: 1,
        effects: { gold: 3 },
        prerequisites: { technology: 'currency' },
        description: 'Aumenta la producción de oro en la ciudad',
        icon: '💰'
      },

      // Era Medieval
      {
        id: 'university',
        name: 'Universidad',
        category: BuildingCategory.SCIENCE,
        level: 1,
        maxLevel: 3,
        era: Era.MEDIEVAL,
        cost: 200,
        upgradeCost: 400,
        maintenance: 3,
        effects: { science: 5 },
        prerequisites: { building: 'library', technology: 'education' },
        description: 'Mejora significativamente la producción científica',
        icon: '🎓'
      },
      {
        id: 'workshop',
        name: 'Taller',
        category: BuildingCategory.PRODUCTION,
        level: 1,
        maxLevel: 3,
        era: Era.MEDIEVAL,
        cost: 120,
        upgradeCost: 240,
        maintenance: 2,
        effects: { production: 3 },
        prerequisites: { technology: 'machinery' },
        description: 'Aumenta la producción de la ciudad',
        icon: '⚒️'
      },

      // Era Renaissance
      {
        id: 'bank',
        name: 'Banco',
        category: BuildingCategory.GOLD,
        level: 1,
        maxLevel: 3,
        era: Era.RENAISSANCE,
        cost: 220,
        upgradeCost: 440,
        maintenance: 3,
        effects: { gold: 5 },
        prerequisites: { building: 'market', technology: 'banking' },
        description: 'Aumenta significativamente la producción de oro',
        icon: '🏦'
      }
    ];

    // Filtrar edificios disponibles según la era actual o anteriores
    return allBuildings.filter(building => {
      const eraOrder = [Era.ANCIENT, Era.CLASSICAL, Era.MEDIEVAL, Era.RENAISSANCE, Era.INDUSTRIAL, Era.MODERN];
      const currentEraIndex = eraOrder.indexOf(era);
      const buildingEraIndex = eraOrder.indexOf(building.era);
      
      return buildingEraIndex <= currentEraIndex;
    });
  }

  // Obtener edificios disponibles para construir en una ciudad
  getAvailableBuildings(city: City): Building[] {
    const availableForEra = this.getAvailableBuildingsForEra(city.era);
    
    // Filtrar edificios que ya están construidos o no cumplen con los requisitos
    return availableForEra.filter(building => {
      // Verificar si ya existe este edificio en la ciudad
      const existingBuilding = city.buildings.find(b => b.id === building.id);
      if (existingBuilding) {
        // Si ya existe, solo mostrar si se puede mejorar
        return existingBuilding.currentLevel < building.maxLevel && !existingBuilding.isUpgrading;
      }
      
      // Verificar si el edificio está en cola de construcción
      if (city.buildingProductionQueue?.some(bp => bp.buildingId === building.id)) {
        return false;
      }
      
      // Verificar prerrequisitos
      if (building.prerequisites) {
        // Verificar edificios prerrequisitos
        if (building.prerequisites.building) {
          const hasPrereqBuilding = city.buildings.some(b => 
            b.id === building.prerequisites?.building && b.currentLevel > 0
          );
          if (!hasPrereqBuilding) return false;
        }
        
        // Verificar tecnologías prerrequisito
        if (building.prerequisites.technology) {
          const hasPrereqTech = this.technologyService.isTechnologyDiscovered(building.prerequisites.technology);
          if (!hasPrereqTech) return false;
        }
      }
      
      return true;
    });
  }

  // Procesar el crecimiento de la ciudad en un turno
  growCity(city: City): void {
    if (!city) return;
    
    // Acumular comida según la producción por turno
    city.food += city.foodPerTurn;
    
    // Verificar si hay suficiente comida para aumentar la población
    if (city.food >= city.foodToGrow) {
      // Aumentar población
      city.population++;
      
      // Añadir nuevo ciudadano como desempleado
      city.citizens.unemployed++;
      
      // Restar la comida consumida para el crecimiento
      city.food -= city.foodToGrow;
      
      // Calcular nueva cantidad de comida necesaria para el siguiente crecimiento
      // La fórmula aumenta progresivamente la dificultad
      city.foodToGrow = Math.floor(city.foodToGrow * 1.5);
      
      // Ajustar límite máximo de población basado en la felicidad
      city.maxPopulation = this.calculateMaxPopulation(city);
      
      console.log(`La ciudad ${city.name} ha crecido a ${city.population} habitantes`);
      
      // Verificar si la ciudad puede pasar de nivel
      this.checkCityLevelUp(city);
    }
  }
  
  // Calcular la población máxima según la felicidad y edificios
  private calculateMaxPopulation(city: City): number {
    // Población base
    let maxPop = 5;
    
    // Añadir bonificación por felicidad
    maxPop += Math.floor(city.happiness / 5);
    
    // Añadir bonificación por edificios específicos
    city.buildings.forEach(building => {
      // Ejemplo: el acueducto aumenta la población máxima
      if (building.id === 'aqueduct') maxPop += 2;
      // Otros edificios pueden tener efectos similares...
    });
    
    return maxPop;
  }
  
  // Verificar si la ciudad puede subir de nivel basado en su población
  private checkCityLevelUp(city: City): void {
    // Criterios de nivel basados en la población
    if (city.population >= 15 && city.level === 'large_town') {
      city.level = 'small_city';
      console.log(`${city.name} ha crecido a una pequeña ciudad`);
    } else if (city.population >= 10 && city.level === 'town') {
      city.level = 'large_town';
      console.log(`${city.name} ha crecido a un pueblo grande`);
    } else if (city.population >= 6 && city.level === 'village') {
      city.level = 'town';
      console.log(`${city.name} ha crecido a un pueblo`);
    } else if (city.population >= 3 && city.level === 'settlement') {
      city.level = 'village';
      console.log(`${city.name} ha crecido a una aldea`);
    }
  }
  
  // Construir un edificio en la ciudad
  constructBuilding(city: City, buildingId: string, currentTurn: number): boolean {
    if (!city) return false;
    
    // Verificar si el edificio ya existe en la ciudad
    if (city.buildings.some(b => b.id === buildingId)) {
      console.log(`El edificio ${buildingId} ya existe en la ciudad ${city.name}`);
      return false;
    }
    
    // Obtener información del edificio
    const building = this.getBuildingById(buildingId);
    if (!building) {
      console.log(`Edificio ${buildingId} no encontrado`);
      return false;
    }
    
    // Verificar si cumple los prerrequisitos
    if (!this.checkBuildingPrerequisites(city, building)) {
      console.log(`La ciudad ${city.name} no cumple los prerrequisitos para construir ${building.name}`);
      return false;
    }
    
    // Crear el edificio en la ciudad
    const cityBuilding: CityBuilding = {
      ...building,
      constructionTurn: currentTurn,
      currentLevel: 1,
      isUpgrading: false
    };
    
    // Añadir el edificio a la lista de la ciudad
    city.buildings.push(cityBuilding);
    
    // Actualizar los rendimientos de la ciudad
    this.updateCityYieldsBasedOnCitizens(city);
    
    console.log(`Edificio ${building.name} construido en ${city.name}`);
    return true;
  }
  
  // Comprobar si se cumplen los prerrequisitos para un edificio
  private checkBuildingPrerequisites(city: City, building: Building): boolean {
    // Verificar era
    const cityEra = city.era;
    if (this.getEraValue(cityEra) < this.getEraValue(building.era)) {
      console.log(`La ciudad ${city.name} no está en la era adecuada para construir ${building.name}`);
      return false;
    }
    
    // Verificar prerrequisitos de edificios
    if (building.prerequisites?.building) {
      const requiredBuilding = building.prerequisites.building;
      if (!city.buildings.some(b => b.id === requiredBuilding)) {
        console.log(`La ciudad ${city.name} necesita tener ${requiredBuilding} para construir ${building.name}`);
        return false;
      }
    }
    
    // Verificar prerrequisitos de tecnología (usando el servicio de tecnología)
    if (building.prerequisites?.technology) {
      const requiredTech = building.prerequisites.technology;
      if (!this.technologyService.isTechnologyDiscovered(requiredTech)) {
        console.log(`Se necesita la tecnología ${requiredTech} para construir ${building.name}`);
        return false;
      }
    }
    
    return true;
  }
  
  // Obtener un valor numérico para cada era (para comparaciones)
  private getEraValue(era: Era): number {
    const eraValues: {[key in Era]: number} = {
      [Era.ANCIENT]: 1,
      [Era.CLASSICAL]: 2,
      [Era.MEDIEVAL]: 3,
      [Era.RENAISSANCE]: 4,
      [Era.INDUSTRIAL]: 5,
      [Era.MODERN]: 6
    };
    return eraValues[era];
  }
  
  // Actualizar la producción de edificios en una ciudad al final del turno
  updateBuildingProduction(city: City, currentTurn: number): void {
    if (!city) return;
    
    // Procesar la construcción de edificios en cola
    this.processBuildingConstruction(city, currentTurn);
    
    // Verificar si hay edificios en actualización/mejora
    city.buildings.forEach(building => {
      if (building.isUpgrading) {
        // Aquí implementaríamos la lógica para procesar la actualización de edificios
      }
    });
    
    // Actualizar los rendimientos basados en todos los edificios activos
    this.refreshCityBuildingEffects(city);
  }
  
  // Refrescar los efectos de todos los edificios en una ciudad
  refreshCityBuildingEffects(city: City): void {
    if (!city) return;
    
    // Establecer valores base
    let baseFood = 1;
    let baseProduction = 1;
    let baseGold = 1;
    let baseScience = 1;
    let baseCulture = 1;
    let baseHappiness = 0;
    let baseDefense = city.defense || 5;
    
    // Sumar los efectos de todos los edificios
    city.buildings.forEach(building => {
      if (building.effects.food) baseFood += building.effects.food;
      if (building.effects.production) baseProduction += building.effects.production;
      if (building.effects.gold) baseGold += building.effects.gold;
      if (building.effects.science) baseScience += building.effects.science;
      if (building.effects.culture) baseCulture += building.effects.culture;
      if (building.effects.happiness) baseHappiness += building.effects.happiness;
      if (building.effects.defense) baseDefense += building.effects.defense;
    });
    
    // Actualizar los valores base de la ciudad
    // Estos valores se combinarán con la contribución de los ciudadanos
    // en updateCityYieldsBasedOnCitizens
    
    // Finalmente, actualizar los rendimientos completos
    this.updateCityYieldsBasedOnCitizens(city);
  }
  
  // Actualizar los efectos de un edificio según su nivel
  private updateBuildingEffects(building: CityBuilding): void {
    // Multiplicador basado en el nivel (nivel 1 = x1, nivel 2 = x1.5, nivel 3 = x2, etc.)
    const multiplier = 1 + ((building.currentLevel - 1) * 0.5);
    
    // Crear una copia de los efectos base del edificio
    const baseEffects = { ...building.effects };
    
    // Aplicar el multiplicador a todos los efectos
    if (baseEffects.food) building.effects.food = Math.round(baseEffects.food * multiplier);
    if (baseEffects.production) building.effects.production = Math.round(baseEffects.production * multiplier);
    if (baseEffects.gold) building.effects.gold = Math.round(baseEffects.gold * multiplier);
    if (baseEffects.science) building.effects.science = Math.round(baseEffects.science * multiplier);
    if (baseEffects.culture) building.effects.culture = Math.round(baseEffects.culture * multiplier);
    if (baseEffects.happiness) building.effects.happiness = Math.round(baseEffects.happiness * multiplier);
    if (baseEffects.defense) building.effects.defense = Math.round(baseEffects.defense * multiplier);
    
    console.log(`Efectos del edificio ${building.name} actualizados según nivel ${building.currentLevel}`);
  }

  // Obtener un edificio por su ID
  private getBuildingById(buildingId: string): Building | undefined {
    // Esta es una implementación básica que debería ser mejorada
    // Idealmente tendríamos un servicio o repositorio dedicado a edificios
    return this.getAvailableBuildingsForEra(Era.ANCIENT)
      .concat(this.getAvailableBuildingsForEra(Era.CLASSICAL))
      .concat(this.getAvailableBuildingsForEra(Era.MEDIEVAL))
      .concat(this.getAvailableBuildingsForEra(Era.RENAISSANCE))
      .concat(this.getAvailableBuildingsForEra(Era.INDUSTRIAL))
      .concat(this.getAvailableBuildingsForEra(Era.MODERN))
      .find(b => b.id === buildingId);
  }

  // Asignar un ciudadano a un rol específico
  assignCitizen(city: City, role: keyof City['citizens']): boolean {
    if (!city) return false;
    
    // Verificar que haya ciudadanos desempleados disponibles
    if (city.citizens.unemployed <= 0) {
      console.log('No hay ciudadanos desempleados disponibles');
      return false;
    }
    
    // Asignar el ciudadano al rol específico
    city.citizens.unemployed--;
    city.citizens[role]++;
    
    // Actualizar rendimientos de la ciudad según el rol asignado
    this.updateCityYieldsBasedOnCitizens(city);
    
    console.log(`Ciudadano asignado como ${role} en ${city.name}`);
    return true;
  }
  
  // Desasignar un ciudadano de un rol específico
  unassignCitizen(city: City, role: keyof City['citizens']): boolean {
    if (!city) return false;
    
    // Verificar que haya ciudadanos asignados en ese rol
    if (role === 'unemployed' || city.citizens[role] <= 0) {
      console.log(`No hay ciudadanos asignados como ${role}`);
      return false;
    }
    
    // Desasignar el ciudadano del rol
    city.citizens[role]--;
    city.citizens.unemployed++;
    
    // Actualizar rendimientos de la ciudad según los cambios
    this.updateCityYieldsBasedOnCitizens(city);
    
    console.log(`Ciudadano desasignado de ${role} en ${city.name}`);
    return true;
  }
  
  // Actualizar los rendimientos de la ciudad basándose en la distribución de ciudadanos
  updateCityYieldsBasedOnCitizens(city: City): void {
    // Valores base proporcionados por el terreno y los edificios
    let baseFood = 1; // Comida base de la ciudad
    let baseProduction = 1; // Producción base de la ciudad
    let baseGold = 1; // Oro base de la ciudad
    let baseScience = 1; // Ciencia base de la ciudad
    let baseCulture = 1; // Cultura base de la ciudad
    
    // Bonificaciones de los edificios (se implementará completamente más adelante)
    city.buildings.forEach(building => {
      if (building.effects.food) baseFood += building.effects.food;
      if (building.effects.production) baseProduction += building.effects.production;
      if (building.effects.gold) baseGold += building.effects.gold;
      if (building.effects.science) baseScience += building.effects.science;
      if (building.effects.culture) baseCulture += building.effects.culture;
    });
    
    // Contribución de los ciudadanos según su especialización
    const foodFromFarmers = city.citizens.farmers * 2;
    const productionFromWorkers = city.citizens.workers * 2;
    const goldFromMerchants = city.citizens.merchants * 2;
    const scienceFromScientists = city.citizens.scientists * 2;
    const cultureFromArtists = city.citizens.artists * 2;
    
    // Actualizar los rendimientos totales
    city.foodPerTurn = baseFood + foodFromFarmers;
    city.productionPerTurn = baseProduction + productionFromWorkers;
    city.goldPerTurn = baseGold + goldFromMerchants;
    city.sciencePerTurn = baseScience + scienceFromScientists;
    city.culturePerTurn = baseCulture + cultureFromArtists;
    
    console.log(`Ciudad ${city.name} - Rendimientos actualizados:`, {
      comida: city.foodPerTurn,
      producción: city.productionPerTurn,
      oro: city.goldPerTurn,
      ciencia: city.sciencePerTurn,
      cultura: city.culturePerTurn
    });
  }

  // Añadir un edificio a la cola de construcción
  addBuildingToQueue(city: City, buildingId: string): boolean {
    if (!city) return false;
    
    // Obtener información del edificio
    const building = this.getBuildingById(buildingId);
    if (!building) {
      console.log(`Edificio ${buildingId} no encontrado`);
      return false;
    }
    
    // Verificar si cumple los prerrequisitos
    if (!this.checkBuildingPrerequisites(city, building)) {
      console.log(`La ciudad ${city.name} no cumple los prerrequisitos para construir ${building.name}`);
      return false;
    }
    
    // Crear el objeto de producción del edificio
    const buildingProduction = {
      buildingId: building.id,
      name: building.name,
      cost: building.cost,
      progress: 0,
      turnsLeft: Math.ceil(building.cost / city.productionPerTurn),
      isUpgrade: false
    };
    
    // Inicializar la cola de producción de edificios si no existe
    if (!city.buildingProductionQueue) {
      city.buildingProductionQueue = [];
    }
    
    // Añadir el edificio a la cola
    city.buildingProductionQueue.push(buildingProduction);
    
    console.log(`Edificio ${building.name} añadido a la cola de construcción de ${city.name}`);
    return true;
  }

  // Procesar la construcción de edificios al final de un turno
  processBuildingConstruction(city: City, currentTurn: number): void {
    if (!city || !city.buildingProductionQueue || city.buildingProductionQueue.length === 0) return;
    
    // Obtener el primer edificio de la cola
    const currentBuilding = city.buildingProductionQueue[0];
    
    // Añadir la producción de este turno
    currentBuilding.progress += city.productionPerTurn;
    
    // Actualizar los turnos restantes
    currentBuilding.turnsLeft = Math.ceil((currentBuilding.cost - currentBuilding.progress) / city.productionPerTurn);
    
    console.log(`Procesando construcción de ${currentBuilding.name} en ${city.name}. Progreso: ${currentBuilding.progress}/${currentBuilding.cost}`);
    
    // Verificar si se ha completado la construcción
    if (currentBuilding.progress >= currentBuilding.cost) {
      // Eliminar de la cola
      city.buildingProductionQueue.shift();
      
      // Si es una mejora, actualizar el nivel del edificio existente
      if (currentBuilding.isUpgrade) {
        const existingBuilding = city.buildings.find(b => b.id === currentBuilding.buildingId);
        if (existingBuilding) {
          existingBuilding.currentLevel++;
          console.log(`${city.name}: ${currentBuilding.name} mejorado a nivel ${existingBuilding.currentLevel}`);
          
          // Actualizar los efectos según el nuevo nivel
          this.updateBuildingEffects(existingBuilding);
        }
      } else {
        // Construir el edificio nuevo
        this.constructBuilding(city, currentBuilding.buildingId, currentTurn);
      }
      
      // Actualizar rendimientos de la ciudad
      this.refreshCityBuildingEffects(city);
    }
  }

  // Añadir la mejora de un edificio existente a la cola de construcción
  upgradeBuildingInQueue(city: City, buildingId: string): boolean {
    if (!city) return false;
    
    // Buscar si el edificio existe en la ciudad
    const existingBuilding = city.buildings.find(b => b.id === buildingId);
    if (!existingBuilding) {
      console.log(`El edificio ${buildingId} no existe en la ciudad ${city.name}`);
      return false;
    }
    
    // Verificar si el edificio ya está en su nivel máximo
    if (existingBuilding.currentLevel >= existingBuilding.maxLevel) {
      console.log(`El edificio ${existingBuilding.name} ya está en su nivel máximo`);
      return false;
    }
    
    // Verificar si el edificio ya está siendo mejorado
    if (existingBuilding.isUpgrading) {
      console.log(`El edificio ${existingBuilding.name} ya está siendo mejorado`);
      return false;
    }
    
    // Verificar si hay alguna tecnología necesaria para la mejora
    if (existingBuilding.prerequisites?.technology) {
      const techRequired = existingBuilding.prerequisites.technology;
      if (!this.technologyService.isTechnologyDiscovered(techRequired)) {
        console.log(`Se necesita la tecnología ${techRequired} para mejorar ${existingBuilding.name}`);
        return false;
      }
    }
    
    // Crear el objeto de producción para la mejora
    const upgradeProduction = {
      buildingId: existingBuilding.id,
      name: `${existingBuilding.name} (nivel ${existingBuilding.currentLevel + 1})`,
      cost: existingBuilding.upgradeCost,
      progress: 0,
      turnsLeft: Math.ceil(existingBuilding.upgradeCost / city.productionPerTurn),
      isUpgrade: true
    };
    
    // Inicializar la cola de producción de edificios si no existe
    if (!city.buildingProductionQueue) {
      city.buildingProductionQueue = [];
    }
    
    // Marcar el edificio como en actualización
    existingBuilding.isUpgrading = true;
    
    // Añadir la mejora a la cola
    city.buildingProductionQueue.push(upgradeProduction);
    
    console.log(`Mejora del edificio ${existingBuilding.name} añadida a la cola de construcción de ${city.name}`);
    return true;
  }
}
