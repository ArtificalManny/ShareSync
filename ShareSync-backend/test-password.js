const bcrypt = require('bcrypt');

const password = 'S7mR0!%uMZ<$[w%@';
const hash = '$2b$10$l31fJ7fwtKPZ9YU3LrWG3.Fqe9/Lg7GBQ81OECSWx/T8POWmVSx5i';

bcrypt.compare(password, hash, (err, result) => {
  if (err) {
    console.error('Error comparing password:', err);
    return;
  }
  console.log('Password match:', result);
});