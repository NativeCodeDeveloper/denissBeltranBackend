import ReservaPacientes from "../model/ReservaPacientes.js";

export default class ReservaPacienteController {
    constructor() {
    }


    static async validacionDisponibilidad(req, res) {
        try {
            const {fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion} = req.body;
            console.log(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);

            if (!fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const respuestaBackend = await claseReservaPaciente.validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);

            if (respuestaBackend) {
                return res.status(200).send({message: true});
            } else {
                return res.status(404).send({message: false});
            }

        } catch (e) {
            throw e;
        }
    }


    static async seleccionarSegunEstado(req, res) {
        try {
            const {estadoReserva} = req.body;
            console.log(estadoReserva);

            if (!estadoReserva) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarReservaEstado(estadoReserva)

            if (resultadoQuery) {
                return res.status(200).json(resultadoQuery);
            } else {
                return res.status(400).send({message: 'sindata'});
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});
        }
    }


    static async actualizarEstado(req, res) {
        try {
            const {estadoReserva, id_reserva} = req.body;
            console.log(estadoReserva, id_reserva);

            if (!estadoReserva || !id_reserva) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.actualizarEstado(estadoReserva, id_reserva);

            if (resultadoQuery.affectedRows > 0) {
                return res.status(200).send({message: true})
            } else {
                return res.status(400).send({message: 'sindata'});
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});
        }
    }


    static async buscarEntreFechas(req, res) {
        try {
            const {fechaInicio, fechaFinalizacion} = req.body;
            console.log(fechaInicio, fechaFinalizacion);

            if (!fechaInicio || !fechaFinalizacion) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarEntreFechas(fechaInicio, fechaFinalizacion);

            if (Array.isArray(resultadoQuery)) {

                return res.status(200).json(resultadoQuery);

            } else {

                return res.status(400).send({message: 'sindata'});
            }
        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});

        }
    }


    static async buscarSimilitudRut(req, res) {
        try {
            const {rut} = req.body;
            console.log(rut);

            if (!rut) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarSimilitudRut(rut);

            if (Array.isArray(resultadoQuery)) {

                return res.status(200).json(resultadoQuery);

            } else {

                return res.status(400).send({message: 'sindata'});
            }

        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});

        }
    }


    static async buscarSimilitudNombre(req, res) {
        try {
            const {nombrePaciente} = req.body;
            console.log(nombrePaciente);

            if (!nombrePaciente) {
                return res.status(400).send({message: 'sindata'});
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarSimilitudNombre(nombrePaciente);

            if (Array.isArray(resultadoQuery)) {

                return res.status(200).json(resultadoQuery);

            } else {

                return res.status(400).send({message: 'sindata'});
            }

        } catch (error) {
            console.log(error);
            return res.status(400).send({message: error.message});

        }
    }


    static async actualizarInformacionReserva(req, res) {
        try {
            const {
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
                id_reserva
            } = req.body;

            console.log(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_reserva);

            if (!id_reserva) {
                return res.status(404).send({message: 'sindata'})
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.actualizarReserva(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva, id_reserva);

            if (resultadoQuery.affectedRows > 0) {
                return res.status(200).json({message: true});
            } else {
                return res.status(200).json({message: false});
            }

        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async seleccionarReservaEspecifica(req, res) {
        try {

            const {id_reserva} = req.body;
            console.log(id_reserva);

            if (!id_reserva) {
                return res.status(404).send({message: 'sindata'})
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarFichasReservadasEspecifica(id_reserva);

            if (resultadoQuery) {
                return res.status(200).json(resultadoQuery);
            } else {
                return res.status(200).json({message: "sindata"});
            }

        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async eliminarReserva(req, res) {
        try {
            const {id_reserva} = req.body;
            console.log(id_reserva);

            if (!id_reserva) {
                return res.status(404).send({message: 'sindata'})
            }

            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.eliminarReservaPaciente(id_reserva);

            if (resultadoQuery.affectedRows > 0) {
                return res.status(200).json({message: true});
            } else {
                return res.status(200).json({message: false});
            }

        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async seleccionarReservados(req, res) {
        try {
            const claseReservaPaciente = new ReservaPacientes();
            const resultadoQuery = await claseReservaPaciente.seleccionarFichasReservadas();

            if (Array.isArray(resultadoQuery)) {
                return res.status(200).json(resultadoQuery);
            } else {
                return res.status(400).json({message: "sindata"});
            }
        } catch (err) {
            res.status(400).send({
                message: err.message
            })
        }
    }


    static async insertarReservaPaciente(req, res) {
        try {
            const {
                nombrePaciente,
                apellidoPaciente,
                rut,
                telefono,
                email,
                fechaInicio,
                horaInicio,
                fechaFinalizacion,
                horaFinalizacion,
                estadoReserva
            } = req.body;

            console.log(req.body);

            if (!nombrePaciente || !apellidoPaciente || !rut || !telefono || !email || !fechaInicio || !horaInicio || !fechaFinalizacion || !horaFinalizacion || !estadoReserva) {
                return res.status(400).send({message: "sindata"})
            }

            const claseReservaPaciente = new ReservaPacientes();

            const validacionHoras = await claseReservaPaciente.validarDisponibilidadBoolean(fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion);
            if (!validacionHoras) {
                return res.status(400).send({message: "conflicto"})
            } else {

                const resultadoQuery = await claseReservaPaciente.insertarReservaPaciente(nombrePaciente, apellidoPaciente, rut, telefono, email, fechaInicio, horaInicio, fechaFinalizacion, horaFinalizacion, estadoReserva)

                if (resultadoQuery.affectedRows > 0) {
                    return res.status(200).send({message: true})
                } else {
                    return res.status(200).send({message: false})
                }
            }

        } catch (error) {
            console.error(error);
            return res.status(500).send({message: error.message});
        }
    }
}