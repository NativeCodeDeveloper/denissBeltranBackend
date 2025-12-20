require('dotenv').config();
const mysql = require('mysql2');

// Usar la misma configuración que el sistema existente
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
};

async function setupPublicaciones() {
  const connection = mysql.createConnection(dbConfig);
  
  try {
    console.log('🔌 Conectando a la base de datos existente...');
    
    // Solo crear la tabla de publicaciones, sin tocar nada más
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS publicaciones (
        id INT PRIMARY KEY AUTO_INCREMENT,
        titulo VARCHAR(500) NOT NULL,
        subtitulo VARCHAR(500),
        descripcion TEXT NOT NULL,
        imagen_url VARCHAR(1000),
        estado ENUM('publicada', 'borrador') DEFAULT 'publicada',
        destacada BOOLEAN DEFAULT FALSE,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await new Promise((resolve, reject) => {
      connection.query(createTableSQL, (error, results) => {
        if (error) {
          reject(error);
        } else {
          console.log('✅ Tabla publicaciones creada/verificada');
          resolve(results);
        }
      });
    });

    // Agregar datos de ejemplo solo si la tabla está vacía
    const countQuery = 'SELECT COUNT(*) as total FROM publicaciones';
    const count = await new Promise((resolve, reject) => {
      connection.query(countQuery, (error, results) => {
        if (error) reject(error);
        else resolve(results[0].total);
      });
    });

    if (count === 0) {
      const insertDataSQL = `
        INSERT INTO publicaciones (titulo, subtitulo, descripcion, imagen_url, destacada) VALUES
        ('Manejo del Estrés en el Trabajo', 'Técnicas efectivas para el equilibrio laboral', 'El estrés laboral es una de las principales causas de malestar en nuestros tiempos. En este artículo exploramos técnicas prácticas y efectivas para mantener un equilibrio saludable entre el trabajo y la vida personal.', '/profesional.jpg', TRUE),
        ('La Importancia de la Salud Mental', 'Por qué debemos priorizar nuestro bienestar emocional', 'La salud mental es tan importante como la salud física. Descubre por qué es fundamental cuidar nuestro bienestar emocional y cómo podemos implementar hábitos saludables en nuestra rutina diaria.', '/presentacion.jpg', TRUE),
        ('Terapia Cognitivo-Conductual', 'Una aproximación moderna a la psicoterapia', 'La terapia cognitivo-conductual ha demostrado ser una de las formas más efectivas de tratamiento para diversos trastornos. Conoce más sobre esta metodología y cómo puede ayudarte.', '/foto.psicologa.jpg', FALSE)
      `;
      
      await new Promise((resolve, reject) => {
        connection.query(insertDataSQL, (error, results) => {
          if (error) reject(error);
          else {
            console.log('✅ Datos de ejemplo agregados');
            resolve(results);
          }
        });
      });
    } else {
      console.log(`📊 La tabla ya tiene ${count} publicaciones`);
    }

    console.log('🎉 Sistema de publicaciones listo!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    connection.end();
  }
}

setupPublicaciones();