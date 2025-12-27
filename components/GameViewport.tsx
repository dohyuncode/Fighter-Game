
import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Environment, Sky } from '@react-three/drei';
import * as THREE from 'three';
import { AircraftStats } from '../types';

interface Props {
  playerStats: AircraftStats;
  enemyStats: AircraftStats;
  onDamagePlayer: (dmg: number) => void;
  onDamageEnemy: (dmg: number) => void;
  onAction: (action: string) => void;
  onEnd: (winner: 'player' | 'enemy') => void;
  isGameOver: boolean;
  setEnemyScreenPos: (pos: { x: number, y: number, z: number } | null) => void;
  setAltitude: (alt: number) => void;
}

const Jet = ({ color, ...props }: any) => (
  <group {...props}>
    {/* @ts-ignore */}
    <mesh castShadow>
      {/* @ts-ignore */}
      <boxGeometry args={[0.4, 0.2, 1.5]} />
      {/* @ts-ignore */}
      <meshStandardMaterial color={color} />
    {/* @ts-ignore */}
    </mesh>
    {/* Wings */}
    {/* @ts-ignore */}
    <mesh castShadow position={[0, 0, 0]}>
      {/* @ts-ignore */}
      <boxGeometry args={[2.5, 0.05, 0.5]} />
      {/* @ts-ignore */}
      <meshStandardMaterial color={color} />
    {/* @ts-ignore */}
    </mesh>
    {/* Tail */}
    {/* @ts-ignore */}
    <mesh castShadow position={[0, 0.2, 0.6]}>
      {/* @ts-ignore */}
      <boxGeometry args={[0.05, 0.4, 0.3]} />
      {/* @ts-ignore */}
      <meshStandardMaterial color={color} />
    {/* @ts-ignore */}
    </mesh>
    {/* Cockpit */}
    {/* @ts-ignore */}
    <mesh position={[0, 0.15, -0.3]}>
      {/* @ts-ignore */}
      <sphereGeometry args={[0.15, 8, 8]} />
      {/* @ts-ignore */}
      <meshStandardMaterial color="#88ffff" transparent opacity={0.6} />
    {/* @ts-ignore */}
    </mesh>
  </group>
);

const Missile = ({ position, rotation, targetPos }: { position: THREE.Vector3, rotation: THREE.Euler, targetPos: THREE.Vector3 }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  const [active, setActive] = useState(true);

  useFrame((state, delta) => {
    if (!meshRef.current || !active) return;
    
    // Homing logic
    const toTarget = targetPos.clone().sub(meshRef.current.position).normalize();
    const currentDir = new THREE.Vector3(0, 0, -1).applyQuaternion(meshRef.current.quaternion);
    currentDir.lerp(toTarget, 0.05); // Adjust homing strength
    
    meshRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), currentDir);
    meshRef.current.translateZ(-1.5); // Fast missile speed

    // Self-destruct after 3 seconds
    if (Date.now() - startTime.current > 3000) {
      setActive(false);
    }
  });

  if (!active) return null;

  return (
    // @ts-ignore
    <mesh ref={meshRef} position={position} rotation={rotation}>
      {/* @ts-ignore */}
      <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
      {/* @ts-ignore */}
      <meshStandardMaterial color="#ff4400" emissive="#ff0000" emissiveIntensity={2} />
    {/* @ts-ignore */}
    </mesh>
  );
};

