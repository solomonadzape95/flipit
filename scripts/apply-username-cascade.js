const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function applyUsernameCascade() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Applying username cascade trigger...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, '../prisma/migrations/add_username_cascade.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await prisma.$executeRawUnsafe(sql);
    
    console.log('✅ Username cascade trigger applied successfully!');
    console.log('Now when a user updates their username, all their scores will be updated automatically.');
    
  } catch (error) {
    console.error('❌ Error applying username cascade trigger:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  applyUsernameCascade()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { applyUsernameCascade };
