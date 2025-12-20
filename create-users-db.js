import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE
} = process.env;

async function createUsersTable() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: 3308,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE,
      multipleStatements: true
    });

    console.log('Conexión exitosa');

    // Leer el archivo SQL
    const sqlPath = path.join(__dirname, 'create-users-table.sql');
    const sqlScript = fs.readFileSync(sqlPath, 'utf8');

    console.log('Ejecutando script SQL...');
    
    // Ejecutar el script
    await connection.query(sqlScript);
    
    console.log('Tabla usuarios creada exitosamente');
    
    // Verificar que la tabla se creó
    const [tables] = await connection.query("SHOW TABLES LIKE 'usuarios'");
    
    if (tables.length > 0) {
      console.log('Tabla usuarios confirmada en la base de datos');
      
      // Mostrar estructura de la tabla
      const [columns] = await connection.query("DESCRIBE usuarios");
      console.log('\nEstructura de la tabla usuarios:');
      columns.forEach(col => {
        console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
      
      // Verificar usuario admin
      const [users] = await connection.query("SELECT id, nombre, apellido, correo, rol FROM usuarios WHERE rol = 'admin'");
      if (users.length > 0) {
        console.log('\nUsuario administrador creado:');
        console.log(users[0]);
      }
    } else {
      console.log('Error: La tabla no se creó correctamente');
    }

  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

createUsersTable();