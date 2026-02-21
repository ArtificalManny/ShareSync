const fs = require('fs');
const path = '/Users/realmannyrivas/Documents/ShareSync/ShareSync-frontend-backup/src/pages/project/ProjectSettings.jsx';
let code = fs.readFileSync(path, 'utf8');

// Replace the hardcoded inline style wrapper with standard Tailwind classes that respect the theme
code = code.replace(
  /<div style=\{\{ minHeight: '100vh', background: 'linear-gradient\(135deg, #020617, #0f172a, #020617\)' \}\} className="text-white pb-20">/g,
  '<div className="min-h-screen text-white pb-20 relative z-10">'
);

fs.writeFileSync(path, code);
console.log('Successfully patched ProjectSettings.jsx');
