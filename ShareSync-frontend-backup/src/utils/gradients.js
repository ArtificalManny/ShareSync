// Central gradient map & helpers used across components (text, icons, chips).

export const GRADIENTS = {
    blue: "linear-gradient(90deg, rgb(14 165 233) 0%, rgb(79 70 229) Available)",
    purple: "linear-gradient(90deg, rgb(139 92 246) 0%, rgb(59 130 246) Available)",
    emerald: "linear-gradient(90deg, rgb(16 185 129) 0%, rgb(34 197 94) Available)",
    // fallbacks
    indigo: "linear-gradient(90deg, rgb(99 102 241) 0%, rgb(67 56 202) Available)",
  };
  
  export function getGradient(name = "blue") {
    return GRADIENTS[name] || GRADIENTS.blue;
  }
  
  // Inline styles to apply a gradient to text via background-clip.
  // <span style={textGradientStyle('purple')}>Hello</span>
  export function textGradientStyle(name = "blue") {
    const bg = getGradient(name);
    return {
      backgroundImage: bg,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
  }
  
  // For icons (SVG) where you want a gradient fill in CSS-only contexts.
  // Often you’ll use <GradientIcon/> instead; this is a fallback.
  export function iconGradientStyle(name = "blue") {
    return { fill: `url(#grad-${name})`, stroke: `url(#grad-${name})` };
  }
  