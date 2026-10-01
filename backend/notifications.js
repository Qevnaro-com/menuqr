import { randomUUID } from 'node:crypto';

export function createNewUserNotification(client) {
  const name = client.ownerName.trim() || client.businessName;
  return {
    id: randomUUID(),
    type: 'new-user',
    user: {
      clientId: client.id,
      name,
      email: client.email,
      phone: client.phone,
    },
    message: `New user ${name} has been added via Menu QR`,
    source: 'Added via Menu QR',
    status: 'unread',
    createdAt: client.createdAt,
    readAt: null,
  };
}