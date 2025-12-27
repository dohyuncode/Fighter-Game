
import React, { useState, useCallback } from 'react';
import { GameState, AircraftStats, GameMessage } from './types';
import { generateAircraftIntel, getAWACSCommentary } from './services/geminiService';
import MainMenu from './components/MainMenu';
import CharacterSelect from './components/CharacterSelect';
import GameViewport from './components/GameViewport';
import HUD from './components/HUD';
import { AnimatePresence, motion } from 'framer-motion';

const INITIAL_AIRCRAFT: AircraftStats = {
  name: 'X-J-20 Interceptor',
  hull: 100,
  maxHull: 100,
  energy: 100,
  speed: 1,
  agility: 1,
  firepower: 10,
  specialWeapon: 'Heatseeker',
  color: '#3b82f6',
  callsign: 'Apex'
};

const ENEMY_AIRCRAFT: AircraftStats = {
  name: 'Drone Swarm Alpha',
  hull: 100,
  maxHull: 100,
  energy: 100,
  speed: 0.9,
  agility: 1.2,
  firepower: 8,
  specialWeapon: 'Flak Cannon',
  color: '#ef4444',
  callsign: 'Target 01'
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [playerStats, setPlayerStats] = useState<AircraftStats>(INITIAL_AIRCRAFT);
  const [enemyStats, setEnemyStats] = useState<AircraftStats>(ENEMY_AIRCRAFT);
  const [messages, setMessages] = useState<GameMessage[]>([]);
  const [commentary, setCommentary] = useState<string>("Skies are clear, Pilot. Engage at will.");
  
  // Tracking states
  const [enemyScreenPos, setEnemyScreenPos] = useState<{x: number, y: number, z: number} | null>(null);
  const [altitude, setAltitude] = useState<number>(0);

  const addMessage = (text: string, type: 'tactical' | 'combat' | 'awacs' = 'tactical') => {
    setMessages(prev => [{ text, type }, ...prev].slice(0, 5));
  };

  const handleStartGame = () => {
    setGameState(GameState.AIRCRAFT_SELECT);
  };

  const handleAircraftSelected = async (type: string, color: string) => {
    setGameState(GameState.LOADING);
    const intel = await generateAircraftIntel(type);
    setPlayerStats({
      ...INITIAL_AIRCRAFT,
      name: intel.squadron + " " + type.toUpperCase(),
      callsign: intel.callsign,
      specialWeapon: intel.ability,
      color: color
    });
    setGameState(GameState.DOGFIGHT);
    addMessage(`Vectoring to mission area. Welcome, ${intel.callsign}.`, 'awacs');
  };

  const handleMissionEnd = (winner: 'player' | 'enemy') => {
    setGameState(GameState.GAME_OVER);
    addMessage(winner === 'player' ? "Target Neutalized. Return to base." : "Pilot Down. Search and Rescue deployed.", 'awacs');
  };

  const updateTactical = useCallback(async (lastAction: string) => {
    const text = await getAWACSCommentary(playerStats.hull, enemyStats.hull, lastAction);
    setCommentary(text || "Negative contact. Keep searching.");
  }, [playerStats.hull, enemyStats.hull]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black text-white">
      <AnimatePresence mode="wait">
        {gameState === GameState.MENU && (
          <MainMenu key="menu" onStart={handleStartGame} />
        )}

        {gameState === GameState.AIRCRAFT_SELECT && (
          <CharacterSelect key="select" onSelect={handleAircraftSelected} />
        )}

        {gameState === GameState.LOADING && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center h-full"
          >
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-2xl font-orbitron animate-pulse uppercase tracking-widest text-blue-500">Initializing Avionics...</h2>
          </motion.div>
        )}

        {(gameState === GameState.DOGFIGHT || gameState === GameState.GAME_OVER) && (
          <>
            <GameViewport 
              playerStats={playerStats}
              enemyStats={enemyStats}
              onDamagePlayer={(dmg) => setPlayerStats(s => ({...s, hull: Math.max(0, s.hull - dmg)}))}
              onDamageEnemy={(dmg) => setEnemyStats(s => ({...s, hull: Math.max(0, s.hull - dmg)}))}
              onAction={updateTactical}
              onEnd={handleMissionEnd}
              isGameOver={gameState === GameState.GAME_OVER}
              setEnemyScreenPos={setEnemyScreenPos}
              setAltitude={setAltitude}
            />
            
            <HUD 
              player={playerStats} 
              enemy={enemyStats} 
              messages={messages} 
              commentary={commentary}
              enemyScreenPos={enemyScreenPos}
              altitude={altitude}
              onReset={() => {
                setGameState(GameState.MENU);
                setPlayerStats(INITIAL_AIRCRAFT);
                setEnemyStats(ENEMY_AIRCRAFT);
                setMessages([]);
                setEnemyScreenPos(null);
                setAltitude(0);
              }}
              isGameOver={gameState === GameState.GAME_OVER}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
