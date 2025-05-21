// Modelo de civilizaciones para el juego

export interface Civilization {
  id: string; // 'spain', 'egypt', etc.
  name: string; // Nombre visible
  leader: string; // Nombre del líder (opcional)
  description: string; // Descripción de la civilización
  bonus: string; // Ventaja especial
  startingPosition: { x: number; y: number } | null;
  isPlayer: boolean; // haz otro boolean para indicar si el jugador ha encontrado la civilización
  isDiscovered: boolean;
  cooldown: number; // Indica el cooldown de interacción (en turnos)
}

export const CIVILIZATIONS: Civilization[] = [
  {
    id: 'spain',
    name: 'España',
    leader: 'Isabel I',
    description: 'Imperio marítimo y comercial.',
    bonus: 'Bonificación de oro y movimiento extra en barcos.',
    startingPosition: {x: 25, y: 15},
    isPlayer: false,
    isDiscovered: false,
    cooldown: 0

  },
  {
    id: 'egypt',
    name: 'Egipto',
    leader: 'Cleopatra',
    description: 'Civilización del Nilo, constructores de maravillas.',
    bonus: 'Construcción de maravillas más rápida.',
    startingPosition: {x: 42, y: 25},
    isPlayer: false,
    isDiscovered: false,
    cooldown: 0
  },
  {
    id: 'greece',
    name: 'Grecia',
    leader: 'Socrates',
    description: 'Cuna de la filosofía y la democracia.',
    bonus: 'Bonificación de ciencia y cultura.',
    startingPosition: {x: 40, y: 40} ,
    isPlayer: false,
    isDiscovered: false,
    cooldown: 0
  },
  {
    id: 'france',
    name: 'Francia',
    leader: 'Napoleón',
    description: 'Potencia cultural y militar.',
    bonus: 'Unidades militares más baratas y cultura extra.',
    startingPosition: null,
    isPlayer: false,
    isDiscovered: false,
    cooldown: 0
  },
  {
    id: 'rome',
    name: 'Roma',
    leader: 'Julio César',
    description: 'Imperio expansivo y disciplinado.',
    bonus: 'Ciudades fundadas empiezan con edificios básicos.',
    startingPosition: null,
    isPlayer: false,
    isDiscovered: false,
    cooldown: 0
  },
  {
    id: 'china',
    name: 'China',
    leader: 'Qin Shi Huang', // Cambiado de Confucio a Qin Shi Huang
    description: 'Civilización milenaria de grandes inventos.',
    bonus: 'Progreso tecnológico acelerado.',
    startingPosition: null,
    isPlayer: false,
    isDiscovered: false,
    cooldown: 0
  }
];
