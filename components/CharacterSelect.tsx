
import React from 'react';
import { motion } from 'framer-motion';

interface Props {
  onSelect: (type: string, color: string) => void;
}

const AIRCRAFT = [
  { id: 'interceptor', name: 'X-1 INTERCEPTOR', desc: 'Superior Speed / Agile', color: '#3b82f6', icon: '🚀' },
  { id: 'bomber', name: 'G-7 STRIKER', desc: 'Heavy Hull / High Power', color: '#ef4444', icon: '🛰️' },
  { id: 'stealth', name: 'SHADOW WING', desc: 'Balanced / Low Vis', color: '#a855f7', icon: '🦇' },
];

const CharacterSelect: React.FC<Props> = ({ onSelect }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center h-full p-8 bg-black"
    >
      <div className="text-center mb-16">
        <h2 className="text-4xl font-orbitron font-black mb-2 text-white">SELECT AIRFRAME</h2>
        <div className="h-1 w-24 bg-blue-500 mx-auto" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-6xl">
        {AIRCRAFT.map((air) => (
          <motion.div
            key={air.id}
            whileHover={{ y: -10, borderColor: air.color }}
            onClick={() => onSelect(air.id, air.color)}
            className="bg-gray-900/50 border border-white/10 p-10 rounded-sm cursor-pointer group transition-all backdrop-blur-sm"
          >
            <div className="text-5xl mb-8 opacity-50 group-hover:opacity-100 transition-opacity">{air.icon}</div>
            <h3 className="text-2xl font-orbitron font-bold mb-3 text-white">{air.name}</h3>
            <p className="text-gray-500 font-mono text-xs uppercase mb-8 leading-relaxed">{air.desc}</p>
            <div 
              className="h-[2px] w-full" 
              style={{ backgroundColor: air.color }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CharacterSelect;
