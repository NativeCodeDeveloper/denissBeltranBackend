import DataBase from "../config/DataBase.js";

export default class Proyectos {
  constructor(portafolio_id, titulo, descripcion_breve, descripcion_detallada) {
    this.portafolio_id = portafolio_id;
    this.titulo = titulo;
    this.descripcion_breve = descripcion_breve;
    this.descripcion_detallada = descripcion_detallada;
  }

  get portafolioid() {
    return this._portafolioid;
  }
  set portafolioid(in_portafolioid) {
    this._portafolioid = in_portafolioid;
  }

  get titulo() {
    return this._titulo;
  }
  set titulo(in_titulo) {
    this._titulo = in_titulo;
  }

  get descripcionbreve() {
    return this._descripcionbreve;
  }
  set descripcionbreve(in_descripcionbreve) {
    this._descripcionbreve = in_descripcionbreve;
  }

  get descripciondetallada() {
    return this._descripciondetallada;
  }
  set descripciondetallada(in_descripciondetallada) {
    this._descripciondetallada = in_descripciondetallada;
  }

  async selectProyecto(){
    const conexion = DataBase.getInstance();
    const query = 'SELECT * FROM Portafolio';

    try {
        const resultado = await conexion.ejecutarQuery(query);
        return resultado;

    } catch (error) {
        throw new Error('Error al ejecutar consulta desde base de datos SQL des de la clase Proyectos.js')
        
    }
  }
}
