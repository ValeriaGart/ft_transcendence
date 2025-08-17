import { db, dbRun } from './database.js';

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Add new columns to users table if they don't exist
    const columns = [
      'name TEXT',
      'googleId TEXT UNIQUE',
      'profilePicture TEXT',
      'emailVerified INTEGER DEFAULT 0',
      'lastLoginAt TIMESTAMP',
      'isActive INTEGER DEFAULT 1'
    ];
    
    for (const column of columns) {
      const [columnName] = column.split(' ');
      try {
        await dbRun(`ALTER TABLE users ADD COLUMN ${columnName} ${column.split(' ').slice(1).join(' ')}`);
        console.log(`Added column: ${columnName}`);
      } catch (error) {
        if (error.message.includes('duplicate column name')) {
          console.log(`Column ${columnName} already exists, skipping...`);
        } else {
          console.error(`Error adding column ${columnName}:`, error);
        }
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
  }
}

migrate(); 