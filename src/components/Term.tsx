"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FORMULAS, formulaText } from "@/lib/glossary/formulas";
import { TERMS } from "@/lib/glossary/terms";

/** A glossary term with an info bubble. The definition lives only in lib/glossary/terms.ts. */
export function Term({ id, label, align = "left" }: { id: string; label?: string; align?: "left" | "right" }) {
  const term = TERMS[id];
  const bubbleId = useId();
  const [open, setOpen] = useState(false);
  const [near, setNear] = useState(false);
  const termRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLSpanElement>(null);
  // The bubble is fixed to the window, which keeps it whole inside a scrolling table and lets it be
  // held inside the window's edges on a phone. It sits under the term, or above when there is no room below.
  const place = useCallback(() => {
    const anchor = termRef.current;
    const el = bubbleRef.current;
    if (!anchor || !el || el.offsetWidth === 0) return;
    const gutter = 12;
    const gap = 6;
    const box = anchor.getBoundingClientRect();
    const width = el.offsetWidth;
    const height = el.offsetHeight;
    const windowWidth = document.documentElement.clientWidth;
    const windowHeight = window.innerHeight;
    const wanted = align === "right" ? box.right - width : box.left;
    const left = Math.max(gutter, Math.min(wanted, windowWidth - gutter - width));
    const below = box.bottom + gap;
    const above = box.top - gap - height;
    const top = below + height > windowHeight - gutter && above >= gutter ? above : below;
    el.style.left = `${Math.round(left)}px`;
    el.style.top = `${Math.round(top)}px`;
  }, [align]);
  // While the bubble is showing, it follows the term as the page or a table scrolls.
  const showing = open || near;
  useEffect(() => {
    if (!showing) return;
    place();
    window.addEventListener("scroll", place, { capture: true, passive: true });
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, { capture: true });
      window.removeEventListener("resize", place);
    };
  }, [showing, place]);
  const enter = () => {
    place();
    setNear(true);
  };
  const leave = () => {
    setOpen(false);
    setNear(false);
  };
  if (!term) return <span>{label ?? id}</span>;
  const formula = term.formulaId ? FORMULAS[term.formulaId] : undefined;
  return (
    <span ref={termRef} className="term" data-open={open} onMouseEnter={enter} onFocus={enter} onBlur={() => setNear(false)} onMouseLeave={leave}>
      <span>{label ?? term.name}</span>
      <button
        type="button"
        className="term-btn"
        aria-label={`Define ${term.name}`}
        aria-describedby={bubbleId}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        i
      </button>
      <span ref={bubbleRef} role="tooltip" id={bubbleId} className={`term-bubble ${align === "right" ? "right" : ""}`}>
        <strong className="font-semibold">{term.name}</strong>
        <span className="mt-1 block">{term.short}</span>
        <span className="block">
          {formula && (
            <>
              <span className="k">Formula</span>
              <span className="d f">{formulaText(formula, (t) => TERMS[t]?.name ?? t)}</span>
            </>
          )}
          {term.example && (
            <>
              <span className="k">Example</span>
              <span className="d">{term.example}</span>
            </>
          )}
          {term.caveat && (
            <>
              <span className="k">Watch for</span>
              <span className="d">{term.caveat}</span>
            </>
          )}
          {term.aliases && (
            <>
              <span className="k">Also called</span>
              <span className="d">{term.aliases.join(", ")}</span>
            </>
          )}
        </span>
      </span>
    </span>
  );
}
