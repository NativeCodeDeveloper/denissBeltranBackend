import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);

// Cargar variables de entorno
dotenv.config();

const {
  MYSQL_HOST,
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE
} = process.env;

async function crearUsuarioAdmin() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    
    connection = await mysql.createConnection({
      host: MYSQL_HOST,
      port: 3308,
      user: MYSQL_USER,
      password: MYSQL_PASSWORD,
      database: MYSQL_DATABASE
    });

    console.log('✅ Conexión exitosa');

    // Verificar si ya existe un usuario admin
    const [existingAdmin] = await connection.query(
      "SELECT id_Usuarios FROM usuarios WHERE correo = 'admin@medify.com'"
    );
    
    if (existingAdmin.length > 0) {
      console.log('⚠️  Usuario admin ya existe. Actualizando contraseña...');
      
      // Actualizar contraseña del admin existente
      const hashedPassword = await bcrypt.hash('password', 10);
      await connection.query(
        "UPDATE usuarios SET contraseña = ? WHERE correo = 'admin@medify.com'",
        [hashedPassword]
      );
      
      console.log('✅ Contraseña del admin actualizada');
    } else {
      console.log('🔄 Creando usuario administrador...');
      
      // Crear nuevo usuario admin
      const hashedPassword = await bcrypt.hash('password', 10);
      const [result] = await connection.query(
        `INSERT INTO usuarios (nombre, apellido, correo, contraseña, rol) 
         VALUES (?, ?, ?, ?, ?)`,
        ['Admin', 'Sistema', 'admin@medify.com', hashedPassword, 'admin']
      );
      
      console.log('✅ Usuario administrador creado con ID:', result.insertId);
    }
    
    // Verificar el usuario creado
    const [adminUser] = await connection.query(
      "SELECT id_Usuarios, nombre, apellido, correo, rol FROM usuarios WHERE correo = 'admin@medify.com'"
    );
    
    if (adminUser.length > 0) {
      console.log('\n✅ USUARIO ADMINISTRADOR CONFIGURADO:');
      console.log('📧 Email: admin@medify.com');
      console.log('🔑 Contraseña: password');
      console.log('👤 Rol:', adminUser[0].rol);
      console.log('🆔 ID:', adminUser[0].id_Usuarios);
      console.log('\n🎯 Ya puedes hacer login en el dashboard!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
crearUsuarioAdmin();