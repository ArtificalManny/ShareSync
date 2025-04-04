const bcrypt = require('bcrypt');

const newPassword = 'S7mR0!%uMZ<$[w%@'; // Set the new password here
const saltRounds = 10;

bcrypt.hash(newPassword, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error hashing password:', err);
    return;
  }
  console.log('Hashed password:', hash);
});