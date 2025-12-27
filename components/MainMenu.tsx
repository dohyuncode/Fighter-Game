
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  onStart: () => void;
}

const MainMenu: React.FC<Props> = ({ onStart }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full bg-[#050505] relative overflow-hidden"
    >
      <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full border-[1px] border-blue-500/20 grid grid-cols-12" />
      </div>

      <motion.div
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-7xl md:text-9xl font-orbitron font-black tracking-tight text-white">
          SKY <span className="text-blue-500">STRIKE</span>
        </h1>
        <p className="text-sm md:text-lg font-mono text-blue-300 mt-2 tracking-[1em] uppercase opacity-70">Gemini Tactical Engine</p>
      </motion.div>

      <div className="space-y-4 w-full max-w-sm z-10">
        <button 
          onClick={onStart}
          className="w-full py-4 bg-white text-black hover:bg-blue-500 hover:text-white transition-all rounded-sm font-orbitron font-bold text-xl tracking-widest uppercase"
        >
          Scramble Fighters
        </button>
        <button className="w-full py-3 bg-transparent border border-white/10 text-white/30 rounded-sm font-mono text-xs tracking-widest uppercase cursor-not-allowed">
          Multiplayer Uplink: OFFLINE
        </button>
      </div>

      <div className="absolute bottom-12 flex gap-12 text-[10px] font-mono text-gray-700 uppercase tracking-widest">
        <span>Combat Sim v4.0</span>
        <span>Neural Pilot Active</span>
        <span>Secure Channel 09</span>
      </div>
    </motion.div>
  );
};

export default MainMenu;
