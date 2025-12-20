import DataBase from "../config/DataBase.js";

export default class Bloqueos {
    constructor() {
        this.database = DataBase.getInstance();
    }

    /**
     * Devuelve bloqueos entre dos fechas (inclusive).
     * Espera los parámetros en formato 'YYYY-MM-DD'.
     * Retorna array de objetos { fecha, all_day, motivo }
     */
    async selectBloqueosEnRango(startDate, endDate) {
        // Intentar consultar tabla 'dias_bloqueados' (si no existe, devolver array vacío)
        const query = `
      SELECT fecha, all_day, motivo
      FROM dias_bloqueados
      WHERE fecha >= ? AND fecha <= ?
      ORDER BY fecha ASC
    `;

        try {
            const resultado = await this.database.ejecutarQuery(query, [startDate, endDate]);
            return resultado.map(r => ({
                fecha: r.fecha instanceof Date ? r.fecha.toISOString().split('T')[0] : String(r.fecha),
                all_day: !!r.all_day,
                motivo: r.motivo || ''
            }));
        } catch (error) {
            // Si la tabla no existe o hay error, logear y devolver vacío para no romper la app
            console.warn('[Bloqueos.selectBloqueosEnRango] No se pudo leer dias_bloqueados:', error.message);
            return [];
        }
    }

    // Métodos adicionales (crear/eliminar) pueden añadirse si se requiere administración
}

