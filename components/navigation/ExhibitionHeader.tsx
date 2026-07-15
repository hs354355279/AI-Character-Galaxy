"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { canAnimateLanding, ScrollTrigger, useGSAP } from "@/animations/landingMotion";
import { BrandMark } from "@/components/shared/BrandMark";
import type { LandingLesson } from "@/lib/landing/lesson-view-model";
import { LessonSwitcher } from "./LessonSwitcher";

export interface ExhibitionChapter {
  number: string;
  label: string;
  href: string;
}

export function ExhibitionHeader({
  lessons,
  theme,
  currentLessonId,
  chapters = [],
  observeHero = false,
  actions,
  indexLabel = "Open navigation index",
}: {
  lessons: LandingLesson[];
  theme: "paper" | "space";
  currentLessonId?: string;
  chapters?: ExhibitionChapter[];
  observeHero?: boolean;
  actions?: ReactNode;
  indexLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const root = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!observeHero || !canAnimateLanding() || !root.current) return;
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
    const trigger = triggerRef.current;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>("a, button")];
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
      trigger?.focus();
    };
  }, [open]);

  const overlayLinks: ExhibitionChapter[] = [
    { number: "A", label: "Exhibition", href: "/" },
    { number: "B", label: "Courses", href: "/courses" },
    { number: "C", label: "Characters", href: "/characters" },
    ...chapters,
  ];

  return (
    <header
      ref={root}
      className={`exhibition-header exhibition-header--${theme}${observeHero ? " exhibition-header--floating" : " is-material"}`}
    >
      <nav aria-label="Primary navigation" className="exhibition-header-inner">
        <BrandMark />
        <div className="exhibition-destinations">
          <Link href="/">Exhibition</Link>
          <Link href="/courses">Courses</Link>
          <Link href="/characters">Characters</Link>
        </div>
        <div className="exhibition-tools">
          <LessonSwitcher lessons={lessons} currentLessonId={currentLessonId} />
          {actions}
          <button
            ref={triggerRef}
            className="exhibition-index-trigger"
            type="button"
            aria-label={indexLabel}
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            Index
          </button>
        </div>
      </nav>
      {open ? (
        <motion.div
          ref={dialogRef}
          className="exhibition-index"
          role="dialog"
          aria-modal="true"
          aria-label="Exhibition index"
          initial={reduceMotion ? false : { clipPath: "inset(0 0 100% 0)" }}
          animate={{ clipPath: "inset(0 0 0% 0)" }}
          transition={{ duration: reduceMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] }}
        >
          <button type="button" className="index-close" onClick={() => setOpen(false)}>
            Close <span aria-hidden="true">×</span>
          </button>
          <div className="index-links">
            {overlayLinks.map(({ number, label, href }, index) => (
              <motion.div
                key={`${number}-${href}`}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.06 + index * 0.045 }}
              >
                <Link href={href} onClick={() => setOpen(false)}>
                  <span>{number}</span>
                  <strong>{label}</strong>
                  <i aria-hidden="true">↘</i>
                </Link>
              </motion.div>
            ))}
            {lessons.map((lesson, index) => (
              <motion.div
                key={lesson.id}
                initial={reduceMotion ? false : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.14 + index * 0.045 }}
              >
                <Link href={`/learn/${lesson.slug}`} onClick={() => setOpen(false)}>
                  <span>{lesson.number}</span>
                  <strong>{lesson.title}</strong>
                  <i aria-hidden="true">↘</i>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      ) : null}
    </header>
  );
}
