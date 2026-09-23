"use client";

import { useInView } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef } from "react";

// three.js only loads when the globe section approaches the viewport.
const Globe = dynamic(() => import("./Globe"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-full bg-accent/5" />,
});

export function GlobeLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const near = useInView(ref, { once: true, margin: "400px 0px" });
  const visible = useInView(ref, { margin: "100px 0px" });
  return (
    <div ref={ref} className="aspect-square w-full cursor-grab active:cursor-grabbing">
      {near && <Globe active={visible} />}
    </div>
  );
}
