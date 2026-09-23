"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { profile } from "@/lib/profile";

/** Hero portrait: photo (or monogram) inside a spinning gold ring with orbiting badges. */
export function Portrait() {
  const reduce = useReducedMotion();
  const badges = [
    { label: "Founder", pos: "left-[-6%] top-[14%]" },
    { label: "Congressional App Challenge · 2nd", pos: "right-[-8%] top-[48%]" },
    { label: "NASA Space Apps · 2nd", pos: "left-[-2%] bottom-[8%]" },
  ];

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[26rem]">
      {/* Glow */}
      <div aria-hidden="true" className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.28),transparent_65%)] blur-2xl" />
      {/* Rotating dashed ring */}
      <div aria-hidden="true" className="absolute inset-[-4%] animate-spin-slow rounded-full border border-dashed border-accent/40" />
      {/* Conic gold ring */}
      <div aria-hidden="true" className="absolute inset-0 rounded-full bg-[conic-gradient(from_140deg,rgb(var(--accent)),#fff3c4,rgb(var(--accent-2)),rgb(var(--accent)))] p-[3px]">
        <div className="h-full w-full rounded-full bg-bg" />
      </div>

      <div className="absolute inset-[3%] overflow-hidden rounded-full bg-surface-2">
        {profile.portrait ? (
          <Image
            src={profile.portrait}
            alt={`Portrait of ${profile.name}`}
            fill
            priority
            sizes="(max-width: 768px) 78vw, 416px"
            className="object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`${profile.name} monogram`}
            className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_30%_25%,rgb(var(--accent)/0.35),transparent_60%)]"
          >
            <span className="font-display text-[7rem] font-bold text-gradient sm:text-[9rem]">HR</span>
          </div>
        )}
      </div>

      {badges.map((b, i) => (
        <motion.span
          key={b.label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={reduce ? { opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { delay: 0.8 + i * 0.15 },
            scale: { delay: 0.8 + i * 0.15, type: "spring", stiffness: 200, damping: 18 },
            y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.6 },
          }}
          className={`absolute ${b.pos} hidden whitespace-nowrap rounded-full border border-accent/30 bg-surface/90 px-4 py-2 text-xs font-medium text-fg shadow-lg backdrop-blur sm:block`}
        >
          <span aria-hidden="true" className="mr-1.5 text-accent">✦</span>
          {b.label}
        </motion.span>
      ))}
    </div>
  );
}
