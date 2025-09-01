// /src/components/docs/DocumentViewer.jsx
import React from "react";
import AnchorLinkButton from "../common/AnchorLinkButton";
import { makeAnchorId, slugify } from "../../utils/anchor";

/**
 * DocumentViewer
 * - Minimal renderer for markdown-like text:
 *   - Headings: #, ##, ###, ####
 *   - Paragraphs: everything else grouped by blank lines
 * - Injects stable ids so sections can be deep-linked.
 * - Renders an AnchorLinkButton that appears on hover/focus.
 *
 * Props:
 *  - content: string (markdown-ish)
 *  - baseUrl?: string  (override base when building deep links)
 *  - className?: string
 */
export default function DocumentViewer({ content = "", baseUrl, className = "" }) {
  const blocks = parseBlocks(content);

  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      {blocks.map((b, idx) => {
        const key = `${b.type}-${idx}`;
        const id = b.id || makeAnchorId(b.type === "p" ? "para" : "doc", b.slug || idx);

        if (b.type === "h1") {
          return (
            <h1 key={key} id={id} className="group scroll-mt-24 flex items-center gap-2">
              <span className="min-w-0 truncate">{b.text}</span>
              <AnchorLinkButton
                anchorId={id}
                baseUrl={baseUrl}
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                size="sm"
                label="Copy link to this heading"
              />
            </h1>
          );
        }
        if (b.type === "h2") {
          return (
            <h2 key={key} id={id} className="group scroll-mt-24 flex items-center gap-2">
              <span className="min-w-0 truncate">{b.text}</span>
              <AnchorLinkButton
                anchorId={id}
                baseUrl={baseUrl}
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                size="sm"
                label="Copy link to this heading"
              />
            </h2>
          );
        }
        if (b.type === "h3") {
          return (
            <h3 key={key} id={id} className="group scroll-mt-24 flex items-center gap-2">
              <span className="min-w-0 truncate">{b.text}</span>
              <AnchorLinkButton
                anchorId={id}
                baseUrl={baseUrl}
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                size="sm"
                label="Copy link to this heading"
              />
            </h3>
          );
        }
        if (b.type === "h4") {
          return (
            <h4 key={key} id={id} className="group scroll-mt-24 flex items-center gap-2">
              <span className="min-w-0 truncate">{b.text}</span>
              <AnchorLinkButton
                anchorId={id}
                baseUrl={baseUrl}
                className="opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
                size="sm"
                label="Copy link to this heading"
              />
            </h4>
          );
        }
        // paragraph
        return (
          <p key={key} id={id} className="group scroll-mt-24">
            {b.text}{" "}
            <AnchorLinkButton
              anchorId={id}
              baseUrl={baseUrl}
              className="align-middle opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-1"
              size="sm"
              label="Copy link to this paragraph"
            />
          </p>
        );
      })}
    </div>
  );
}

/**
 * Parse markdown-ish text into block objects.
 * Supports: #, ##, ###, #### headings and paragraphs.
 */
function parseBlocks(src) {
  const lines = (src || "").replace(/\r\n?/g, "\n").split("\n");

  const blocks = [];
  let para = [];

  const flushPara = () => {
    if (para.length === 0) return;
    const text = para.join(" ").trim();
    if (text) {
      blocks.push({
        type: "p",
        text,
        slug: slugFromText(text),
        id: makeAnchorId("para", slugFromText(text)),
      });
    }
    para = [];
  };

  for (let raw of lines) {
    const line = raw.trim();

    // blank line → paragraph break
    if (!line) {
      flushPara();
      continue;
    }

    // headings
    const m = /^(#{1,4})\s+(.*)$/.exec(line);
    if (m) {
      flushPara();
      const level = m[1].length;
      const text = m[2].trim();
      const type = level === 1 ? "h1" : level === 2 ? "h2" : level === 3 ? "h3" : "h4";
      const slug = slugFromText(text);
      blocks.push({
        type,
        text,
        slug,
        id: makeAnchorId("doc", `${type}-${slug}`),
      });
      continue;
    }

    // otherwise keep collecting paragraph text
    para.push(line);
  }

  flushPara();
  return blocks;
}

function slugFromText(text) {
  // Use first ~8 words for paragraph slug, whole text for headings
  const words = (text || "").split(/\s+/).slice(0, 8).join(" ");
  return slugify(words);
}