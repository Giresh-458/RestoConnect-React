// Test script to verify email configuration
// Run with: node util/testEmail.js

const { sendPasswordResetCode } = require('./emailService');

async function testEmail() {
  console.log('🧪 Testing email configuration...\n');
  
  const testEmail = process.env.TEST_EMAIL || 'restoconnect.wbd@gmail.com';
  const testCode = '123456';
  
  try {
    console.log(`📧 Sending test email to: ${testEmail}`);
    const result = await sendPasswordResetCode(testEmail, testCode);
    console.log('\n✅ SUCCESS! Email sent successfully!');
    console.log('Message ID:', result.messageId);
  } catch (error) {
    console.log('\n❌ FAILED! Email could not be sent.');
    console.log('Error:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. For Gmail, you need to use an App Password (not your regular password)');
    console.log('2. Enable 2-Step Verification in your Google Account');
    console.log('3. Generate an App Password: https://myaccount.google.com/apppasswords');
    console.log('4. Use the 16-character App Password in EMAIL_PASS');
    console.log('5. Make sure "Less secure app access" is enabled (if not using App Password)');
  }
  
  process.exit(0);
}

testEmail();
