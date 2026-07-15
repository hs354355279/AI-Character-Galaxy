"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  canAnimateLanding,
  ScrollTrigger,
  useGSAP,
} from "@/animations/landingMotion";
import { BrandMark } from "@/components/shared/BrandMark";

const chapters = [
  ["00", "Introduction", "#top"],
  ["01", "Method", "#method"],
  ["02", "Lessons", "#official-lessons"],
  ["03", "Evidence", "#evidence"],
] as const;

export function ExhibitionNav() {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const root = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!canAnimateLanding() || !root.current) return;
      const hero = document.querySelector<HTMLElement>(".editorial-hero");
      if (!hero) return;

      ScrollTrigger.create({
        trigger: hero,
        start: "bottom 96px",
        end: "max",
        toggleClass: { targets: root.current, className: "is-material" },
      });
    },
    { scope: root },
  );

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>("a, button"),
      ];
      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <nav ref={root} className="exhibition-nav" aria-label="Primary navigation">
      <BrandMark />
      <div className="exhibition-nav-actions">
        <a href="#official-lessons">Lessons</a>
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open exhibition index"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          Index
        </button>
      </div>
      {open ? (
        <motion.div
          ref={dialogRef}
          className="exhibition-index"
          role="dialog"
          aria-modal="true"
          aria-label="Exhibition index"
          initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" className="index-close" onClick={() => setOpen(false)}>
            Close
          </button>
          <div className="index-links">
            {chapters.map(([number, label, href], index) => (
              <motion.a
                href={href}
                key={number}
                onClick={() => setOpen(false)}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.08 + index * 0.06 }}
              >
                <span>{number}</span>
                <strong>{label}</strong>
                <i aria-hidden="true">↘</i>
              </motion.a>
            ))}
          </div>
        </motion.div>
      ) : null}
    </nav>
  );
}
