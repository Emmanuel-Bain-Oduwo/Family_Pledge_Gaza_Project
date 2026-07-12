const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const layout = read('components/AdminLayout.tsx');
assert.match(layout, /drawerOpen/);
assert.match(layout, /document\.body\.style\.overflow = 'hidden'/);
assert.match(layout, /event\.key === 'Escape'/);
assert.match(layout, /lg:ml-60/);
assert.match(layout, /overflow-x-hidden/);

const sidebar = read('components/Sidebar.tsx');
assert.match(sidebar, /translate-x-0/);
assert.match(sidebar, /-translate-x-full lg:translate-x-0/);
assert.match(sidebar, /aria-label="Close admin menu"/);
assert.match(sidebar, /onClick=\{onClose\}/);

const topbar = read('components/Topbar.tsx');
assert.match(topbar, /aria-label="Open admin menu"/);
assert.match(topbar, /lg:hidden/);
assert.match(topbar, /truncate/);
assert.match(topbar, /break-words/);

const globals = read('app/globals.css');
assert.match(globals, /html, body \{ max-width: 100%; overflow-x: hidden; \}/);
assert.match(globals, /\.modal-panel/);
assert.match(globals, /max-h-\[calc\(100dvh-2rem\)\]/);
assert.match(globals, /min-h-11/);

const dataTable = read('components/DataTable.tsx');
assert.match(dataTable, /overflow-x-auto/);
assert.match(dataTable, /min-w-full/);

const contributions = read('app/contributions/page.tsx');
assert.match(contributions, /flex flex-wrap gap-2/);
assert.match(contributions, /modal-shell/);
assert.match(contributions, /modal-panel max-w-md/);
assert.match(contributions, /modal-actions/);

const notifications = read('app/notifications/page.tsx');
assert.match(notifications, /grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3/);
assert.match(notifications, /flex flex-col gap-3 sm:flex-row/);
assert.match(notifications, /text-left sm:text-right/);

console.log('Focused admin responsive checks passed');
