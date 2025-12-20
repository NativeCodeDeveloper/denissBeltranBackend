import Proyectos from "../model/Proyectos.js";

export default class ProyectoController {
    constructor(){

    }

    static async cargarProyecto(req, res){
        try {
            const proyectos = new Proyectos();
            const proyectosData = await proyectos.selectProyecto();
            return res.json(proyectosData);

        } catch (error) {
            throw new Error('Error al ejecutar consulta desde la clase ProyectoController.js'); 
        }

    }
}