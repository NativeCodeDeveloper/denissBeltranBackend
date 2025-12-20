import { Router } from "express";
import ProyectosController from "../controller/ProyectosController.js";
const router = Router();

router.get("/", ProyectosController.cargarProyecto);

export default router;
