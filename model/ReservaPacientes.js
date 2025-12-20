import DataBase from "../config/DataBase.js";

export default class ReservaPacientes {
    constructor(
        id_reserva,
        nombrePaciente,
        apellidoPaciente,
        rut,
        telefono,
        email,
        fechaInicio,
        horaInicio,
        fechaFinalizacion,
        horaFinalizacion,
        estadoReserva,
        estadoPeticion,
        preference_id) {

        this.id_reserva = id_reserva;
        this.nombrePaciente = nombrePaciente;
        this.apellidoPaciente = apellidoPaciente;
        this.rut = rut;
        this.telefono = telefono;
        this.email = email;
        this.fechaInicio = fechaInicio;
        this.horaInicio = horaInicio;
        this.fechaFinalizacion = fechaFinalizacion;
        this.horaFinalizacion = horaFinalizacion;
        this.estadoReserva = estadoReserva;
        this.estadoPeticion = estadoPeticion;
        this.preference_id = preference_id;

    }


    //METODO PARA ACTUALZIAR NUEVAS CITAS MEDICAS
    async actualizarReserva(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_reserva) {
        try {
            const conexion = DataBase.getInstance();
            const query = 'UPDATE reservaPacientes SET nombrePaciente = ? , apellidoPaciente = ?, rut = ? , telefono = ? , email = ? , fechaInicio = ?  , horaInicio = ? , fechaFinalizacion = ? , horaFinalizacion = ? , estadoReserva = ? WHERE id_reserva = ?';
            const param = [nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_reserva]
            const resultadoQuery = await conexion.ejecutarQuery(query, param);

            if (resultadoQuery) {
                return resultadoQuery;
            }
        } catch (e) {
            throw new Error(e)
        }
    }


    //METODO PARA ELIMINAR LOGICAMENTE EL AGENDAMIENTO
    async eliminarReservaPaciente(id_reserva) {
        try {
            const conexion = DataBase.getInstance();
            const query = "UPDATE reservaPacientes SET estadoPeticion = 0 where id_reserva = ?";
            const param = [id_reserva];

            const resultadoQuery = await conexion.ejecutarQuery(query, param);
            if (resultadoQuery) {
                return resultadoQuery;
            }

        } catch (error) {
            throw new Error(error);
        }
    }


    //METODO PARA SELECCIONAR TODAS LAS CITAS MEDICAS
    async seleccionarFichasReservadasEspecifica(id_reserva) {
        try {
            const conexion = DataBase.getInstance();
            const query = "SELECT * FROM reservaPacientes WHERE id_reserva = ? AND estadoPeticion <> 0"
            const param = [id_reserva];
            const resultadoQuery = await conexion.ejecutarQuery(query, param);

            if (resultadoQuery) {
                return resultadoQuery;
            }

        } catch (error) {
            console.log(error);
            throw new Error(error);
        }

    }


    //METODO PARA SELECCIONAR TODAS LAS CITAS MEDICAS
    async seleccionarFichasReservadas() {
        try {
            const conexion = DataBase.getInstance();
            const query = "SELECT * FROM reservaPacientes WHERE estadoReserva = 'reservada' AND estadoPeticion <> 0"
            const resultadoQuery = await conexion.ejecutarQuery(query);
            if (resultadoQuery) {
                return resultadoQuery;
            }
        } catch (error) {
            console.log(error);
            throw new Error(error);
        }
    }


    //METODO PARA INSERTAR NUEVAS CITAS MEDICAS
    async insertarReservaPaciente(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva) {
        try {
            const conexion = DataBase.getInstance();
            const query = 'INSERT INTO reservaPacientes(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio,fechaFinalizacion, horaFinalizacion, estadoReserva) VALUES (?,?,?,?,?,?,?,?,?,?)';
            const param = [nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva];

            const resultadoQuery = await conexion.ejecutarQuery(query, param);
            if (resultadoQuery) {
                return resultadoQuery;
            }
        } catch (e) {
            throw new Error(e)
        }
    }

//DEVUELVE UN VALOR booleano PARA EVALUAR SI LAS HORAS MEDICAS SE SUPERPONEN
    async validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion) {
        const conexion = DataBase.getInstance();

        const query = `
         SELECT COUNT(*) AS cnt
        FROM reservaPacientes
        WHERE NOT (
          TIMESTAMP(fechaFinalizacion, horaFinalizacion) <= TIMESTAMP(?, ?)
          OR TIMESTAMP(fechaInicio, horaInicio) >= TIMESTAMP(?, ?)
        )
    `;

        const params = [fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion];
        const filas = await conexion.ejecutarQuery(query, params);

        const cnt = Array.isArray(filas) ? filas[0].cnt : filas.cnt;
        return cnt === 0; // true = disponible
    }
}