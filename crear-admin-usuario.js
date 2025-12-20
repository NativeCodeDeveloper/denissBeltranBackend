import 'dotenv/config';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const { DB_HOST, DB_USER, DB_PASS, DB_DATABASE, DB_PORT } = process.env;

async function crearUsuarioAdmin() {
  try {
    // Crear conexión a la base de datos
    const conexion = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      database: DB_DATABASE,
      port: DB_PORT
    });
    
    console.log(`Conectando a: ${DB_DATABASE} en puerto ${DB_PORT}`);

    console.log('Conectado a la base de datos MySQL');

    // Verificar si la tabla Usuarios existe
    const [tablas] = await conexion.execute("SHOW TABLES LIKE 'Usuarios'");
    
    if (tablas.length === 0) {
      console.log('Creando tabla Usuarios...');
      await conexion.execute(`
        CREATE TABLE Usuarios (
          id_Usuarios INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(100) NOT NULL,
          apellido VARCHAR(100) NOT NULL,
          correo VARCHAR(150) UNIQUE NOT NULL,
          contraseña VARCHAR(255) NOT NULL,
          rol ENUM('admin', 'usuario') DEFAULT 'usuario',
          fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('Tabla Usuarios creada');
    }

    // Verificar si ya existe un usuario admin
    const [adminExiste] = await conexion.execute(
      "SELECT * FROM Usuarios WHERE correo = ?", 
      ['admin@medify.com']
    );

    if (adminExiste.length > 0) {
      console.log('Usuario admin ya existe');
    } else {
      // Crear usuario administrador
      const passwordHash = await bcrypt.hash('password', 10);
      
      await conexion.execute(`
        INSERT INTO Usuarios (nombre, apellido, correo, contraseña, rol) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Admin', 'Sistema', 'admin@medify.com', passwordHash, 'admin']);
      
      console.log('Usuario administrador creado:');
      console.log('Email: admin@medify.com');
      console.log('Password: password');
    }

    // También crear usuario admin con las credenciales originales
    const [adminOriginal] = await conexion.execute(
      "SELECT * FROM Usuarios WHERE correo = ?", 
      ['admin']
    );

    if (adminOriginal.length === 0) {
      const passwordHash2 = await bcrypt.hash('admin123', 10);
      
      await conexion.execute(`
        INSERT INTO Usuarios (nombre, apellido, correo, contraseña, rol) 
        VALUES (?, ?, ?, ?, ?)
      `, ['Admin', 'Medify', 'admin', passwordHash2, 'admin']);
      
      console.log('Usuario admin secundario creado:');
      console.log('Email: admin');
      console.log('Password: admin123');
    }

    await conexion.end();
    console.log('Proceso completado');

  } catch (error) {
    console.error('Error:', error.message);
  }
}

crearUsuarioAdmin();