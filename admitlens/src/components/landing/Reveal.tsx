"use client";
import { useEffect, useRef } from "react";
import { cx } from "../ui";

/** Fades content up when it scrolls into view and adds `.in` so nested animations can start. */
export function Reveal({ children, className, as: Tag = "div", delay = 0, ...rest }: { children: React.ReactNode; className?: string; as?: "div" | "section" | "li"; delay?: number } & React.HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add("in");
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} className={cx("reveal", className)} style={delay ? { transitionDelay: `${delay}ms` } : undefined} {...rest}>
      {children}
    </Tag>
  );
}
