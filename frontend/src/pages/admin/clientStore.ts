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

const storageKey = 'menuqr.clients';
const draftStorageKey = 'menuqr.clientDrafts';

type ClientDraft = Omit<ClientRecord, 'id' | 'createdAt'>;

export function getClients(): ClientRecord[] {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as ClientRecord[]) : [];
  } catch {
    return [];
  }
}

export function getClient(id: string): ClientRecord | undefined {
  return getClients().find((client) => client.id === id);
}

export function getClientByMenuSlug(slug: string): ClientRecord | undefined {
  return getClients().find((client) => client.menuSlug === slug);
}

export function saveClient(client: ClientRecord): void {
  const clients = getClients();
  const existingIndex = clients.findIndex((item) => item.id === client.id);
  if (existingIndex === -1) clients.unshift(client);
  else clients[existingIndex] = client;
  localStorage.setItem(storageKey, JSON.stringify(clients));
}

export function deleteClient(id: string): void {
  localStorage.setItem(storageKey, JSON.stringify(getClients().filter((client) => client.id !== id)));
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
  const drafts = JSON.parse(localStorage.getItem(draftStorageKey) ?? '{}') as Record<string, ClientDraft>;
  drafts[key] = draft;
  localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}

export function removeClientDraft(key: string): void {
  const drafts = JSON.parse(localStorage.getItem(draftStorageKey) ?? '{}') as Record<string, ClientDraft>;
  delete drafts[key];
  localStorage.setItem(draftStorageKey, JSON.stringify(drafts));
}