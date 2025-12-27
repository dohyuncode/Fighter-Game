
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AircraftStats, GameMessage } from '../types';

interface Props {
  player: AircraftStats;
  enemy: AircraftStats;
  messages: GameMessage[];
  commentary: string;
  onReset: () => void;
  isGameOver: boolean;
  enemyScreenPos: { x: number, y: number, z: number } | null;
  altitude: number;
}

const HUD: React.FC<Props> = ({ player, enemy, messages, commentary, onReset, isGameOver, enemyScreenPos, altitude }) => {
  const [missileReady, setMissileReady] = useState(true);

  // Logic for off-screen indicator
  let indicatorX = 0;
  let indicatorY = 0;
  let isOffScreen = false;
  let isOnScreen = false;
  let rotation = 0;

  if (enemyScreenPos) {
    if (enemyScreenPos.z > 1) {
      isOffScreen = true;
      indicatorX = -enemyScreenPos.x;
      indicatorY = -enemyScreenPos.y;
    } else {
      indicatorX = enemyScreenPos.x;
      indicatorY = enemyScreenPos.y;
      if (Math.abs(indicatorX) > 0.9 || Math.abs(indicatorY) > 0.9) {
        isOffScreen = true;
      } else {
        isOnScreen = true;
      }
    }
    if (isOffScreen) {
      const mag = Math.sqrt(indicatorX * indicatorX + indicatorY * indicatorY);
      indicatorX /= mag;
      indicatorY /= mag;
      rotation = Math.atan2(indicatorY, indicatorX);
    }
  }

  // Monitor missile firing from keyboard listener in this component just for UI state
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && missileReady && !isGameOver) {
        setMissileReady(false);
        setTimeout(() => setMissileReady(true), 3000);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [missileReady, isGameOver]);

  return (
    <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between select-none">
      {/* Target Tracker (Off-Screen) */}
      <AnimatePresence>
        {isOffScreen && !isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              left: `${50 + indicatorX * 45}%`,
              top: `${50 - indicatorY * 45}%`,
              transform: `translate(-50%, -50%) rotate(${rotation}rad)`,
            }}
            className="w-0 h-0 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent border-l-[15px] border-l-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]"
          />
        )}
      </AnimatePresence>

      {/* Target Tracker (On-Screen) */}
      {isOnScreen && enemyScreenPos && !isGameOver && (
        <div
          style={{
            position: 'absolute',
            left: `${50 + enemyScreenPos.x * 50}%`,
            top: `${50 - enemyScreenPos.y * 50}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="w-16 h-16 border-2 border-red-500/80 rotate-45 flex items-center justify-center animate-pulse"
        >
          <div className="w-1 h-1 bg-red-500" />
          <div className="absolute -top-6 text-[10px] font-orbitron text-red-500 font-bold whitespace-nowrap">
            LOCK: {enemy.callsign}
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex justify-between items-start">
        <div className="bg-black/60 backdrop-blur-md p-4 border-l-4 border-blue-500 rounded-sm">
          <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">UNIT: {player.callsign}</div>
          <div className="text-2xl font-orbitron font-black text-white uppercase">{player.hull > 0 ? 'Online' : 'Signal Lost'}</div>
          <div className="mt-2 w-48 h-1.5 bg-gray-900 rounded-full overflow-hidden">
            <motion.div className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" animate={{ width: `${player.hull}%` }} />
          </div>
          <div className="text-[9px] font-mono mt-1 text-blue-300">HULL: {Math.ceil(player.hull)}%</div>
        </div>

        {/* Altitude Altimeter */}
        <div className="flex flex-col items-center">
            <div className={`text-4xl font-orbitron font-black transition-colors ${altitude < 15 ? 'text-red-500 animate-bounce' : 'text-white/20'}`}>
                {altitude < 15 && (altitude < 5 ? 'TERRAIN ALERT' : 'PULL UP')}
            </div>
            <div className="mt-2 px-4 py-1 bg-black/60 border border-white/20 font-mono text-xs">
                ALT: <span className={altitude < 20 ? 'text-red-500' : 'text-green-400'}>{Math.max(0, Math.ceil(altitude))}m</span>
            </div>
        </div>

        <div className="bg-black/60 backdrop-blur-md p-4 border-r-4 border-red-500 rounded-sm text-right">
          <div className="text-[10px] font-mono text-red-400 uppercase tracking-widest">BOGEY: {enemy.callsign}</div>
          <div className="text-2xl font-orbitron font-black text-white uppercase">{enemy.hull > 0 ? 'Engaged' : 'Destroyed'}</div>
          <div className="mt-2 w-48 h-1.5 bg-gray-900 rounded-full overflow-hidden ml-auto">
            <motion.div className="h-full bg-red-500 shadow-[0_0_10px_#ef4444]" animate={{ width: `${enemy.hull}%` }} style={{ float: 'right' }} />
          </div>
          <div className="text-[9px] font-mono mt-1 text-red-300">TGT HP: {Math.ceil(enemy.hull)}%</div>
        </div>
      </div>

      {/* Middle: Tactical Overlay */}
      <div className="flex flex-col items-center gap-4">
        <AnimatePresence mode="wait">
          <motion.div 
            key={commentary}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/10 border border-blue-500/30 px-6 py-2 rounded-sm text-center backdrop-blur-sm"
          >
            <span className="text-[10px] font-mono text-blue-400 block mb-1">TACTICAL UPLINK</span>
            <p className="text-blue-100 font-orbitron text-xs uppercase tracking-wider italic">"{commentary}"</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: Mini-Radar & Logs */}
      <div className="flex justify-between items-end">
        <div className="w-64 space-y-2 opacity-60">
            <AnimatePresence>
                {messages.map((m, i) => (
                    <motion.div 
                        key={`${m.text}-${i}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`text-[9px] font-mono p-1 px-2 border-l-2 ${m.type === 'awacs' ? 'border-blue-500 text-blue-300' : 'border-red-500 text-red-300'}`}
                    >
                        {m.text}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>

        {/* Weapons Status Display */}
        <div className="flex flex-col items-center gap-2">
           <div className="flex gap-4">
              <div className="flex flex-col items-center bg-black/40 border border-white/10 p-2 rounded w-20">
                 <span className="text-[8px] text-gray-400 mb-1">CANNON</span>
                 <div className="w-full h-1 bg-green-500/50" />
                 <span className="text-[10px] text-white mt-1">READY</span>
              </div>
              <div className={`flex flex-col items-center bg-black/40 border p-2 rounded w-24 transition-colors ${missileReady ? 'border-red-500/50' : 'border-white/10'}`}>
                 <span className="text-[8px] text-gray-400 mb-1">TACTICAL MISSILE</span>
                 <div className="w-full h-1 bg-gray-800 overflow-hidden">
                    <motion.div 
                      className="h-full bg-red-500"
                      initial={{ width: '100%' }}
                      animate={{ width: missileReady ? '100%' : '0%' }}
                      transition={{ duration: missileReady ? 0.2 : 3, ease: "linear" }}
                    />
                 </div>
                 <span className={`text-[10px] mt-1 ${missileReady ? 'text-red-400 animate-pulse' : 'text-gray-600'}`}>
                    {missileReady ? 'LOCKED' : 'RELOADING'}
                 </span>
              </div>
           </div>
           
           {/* Tactical Radar */}
           <div className="relative w-24 h-24 rounded-full border border-white/20 bg-black/40 backdrop-blur-sm overflow-hidden flex items-center justify-center">
               <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-10">
                   <div className="border border-white/50" /><div className="border border-white/50" /><div className="border border-white/50" /><div className="border border-white/50" />
               </div>
               <div className="w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_5px_#3b82f6]" />
               {enemyScreenPos && (
                   <motion.div 
                      animate={{ 
                          x: enemyScreenPos.x * 30, 
                          y: -enemyScreenPos.z * 30 
                      }}
                      className="w-1 h-1 bg-red-500 rounded-full shadow-[0_0_5px_#ef4444] absolute" 
                   />
               )}
           </div>
        </div>

        <div className="w-64 text-right">
            <div className="text-[9px] font-mono text-white/40 mb-2 space-y-1">
                <div>[W/S] PITCH [A/D] DIRECTION</div>
                <div>[Q/E] ANGLE [SHIFT] AFTERBURNER</div>
                <div>[SPACE] CANNON [F] MISSILE</div>
            </div>
        </div>
      </div>

      {isGameOver && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center pointer-events-auto z-50">
              <h1 className={`text-6xl font-orbitron font-black mb-4 ${player.hull > 0 ? 'text-blue-500' : 'text-red-500 animate-pulse'}`}>
                  {player.hull > 0 ? 'MISSION COMPLETE' : 'MISSION FAILED'}
              </h1>
              <p className="text-gray-500 mb-12 font-mono uppercase tracking-[0.5em] text-center max-w-md">
                {player.hull > 0 ? 'Enemy neutralized. Air superiority achieved.' : 'Combat aircraft lost. Tactical mission compromise.'}
              </p>
              <button 
                onClick={onReset}
                className="px-12 py-4 border-2 border-white/20 text-white font-orbitron hover:border-white hover:bg-white hover:text-black transition-all"
              >
                  REBOOT SIMULATOR
              </button>
          </div>
      )}
    </div>
  );
};

export default HUD;
