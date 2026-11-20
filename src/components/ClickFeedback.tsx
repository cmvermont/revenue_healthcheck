"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Confirms every click. Any button, link, or disclosure gets a short press animation, and a
 * control that carries a data-toast attribute also shows that text in a brief message, so an
 * action with no visible result (a reset, a clear, a copy) is still acknowledged.
 */
export function ClickFeedback() {
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      const origin = ev.target instanceof Element ? ev.target.closest("button, a[href], summary, [role=button]") : null;
      if (!(origin instanceof HTMLElement) || origin.hasAttribute("disabled")) return;
      // A link that wraps a card animates the card, because an inline link has no box to scale.
      const target = origin.tagName === "A" && origin.children.length === 1 && origin.firstElementChild instanceof HTMLElement ? origin.firstElementChild : origin;
      target.removeAttribute("data-pressed");
      // Reading a layout property restarts the animation when the same control is clicked twice quickly.
      void target.offsetWidth;
      target.setAttribute("data-pressed", "");
      window.setTimeout(() => target.removeAttribute("data-pressed"), 450);

      const text = origin.dataset.toast;
      if (text) {
        if (timer.current) clearTimeout(timer.current);
        setToast({ text, id: Date.now() });
        timer.current = setTimeout(() => setToast(null), 2200);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div aria-live="polite" role="status">
      {toast && (
        <div key={toast.id} className="toast">
          <span className="toast-check" aria-hidden>
            ✓
          </span>
          {toast.text}
        </div>
      )}
    </div>
  );
}
