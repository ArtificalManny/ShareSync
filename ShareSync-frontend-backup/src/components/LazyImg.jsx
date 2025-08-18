// src/components/LazyImg.jsx
import React from 'react';
export default function LazyImg({ src, alt = '', className = '', width, height, decoding = 'async' }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding={decoding}
      width={width}
      height={height}
      className={className}
    />
  );
}