const FlightEngine = ({ 
  playerStats, 
  enemyStats, 
  onDamagePlayer, 
  onDamageEnemy, 
  onAction, 
  onEnd, 
  isGameOver,
  setEnemyScreenPos,
  setAltitude
}: Props) => {
  const playerRef = useRef<THREE.Group>(null);
  const enemyRef = useRef<THREE.Group>(null);
  const keys = useRef<Record<string, boolean>>({});
  const lastFireTime = useRef(0);
  const lastMissileTime = useRef(0);
  const speed = useRef(0.25);
  const [missiles, setMissiles] = useState<{ id: number, pos: THREE.Vector3, rot: THREE.Euler }[]>([]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = true;
    const handleUp = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => {
      window.removeEventListener('keydown', handleDown);
      window.removeEventListener('keyup', handleUp);
    };
  }, []);

  useFrame((state, delta) => {
    if (isGameOver || !playerRef.current || !enemyRef.current) return;

    const p = playerRef.current;
    const e = enemyRef.current;
    
    // --- PLAYER FLIGHT ---
    // W/S for Pitch
    if (keys.current['w']) p.rotateX(2 * delta);
    if (keys.current['s']) p.rotateX(-2 * delta);
    
    // A/D for Yaw (Turning Left/Right)
    if (keys.current['a']) p.rotateY(2 * delta);
    if (keys.current['d']) p.rotateY(-2 * delta);
    
    // Q/E for Roll (Angle CCW/CW)
    if (keys.current['q']) p.rotateZ(3 * delta);
    if (keys.current['e']) p.rotateZ(-3 * delta);

    if (keys.current['shift']) speed.current = THREE.MathUtils.lerp(speed.current, 0.8, 0.1);
    else speed.current = THREE.MathUtils.lerp(speed.current, 0.3, 0.05);

    p.translateZ(-speed.current);

    // Ground Collision Check (Floor is at -50)
    const currentAlt = p.position.y + 50;
    setAltitude(currentAlt);
    if (currentAlt < 1.0) {
      onAction("TERRAIN IMPACT");
      onEnd('enemy');
      return;
    }

    // Camera follow
    const offset = new THREE.Vector3(0, 0.8, 4);
    offset.applyQuaternion(p.quaternion);
    state.camera.position.lerp(p.position.clone().add(offset), 0.15);
    state.camera.lookAt(p.position);

    // Calculate Enemy Screen Position for HUD
    const vector = e.position.clone();
    vector.project(state.camera);
    setEnemyScreenPos({ x: vector.x, y: vector.y, z: vector.z });

    // Shooting: Autocannon
    const now = Date.now();
    if (keys.current[' '] && now - lastFireTime.current > 100) {
      const dist = p.position.distanceTo(e.position);
      const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion);
      const toEnemy = e.position.clone().sub(p.position).normalize();
      const accuracy = dir.dot(toEnemy);
      if (dist < 60 && accuracy > 0.98) {
        onDamageEnemy(1.5);
      }
      lastFireTime.current = now;
    }

    // Shooting: Missiles
    if (keys.current['f'] && now - lastMissileTime.current > 3000) {
      const missilePos = p.position.clone().add(new THREE.Vector3(0, -0.2, -0.5).applyQuaternion(p.quaternion));
      setMissiles(prev => [...prev, { id: now, pos: missilePos, rot: p.rotation.clone() }].slice(-3));
      onAction("FOX TWO! MISSILE AWAY.");
      
      // Delay damage logic for "hit" feel
      setTimeout(() => {
        const dist = playerRef.current?.position.distanceTo(enemyRef.current?.position || new THREE.Vector3()) || 1000;
        if (dist < 100) {
           onDamageEnemy(20);
           onAction("TARGET HIT BY MISSILE!");
        }
      }, 800);
      
      lastMissileTime.current = now;
    }

    // --- ENEMY AI ---
    const distToPlayer = e.position.distanceTo(p.position);
    if (distToPlayer > 15) {
      e.lookAt(p.position);
      e.translateZ(0.25);
    } else {
      e.rotateY(0.4 * delta);
      e.translateZ(0.2);
    }
    if (Math.random() < 0.015 && distToPlayer < 30) onDamagePlayer(1);

    if (playerStats.hull <= 0) onEnd('enemy');
    if (enemyStats.hull <= 0) onEnd('player');
  });

  return (
    <>
      <Jet ref={playerRef} color={playerStats.color} position={[0, 20, 0]} />
      <Jet ref={enemyRef} color={enemyStats.color} position={[0, 25, -60]} />
      
      {missiles.map(m => (
        <Missile key={m.id} position={m.pos} rotation={m.rot} targetPos={enemyRef.current?.position || new THREE.Vector3()} />
      ))}

      {/* @ts-ignore */}
      <gridHelper args={[5000, 100, '#222', '#111']} position={[0, -50, 0]} />
      {/* @ts-ignore */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -50.1, 0]}>
        {/* @ts-ignore */}
        <planeGeometry args={[10000, 10000]} />
        {/* @ts-ignore */}
        <meshStandardMaterial color="#050505" />
      {/* @ts-ignore */}
      </mesh>
    </>
  );
};

const GameViewport: React.FC<Props> = (props) => {
  return (
    <div className="w-full h-full cursor-none">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault fov={65} />
        <Sky sunPosition={[100, 20, 100]} />
        <Stars radius={300} depth={60} count={10000} factor={6} saturation={0} fade speed={1} />
        <Environment preset="night" />
        {/* @ts-ignore */}
        <ambientLight intensity={0.5} />
        {/* @ts-ignore */}
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <FlightEngine {...props} />
      </Canvas>
    </div>
  );
};

export default GameViewport;
