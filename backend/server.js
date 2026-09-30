import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const dataDirectory = join(directory, 'data');
const dataFile = join(dataDirectory, 'clients.json');
const port = Number(process.env.API_PORT || 3001);
const maxBodyBytes = 20 * 1024 * 1024;
const adminPassword = process.env.ADMIN_PASSWORD || 'MenuQR@2026!';
const adminPasswordHash = createHash('sha256').update(adminPassword).digest();
const sessionDurationSeconds = 8 * 60 * 60;
const categories = new Set(['restaurants', 'dhabas', 'cafes']);
const sessions = new Map();
const loginAttempts = new Map();

const seedClients = [
  {
    id: 'seed-sharma-dhaba', businessName: 'Sharma Dhaba', category: 'dhabas', ownerName: 'Amit Sharma',
    email: 'hello@sharmadhaba.example', phone: '+91 98765 43210', website: '', address: 'NH-44, Murthal Road',
    city: 'Sonipat', state: 'Haryana', postalCode: '131027', country: 'India', menuSlug: 'sharma-dhaba',
    plan: 'Basic', billingCycle: 'Monthly', monthlyPrice: '1499', openingHours: 'Daily: 8:00 AM – 11:00 PM',
    services: ['Dine-in', 'Takeaway'], heroImage: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1600&q=85',
    status: 'Active', notes: '', createdAt: '2025-11-14T08:30:00.000Z',
    menuItems: [
      { id: 'sharma-paneer-tikka', name: 'Paneer Tikka', description: 'Smoky paneer with house spices.', price: '250', pricingType: 'single', category: 'Starters', dietType: 'veg', image: 'https://images.unsplash.com/photo-1567158763566-50794ce8b9a1?w=700&q=80', available: true },
      { id: 'sharma-chicken-biryani', name: 'Chicken Biryani', description: 'Slow-cooked basmati rice with aromatic spices.', price: '350', pricingType: 'single', category: 'Main Course', dietType: 'non-veg', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=700&q=80', available: true },
      { id: 'sharma-tandoori-roti', name: 'Tandoori Roti', description: 'Freshly baked in the clay oven.', price: '30', pricingType: 'single', category: 'Breads', dietType: 'veg', image: 'https://images.unsplash.com/photo-1626200419188-3caeb0064a78?w=700&q=80', available: true },
      { id: 'sharma-mojito', name: 'Mojito', description: 'Mint, lime, and sparkling soda.', price: '150', pricingType: 'single', category: 'Beverages', dietType: 'vegan', image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=700&q=80', available: true },
    ],
  },
  {
    id: 'seed-green-table', businessName: 'The Green Table', category: 'restaurants', ownerName: 'Neha Kapoor',
    email: 'team@greentable.example', phone: '+91 98111 22334', website: 'https://example.com', address: '12, Khan Market',
    city: 'New Delhi', state: 'Delhi', postalCode: '110003', country: 'India', menuSlug: 'the-green-table',
    plan: 'Pro', billingCycle: 'Monthly', monthlyPrice: '2999', openingHours: 'Mon–Sun: 11:00 AM – 10:30 PM',
    services: ['Dine-in', 'Takeaway', 'Delivery'], heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85',
    status: 'Active', notes: '', createdAt: '2026-01-22T10:15:00.000Z',
    menuItems: [
      { id: 'green-table-salad', name: 'Garden Greens', description: 'Seasonal leaves, citrus dressing, toasted seeds.', price: '320', pricingType: 'single', category: 'Starters', dietType: 'vegan', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=700&q=80', available: true },
      { id: 'green-table-paneer', name: 'Charred Paneer Bowl', description: 'Grilled paneer, herbed rice, and house chutney.', price: '420', pricingType: 'single', category: 'Main Course', dietType: 'veg', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=700&q=80', available: true },
    ],
  },
  {
    id: 'seed-brew-beans', businessName: 'Brew Beans Cafe', category: 'cafes', ownerName: 'Rohan Mehta',
    email: 'hello@brewbeans.example', phone: '+91 98450 11223', website: '', address: '44, 5th Block, Koramangala',
    city: 'Bengaluru', state: 'Karnataka', postalCode: '560095', country: 'India', menuSlug: 'brew-beans-cafe',
    plan: 'Starter', billingCycle: 'Monthly', monthlyPrice: '999', openingHours: 'Daily: 9:00 AM – 9:00 PM',
    services: ['Dine-in', 'Takeaway'], heroImage: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=85',
    status: 'Active', notes: '', createdAt: '2026-03-05T06:45:00.000Z',
    menuItems: [
      { id: 'brew-cold-coffee', name: 'Classic Cold Coffee', description: 'Slow-brewed coffee, chilled milk, and a touch of cocoa.', price: '210', pricingType: 'single', category: 'Beverages', dietType: 'veg', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700&q=80', available: true },
      { id: 'brew-brownie', name: 'Walnut Brownie', description: 'Warm chocolate brownie with toasted walnuts.', price: '180', pricingType: 'single', category: 'Desserts', dietType: 'veg', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=700&q=80', available: true },
    ],
  },
];

function apiError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function sendJson(response, status, value, headers = {}) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  response.end(JSON.stringify(value));
}

function getSessionToken(request) {
  const sessionCookie = request.headers.cookie?.split(';').map((entry) => entry.trim()).find((entry) => entry.startsWith('menuqr_admin_session='));
  return sessionCookie?.slice('menuqr_admin_session='.length);
}

function hasAdminSession(request) {
  const token = getSessionToken(request);
  const expiresAt = token ? sessions.get(token) : undefined;
  if (!expiresAt) return false;
  if (expiresAt <= Date.now()) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function hasCorrectAdminPassword(password) {
  if (typeof password !== 'string' || password.length > 256) return false;
  const passwordHash = createHash('sha256').update(password).digest();
  return timingSafeEqual(adminPasswordHash, passwordHash);
}

async function readJson(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) throw apiError(413, 'Request body is too large.');
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw apiError(400, 'Request body must contain valid JSON.');
  }
}

function validateClient(input, id, createdAt) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw apiError(400, 'Client data is required.');
  const businessName = String(input.businessName ?? '').trim();
  const menuSlug = String(input.menuSlug ?? '').trim().toLowerCase();
  if (!businessName) throw apiError(400, 'Business name is required.');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(menuSlug)) throw apiError(400, 'Menu URL slug is invalid.');
  if (!categories.has(input.category)) throw apiError(400, 'Business category is invalid.');
  if (!Array.isArray(input.menuItems) || input.menuItems.length > 300) throw apiError(400, 'Menu items must be a list of up to 300 items.');
  if (!Array.isArray(input.services)) throw apiError(400, 'Services must be a list.');

  const menuItems = input.menuItems.map((item) => {
    if (!item || typeof item !== 'object' || !String(item.name ?? '').trim()) throw apiError(400, 'Each menu item needs a name.');
    return {
      id: String(item.id || randomUUID()),
      name: String(item.name).trim(),
      description: String(item.description ?? ''),
      price: String(item.price ?? ''),
      pricingType: ['single', 'half-full', 'sizes'].includes(item.pricingType) ? item.pricingType : 'single',
      halfPrice: String(item.halfPrice ?? ''),
      fullPrice: String(item.fullPrice ?? ''),
      regPrice: String(item.regPrice ?? ''),
      medPrice: String(item.medPrice ?? ''),
      largePrice: String(item.largePrice ?? ''),
      category: String(item.category ?? 'Other'),
      dietType: ['veg', 'non-veg', 'vegan'].includes(item.dietType) ? item.dietType : 'veg',
      image: String(item.image ?? ''),
      available: Boolean(item.available),
    };
  });

  return {
    id,
    businessName,
    category: input.category,
    ownerName: String(input.ownerName ?? ''),
    email: String(input.email ?? ''),
    phone: String(input.phone ?? ''),
    website: String(input.website ?? ''),
    address: String(input.address ?? ''),
    city: String(input.city ?? ''),
    state: String(input.state ?? ''),
    postalCode: String(input.postalCode ?? ''),
    country: String(input.country ?? ''),
    menuSlug,
    plan: String(input.plan ?? 'Starter'),
    billingCycle: String(input.billingCycle ?? 'Monthly'),
    monthlyPrice: String(input.monthlyPrice ?? ''),
    openingHours: String(input.openingHours ?? ''),
    services: input.services.map(String),
    menuItems,
    heroImage: String(input.heroImage ?? ''),
    status: String(input.status ?? 'Active'),
    notes: String(input.notes ?? ''),
    createdAt,
  };
}

function toPublicMenu(client) {
  return {
    businessName: client.businessName,
    category: client.category,
    address: client.address,
    city: client.city,
    state: client.state,
    website: client.website,
    openingHours: client.openingHours,
    services: client.services,
    heroImage: client.heroImage,
    menuItems: client.menuItems.filter((item) => item.available),
  };
}

let clients;
let writeQueue = Promise.resolve();

async function initializeStore() {
  await mkdir(dataDirectory, { recursive: true });
  try {
    const saved = JSON.parse(await readFile(dataFile, 'utf8'));
    if (!Array.isArray(saved)) throw new Error('Stored client data must be a list.');
    clients = saved;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    clients = seedClients;
    await writeFile(dataFile, JSON.stringify(clients, null, 2), 'utf8');
  }
}

function persistClients() {
  const snapshot = JSON.stringify(clients, null, 2);
  writeQueue = writeQueue.then(async () => {
    const temporaryFile = `${dataFile}.tmp`;
    await writeFile(temporaryFile, snapshot, 'utf8');
    await rename(temporaryFile, dataFile);
  });
  return writeQueue;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    response.end();
    return;
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { status: 'ok', storage: 'json-file', clients: clients.length });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      sendJson(response, 200, { authenticated: hasAdminSession(request) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const address = request.socket.remoteAddress ?? 'unknown';
      const now = Date.now();
      const attempt = loginAttempts.get(address);
      if (attempt?.lockedUntil > now) throw apiError(429, 'Too many login attempts. Try again in 15 minutes.');

      const input = await readJson(request);
      if (!hasCorrectAdminPassword(input?.password)) {
        const currentAttempt = attempt && now - attempt.windowStartedAt < 15 * 60 * 1000
          ? attempt
          : { count: 0, windowStartedAt: now, lockedUntil: 0 };
        currentAttempt.count += 1;
        if (currentAttempt.count >= 5) currentAttempt.lockedUntil = now + 15 * 60 * 1000;
        loginAttempts.set(address, currentAttempt);
        throw apiError(401, 'Incorrect admin password.');
      }

      loginAttempts.delete(address);
      const token = randomUUID();
      sessions.set(token, now + sessionDurationSeconds * 1000);
      const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
      sendJson(response, 200, { authenticated: true }, {
        'Set-Cookie': `menuqr_admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionDurationSeconds}${secure}`,
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = getSessionToken(request);
      if (token) sessions.delete(token);
      sendJson(response, 200, { authenticated: false }, {
        'Set-Cookie': 'menuqr_admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
      });
      return;
    }

    if (url.pathname.startsWith('/api/admin/') && !hasAdminSession(request)) {
      throw apiError(401, 'Admin login required.');
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/clients') {
      sendJson(response, 200, [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      return;
    }

    const adminClientMatch = url.pathname.match(/^\/api\/admin\/clients\/([^/]+)$/);
    if (adminClientMatch) {
      const id = decodeURIComponent(adminClientMatch[1]);
      const index = clients.findIndex((client) => client.id === id);

      if (request.method === 'GET') {
        if (index < 0) throw apiError(404, 'Client not found.');
        sendJson(response, 200, clients[index]);
        return;
      }

      if (request.method === 'PUT') {
        if (index < 0) throw apiError(404, 'Client not found.');
        const updated = validateClient(await readJson(request), id, clients[index].createdAt);
        if (clients.some((client) => client.id !== id && client.menuSlug === updated.menuSlug)) throw apiError(409, 'That menu URL is already in use.');
        clients[index] = updated;
        await persistClients();
        sendJson(response, 200, updated);
        return;
      }

      if (request.method === 'DELETE') {
        if (index < 0) throw apiError(404, 'Client not found.');
        clients = clients.filter((client) => client.id !== id);
        await persistClients();
        response.writeHead(204);
        response.end();
        return;
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/clients') {
      const input = await readJson(request);
      const requestedId = typeof input?.id === 'string' && input.id.length <= 100 ? input.id : randomUUID();
      const client = validateClient(input, requestedId, new Date().toISOString());
      if (clients.some((entry) => entry.id === client.id)) throw apiError(409, 'That client ID is already in use.');
      if (clients.some((entry) => entry.menuSlug === client.menuSlug)) throw apiError(409, 'That menu URL is already in use.');
      clients.unshift(client);
      await persistClients();
      sendJson(response, 201, client);
      return;
    }

    const publicMenuMatch = url.pathname.match(/^\/api\/public\/menus\/([^/]+)$/);
    if (request.method === 'GET' && publicMenuMatch) {
      const slug = decodeURIComponent(publicMenuMatch[1]);
      const client = clients.find((entry) => entry.menuSlug === slug && entry.status.toLowerCase() === 'active');
      if (!client) throw apiError(404, 'This menu is unavailable.');
      sendJson(response, 200, toPublicMenu(client));
      return;
    }

    throw apiError(404, 'API route not found.');
  } catch (error) {
    console.error(`[api] ${request.method} ${url.pathname}:`, error.message);
    sendJson(response, error.status || 500, { error: error.status ? error.message : 'The server could not complete this request.' });
  }
});

await initializeStore();
server.listen(port, '127.0.0.1', () => {
  console.log(`MenuQR API listening at http://127.0.0.1:${port}`);
});