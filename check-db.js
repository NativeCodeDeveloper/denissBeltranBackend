import mysql from 'mysql2';
import dotenv from 'dotenv';

// The following block was misplaced and should be inside the callback for creating the table.
// It is now moved to the correct place below.

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT || 3306
});

console.log('Intentando conectar a la base de datos...');

connection.connect((err) => {
  if (err) {
    console.log('Error de conexión:', err.message);
    return;
  }
  console.log('Conexión exitosa a MySQL');
  
  // Verificar si la tabla existe
  connection.query('DESCRIBE pacientes_reservas', (err, results) => {
    if (err) {
      if (err.code === 'ER_NO_SUCH_TABLE') {
        console.log('La tabla pacientes_reservas no existe. Creándola...');
        
        const createQuery = `
          CREATE TABLE pacientes_reservas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL,
            rut VARCHAR(20) NOT NULL,
            telefono VARCHAR(20),
            email VARCHAR(255),
            fecha DATE NOT NULL,
            hora TIME NOT NULL,
            event_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status ENUM('pendiente', 'confirmada', 'completada', 'cancelada') DEFAULT 'pendiente',
            id_paciente INT,
            INDEX(rut),
            INDEX(fecha),
            INDEX(id_paciente)
          )
        `;
        
        connection.query(createQuery, (createErr) => {
          if (createErr) {
            console.log('Error creando tabla:', createErr.message);
          } else {
            console.log(' Tabla pacientes_reservas creada exitosamente');
          }
          connection.end();
        });
      } else {
        console.log('Error:', err.message);
        connection.end();
      }
    } else {
      console.log(' Tabla pacientes_reservas existe. Estructura:');
      results.forEach(row => {
        console.log(`${row.Field} - ${row.Type} - Null: ${row.Null} - Default: ${row.Default}`);
      });
      
      // Verificar si necesitamos agregar columnas
      const existingColumns = results.map(row => row.Field);
      const alterQueries = [];
      if (!existingColumns.includes('status')) {
        alterQueries.push("ALTER TABLE pacientes_reservas ADD COLUMN status ENUM('pendiente', 'confirmada', 'completada', 'cancelada') DEFAULT 'pendiente'");
      }
      if (!existingColumns.includes('id_paciente')) {
        alterQueries.push("ALTER TABLE pacientes_reservas ADD COLUMN id_paciente INT");
      }
      
      if (alterQueries.length > 0) {
        let completed = 0;
        alterQueries.forEach((query, index) => {
          connection.query(query, (alterErr) => {
            completed++;
            if (alterErr) {
              console.log(`Error en consulta ${index + 1}:`, alterErr.message);
            } else {
              console.log(` Consulta ${index + 1} completada`);
            }
      
            if (completed === alterQueries.length) {
              console.log('\n Todas las columnas agregadas correctamente');
              connection.end();
            }
          });
        });
      } else {
        console.log('\n Todas las columnas necesarias ya existen');
        connection.end();
      }
    }
  });
});