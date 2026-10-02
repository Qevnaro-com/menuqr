import https from 'https';

async function sendEmail(message, label) {
  if (!process.env.BREVO_API_KEY) {
    console.error(`[email] BREVO_API_KEY is not set in Render Environment Variables; could not send ${label}.`);
    return;
  }
  
  // Use the verified Gmail ID
  const senderEmail = process.env.SMTP_USER?.trim() || 'qevnaro@gmail.com';

  const payload = JSON.stringify({
    sender: { email: senderEmail, name: 'MenuQR' },
    to: [{ email: message.to }],
    subject: message.subject,
    htmlContent: message.html,
    textContent: message.text
  });

  const options = {
    hostname: 'api.brevo.com',
    path: '/v3/smtp/email',
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': process.env.BREVO_API_KEY.trim(),
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.info(`[email] ${label} accepted by Brevo.`);
          resolve();
        } else {
          console.error(`[email] Could not send ${label} (status: ${res.statusCode}):`, data);
          resolve();
        }
      });
    });
    
    req.on('error', (e) => {
      console.error(`[email] Request error for ${label}:`, e.message);
      resolve();
    });
    
    req.write(payload);
    req.end();
  });
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
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); border: 1px solid #f0f0f0;">
      
      <!-- Header with Food Image -->
      <div style="background-image: url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600&auto=format&fit=crop'); background-size: cover; background-position: center; padding: 50px 20px; text-align: center; position: relative;">
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.6);"></div>
        <div style="position: relative; z-index: 1;">
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; text-shadow: 2px 2px 4px rgba(0,0,0,0.8);">Welcome to MenuQR! 🍽️</h1>
          <p style="color: #f1c40f; font-size: 20px; margin-top: 10px; font-weight: bold; text-shadow: 1px 1px 3px rgba(0,0,0,0.8);">${client.businessName}</p>
        </div>
      </div>
      
      <!-- Content -->
      <div style="padding: 30px; background-color: #fafafa;">
        <p style="font-size: 16px; color: #333;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #555; line-height: 1.6;">Aapka digital menu account successfully register ho gaya hai. Ab aapke customers ek scan se aapka swadisht khana apne phone par dekh payenge! 🎉</p>
        
        <div style="margin: 30px 0; background-color: #ffffff; border-radius: 8px; padding: 25px; border-left: 5px solid #e67e22; box-shadow: 0 2px 5px rgba(0,0,0,0.02);">
          <h3 style="color: #e67e22; margin-top: 0; margin-bottom: 20px; font-size: 18px;">📋 Your Subscription Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666; width: 120px;"><strong>Plan:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #2c3e50; font-weight: bold;">${client.plan}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #666;"><strong>Cycle:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #2c3e50; font-weight: bold;">${client.billingCycle}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #666;"><strong>Price:</strong></td>
              <td style="padding: 10px 0; color: #2c3e50; font-weight: bold; font-size: 18px;">${price}</td>
            </tr>
          </table>
        </div>

        <!-- Trust Indicators Section -->
        <div style="margin: 30px 0;">
          <h3 style="color: #2c3e50; font-size: 18px; text-align: center; margin-bottom: 20px;">Why Top Restaurants Trust Us 🤝</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 15px; width: 50%; text-align: center; border-right: 1px solid #eee; border-bottom: 1px solid #eee;">
                <span style="font-size: 24px;">⚡</span>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 14px;">Superfast Loading</p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #777;">No delays for your customers.</p>
              </td>
              <td style="padding: 15px; width: 50%; text-align: center; border-bottom: 1px solid #eee;">
                <span style="font-size: 24px;">🔒</span>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 14px;">100% Secure</p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #777;">Bank-level security.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 15px; width: 50%; text-align: center; border-right: 1px solid #eee;">
                <span style="font-size: 24px;">📞</span>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 14px;">Dedicated Support</p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #777;">Hum hamesha aapke sath hain.</p>
              </td>
              <td style="padding: 15px; width: 50%; text-align: center;">
                <span style="font-size: 24px;">⭐</span>
                <p style="margin: 5px 0 0 0; font-weight: bold; color: #333; font-size: 14px;">Premium Quality</p>
                <p style="margin: 3px 0 0 0; font-size: 12px; color: #777;">Best UI experience.</p>
              </td>
            </tr>
          </table>
        </div>

        <div style="background-color: #eafaf1; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #a3e4d7;">
          <h4 style="margin: 0 0 10px 0; color: #148f77; font-size: 16px;">What's Next? 🚀</h4>
          <p style="margin: 0; color: #117a65; font-size: 14px; line-height: 1.5;">Humari team jaldi hi aapse contact karegi. Aap bas apna menu ready rakhiye, hum sab setup kar denge!</p>
        </div>
        
        <p style="font-size: 15px; color: #666; line-height: 1.6; margin-top: 30px; text-align: center;">Agar aapko menu setup karne me koi bhi madad chahiye, to bas is email par reply karein. Hum aapki madad ke liye hamesha taiyar hain.</p>
      </div>
      
      <!-- Footer -->
      <div style="background-color: #2c3e50; padding: 25px; text-align: center;">
        <p style="color: #ecf0f1; font-size: 15px; margin: 5px 0; font-weight: bold;">Thank you for choosing MenuQR.</p>
        <p style="color: #95a5a6; font-size: 13px; margin: 10px 0 0 0;">&copy; ${new Date().getFullYear()} MenuQR. All rights reserved.</p>
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
      'Why Top Restaurants Trust Us:',
      '- Superfast Loading',
      '- 100% Secure Data',
      '- Dedicated Support',
      '- Premium Quality',
      '',
      'What\\'s Next?',
      'Humari team jaldi hi aapse contact karegi. Aap bas apna menu ready rakhiye, hum sab setup kar denge!',
      '',
      'If you have questions about your subscription, reply to this email.',
      '',
      'Thank you,',
      'Menu QR Team',
    ].join('\n'),
  }, `customer welcome email for ${client.businessName}`);
}