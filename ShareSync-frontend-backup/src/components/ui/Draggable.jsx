// /src/components/ui/Draggable.jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Draggable
 * - Whole container is draggable
 * - Drag does NOT start if the event target matches `blockSelector`
 * - Position is persisted to localStorage (`drag:${id}`)
 *
 * Props:
 *  id: string (required)
 *  initial?: { x: number, y: number }   // default { x: 16, y: 16 }
 *  blockSelector?: string                // elements that CANCEL drag start
 *  children: ReactNode
 */
export default function Draggable({
  id,
  initial = { x: 16, y: 16 },
  blockSelector = "button, [role='button'], a, input, textarea, select, [data-no-drag]",
  children,
}) {
  if (!id) throw new Error("Draggable requires an `id` prop.");

  const readStored = () => {
    try {
      const raw = localStorage.getItem(`drag:${id}`);
      if (!raw) return initial;
      const p = JSON.parse(raw);
      if (typeof p?.x === "number" && typeof p?.y === "number") return p;
    } catch {}
    return initial;
  };

  const [pos, setPos] = useState(readStored);
  const ref = useRef(null);
  const dragRef = useRef(null); // { offsetX, offsetY }

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(`drag:${id}`, JSON.stringify(pos));
    } catch {}
  }, [id, pos]);

  // keep in viewport
  useEffect(() => {
    const onResize = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const next = {
        x: Math.min(Math.max(0, pos.x), Math.max(0, vw - rect.width)),
        y: Math.min(Math.max(0, pos.y), Math.max(0, vh - rect.height)),
      };
      if (next.x !== pos.x || next.y !== pos.y) setPos(next);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [pos]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseDown = (e) => {
      if (e.button !== 0) return; // left click only
      // cancel if started on blocked element
      if (e.target?.closest?.(blockSelector)) return;

      const rect = el.getBoundingClientRect();
      dragRef.current = {
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "none";
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const elRect = ref.current?.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = elRect?.width ?? 0;
      const h = elRect?.height ?? 0;

      let x = e.clientX - d.offsetX;
      let y = e.clientY - d.offsetY;

      x = Math.min(Math.max(0, x), Math.max(0, vw - w));
      y = Math.min(Math.max(0, y), Math.max(0, vh - h));

      setPos({ x, y });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.userSelect = "";
    };

    el.addEventListener("mousedown", onMouseDown);
    return () => {
      el.removeEventListener("mousedown", onMouseDown);
    };
  }, [blockSelector]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: `${pos.x}px`,
        top: `${pos.y}px`,
      }}
    >
      {children}
    </div>
  );
}