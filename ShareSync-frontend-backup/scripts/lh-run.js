// /scripts/lh-run.js
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { existsSync, mkdirSync } from 'node:fs';

const urls = [
  { name: 'home', url: 'http://localhost:4173/home' },
  { name: 'projects', url: 'http://localhost:4173/projects' },
  // Replace DEMO_ID with a real project id or use SS_PROJECT_ID env for the lh:projectId script
  { name: 'project', url: `http://localhost:4173/projects/${process.env.SS_PROJECT_ID || 'DEMO_ID'}` }
];

async function run() {
  if (!existsSync('lighthouse')) mkdirSync('lighthouse');

  // Start preview server
  const preview = spawn('npm', ['run', 'serve:dist'], { stdio: 'inherit', shell: true });
  await delay(1200); // give it a moment

  for (const { name, url } of urls) {
    console.log(`\n→ Running Lighthouse for ${name}: ${url}`);
    await new Promise((resolve) => {
      const lh = spawn('npx', [
        'lighthouse', url,
        '--only-categories=performance,accessibility,best-practices,seo',
        '--output', 'html',
        '--output', 'json',
        '--output-path', `./lighthouse/${name}_after`,
        '--chrome-flags=--headless=new'
      ], { stdio: 'inherit', shell: true });
      lh.on('close', resolve);
    });
  }

  preview.kill('SIGINT');
  console.log('\n✓ Lighthouse reports written to /lighthouse');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
