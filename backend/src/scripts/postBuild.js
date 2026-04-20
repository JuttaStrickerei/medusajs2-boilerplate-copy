const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const MEDUSA_SERVER_PATH = path.join(process.cwd(), '.medusa', 'server');

// Check if .medusa/server exists - if not, build process failed
if (!fs.existsSync(MEDUSA_SERVER_PATH)) {
  throw new Error('.medusa/server directory not found. This indicates the Medusa build process failed. Please check for build errors.');
}

// Copy pnpm-lock.yaml
fs.copyFileSync(
  path.join(process.cwd(), 'pnpm-lock.yaml'),
  path.join(MEDUSA_SERVER_PATH, 'pnpm-lock.yaml')
);

// Copy .env if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  fs.copyFileSync(
    envPath,
    path.join(MEDUSA_SERVER_PATH, '.env')
  );
}

// Brand the admin dashboard (title + favicon) — minimal prod-only branding.
const ADMIN_PUBLIC_PATH = path.join(MEDUSA_SERVER_PATH, 'public', 'admin');
const ADMIN_INDEX_PATH = path.join(ADMIN_PUBLIC_PATH, 'index.html');
const FAVICON_SRC = path.join(process.cwd(), 'src', 'admin', 'branding', 'favicon.ico');
const FAVICON_DEST = path.join(ADMIN_PUBLIC_PATH, 'favicon.ico');

if (!fs.existsSync(ADMIN_INDEX_PATH)) {
  throw new Error(`Built admin index.html not found at ${ADMIN_INDEX_PATH}. Admin build may have failed.`);
}
if (!fs.existsSync(FAVICON_SRC)) {
  throw new Error(`Branding favicon not found at ${FAVICON_SRC}. Ensure backend/src/admin/branding/favicon.ico exists.`);
}

fs.copyFileSync(FAVICON_SRC, FAVICON_DEST);

const ADMIN_TITLE = 'Jutta Strickerei Admin';
const FAVICON_HREF = '/app/favicon.ico';

let html = fs.readFileSync(ADMIN_INDEX_PATH, 'utf8');

// Replace placeholder favicon link (data-placeholder-favicon) with real link.
html = html.replace(
  /<link\s+rel="icon"[^>]*data-placeholder-favicon[^>]*\/?>/,
  `<link rel="icon" type="image/x-icon" href="${FAVICON_HREF}" />`
);

// Inject <title> before </head> if not already present.
if (!/<title>/i.test(html)) {
  html = html.replace('</head>', `    <title>${ADMIN_TITLE}</title>\n    </head>`);
}

fs.writeFileSync(ADMIN_INDEX_PATH, html, 'utf8');
console.log(`Branded admin index.html (title: "${ADMIN_TITLE}", favicon: ${FAVICON_HREF}).`);

// Install dependencies
console.log('Installing dependencies in .medusa/server...');
execSync('pnpm i --prod --frozen-lockfile', { 
  cwd: MEDUSA_SERVER_PATH,
  stdio: 'inherit'
});
