
export enum GameState {
  MENU = 'MENU',
  AIRCRAFT_SELECT = 'AIRCRAFT_SELECT',
  LOADING = 'LOADING',
  DOGFIGHT = 'DOGFIGHT',
  GAME_OVER = 'GAME_OVER'
}

export interface AircraftStats {
  name: string;
  hull: number;
  maxHull: number;
  energy: number;
  speed: number;
  agility: number;
  firepower: number;
  specialWeapon: string;
  color: string;
  callsign: string;
}

export interface GameMessage {
  text: string;
  type: 'tactical' | 'combat' | 'awacs';
}
