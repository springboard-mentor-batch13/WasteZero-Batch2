const path = require('path');
const nodemailer = require('nodemailer');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const sendEmail = async ({ to, subject, html }) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpEmail = process.env.SMTP_EMAIL;
  const smtpPassword = process.env.SMTP_PASSWORD;

  console.log('[SMTP] Preparing email delivery...');
  console.log('[SMTP] Host:', smtpHost || 'undefined');
  console.log('[SMTP] Port:', smtpPort || 'undefined');
  console.log('[SMTP] Sender:', smtpEmail || 'undefined');
  console.log('[SMTP] Password configured:', smtpPassword ? 'yes' : 'no');

  if (!smtpHost || !smtpPort || !smtpEmail || !smtpPassword) {
    const missingVars = [];
    if (!smtpHost) missingVars.push('SMTP_HOST');
    if (!smtpPort) missingVars.push('SMTP_PORT');
    if (!smtpEmail) missingVars.push('SMTP_EMAIL');
    if (!smtpPassword) missingVars.push('SMTP_PASSWORD');

    const errorMessage = `Missing SMTP environment variables: ${missingVars.join(', ')}. Make sure your backend .env file exists and is loaded correctly.`;
    console.error('[SMTP] Configuration error:', errorMessage);
    throw new Error(errorMessage);
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(smtpPort),
    secure: false,
    auth: {
      user: smtpEmail,
      pass: smtpPassword,
    },
  });

  const mailOptions = {
    from: smtpEmail,
    to,
    subject,
    html,
  };

  try {
    console.log('[SMTP] Verifying connection to SMTP server...');
    await transporter.verify();
    console.log('[SMTP] SMTP connection verified successfully.');

    console.log('[SMTP] Sending email to:', to);
    const info = await transporter.sendMail(mailOptions);
    console.log('[SMTP] Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('[SMTP] sendMail() failed.');
    console.error('[SMTP] Error name:', error.name);
    console.error('[SMTP] Error message:', error.message);

    if (error.code === 'EAUTH') {
      console.error('[SMTP] Authentication failed. Check SMTP_EMAIL and SMTP_PASSWORD. For Gmail, use an App Password instead of the normal Google account password.');
    }

    if (error.response) {
      console.error('[SMTP] SMTP response:', error.response);
    }

    throw error;
  }
};

module.exports = sendEmail;
