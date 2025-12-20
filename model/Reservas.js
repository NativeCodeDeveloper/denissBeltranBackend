import DataBase from "../config/DataBase.js";

export default class Reservas {
    constructor() {
        this.database = DataBase.getInstance();
    }

    // SELECCIONA TODAS LAS RESERVAS CON DATOS DEL PACIENTE
    async selectReservasConPaciente() {
        const query =
            `
                SELECT 
                r.id_paciente,
                r.nombre,
                r.rut,
                r.telefono,
                r.email,
                r.fecha,
                r.hora,
                r.event_id,
                r.created_at,
                r.status,
                p.apellido,
                p.nacimiento as fechaNacimiento,
                p.sexo,
                p.correo as correo_paciente,
                p.direccion,
                p.pais
            FROM pacientes_reservas r
            LEFT JOIN pacienteDatos p ON REPLACE(r.rut, '-', '') = p.rut
            ORDER BY r.fecha DESC, r.hora ASC
        `;

        try {
            const resultado = await this.database.ejecutarQuery(query);
            return resultado;
        } catch (error) {
            throw new Error('Error al obtener reservas con datos del paciente: ' + error.message);
        }
    }

    // SELECCIONA TODAS LAS RESERVAS DE GOOGLE CALENDAR
    async selectTodasReservas() {
        const query = `
            SELECT 
                id_paciente as id, nombre, rut, telefono, email, fecha, hora, 
                event_id, created_at, status
                FROM pacientes_reservas 
                ORDER BY created_at DESC`;

        try {
            const resultado = await this.database.ejecutarQuery(query);
            return resultado;
        } catch (error) {
            throw new Error('Error al obtener reservas desde la base de datos: ' + error.message);
        }
    }

