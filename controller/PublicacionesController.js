import Publicaciones from "../model/Publicaciones.js";

export default class PublicacionesController {
  constructor() {}

  // Obtener todas las publicaciones
  static async obtenerPublicaciones(req, res) {
    try {
      const publicaciones = await Publicaciones.obtenerPublicaciones();
      res.json(publicaciones);
    } catch (error) {
      console.error("Error en controller obtenerPublicaciones:", error);
      res.status(500).json({
        error: "Error al consultar publicaciones desde el controller"
      });
    }
  }

  // Obtener publicaciones destacadas para la portada
  static async obtenerPublicacionesDestacadas(req, res) {
    try {
      const publicaciones = await Publicaciones.obtenerPublicacionesDestacadas();
      res.json(publicaciones);
    } catch (error) {
      console.error("Error en controller obtenerPublicacionesDestacadas:", error);
      res.status(500).json({
        error: "Error al consultar publicaciones destacadas desde el controller"
      });
    }
  }

  // Crear nueva publicación
  static async crearPublicacion(req, res) {
    try {
      console.log("Body recibido:", req.body);
      const { titulo, subtitulo, descripcion, destacada, imagen_url } = req.body;

      if (!titulo || titulo.trim() === "") {
        return res.status(400).json({
          error: "El título es obligatorio"
        });
      }

      const datosPublicacion = {
        titulo: titulo.trim(),
        subtitulo: subtitulo?.trim() || null,
        descripcion: descripcion?.trim() || null,
        imagen_url: imagen_url || null, // URL de Cloudinary
        destacada: destacada ? 1 : 0
      };

      const resultado = await Publicaciones.crearPublicacion(datosPublicacion);
      
      res.json({
        message: "Publicación creada correctamente",
        id: resultado.insertId,
        resultado
      });

    } catch (error) {
      console.error("Error en controller crearPublicacion:", error);
      res.status(500).json({
        error: "Error al crear publicación desde el controller"
      });
    }
  }

  // Eliminar publicación
  static async eliminarPublicacion(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: "ID de publicación inválido"
        });
      }

      const resultado = await Publicaciones.eliminarPublicacion(parseInt(id));
      
      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: "Publicación no encontrada"
        });
      }

      res.json({
        message: "Publicación eliminada correctamente",
        resultado
      });

    } catch (error) {
      console.error("Error en controller eliminarPublicacion:", error);
      res.status(500).json({
        error: "Error al eliminar publicación desde el controller"
      });
    }
  }

  // Toggle destacada
  static async toggleDestacada(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: "ID de publicación inválido"
        });
      }

      const resultado = await Publicaciones.toggleDestacada(parseInt(id));
      
      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          error: "Publicación no encontrada"
        });
      }

      res.json({
        message: "Estado de destacada actualizado correctamente",
        resultado
      });

    } catch (error) {
      console.error("Error en controller toggleDestacada:", error);
      res.status(500).json({
        error: "Error al actualizar estado destacada desde el controller"
      });
    }
  }
}