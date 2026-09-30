import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { setServers } from 'node:dns';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { MongoClient } from 'mongodb';

const directory = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(directory, '.env') });
const dnsServers = (process.env.MONGODB_DNS_SERVERS || '').split(',').map((server) => server.trim()).filter(Boolean);
if (dnsServers.length > 0) setServers(dnsServers);
const legacyDataFile = join(directory, 'data', 'clients.json');
const port = Number(process.env.API_PORT || 3001);
const maxBodyBytes = 20 * 1024 * 1024;
const adminPassword = process.env.ADMIN_PASSWORD || 'MenuQR@2026!';
const adminPasswordHash = createHash('sha256').update(adminPassword).digest();
const sessionDurationSeconds = 8 * 60 * 60;
const loginLockDurationMs = 60 * 1000;
const frontendOrigin = process.env.FRONTEND_ORIGIN;
const categories = new Set(['restaurants', 'dhabas', 'cafes']);
const loginAttempts = new Map();

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

async function hasAdminSession(request) {
  const token = getSessionToken(request);
  if (!token) return false;
  return Boolean(await adminSessions.findOne({ token, expiresAt: { $gt: new Date() } }, { projection: { _id: 1 } }));
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

let mongoClient;
let clientCollection;
let adminSessions;

async function initializeStore() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required. Configure your MongoDB connection string before starting the API.');

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  const database = mongoClient.db(process.env.MONGODB_DATABASE || 'menuqr');
  clientCollection = database.collection('clients');
  adminSessions = database.collection('admin_sessions');
  await Promise.all([
    clientCollection.createIndex({ id: 1 }, { unique: true }),
    clientCollection.createIndex({ menuSlug: 1 }, { unique: true }),
    adminSessions.createIndex({ token: 1 }, { unique: true }),
    adminSessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  if (await clientCollection.estimatedDocumentCount() === 0) {
    let importedClients = [];
    try {
      const saved = JSON.parse(await readFile(legacyDataFile, 'utf8'));
      if (Array.isArray(saved)) importedClients = saved.filter((client) => !String(client.id).startsWith('seed-'));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    if (importedClients.length > 0) await clientCollection.insertMany(importedClients);
    console.log(`Imported ${importedClients.length} client records into MongoDB.`);
  }

  console.log(`Connected to MongoDB database "${database.databaseName}".`);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, 'http://localhost');
  const requestOrigin = request.headers.origin;
  if (requestOrigin && requestOrigin === frontendOrigin) {
    response.setHeader('Access-Control-Allow-Origin', frontendOrigin);
    response.setHeader('Access-Control-Allow-Credentials', 'true');
    response.setHeader('Vary', 'Origin');
  }
  if (request.method === 'OPTIONS') {
    response.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    response.end();
    return;
  }

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') {
      sendJson(response, 200, { status: 'ok', storage: 'mongodb', clients: await clientCollection.countDocuments() });
      return;
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/session') {
      sendJson(response, 200, { authenticated: await hasAdminSession(request) });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      const address = request.socket.remoteAddress ?? 'unknown';
      const now = Date.now();
      const attempt = loginAttempts.get(address);
      if (attempt?.lockedUntil > now) throw apiError(429, 'Too many login attempts. Try again in 1 minute.');

      const input = await readJson(request);
      if (!hasCorrectAdminPassword(input?.password)) {
        const currentAttempt = attempt && now - attempt.windowStartedAt < 15 * 60 * 1000
          ? attempt
          : { count: 0, windowStartedAt: now, lockedUntil: 0 };
        currentAttempt.count += 1;
        if (currentAttempt.count >= 5) currentAttempt.lockedUntil = now + loginLockDurationMs;
        loginAttempts.set(address, currentAttempt);
        throw apiError(401, 'Incorrect admin password.');
      }

      loginAttempts.delete(address);
      const token = randomUUID();
      const expiresAt = new Date(now + sessionDurationSeconds * 1000);
      await adminSessions.insertOne({ token, expiresAt });
      const secure = process.env.NODE_ENV === 'production' ? '; Secure; SameSite=None' : '; SameSite=Strict';
      sendJson(response, 200, { authenticated: true }, {
        'Set-Cookie': `menuqr_admin_session=${token}; HttpOnly; Path=/; Max-Age=${sessionDurationSeconds}${secure}`,
      });
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/logout') {
      const token = getSessionToken(request);
      if (token) await adminSessions.deleteOne({ token });
      const secure = process.env.NODE_ENV === 'production' ? '; Secure; SameSite=None' : '; SameSite=Strict';
      sendJson(response, 200, { authenticated: false }, {
        'Set-Cookie': `menuqr_admin_session=; HttpOnly; Path=/; Max-Age=0${secure}`,
      });
      return;
    }

    if (url.pathname.startsWith('/api/admin/') && !await hasAdminSession(request)) {
      throw apiError(401, 'Admin login required.');
    }

    if (request.method === 'GET' && url.pathname === '/api/admin/clients') {
      const records = await clientCollection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
      sendJson(response, 200, records);
      return;
    }

    const adminClientMatch = url.pathname.match(/^\/api\/admin\/clients\/([^/]+)$/);
    if (adminClientMatch) {
      const id = decodeURIComponent(adminClientMatch[1]);

      if (request.method === 'GET') {
        const client = await clientCollection.findOne({ id }, { projection: { _id: 0 } });
        if (!client) throw apiError(404, 'Client not found.');
        sendJson(response, 200, client);
        return;
      }

      if (request.method === 'PUT') {
        const current = await clientCollection.findOne({ id }, { projection: { _id: 0 } });
        if (!current) throw apiError(404, 'Client not found.');
        const updated = validateClient(await readJson(request), id, current.createdAt);
        const conflict = await clientCollection.findOne({ menuSlug: updated.menuSlug, id: { $ne: id } }, { projection: { _id: 1 } });
        if (conflict) throw apiError(409, 'That menu URL is already in use.');
        await clientCollection.updateOne({ id }, { $set: updated });
        sendJson(response, 200, updated);
        return;
      }

      if (request.method === 'DELETE') {
        const result = await clientCollection.deleteOne({ id });
        if (result.deletedCount === 0) throw apiError(404, 'Client not found.');
        response.writeHead(204);
        response.end();
        return;
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/admin/clients') {
      const input = await readJson(request);
      const requestedId = typeof input?.id === 'string' && input.id.length <= 100 ? input.id : randomUUID();
      const client = validateClient(input, requestedId, new Date().toISOString());
      if (await clientCollection.findOne({ id: client.id }, { projection: { _id: 1 } })) throw apiError(409, 'That client ID is already in use.');
      if (await clientCollection.findOne({ menuSlug: client.menuSlug }, { projection: { _id: 1 } })) throw apiError(409, 'That menu URL is already in use.');
      await clientCollection.insertOne(client);
      sendJson(response, 201, client);
      return;
    }

    const publicMenuMatch = url.pathname.match(/^\/api\/public\/menus\/([^/]+)$/);
    if (request.method === 'GET' && publicMenuMatch) {
      const slug = decodeURIComponent(publicMenuMatch[1]);
      const client = await clientCollection.findOne({ menuSlug: slug }, { projection: { _id: 0 } });
      if (!client || client.status.toLowerCase() !== 'active') throw apiError(404, 'This menu is unavailable.');
      sendJson(response, 200, toPublicMenu(client));
      return;
    }

    throw apiError(404, 'API route not found.');
  } catch (error) {
    console.error(`[api] ${request.method} ${url.pathname}:`, error.message);
    const status = error.status || (error.code === 11000 ? 409 : 500);
    sendJson(response, status, { error: error.status || error.code === 11000 ? error.message : 'The server could not complete this request.' });
  }
});

await initializeStore();
const PORT = process.env.PORT || port || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`MenuQR API listening on port ${PORT}`);
});