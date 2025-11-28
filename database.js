require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('Conectado ao MariaDB com sucesso!');

    // Verificar e adicionar o campo userId se não existir
    const [columns] = await connection.query("DESCRIBE payments");
    const columnExists = columns.some(col => col.Field === 'userId');

    if (!columnExists) {
      const addUserIdQuery = `
        ALTER TABLE payments
        ADD COLUMN userId INT,
        ADD FOREIGN KEY (userId) REFERENCES usuarios(id);
      `;
      await connection.query(addUserIdQuery);
      console.log('Coluna "userId" adicionada à tabela "payments" com chave estrangeira para "usuarios".');
    }

    // Tabela de pagamentos
    const createPaymentsTableQuery = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        orderId VARCHAR(255) NOT NULL,
        proofImagePath TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        userId INT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES usuarios(id)
      );
    `;
    await connection.query(createPaymentsTableQuery);
    console.log('Tabela "payments" verificada/criada com sucesso.');

    // Tabela de usuários
    const createUsersTableQuery = `
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user VARCHAR(50) NOT NULL UNIQUE,
        senha VARCHAR(255) NOT NULL,
        perfil VARCHAR(50) NOT NULL,
        ultimo_login TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await connection.query(createUsersTableQuery);
    console.log('Tabela "usuarios" verificada/criada com sucesso.');

    // Inserir usuário admin padrão, se não existir
    const [users] = await connection.query('SELECT * FROM usuarios WHERE user = ?', ['admin']);
    if (users.length === 0) {
      const adminPassword = 'admin';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      const insertAdminQuery = `
        INSERT INTO usuarios (user, senha, perfil) VALUES (?, ?, ?);
      `;
      await connection.query(insertAdminQuery, ['admin', hashedPassword, 'admin']);
      console.log('Usuário "admin" padrão criado com sucesso.');
    }

    connection.release();
  } catch (error) {
    console.error('Erro ao inicializar o banco de dados:', error);
    // Encerra o processo se não conseguir conectar ao DB na inicialização
    process.exit(1);
  }
}

module.exports = {
  pool,
  initializeDatabase
};
