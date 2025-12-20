import Reservas from '../model/Reservas.js';
import {enviarCorreoConfirmacion} from '../config/email-config.js';
import {crearEventoGoogleCalendar} from '../utils/googleCalendar.js';
import Bloqueos from '../model/Bloqueos.js';

export default class ReservasController {
    constructor() {
    }

    // OBTENER TODAS LAS RESERVAS
    static async obtenerTodasReservas(req, res) {
        try {
            const reservas = new Reservas();
            const dataReservas = await reservas.selectTodasReservas();
            return res.json(dataReservas);
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido obtener las reservas desde ReservasController",
                details: error.message
            });
        }
    }

    // OBTENER RESERVAS CON DATOS DEL PACIENTE
    static async obtenerReservasConPaciente(req, res) {
        try {
            const reservas = new Reservas();
            const dataReservas = await reservas.selectReservasConPaciente();
            return res.json(dataReservas);
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido obtener las reservas con datos del paciente",
                details: error.message
            });
        }
    }

    // OBTENER HORARIOS OCUPADOS PARA UNA FECHA
    static async obtenerHorariosOcupados(req, res) {
        try {
            const {fecha} = req.params;

            if (!fecha) {
                return res.status(400).json({
                    message: 'La fecha es requerida'
                });
            }

            const reservas = new Reservas();
            // El modelo ya devuelve un array de strings ['09:00', '10:00', ...]
            const horariosOcupados = await reservas.selectHorariosOcupados(fecha);

            console.log(`[obtenerHorariosOcupados] Fecha: ${fecha}, Horarios: ${JSON.stringify(horariosOcupados)}`);

            return res.json({
                fecha: fecha,
                horariosOcupados: horariosOcupados
            });
        } catch (error) {
            console.error('[obtenerHorariosOcupados] Error:', error);
            res.status(500).json({
                error: "No se ha podido obtener los horarios ocupados",
                details: error.message
            });
        }
    }

    // OBTENER RESERVAS POR FECHA
    static async obtenerReservasPorFecha(req, res) {
        try {
            const {fecha} = req.body;

            if (!fecha) {
                return res.status(400).json({
                    message: 'La fecha es requerida'
                });
            }

            const reservas = new Reservas();
            const dataReservas = await reservas.selectReservasPorFecha(fecha);
            return res.json(dataReservas);
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido obtener las reservas por fecha",
                details: error.message
            });
        }
    }

    // BUSCAR RESERVA POR RUT
    static async buscarReservaPorRut(req, res) {
        try {
            const {rut} = req.body;

            if (!rut) {
                return res.status(400).json({
                    message: 'El RUT es requerido'
                });
            }

            const reservas = new Reservas();
            const dataReservas = await reservas.selectReservaPorRut(rut);
            return res.json(dataReservas);
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido buscar la reserva por RUT",
                details: error.message
            });
        }
    }

    // ACTUALIZAR STATUS DE RESERVA
    static async actualizarStatusReserva(req, res) {
        try {
            const {id, status} = req.body;

            if (!id || !status) {
                return res.status(400).json({
                    message: 'ID y status son requeridos'
                });
            }

            const reservas = new Reservas();
            const resultado = await reservas.actualizarStatusReserva(id, status);

            if (resultado) {
                return res.json({
                    message: 'Status de reserva actualizado exitosamente'
                });
            } else {
                return res.status(404).json({
                    message: 'Reserva no encontrada'
                });
            }
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido actualizar el status de la reserva",
                details: error.message
            });
        }
    }

    // CONECTAR RESERVA CON PACIENTE EXISTENTE
    static async conectarConPaciente(req, res) {
        try {
            const {idReserva, idPaciente} = req.body;

            if (!idReserva || !idPaciente) {
                return res.status(400).json({
                    message: 'ID de reserva e ID de paciente son requeridos'
                });
            }

            const reservas = new Reservas();
            const resultado = await reservas.conectarConPaciente(idReserva, idPaciente);

            if (resultado.affectedRows > 0) {
                return res.json({
                    message: 'Reserva conectada con paciente exitosamente'
                });
            } else {
                return res.status(404).json({
                    message: 'Reserva no encontrada'
                });
            }
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido conectar la reserva con el paciente",
                details: error.message
            });
        }
    }

    // ANULAR RESERVA (NO LA ELIMINA, SOLO CAMBIA EL STATUS A "ANULADA")
    static async anularReserva(req, res) {
        try {
            const {id} = req.body;

            if (!id) {
                return res.status(400).json({
                    message: 'ID de reserva es requerido'
                });
            }

            const reservas = new Reservas();
            const resultado = await reservas.anularReserva(id);

            if (resultado) {
                return res.json({
                    message: 'Reserva anulada exitosamente'
                });
            } else {
                return res.status(404).json({
                    message: 'Reserva no encontrada'
                });
            }
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido anular la reserva",
                details: error.message
            });
        }
    }

    // CREAR PACIENTE DESDE RESERVA
    static async crearPacienteDesdeReserva(req, res) {
        try {
            const {idReserva} = req.body;

            if (!idReserva) {
                return res.status(400).json({
                    message: 'ID de reserva es requerido'
                });
            }

            const reservas = new Reservas();
            const resultado = await reservas.crearPacienteDesdeReserva(idReserva);

            return res.json({
                message: 'Paciente creado desde reserva exitosamente',
                idPaciente: resultado.insertId
            });
        } catch (error) {
            res.status(500).json({
                error: "No se ha podido crear el paciente desde la reserva",
                details: error.message
            });
        }
    }

    // ============ NUEVOS MÉTODOS MEJORADOS ============

    // OBTENER HORARIOS DISPONIBLES PARA UNA FECHA (CON LÓGICA TEMPORAL)
    static async obtenerHorariosDisponibles(req, res) {
        try {
            const {fecha} = req.params;

            if (!fecha) {
                return res.status(400).json({
                    error: 'La fecha es requerida'
                });
            }

            // Horarios de trabajo (9:00 AM a 6:00 PM cada 30 minutos)
            const horariosBase = [
                '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
                '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
            ];

            const reservas = new Reservas();
            const horariosOcupados = await reservas.selectHorariosOcupados(fecha);
            const horasOcupadas = horariosOcupados.map(reserva => reserva.hora);

            // Filtrar horarios considerando la hora actual si es hoy
            const ahora = new Date();
            const fechaHoy = ahora.toISOString().split('T')[0];
            const horaActual = ahora.getHours() * 100 + ahora.getMinutes();

            const horariosDisponibles = horariosBase.filter(hora => {
                // Verificar si no está ocupado
                if (horasOcupadas.includes(hora)) {
                    return false;
                }

                // Si es hoy, solo mostrar horarios futuros
                if (fecha === fechaHoy) {
                    const [horas, minutos] = hora.split(':').map(Number);
                    const horarioEnNumero = horas * 100 + minutos;
                    return horarioEnNumero > horaActual;
                }

                return true;
            });

            return res.json({
                success: true,
                fecha: fecha,
                horariosDisponibles: horariosDisponibles,
                horariosOcupados: horasOcupadas,
                total: horariosDisponibles.length
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: "No se pudieron obtener los horarios disponibles",
                details: error.message
            });
        }
    }

    // RESERVAR HORARIO ESPECÍFICO
    static async reservarHorario(req, res) {
        try {
            const {fecha, hora, nombre_paciente, rut, telefono, email} = req.body;

            // Validaciones
            if (!fecha || !hora) {
                return res.status(400).json({
                    success: false,
                    error: 'Fecha y hora son requeridos'
                });
            }

            // Validar que no sea una fecha pasada
            const fechaHoy = new Date().toISOString().split('T')[0];
            if (fecha < fechaHoy) {
                return res.status(400).json({
                    success: false,
                    error: 'No se pueden hacer reservas en fechas pasadas'
                });
            }

            // Validar que no sea una hora pasada si es hoy
            if (fecha === fechaHoy) {
                const ahora = new Date();
                const horaActual = ahora.getHours() * 100 + ahora.getMinutes();
                const [horas, minutos] = hora.split(':').map(Number);
                const horarioEnNumero = horas * 100 + minutos;

                if (horarioEnNumero <= horaActual) {
                    return res.status(400).json({
                        success: false,
                        error: 'No se pueden hacer reservas en horarios pasados'
                    });
                }
            }

            // Verificar disponibilidad
            const reservas = new Reservas();
            const horariosOcupados = await reservas.selectHorariosOcupados(fecha);
            const horasOcupadas = horariosOcupados.map(reserva => reserva.hora);

            if (horasOcupadas.includes(hora)) {
                return res.status(409).json({
                    success: false,
                    error: 'Este horario ya está reservado'
                });
            }


            // 1. Crear la reserva en la base de datos (sin event_id aún)
            const nuevaReserva = {
                fecha,
                hora,
                nombre_paciente: nombre_paciente || 'Reserva pendiente',
                rut: rut || '',
                telefono: telefono || '',
                email: email || '',
                status: 'pendiente'
            };
            const resultado = await reservas.insertReserva(nuevaReserva);
            let eventId = null;
            let meetLink = '';

            // 2. Crear evento en Google Calendar si hay email
            if (email && email.trim() !== '') {
                try {
                    // Construir fechas ISO para Google Calendar
                    const startISO = new Date(`${fecha}T${hora}:00-03:00`).toISOString();
                    // Asumimos duración 45 min (ajustar si es necesario)
                    const [h, m] = hora.split(':').map(Number);
                    const endDate = new Date(`${fecha}T${hora}:00-03:00`);
                    endDate.setMinutes(endDate.getMinutes() + 45);
                    const endISO = endDate.toISOString();

                    console.log('[GoogleCalendar] Creando evento:', {startISO, endISO, email});
                    const resultGC = await crearEventoGoogleCalendar({
                        summary: 'Sesión Psicología',
                        description: `Reserva para ${nombre_paciente} (${rut})`,
                        startISO,
                        endISO,
                        email
                    });
                    console.log('[GoogleCalendar] Respuesta:', resultGC);
                    eventId = resultGC.eventId;
                    meetLink = resultGC.meetLink;

                    // Guardar event_id en la reserva
                    if (eventId) {
                        const updateResult = await reservas.actualizarEventId(resultado.insertId, eventId);
                        console.log('[GoogleCalendar] event_id guardado en BD:', updateResult);
                    } else {
                        console.error('[GoogleCalendar] event_id es null, no se guardó en BD');
                    }
                } catch (errCal) {
                    console.error('Error creando evento en Google Calendar:', errCal);
                }
            }

            // 3. Enviar correo de confirmación (con meetLink si existe)
            if (email && email.trim() !== '') {
                try {
                    const datosCorreo = {
                        nombre: nombre_paciente || 'Estimado/a paciente',
                        email,
                        fecha,
                        hora,
                        meetLink
                    };
                    const resultadoCorreo = await enviarCorreoConfirmacion(datosCorreo);
                    if (resultadoCorreo.success) {
                        console.log('Correo de confirmación enviado exitosamente');
                    } else {
                        console.error('Error enviando correo:', resultadoCorreo.error);
                    }
                } catch (errorCorreo) {
                    console.error('Error en envío de correo:', errorCorreo);
                }
            }

            return res.json({
                success: true,
                message: 'Horario reservado correctamente',
                reserva: {
                    id: resultado.insertId,
                    ...nuevaReserva,
                    event_id: eventId,
                    meetLink
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: "No se pudo reservar el horario",
                details: error.message
            });
        }
    }

    // LIBERAR HORARIO
    static async liberarHorario(req, res) {
        try {
            const {fecha, hora, idReserva} = req.body;

            if (!idReserva && (!fecha || !hora)) {
                return res.status(400).json({
                    success: false,
                    error: 'Se requiere ID de reserva o (fecha y hora)'
                });
            }

            const reservas = new Reservas();
            let resultado;

            if (idReserva) {
                resultado = await reservas.deleteReserva(idReserva);
            } else {
                resultado = await reservas.deleteReservaPorFechaHora(fecha, hora);
            }

            if (resultado.affectedRows > 0) {
                return res.json({
                    success: true,
                    message: 'Horario liberado correctamente'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    error: 'Reserva no encontrada'
                });
            }

        } catch (error) {
            res.status(500).json({
                success: false,
                error: "No se pudo liberar el horario",
                details: error.message
            });
        }
    }

    // OBTENER ESTADÍSTICAS DE RESERVAS
    static async obtenerEstadisticas(req, res) {
        try {
            const reservas = new Reservas();

            // Obtener estadísticas desde la base de datos
            const totalReservas = await reservas.countTotalReservas();
            const reservasHoy = await reservas.countReservasHoy();
            const proximasReservas = await reservas.selectProximasReservas(5);

            return res.json({
                success: true,
                estadisticas: {
                    totalReservas: totalReservas,
                    reservasHoy: reservasHoy,
                    proximasReservas: proximasReservas
                }
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: "No se pudieron obtener las estadísticas",
                details: error.message
            });
        }
    }

    // ACTUALIZAR EVENT_ID DE UNA RESERVA DESPUÉS DE CREAR EVENTO EN GOOGLE CALENDAR
    static async actualizarEventId(req, res) {
        try {
            const {reservaId, event_id} = req.body;

            if (!reservaId || !event_id) {
                return res.status(400).json({
                    success: false,
                    error: "Se requieren reservaId y event_id"
                });
            }

            const reservas = new Reservas();
            const resultado = await reservas.actualizarEventId(reservaId, event_id);

            if (resultado) {
                return res.json({
                    success: true,
                    message: "Event ID actualizado correctamente"
                });
            } else {
                return res.status(404).json({
                    success: false,
                    error: "No se encontró la reserva o no se pudo actualizar"
                });
            }

        } catch (error) {
            console.error("Error al actualizar event_id:", error);
            res.status(500).json({
                success: false,
                error: "No se pudo actualizar el event_id de la reserva",
                details: error.message
            });
        }
    }

    // OBTENER DÍAS BLOQUEADOS ENTRE RANGO
    static async obtenerDiasBloqueados(req, res) {
        try {
            const {start, end} = req.query;
            if (!start || !end) {
                return res.status(400).json({ok: false, error: 'Parámetros start y end son requeridos (YYYY-MM-DD)'});
            }

            const bloqueosModel = new Bloqueos();
            const bloqueos = await bloqueosModel.selectBloqueosEnRango(start, end);

            return res.json({ok: true, bloqueos});
        } catch (error) {
            console.error('[obtenerDiasBloqueados] Error:', error);
            return res.status(500).json({
                ok: false,
                error: 'No se pudieron obtener los días bloqueados',
                details: error.message
            });
        }
    }
}
