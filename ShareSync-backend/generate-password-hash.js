const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'S7mR0!%uMZ<$[w%@';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Hashed Password:', hashedPassword);
}

generateHash();