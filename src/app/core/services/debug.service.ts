import { Injectable } from '@angular/core';
import { GameService } from './game.service';

@Injectable({
  providedIn: 'root'
})
export class DebugService {
  constructor(private gameService: GameService) {}
  
  // Para depuración - imprimir estado actual de ciencia
  debugScienceStatus(): void {
    const game = this.gameService.currentGame;
    if (!game) {
      console.log('No hay juego activo');
      return;
    }
    
    console.log('=== ESTADO DE CIENCIA ===');
    console.log(`Ciencia total acumulada: ${game.science}`);
    console.log(`Ciencia por turno: ${game.sciencePerTurn}`);
    
    // Desglose por ciudades
    console.log('Desglose por ciudades:');
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        console.log(`  ${city.name}: ${city.sciencePerTurn} (Científicos: ${city.citizens.scientists})`);
      }
    });
    
    // Investigación actual
    if (game.researchProgress) {
      console.log('Investigación actual:');
      console.log(`  Tecnología: ${game.researchProgress.currentTechnology}`);
      console.log(`  Progreso: ${game.researchProgress.progress}/${game.researchProgress.totalCost}`);
      console.log(`  Turnos estimados: ${game.researchProgress.turnsLeft}`);
    } else {
      console.log('No hay investigación en curso');
    }
    console.log('=======================');
  }
  
  // Corregir cualquier problema en la ciencia
  fixScienceIssues(): void {
    const game = this.gameService.currentGame;
    if (!game) {
      console.log('No hay juego activo');
      return;
    }
    
    console.log('=== CORRIGIENDO PROBLEMAS DE CIENCIA ===');
    console.log('1. Verificando cada ciudad...');
    
    // Recalcular la ciencia por turno sumando la de todas las ciudades
    let recalculatedScience = 0;
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        // Guardar el valor anterior para depuración
        const oldScience = city.sciencePerTurn;
        
        // Asegurarse de que la ciencia por científico sea correcta
        const scientistScience = city.citizens.scientists * 2;
        const baseScience = 1; // Valor base + edificios
        
        // Sumar efectos de edificios
        let buildingScience = 0;
        city.buildings.forEach(building => {
          if (building.effects.science) buildingScience += building.effects.science;
        });
        
        city.sciencePerTurn = baseScience + scientistScience + buildingScience;
        
        // Acumular para el total
        recalculatedScience += city.sciencePerTurn;
        
        console.log(`Ciudad ${city.name}: ${oldScience} → ${city.sciencePerTurn} ciencia/turno (${city.citizens.scientists} científicos)`);
      }
    });
    
    // Actualizar la ciencia por turno en el juego
    if (game.sciencePerTurn !== recalculatedScience) {
      console.log(`2. Corrigiendo ciencia por turno: ${game.sciencePerTurn} => ${recalculatedScience}`);
      game.sciencePerTurn = recalculatedScience;
    } else {
      console.log('2. Los valores de ciencia por turno ya eran correctos');
    }
    
    console.log('3. Forzando actualización del estado del juego...');
    // Llamar al método del gameService para actualizar todo
    this.gameService.calculatePlayerResources();
    
    console.log('4. Forzando actualización de investigación...');
    // Forzar la actualización de investigación sin añadir ciencia
    this.forceResearchUpdate();
    
    console.log('5. Recursos recalculados correctamente');
    
    // Mostrar el estado actualizado
    this.debugScienceStatus();
  }
  
  // Método para forzar la actualización de la investigación sin añadir ciencia
  forceResearchUpdate(): void {
    const game = this.gameService.currentGame;
    if (!game) return;
    
    console.log('=== FORZANDO ACTUALIZACIÓN DE INVESTIGACIÓN ===');
    
    // Recalcular la ciencia proveniente de cada ciudad
    let totalScience = 0;
    game.cities.forEach(city => {
      if (city.ownerId === game.currentPlayerId) {
        console.log(`Ciudad ${city.name}: ${city.sciencePerTurn} ciencia/turno (${city.citizens.scientists} científicos)`);
        totalScience += city.sciencePerTurn;
      }
    });
    
    // Verificar si hay discrepancia con el valor almacenado en el juego
    if (game.sciencePerTurn !== totalScience) {
      console.log(`¡Valor de ciencia incorrecto en el juego! ${game.sciencePerTurn} vs calculado ${totalScience}`);
      game.sciencePerTurn = totalScience;
    }
    
    // Actualizar los turnos restantes para la tecnología actual si hay alguna
    if (game.researchProgress) {
      const oldTurnsLeft = game.researchProgress.turnsLeft;
      game.researchProgress.turnsLeft = Math.ceil(
        (game.researchProgress.totalCost - game.researchProgress.progress) / Math.max(1, game.sciencePerTurn)
      );
      
      console.log(`Turnos para completar ${game.researchProgress.currentTechnology}: ${oldTurnsLeft} → ${game.researchProgress.turnsLeft}`);
    }
    
    // Notificar los cambios
    this.gameService.updateGame();
  }
}
