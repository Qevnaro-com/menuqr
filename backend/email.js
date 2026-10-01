import nodemailer from 'nodemailer';
import dns from 'dns';

// Render ke server par IPv6 network block hota hai, 
// isliye hum Node.js ko sirf IPv4 (normal IPs) use karne ke liye force kar rahe hain.
dns.setDefaultResultOrder('ipv4first');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER?.trim(),
        pass: process.env.SMTP_APP_PASSWORD?.trim(),
      },
    });
  }
  return transporter;
}

async function sendEmail(message, label) {
  try {
    const info = await getTransporter().sendMail({
      from: `MenuQR <${process.env.SMTP_USER?.trim()}>`,
      ...message,
    });
    console.info(`[email] ${label} accepted by Gmail (id: ${info.messageId}).`);
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
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">🎉 New User Registration</h2>
      <p style="font-size: 16px; color: #555;">A new user has just registered via Menu QR. Here are the details:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;">User Name:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Business:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${client.businessName || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${client.email || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${client.phone || 'Not provided'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Date & Time:</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${dateTime}</td>
        </tr>
        <tr>
          <td style="padding: 10px; font-weight: bold;">Source:</td>
          <td style="padding: 10px;">Added via Menu QR</td>
        </tr>
      </table>
      
      <div style="margin-top: 30px; text-align: center; color: #888; font-size: 12px;">
        <p>This is an automated notification from Menu QR.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: recipient,
    subject: `New Menu QR user: ${name}`,
    html: htmlContent,
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

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #fcfcfc;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #2c3e50; margin: 0;">Welcome to Menu QR!</h1>
        <p style="color: #7f8c8d; font-size: 16px;">We're thrilled to have ${client.businessName} on board.</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #555; line-height: 1.5;">Your account for <strong>${client.businessName}</strong> has been successfully registered.</p>
        
        <div style="margin: 25px 0; border-left: 4px solid #3498db; padding-left: 15px; background-color: #f8fbfe; padding-top: 10px; padding-bottom: 10px;">
          <h3 style="color: #2980b9; margin-top: 0; margin-bottom: 15px;">Your Subscription Details</h3>
          <p style="margin: 5px 0; color: #444;"><strong>Plan:</strong> <span style="color: #2c3e50;">${client.plan}</span></p>
          <p style="margin: 5px 0; color: #444;"><strong>Billing Cycle:</strong> <span style="color: #2c3e50;">${client.billingCycle}</span></p>
          <p style="margin: 5px 0; color: #444;"><strong>Price:</strong> <span style="color: #2c3e50;">${price}</span></p>
        </div>
        
        <p style="font-size: 15px; color: #555; line-height: 1.5;">If you have any questions or need help setting up your digital menu, simply reply to this email. We're here to help!</p>
      </div>
      
      <div style="margin-top: 30px; text-align: center; border-top: 1px solid #eee; padding-top: 20px;">
        <p style="color: #888; font-size: 14px; margin: 5px 0;">Thank you for choosing Menu QR.</p>
        <p style="color: #aaa; font-size: 12px; margin: 5px 0;">&copy; ${new Date().getFullYear()} Menu QR. All rights reserved.</p>
      </div>
    </div>
  `;

  await sendEmail({
    to: recipient,
    subject: `Welcome to Menu QR, ${client.businessName}`,
    html: htmlContent,
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