import { Router } from "express";
import PublicacionesController from "../controller/PublicacionesController.js";
const router = Router();

// Obtener todas las publicaciones
router.get("/", PublicacionesController.obtenerPublicaciones);

// Obtener publicaciones destacadas para la portada
router.get("/destacadas", PublicacionesController.obtenerPublicacionesDestacadas);

// Crear nueva publicación
router.post("/", PublicacionesController.crearPublicacion);

// Eliminar publicación
router.delete("/:id", PublicacionesController.eliminarPublicacion);

// Toggle destacada
router.put("/:id/destacada", PublicacionesController.toggleDestacada);

export default router;