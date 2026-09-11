"use client";

import { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sphere, Icosahedron, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Shape({ position, color, speed, type, scale = 1 }: { position: [number, number, number], color: string, speed: number, type: 'sphere' | 'icosa', scale?: number }) {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = state.clock.elapsedTime * speed;
      mesh.current.rotation.y = state.clock.elapsedTime * speed * 0.5;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2} position={position}>
      {type === 'sphere' ? (
        <Sphere ref={mesh} args={[1, 64, 64]} scale={scale}>
          <MeshTransmissionMaterial 
            backside
            thickness={2}
            roughness={0.1}
            transmission={1}
            ior={1.5}
            chromaticAberration={0.05}
            anisotropy={0.1}
            color={color}
          />
        </Sphere>
      ) : (
        <Icosahedron ref={mesh} args={[1, 0]} scale={scale}>
          <MeshTransmissionMaterial 
            backside
            thickness={2}
            roughness={0.2}
            transmission={1}
            ior={1.2}
            chromaticAberration={0.1}
            anisotropy={0.1}
            color={color}
          />
        </Icosahedron>
      )}
    </Float>
  );
}

export default function ThreeBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none opacity-[0.85] mix-blend-screen dark:mix-blend-lighten">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        {/* Soft floating glassmorphic emerald and teal shapes */}
        <Shape position={[-8, 4, -5]} color="#10B981" speed={0.2} type="icosa" scale={1.8} />
        <Shape position={[8, -3, -8]} color="#0D9488" speed={0.3} type="sphere" scale={2.5} />
        <Shape position={[-5, -6, -10]} color="#059669" speed={0.1} type="sphere" scale={3} />
        <Shape position={[7, 6, -4]} color="#14B8A6" speed={0.25} type="icosa" scale={1.5} />
        <Shape position={[0, -2, -15]} color="#34D399" speed={0.15} type="icosa" scale={4} />

        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
