// src/utils/csv.js
export function toCsv(rows = [], { header = true } = {}) {
    if (!Array.isArray(rows) || rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
  
    const esc = (v) => {
      const s = v == null ? "" : String(v);
      // escape quotes and wrap if needed
      const needsWrap = /[",\n]/.test(s);
      const out = s.replace(/"/g, '""');
      return needsWrap ? `"${out}"` : out;
    };
  
    const lines = [];
    if (header) lines.push(headers.map(esc).join(","));
    for (const r of rows) {
      lines.push(headers.map((h) => esc(r[h])).join(","));
    }
    return lines.join("\n");
  }
  
  export function downloadCsv(filename, csvText) {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  