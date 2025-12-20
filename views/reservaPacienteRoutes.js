import {Router} from 'express';
import ReservaPacienteController from "../controller/ReservaPacienteController.js";

const router = Router();

// Rutas para gestión de reservas existentes
router.get("/seleccionarReservados", ReservaPacienteController.seleccionarReservados);
router.post("/insertarReserva", ReservaPacienteController.insertarReservaPaciente);
router.post("/eliminarReserva", ReservaPacienteController.eliminarReserva);
router.post("/seleccionarEspecifica", ReservaPacienteController.seleccionarReservaEspecifica);
router.post("/actualizarReservacion", ReservaPacienteController.actualizarInformacionReserva);


export default router;
