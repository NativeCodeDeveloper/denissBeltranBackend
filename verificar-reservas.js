import 'dotenv/config';
import mysql from 'mysql2/promise';

async function verificarReservas() {
    try {
        console.log('🔍 Conectando a la base de datos...');
        console.log('Config:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            port: process.env.DB_PORT,
            database: process.env.DB_DATABASE
        });
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_DATABASE,
            port: process.env.DB_PORT
        });

        console.log('✅ Conexión exitosa');

        // Verificar registros existentes
        const [rows] = await connection.execute(
            'SELECT * FROM pacientes_reservas ORDER BY fecha DESC, hora DESC LIMIT 10'
        );

        console.log('\n📋 Últimas 10 reservas:');
        if (rows.length === 0) {
            console.log('❌ No hay reservas en la base de datos');
        } else {
            rows.forEach((row, index) => {
                console.log(`${index + 1}. ID: ${row.id_paciente}, Nombre: ${row.nombre}, Fecha: ${row.fecha}, Hora: ${row.hora}, Email: ${row.email}, Status: ${row.status}`);
            });
        }

        // Contar total de reservas
        const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM pacientes_reservas');
        console.log(`\n📊 Total de reservas en la base de datos: ${countResult[0].total}`);

        await connection.end();
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verificarReservas();