const nodemailer = require('nodemailer');

// Email configuration - using Gmail as default
// For production, use environment variables
const createTransporter = () => {
  const emailUser = process.env.EMAIL_USER || 'restoconnect.wbd@gmail.com';
  const emailPass = process.env.EMAIL_PASS || 'tcwpoluxajgyynfj';

  // Try Gmail with secure configuration
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verify transporter connection
const verifyTransporter = async (transporter) => {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email server verification failed:', error.message);
    return false;
  }
};

// Send password reset code email
const sendPasswordResetCode = async (email, code) => {
  let transporter;
  try {
    transporter = createTransporter();
    
    // Try to verify connection (non-blocking - will still attempt to send if verification fails)
    try {
      const isVerified = await verifyTransporter(transporter);
      if (!isVerified) {
        console.warn('⚠️ Email server verification failed, but will still attempt to send email');
      }
    } catch (verifyError) {
      console.warn('⚠️ Email verification error (non-blocking):', verifyError.message);
      // Continue anyway - sometimes verification fails but sending still works
    }
    
    const emailUser = process.env.EMAIL_USER || 'restoconnect.wbd@gmail.com';
    const mailOptions = {
      from: `RestoConnect <${emailUser}>`,
      to: email,
      subject: 'Password Reset Code - RestoConnect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 25%, #00d4aa 50%, #4facfe 75%, #00f2fe 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">🍽️ RestoConnect</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You requested to reset your password. Use the code below to reset your password:
            </p>
            <div style="background: white; border: 2px dashed #4facfe; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="font-size: 32px; font-weight: bold; color: #4facfe; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
                ${code}
              </p>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This code will expire in <strong>15 minutes</strong>.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              If you didn't request this, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} RestoConnect. All rights reserved.</p>
          </div>
        </div>
      `
    };

    console.log(`📧 Attempting to send email to: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent successfully:', info.messageId);
    console.log('📬 Email response:', info.response);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending password reset email:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response);
    console.error('Full error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to send email. Please try again later.';
    
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check your email credentials. For Gmail, you may need to use an App Password instead of your regular password.';
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      errorMessage = 'Could not connect to email server. Please check your internet connection.';
    } else if (error.response) {
      errorMessage = `Email server error: ${error.response}`;
    }
    
    throw new Error(errorMessage);
  }
};

module.exports = {
  sendPasswordResetCode
};
