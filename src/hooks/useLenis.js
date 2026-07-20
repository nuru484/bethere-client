// src/hooks/useLenis.js
//
// Lenis momentum / smooth scroll, mirroring the mhp website-frontend setup: a
// long duration with easeOutCubic and boosted wheel/touch multipliers plus a
// low lerp for a heavy, gliding feel. Honors prefers-reduced-motion (the
// scroll simply stays native). Returns a scrollTo helper for anchor jumps.
import { useEffect, useRef } from "react";
import Lenis from "lenis";

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const useLenis = () => {
  const lenisRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 2.5,
      easing: easeOutCubic,
      touchMultiplier: 2,
      wheelMultiplier: 1.5,
      infinite: false,
      lerp: 0.05,
    });
    lenisRef.current = lenis;

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const scrollTo = (target, options) => {
    lenisRef.current?.scrollTo(target, {
      offset: 0,
      duration: 2,
      easing: easeOutCubic,
      ...options,
    });
  };

  return { scrollTo };
};
