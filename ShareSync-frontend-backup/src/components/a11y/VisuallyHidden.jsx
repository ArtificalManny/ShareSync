import React from "react";

export default function VisuallyHidden({ as: Tag = "span", children }) {
  return (
    <Tag
      style={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: "1px",
        margin: "-1px",
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        width: "1px",
        whiteSpace: "nowrap"
      }}
    >
      {children}
    </Tag>
  );
}
