import {Router} from 'express';
import ReservasController from '../controller/ReservasController.js';

const router = Router();

// Rutas para gestión de reservas existentes
router.get("/", ReservasController.obtenerTodasReservas);
router.get("/con-paciente", ReservasController.obtenerReservasConPaciente);
router.post("/por-fecha", ReservasController.obtenerReservasPorFecha);
router.get("/horarios-ocupados/:fecha", ReservasController.obtenerHorariosOcupados);
router.post("/buscar-rut", ReservasController.buscarReservaPorRut);
router.put("/actualizar-status", ReservasController.actualizarStatusReserva);
router.put("/anular", ReservasController.anularReserva);
router.put("/conectar-paciente", ReservasController.conectarConPaciente);
router.post("/crear-paciente", ReservasController.crearPacienteDesdeReserva);

// Nueva ruta para obtener días bloqueados por rango
router.get('/bloqueos', ReservasController.obtenerDiasBloqueados);

// Nuevas rutas mejoradas para el sistema de horarios
router.get("/horarios-disponibles/:fecha", ReservasController.obtenerHorariosDisponibles);
router.post("/reservar-horario", ReservasController.reservarHorario);
router.delete("/liberar-horario", ReservasController.liberarHorario);
router.get("/estadisticas", ReservasController.obtenerEstadisticas);

// Ruta para actualizar event_id después de crear evento en Google Calendar
router.put("/actualizar-event-id", ReservasController.actualizarEventId);

export default router;
