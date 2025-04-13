const bcrypt = require('bcryptjs');

const password = 'S7mR0!%uMZ<$[w%@';
bcrypt.hash(password, 10, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Hashed password:', hash);
});