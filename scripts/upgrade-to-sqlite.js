const fs = require('fs');
const path = require('path');

// 数据库升级脚本：从JSON文件迁移到SQLite
class DatabaseUpgrade {
  static async upgradeToSQLite() {
    console.log('🔄 开始数据库升级...');
    
    try {
      // 检查是否需要安装sqlite3
      try {
        require('sqlite3');
      } catch (error) {
        console.log('❌ 请先安装sqlite3: npm install sqlite3');
        return;
      }

      const sqlite3 = require('sqlite3').verbose();
      const dbPath = path.join(process.cwd(), 'data', 'xhs.db');
      
      // 创建SQLite数据库
      const db = new sqlite3.Database(dbPath);
      
      // 创建表结构
      await this.createTables(db);
      
      // 迁移用户数据
      await this.migrateUsers(db);
      
      // 迁移笔记数据
      await this.migrateNotes(db);
      
      console.log('✅ 数据库升级完成！');
      console.log(`📍 SQLite数据库位置: ${dbPath}`);
      
      // 备份原始JSON文件
      await this.backupJsonFiles();
      
      db.close();
      
    } catch (error) {
      console.error('❌ 升级失败:', error);
    }
  }

  static createTables(db) {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          avatar_url TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS notes (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          author_name TEXT,
          author_avatar TEXT,
          author_user_id TEXT,
          images TEXT,
          tags TEXT,
          likes INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          url TEXT,
          create_time TEXT,
          extracted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_notes_extracted_at ON notes(extracted_at);
      `;
      
      db.exec(sql, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ 数据库表创建成功');
          resolve();
        }
      });
    });
  }

  static async migrateUsers(db) {
    const usersFile = path.join(process.cwd(), 'data', 'users.json');
    
    if (!fs.existsSync(usersFile)) {
      console.log('ℹ️  没有找到用户数据文件');
      return;
    }

    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO users 
        (id, username, email, password_hash, avatar_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      users.forEach(user => {
        stmt.run([
          user.id,
          user.username,
          user.email,
          user.passwordHash,
          user.avatarUrl || null,
          user.createdAt,
          user.updatedAt
        ], (err) => {
          if (err) {
            console.error('用户迁移失败:', err);
          } else {
            count++;
          }
        });
      });

      stmt.finalize((err) => {
        if (err) reject(err);
        else {
          console.log(`✅ 成功迁移 ${count} 个用户`);
          resolve();
        }
      });
    });
  }

  static async migrateNotes(db) {
    const notesFile = path.join(process.cwd(), 'data', 'notes.json');
    
    if (!fs.existsSync(notesFile)) {
      console.log('ℹ️  没有找到笔记数据文件');
      return;
    }

    const notes = JSON.parse(fs.readFileSync(notesFile, 'utf-8'));
    
    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO notes 
        (id, user_id, title, content, author_name, author_avatar, author_user_id,
         images, tags, likes, comments, shares, url, create_time, extracted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      notes.forEach(note => {
        stmt.run([
          note.id,
          note.userId,
          note.title,
          note.content,
          note.authorName,
          note.authorAvatar || null,
          note.authorUserId || null,
          JSON.stringify(note.images),
          JSON.stringify(note.tags),
          note.likes,
          note.comments,
          note.shares,
          note.url || null,
          note.createTime,
          note.extractedAt
        ], (err) => {
          if (err) {
            console.error('笔记迁移失败:', err);
          } else {
            count++;
          }
        });
      });

      stmt.finalize((err) => {
        if (err) reject(err);
        else {
          console.log(`✅ 成功迁移 ${count} 条笔记`);
          resolve();
        }
      });
    });
  }

  static async backupJsonFiles() {
    const dataDir = path.join(process.cwd(), 'data');
    const backupDir = path.join(dataDir, 'backup');
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    const files = ['users.json', 'notes.json'];
    const timestamp = new Date().toISOString().split('T')[0];
    
    files.forEach(file => {
      const sourcePath = path.join(dataDir, file);
      if (fs.existsSync(sourcePath)) {
        const backupPath = path.join(backupDir, `${timestamp}-${file}`);
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`📦 备份文件: ${backupPath}`);
      }
    });
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  DatabaseUpgrade.upgradeToSQLite().then(() => {
    console.log('🎉 升级完成！');
    process.exit(0);
  }).catch(error => {
    console.error('💥 升级失败:', error);
    process.exit(1);
  });
}

module.exports = DatabaseUpgrade; 