    // SELECCIONAR HORARIOS OCUPADOS PARA UNA FECHA ESPECÍFICA
    async selectHorariosOcupados(fecha) {
        const query = `
            SELECT hora 
            FROM pacientes_reservas 
            WHERE fecha = ? 
            AND status IN ('pendiente', 'confirmada', 'completada')
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [fecha]);
            // Retornar solo un array de horarios
            return resultado.map(row => row.hora);
        } catch (error) {
            throw new Error('Error al obtener horarios ocupados: ' + error.message);
        }
    }

    // SELECCIONA RESERVAS POR FECHA
    async selectReservasPorFecha(fecha) {
        const query = `
            SELECT 
                id_paciente as id, nombre, rut, telefono, email, fecha, hora, 
                event_id, created_at, status
            FROM pacientes_reservas 
            WHERE fecha = ?
            ORDER BY hora ASC
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [fecha]);
            return resultado;
        } catch (error) {
            throw new Error('Error al obtener reservas por fecha: ' + error.message);
        }
    }

    // SELECCIONA RESERVA POR RUT
    async selectReservaPorRut(rut) {
        const query = `
            SELECT 
                id_paciente as id, nombre, rut, telefono, email, fecha, hora, 
                event_id, created_at, status
            FROM pacientes_reservas 
            WHERE rut = ?
            ORDER BY fecha DESC
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [rut]);
            return resultado;
        } catch (error) {
            throw new Error('Error al obtener reservas por RUT: ' + error.message);
        }
    }

    // ACTUALIZA EL STATUS DE UNA RESERVA
    async actualizarStatusReserva(id, status) {
        const query = `
            UPDATE pacientes_reservas 
            SET status = ? 
            WHERE id_paciente = ?
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [status, id]);
            return resultado.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al actualizar status de reserva: ' + error.message);
        }
    }

    // CONECTA UNA RESERVA CON UN PACIENTE EXISTENTE
    async conectarConPaciente(idReserva, idPaciente) {
        const query = `
            UPDATE pacientes_reservas r
            JOIN pacienteDatos p ON p.id_paciente = ?
            SET r.nombre = CONCAT(p.nombre, ' ', p.apellido),
                r.telefono = p.telefono,
                r.email = p.correo
            WHERE r.id_paciente = ?
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [idPaciente, idReserva]);
            return resultado.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al conectar con paciente: ' + error.message);
        }
    }

    // INSERTA NUEVA RESERVA
    async insertarReserva(datosReserva) {
        const query = `
            INSERT INTO pacientes_reservas 
            (nombre, rut, telefono, email, fecha, hora, event_id, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        try {
            const valores = [
                datosReserva.nombre,
                datosReserva.rut,
                datosReserva.telefono,
                datosReserva.email,
                datosReserva.fecha,
                datosReserva.hora,
                datosReserva.event_id,
                datosReserva.status || 'pendiente'
            ];
            const resultado = await this.database.ejecutarQuery(query, valores);
            return resultado.insertId;
        } catch (error) {
            throw new Error('Error al insertar reserva: ' + error.message);
        }
    }

    // ANULA UNA RESERVA (NO LA ELIMINA, SOLO CAMBIA EL STATUS)
    async anularReserva(id) {
        const query = `
            UPDATE pacientes_reservas 
            SET status = 'cancelada' 
            WHERE id_paciente = ?
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [id]);
            return resultado.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al anular reserva: ' + error.message);
        }
    }

    // ELIMINA UNA RESERVA
    async eliminarReserva(id) {
        const query = `DELETE FROM pacientes_reservas WHERE id_paciente = ?`;
        try {
            const resultado = await this.database.ejecutarQuery(query, [id]);
            return resultado.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al eliminar reserva: ' + error.message);
        }
    }

    // BUSCA RESERVAS POR TÉRMINO DE BÚSQUEDA
    async buscarReservas(termino) {
        const query = `
            SELECT 
                id_paciente as id, nombre, rut, telefono, email, fecha, hora, 
                event_id, created_at, status
            FROM pacientes_reservas 
            WHERE nombre LIKE ? OR rut LIKE ? OR email LIKE ?
            ORDER BY fecha DESC
        `;
        try {
            const terminoBusqueda = `%${termino}%`;
            const resultado = await this.database.ejecutarQuery(query, [terminoBusqueda, terminoBusqueda, terminoBusqueda]);
            return resultado;
        } catch (error) {
            throw new Error('Error al buscar reservas: ' + error.message);
        }
    }

    // ============ NUEVOS MÉTODOS PARA SISTEMA DE AGENDAS ============

    // OBTIENE HORARIOS OCUPADOS PARA UNA FECHA ESPECÍFICA
    async selectHorariosOcupados(fecha) {
        const query = `
            SELECT hora, nombre, status
            FROM pacientes_reservas 
            WHERE fecha = ? AND status != 'cancelada'
            ORDER BY hora ASC
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [fecha]);
            return resultado;
        } catch (error) {
            throw new Error('Error al obtener horarios ocupados: ' + error.message);
        }
    }

    // INSERTA NUEVA RESERVA (VERSIÓN MEJORADA)
    async insertReserva(datosReserva) {
        const query = `
            INSERT INTO pacientes_reservas 
            (nombre, rut, telefono, email, fecha, hora, status, event_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        try {
            const {nombre_paciente, rut, telefono, email, fecha, hora, status} = datosReserva;
            const resultado = await this.database.ejecutarQuery(query, [
                nombre_paciente || 'Reserva pendiente',
                rut || '',
                telefono || '',
                email || '',
                fecha,
                hora,
                status || 'pendiente',
                null // event_id se puede agregar después si es necesario
            ]);
            return resultado;
        } catch (error) {
            throw new Error('Error al insertar reserva: ' + error.message);
        }
    }

    // ELIMINA RESERVA POR ID
    async deleteReserva(idReserva) {
        const query = `DELETE FROM pacientes_reservas WHERE id_paciente = ?`;
        try {
            const resultado = await this.database.ejecutarQuery(query, [idReserva]);
            return resultado;
        } catch (error) {
            throw new Error('Error al eliminar reserva: ' + error.message);
        }
    }

    // ELIMINA RESERVA POR FECHA Y HORA
    async deleteReservaPorFechaHora(fecha, hora) {
        const query = `DELETE FROM pacientes_reservas WHERE fecha = ? AND hora = ?`;
        try {
            const resultado = await this.database.ejecutarQuery(query, [fecha, hora]);
            return resultado;
        } catch (error) {
            throw new Error('Error al eliminar reserva por fecha y hora: ' + error.message);
        }
    }

    // CUENTA EL TOTAL DE RESERVAS
    async countTotalReservas() {
        const query = `SELECT COUNT(*) as total FROM pacientes_reservas WHERE status != 'cancelada'`;
        try {
            const resultado = await this.database.ejecutarQuery(query);
            return resultado[0]?.total || 0;
        } catch (error) {
            throw new Error('Error al contar reservas totales: ' + error.message);
        }
    }

    // CUENTA LAS RESERVAS DE HOY
    async countReservasHoy() {
        const query = `
            SELECT COUNT(*) as total 
            FROM pacientes_reservas 
            WHERE DATE(fecha) = CURDATE() AND status != 'cancelada'
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query);
            return resultado[0]?.total || 0;
        } catch (error) {
            throw new Error('Error al contar reservas de hoy: ' + error.message);
        }
    }

    // OBTIENE LAS PRÓXIMAS RESERVAS
    async selectProximasReservas(limite = 5) {
        const query = `
            SELECT nombre, fecha, hora, telefono, status
            FROM pacientes_reservas 
            WHERE fecha >= CURDATE() AND status != 'cancelada'
            ORDER BY fecha ASC, hora ASC
            LIMIT ?
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [limite]);
            return resultado;
        } catch (error) {
            throw new Error('Error al obtener próximas reservas: ' + error.message);
        }
    }

    // ACTUALIZAR EVENT_ID DE UNA RESERVA
    async actualizarEventId(reservaId, eventId) {
        const query = `
            UPDATE pacientes_reservas 
            SET event_id = ? 
            WHERE id_paciente = ?
        `;
        try {
            const resultado = await this.database.ejecutarQuery(query, [eventId, reservaId]);
            return resultado.affectedRows > 0;
        } catch (error) {
            throw new Error('Error al actualizar event_id: ' + error.message);
        }
    }
}
