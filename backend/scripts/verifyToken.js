const jwt = require('jsonwebtoken');

const token = process.argv[2];
const secret = process.env.JWT_SECRET || 'please_change_this_secret';

if (!token) {
  console.error('Usage: node verifyToken.js <token>');
  process.exit(1);
}

try {
  const payload = jwt.verify(token, secret);
  console.log('valid');
  console.log(JSON.stringify(payload, null, 2));
} catch (err) {
  console.error('verify-error:', err.message);
  process.exit(2);
}
