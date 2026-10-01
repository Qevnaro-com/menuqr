import { Resend } from 'resend';

let resendClient;

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('RESEND_API_KEY must be configured.');
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

async function sendEmail(message, label) {
  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.RESEND_FROM_EMAIL?.trim() || 'MenuQR <onboarding@resend.dev>',
      ...message,
    });
    if (error) {
      console.error(`[email] Could not send ${label}:`, error.message);
      return;
    }
    console.info(`[email] ${label} accepted by Resend (id: ${data?.id ?? 'unknown'}).`);
  } catch (error) {
    console.error(`[email] Could not send ${label}:`, error.message);
  }
}

export async function sendNewUserAlert(client) {
  const recipient = process.env.ADMIN_EMAIL?.trim();
  if (!recipient) {
    console.error('[email] ADMIN_EMAIL is not configured; new-user alert skipped.');
    return;
  }

  const name = client.ownerName.trim() || client.businessName;
  const dateTime = new Date(client.createdAt).toLocaleString();
  await sendEmail({
    to: recipient,
    subject: `New Menu QR user: ${name}`,
    text: [
      `User Name: ${name}`,
      `Email: ${client.email || 'Not provided'}`,
      `Phone: ${client.phone || 'Not provided'}`,
      `Date & Time: ${dateTime}`,
      'Source: Added via Menu QR',
    ].join('\n'),
  }, 'new-user admin alert');
}

export async function sendClientWelcomeEmail(client) {
  const recipient = client.email.trim();
  if (!recipient) {
    console.info(`[email] No customer email for ${client.businessName}; welcome email skipped.`);
    return;
  }

  const name = client.ownerName.trim() || client.businessName;
  const price = client.monthlyPrice
    ? `INR ${client.monthlyPrice} per ${client.billingCycle.toLowerCase()} billing cycle`
    : 'Please contact us to confirm pricing';

  await sendEmail({
    to: recipient,
    subject: `Welcome to Menu QR, ${client.businessName}`,
    text: [
      `Hello ${name},`,
      '',
      `Welcome to Menu QR. ${client.businessName} has been registered successfully.`,
      '',
      'Your selected subscription:',
      `Plan: ${client.plan}`,
      `Billing cycle: ${client.billingCycle}`,
      `Price: ${price}`,
      '',
      'If you have questions about your subscription, reply to this email.',
      '',
      'Thank you,',
      'Menu QR',
    ].join('\n'),
  }, `customer welcome email for ${client.businessName}`);
}