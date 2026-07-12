const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const display = read('lib/adminDisplay.ts');
const topbar = read('components/Topbar.tsx');
const login = read('app/login/page.tsx');
const layout = read('components/AdminLayout.tsx');
const api = read('lib/api.ts');

const required = [
  [display, 'admin?.full_name?.trim()', 'full_name display fallback'],
  [display, 'admin?.nickname?.trim()', 'nickname display fallback'],
  [display, 'admin?.email?.trim()', 'email display fallback'],
  [display, 'admin?.phone?.trim()', 'phone display fallback'],
  [display, "'Admin'", 'Admin display fallback'],
  [display, "getAdminDisplayName(admin).charAt(0).toUpperCase() || 'A'", 'safe initial fallback'],
  [topbar, '>Admin</div>', 'visible role label'],
  [login, "register('identifier'", 'identifier login field'],
  [login, 'Email or phone', 'email-or-phone label'],
  [login, 'type="text"', 'text login input'],
  [login, 'getAdminMe()', 'post-login current-user check'],
  [login, 'Admin access required.', 'donor rejection message'],
  [layout, 'getAdminMe()', 'layout current-user check'],
  [layout, 'removeToken()', 'layout clears rejected token'],
  [api, "client.patch<Admin>('/users/me'", 'admin profile update API'],
];

for (const [source, needle, label] of required) {
  if (!source.includes(needle)) {
    throw new Error(`Missing ${label}: ${needle}`);
  }
}

if (topbar.includes('admin.name') || topbar.includes('role.replace')) {
  throw new Error('Topbar still contains unsafe legacy admin.name or raw role rendering');
}

console.log('Focused admin auth/display source checks passed');
