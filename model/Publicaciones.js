import DataBase from "../config/DataBase.js";

export default class Publicaciones {
  constructor() {}

  // Obtener todas las publicaciones
  static async obtenerPublicaciones() {
    const conexion = DataBase.getInstance();
    const sql = `
      SELECT 
        id,
        titulo,
        subtitulo,
        descripcion,
        imagen_url,
        fecha_creacion,
        fecha_actualizacion,
        estado,
        destacada
      FROM publicaciones 
      WHERE estado = 'publicada'
      ORDER BY destacada DESC, fecha_creacion DESC
    `;
    
    try {
      const resultado = await conexion.ejecutarQuery(sql);
      return resultado;
    } catch (error) {
      console.error("Error al obtener publicaciones:", error);
      throw new Error("Error al consultar publicaciones");
    }
  }

  // Obtener publicaciones destacadas para la portada (máximo 3)
  static async obtenerPublicacionesDestacadas() {
    const conexion = DataBase.getInstance();
    const sql = `
      SELECT 
        id,
        titulo,
        subtitulo,
        descripcion,
        imagen_url,
        fecha_creacion
      FROM publicaciones 
      WHERE estado = 'publicada' AND destacada = 1
      ORDER BY fecha_creacion DESC
      LIMIT 3
    `;
    
    try {
      const resultado = await conexion.ejecutarQuery(sql);
      return resultado;
    } catch (error) {
      console.error("Error al obtener publicaciones destacadas:", error);
      throw new Error("Error al consultar publicaciones destacadas");
    }
  }

  // Crear nueva publicación
  static async crearPublicacion(datosPublicacion) {
    const conexion = DataBase.getInstance();
    const { 
      titulo, 
      subtitulo, 
      descripcion, 
      imagen_url,
      destacada = 0 
    } = datosPublicacion;

    const sql = `
      INSERT INTO publicaciones (
        titulo, 
        subtitulo, 
        descripcion, 
        imagen_url,
        destacada
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const parametros = [
      titulo,
      subtitulo || null,
      descripcion || null,
      imagen_url || null,
      destacada
    ];

    try {
      const resultado = await conexion.ejecutarQuery(sql, parametros);
      return resultado;
    } catch (error) {
      console.error("Error al crear publicación:", error);
      throw new Error("Error al insertar publicación");
    }
  }

  // Eliminar publicación (soft delete)
  static async eliminarPublicacion(id) {
    const conexion = DataBase.getInstance();
    const sql = `
      UPDATE publicaciones 
      SET estado = 'borrador', fecha_actualizacion = NOW()
      WHERE id = ?
    `;

    try {
      const resultado = await conexion.ejecutarQuery(sql, [id]);
      return resultado;
    } catch (error) {
      console.error("Error al eliminar publicación:", error);
      throw new Error("Error al eliminar publicación");
    }
  }

  // Marcar/desmarcar como destacada
  static async toggleDestacada(id) {
    const conexion = DataBase.getInstance();
    const sql = `
      UPDATE publicaciones 
      SET destacada = NOT destacada, fecha_actualizacion = NOW()
      WHERE id = ?
    `;

    try {
      const resultado = await conexion.ejecutarQuery(sql, [id]);
      return resultado;
    } catch (error) {
      console.error("Error al cambiar estado destacada:", error);
      throw new Error("Error al actualizar estado destacada");
    }
  }
}