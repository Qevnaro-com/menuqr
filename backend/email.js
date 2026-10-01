import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  const user = process.env.SMTP_USER?.trim();
  const appPassword = process.env.SMTP_APP_PASSWORD?.replace(/\s/g, '');
  if (!user || !appPassword) {
    throw new Error('SMTP_USER and SMTP_APP_PASSWORD must be configured.');
  }
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass: appPassword },
    });
  }
  return transporter;
}

export async function sendNewUserAlert(client) {
  const recipient = process.env.ADMIN_EMAIL?.trim();
  if (!recipient) {
    console.error('[email] ADMIN_EMAIL is not configured; new-user alert skipped.');
    return;
  }

  const name = client.ownerName.trim() || client.businessName;
  const dateTime = new Date(client.createdAt).toLocaleString();
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_USER.trim(),
      to: recipient,
      subject: `New Menu QR user: ${name}`,
      text: [
        `User Name: ${name}`,
        `Email: ${client.email || 'Not provided'}`,
        `Phone: ${client.phone || 'Not provided'}`,
        `Date & Time: ${dateTime}`,
        'Source: Added via Menu QR',
      ].join('\n'),
    });
  } catch (error) {
    console.error('[email] Could not send new-user alert:', error.message);
  }
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

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_USER.trim(),
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
    });
  } catch (error) {
    console.error(`[email] Could not send welcome email to ${recipient}:`, error.message);
  }
}