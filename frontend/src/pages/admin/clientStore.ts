export type ClientCategory = 'restaurants' | 'dhabas' | 'cafes';
export type MenuDietType = 'veg' | 'non-veg' | 'vegan';

export interface MenuItemRecord {
  id: string;
  name: string;
  description: string;
  price: string;
  pricingType?: 'single' | 'half-full' | 'sizes';
  halfPrice?: string;
  fullPrice?: string;
  regPrice?: string;
  medPrice?: string;
  largePrice?: string;
  category: string;
  dietType: MenuDietType;
  image: string;
  available: boolean;
}

export interface ClientRecord {
  id: string;
  businessName: string;
  category: ClientCategory;
  ownerName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  menuSlug: string;
  plan: string;
  billingCycle: string;
  monthlyPrice: string;
  openingHours: string;
  services: string[];
  menuItems: MenuItemRecord[];
  heroImage?: string;
  status: string;
  notes: string;
  createdAt: string;
}

export interface PublicMenuRecord {
  businessName: string;
  category: ClientCategory;
  phone: string;
  address: string;
  city: string;
  state: string;
  website: string;
  openingHours: string;
  services: string[];
  heroImage?: string;
  menuItems: MenuItemRecord[];
}

export interface ApiHealth {
  status: 'ok';
  storage: string;
  clients: number;
}

export interface AdminSession {
  authenticated: boolean;
}

const storageKey = 'menuqr.clients';
const draftStorageKey = 'menuqr.clientDrafts';
const migrationStorageKey = 'menuqr.apiMigration.v1';
const adminTokenKey = 'menuqr.adminToken';

type ClientDraft = Omit<ClientRecord, 'id' | 'createdAt'>;
let migrationPromise: Promise<void> | undefined;
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem(adminTokenKey);
  const response = await fetch(`${apiBaseUrl}/api${path}`, {
    ...init,
    credentials: 'omit',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    if (response.status === 401 && path.startsWith('/admin/')) {
      window.dispatchEvent(new Event('menuqr:admin-unauthorized'));
    }
    const result = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(result?.error ?? `Request failed (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function getLegacyClients(): ClientRecord[] {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as ClientRecord[]) : [];
  } catch {
    return [];
  }
}

async function migrateLegacyClients(clients: ClientRecord[]): Promise<ClientRecord[]> {
  if (localStorage.getItem(migrationStorageKey)) return clients;
  if (!migrationPromise) {
    migrationPromise = (async () => {
      for (const legacyClient of getLegacyClients()) {
        if (clients.some((client) => client.menuSlug === legacyClient.menuSlug)) continue;
        try {
          await request<ClientRecord>('/admin/clients', {
            method: 'POST',
            body: JSON.stringify(legacyClient),
          });
        } catch (error) {
          if (!(error instanceof Error) || !error.message.includes('already in use')) throw error;
        }
      }
      localStorage.setItem(migrationStorageKey, 'done');
    })();
  }
  try {
    await migrationPromise;
  } finally {
    migrationPromise = undefined;
  }
  return request<ClientRecord[]>('/admin/clients');
}

export async function getClients(): Promise<ClientRecord[]> {
  return migrateLegacyClients(await request<ClientRecord[]>('/admin/clients'));
}

export function getApiHealth(): Promise<ApiHealth> {
  return request<ApiHealth>('/health');
}

export function getAdminSession(): Promise<AdminSession> {
  return request<AdminSession>('/auth/session');
}

export async function loginAdmin(password: string): Promise<AdminSession> {
  const session = await request<AdminSession & { token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  localStorage.setItem(adminTokenKey, session.token);
  return { authenticated: session.authenticated };
}

export async function logoutAdmin(): Promise<AdminSession> {
  try {
    return await request<AdminSession>('/auth/logout', { method: 'POST', body: '{}' });
  } finally {
    localStorage.removeItem(adminTokenKey);
  }
}

export async function getClient(id: string): Promise<ClientRecord | undefined> {
  await getClients();
  try {
    return await request<ClientRecord>(`/admin/clients/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof Error && error.message === 'Client not found.') return undefined;
    throw error;
  }
}

export async function getClientByMenuSlug(slug: string): Promise<PublicMenuRecord | undefined> {
  try {
    return await request<PublicMenuRecord>(`/public/menus/${encodeURIComponent(slug)}`);
  } catch (error) {
    if (error instanceof Error && error.message === 'This menu is unavailable.') return undefined;
    throw error;
  }
}

export function createClient(client: Omit<ClientRecord, 'id' | 'createdAt'>): Promise<ClientRecord> {
  return request<ClientRecord>('/admin/clients', { method: 'POST', body: JSON.stringify(client) });
}

export function saveClient(client: ClientRecord): Promise<ClientRecord> {
  return request<ClientRecord>(`/admin/clients/${encodeURIComponent(client.id)}`, {
    method: 'PUT',
    body: JSON.stringify(client),
  });
}

export async function deleteClient(id: string): Promise<void> {
  await request<void>(`/admin/clients/${encodeURIComponent(id)}`, { method: 'DELETE' });
  removeClientDraft(id);
}

export function getClientDraft(key: string): ClientDraft | undefined {
  try {
    const drafts = JSON.parse(localStorage.getItem(draftStorageKey) ?? '{}') as Record<string, ClientDraft>;
    return drafts[key];
  } catch {
    return undefined;
  }
}

export function saveClientDraft(key: string, draft: ClientDraft): void {
  let drafts: Record<string, ClientDraft> = {};
  try {
    drafts = JSON.parse(localStorage.getItem(draftStorageKey) ?? '{}') as Record<string, ClientDraft>;
  } catch {
    drafts = {};
  }
  drafts[key] = draft;
  localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}

export function removeClientDraft(key: string): void {
  let drafts: Record<string, ClientDraft> = {};
  try {
    drafts = JSON.parse(localStorage.getItem(draftStorageKey) ?? '{}') as Record<string, ClientDraft>;
  } catch {
    drafts = {};
  }
  delete drafts[key];
  localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}