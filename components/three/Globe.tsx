"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import landDots from "@/lib/landDots.json";
import { home, reachPoints } from "@/lib/profile";

const R = 1;

/** lat/lng → point on the sphere. lng -90 faces the camera at rotation 0. */
function toVec3(lat: number, lng: number, r = R) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

/** Reads the current theme's colors from CSS variables and updates on theme change. */
function useThemeColors() {
  const read = () => {
    const css = getComputedStyle(document.documentElement);
    const rgb = (name: string) => `rgb(${css.getPropertyValue(name).trim().split(/\s+/).join(",")})`;
    return { accent: rgb("--accent"), fg: rgb("--fg"), bg: rgb("--bg"), light: document.documentElement.dataset.theme === "light" };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const obs = new MutationObserver(() => setColors(read()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);
  return colors;
}

/** Round sprite so points render as dots, not squares. */
function useDotTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fillStyle = "#fff";
    ctx.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

function Arc({ to, color, delay }: { to: { lat: number; lng: number }; color: string; delay: number }) {
  const line = useMemo(() => {
    const a = toVec3(home.lat, home.lng);
    const b = toVec3(to.lat, to.lng);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const lift = 1 + a.distanceTo(b) * 0.22;
    mid.normalize().multiplyScalar(R * lift);
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
    const mat = new THREE.LineDashedMaterial({ color, dashSize: 0.06, gapSize: 0.04, transparent: true, opacity: 0.85 });
    const l = new THREE.Line(geo, mat);
    l.computeLineDistances();
    return l;
  }, [to, color]);

  // Each arc gently breathes, offset in time so they shimmer in sequence.
  useFrame(({ clock }) => {
    const m = line.material as THREE.LineDashedMaterial;
    m.opacity = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * 1.2 + delay));
  });

  useEffect(() => () => {
    line.geometry.dispose();
    (line.material as THREE.Material).dispose();
  }, [line]);

  return <primitive object={line} />;
}

function Pulse({ color }: { color: string }) {
  const ring = useRef<THREE.Mesh>(null);
  const pos = useMemo(() => toVec3(home.lat, home.lng, R * 1.005), []);
  const quat = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), pos.clone().normalize()), [pos]);
  useFrame(({ clock }) => {
    if (!ring.current) return;
    const t = (clock.elapsedTime % 2) / 2;
    ring.current.scale.setScalar(1 + t * 3);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 1 - t;
  });
  return (
    <group position={pos} quaternion={quat}>
      <mesh>
        <circleGeometry args={[0.018, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ring}>
        <ringGeometry args={[0.02, 0.028, 32]} />
        <meshBasicMaterial color={color} transparent side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Earth({ reduce }: { reduce: boolean }) {
  const group = useRef<THREE.Group>(null);
  const colors = useThemeColors();
  const dot = useDotTexture();
  // Point size scales with canvas height; keep dots legible on small (mobile) canvases.
  const height = useThree((st) => st.size.height);
  const dotSize = 0.019 * THREE.MathUtils.clamp(620 / Math.max(height, 1), 1, 1.9);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number; down: boolean }>({ x: 0, y: 0, vx: 0, vy: 0, down: false });

  const positions = useMemo(() => {
    const arr = new Float32Array((landDots.length / 2) * 3);
    for (let i = 0; i < landDots.length; i += 2) {
      const v = toVec3(landDots[i], landDots[i + 1]);
      arr.set([v.x, v.y, v.z], (i / 2) * 3);
    }
    return arr;
  }, []);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    const d = drag.current;
    if (!d.down) {
      // Inertia after a drag, then settle into a slow auto-rotation.
      d.vx *= 0.94;
      d.vy *= 0.94;
      g.rotation.y += d.vx + (reduce ? 0 : dt * 0.08);
      g.rotation.x = THREE.MathUtils.clamp(g.rotation.x + d.vy, -0.6, 0.6);
    }
  });

  return (
    <group
      ref={group}
      rotation={[0.35, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        drag.current = { ...drag.current, x: e.clientX, y: e.clientY, down: true };
        (e.target as Element | null)?.setPointerCapture?.(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d.down || !group.current) return;
        d.vx = (e.clientX - d.x) * 0.005;
        d.vy = (e.clientY - d.y) * 0.005;
        group.current.rotation.y += d.vx;
        group.current.rotation.x = THREE.MathUtils.clamp(group.current.rotation.x + d.vy, -0.6, 0.6);
        d.x = e.clientX;
        d.y = e.clientY;
      }}
      onPointerUp={() => (drag.current.down = false)}
      onPointerLeave={() => (drag.current.down = false)}
    >
      {/* Solid core hides the dots on the far side */}
      <mesh>
        <sphereGeometry args={[R * 0.985, 64, 64]} />
        <meshBasicMaterial color={colors.bg} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={dotSize}
          map={dot}
          alphaTest={0.3}
          depthWrite={false}
          color={colors.light ? colors.fg : colors.accent}
          transparent
          opacity={colors.light ? 0.55 : 0.8}
          sizeAttenuation
        />
      </points>
      {reachPoints.map((p, i) => (
        <Arc key={i} to={p} color={colors.accent} delay={i * 0.7} />
      ))}
      <Pulse color={colors.accent} />
    </group>
  );
}

/** Soft glow around the globe (fresnel-style, rendered on the back faces). */
function Atmosphere() {
  const colors = useThemeColors();
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { c: { value: new THREE.Color(colors.accent) } },
        vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 c; varying vec3 vN; void main(){ float i = pow(max(0.0, 0.62 - dot(vN, vec3(0,0,1.0))), 3.0); gl_FragColor = vec4(c, 1.0) * i * 0.9; }`,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
      }),
    [colors.accent],
  );
  return (
    <mesh scale={1.12}>
      <sphereGeometry args={[R, 64, 64]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

export default function Globe({ active }: { active: boolean }) {
  const [reduce, setReduce] = useState(false);
  useEffect(() => setReduce(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  return (
    <Canvas
      camera={{ position: [0, 0, 3.1], fov: 45 }}
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ touchAction: "pan-y" }}
      aria-hidden="true"
    >
      <Atmosphere />
      <Earth reduce={reduce} />
    </Canvas>
  );
}
