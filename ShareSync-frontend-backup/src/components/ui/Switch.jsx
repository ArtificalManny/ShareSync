import React, { useCallback } from "react";

/**
 * Switch (accessible)
 *
 * Props:
 *  - checked: boolean
 *  - onChange: (next:boolean) => void
 *  - disabled?: boolean
 *  - id?: string
 *  - label?: string (visually hidden text for screen readers)
 *  - size?: 'sm' | 'md' | 'lg'
 *  - className?: string (container)
 */
export default function Switch({
  checked = false,
  onChange,
  disabled = false,
  id,
  label = "Toggle",
  size = "md",
  className = "",
}) {
  const dims = size === "sm"
    ? { w: 30, h: 18, knob: 14, pad: 2 }
    : size === "lg"
    ? { w: 48, h: 28, knob: 24, pad: 2 }
    : { w: 40, h: 24, knob: 20, pad: 2 };

  const handleToggle = useCallback(() => {
    if (disabled) return;
    onChange?.(!checked);
  }, [checked, disabled, onChange]);

  const onKeyDown = (e) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  const knobTranslate = checked
    ? `translateX(${dims.w - dims.knob - dims.pad}px)`
    : `translateX(${dims.pad}px)`;

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-disabled={disabled ? "true" : undefined}
      disabled={disabled}
      onClick={handleToggle}
      onKeyDown={onKeyDown}
      className={[
        "inline-flex items-center select-none rounded-full transition-colors focus:outline-none focus-visible:ring-2",
        checked
          ? "bg-indigo-600"
          : "bg-slate-300 dark:bg-slate-700",
        disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
        className,
      ].join(" ")}
      style={{ width: dims.w, height: dims.h }}
    >
      {/* track gradient sheen when checked */}
      <span
        className="absolute inset-0 rounded-full overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {checked && (
          <span className="block w-full h-full bg-grad-purple opacity-30" />
        )}
      </span>

      {/* knob */}
      <span
        className="relative rounded-full bg-white shadow transition-transform"
        style={{
          width: dims.knob,
          height: dims.knob,
          transform: knobTranslate,
        }}
        aria-hidden="true"
      />
    </button>
  );
}
