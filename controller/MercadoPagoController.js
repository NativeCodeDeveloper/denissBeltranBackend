import dotenv from 'dotenv';
import mercadopago, * as mpNamed from 'mercadopago';
import PedidoComprasController from "../controller/PedidoComprasController.js";
import PedidoCompras from "../model/PedidoCompras.js";

dotenv.config();

const BACKEND = process.env.BACKEND_URL;


//SE DEFINE LA FUNCION CREATE ORDER ESTA FUNCION PERMITE CREAR LA ORDEN DE PAGO
export const createOrder = async (req, res) => {
    try {
        const {comprador = {}} = req.body;
        console.log(comprador);

        const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
        if (!ACCESS_TOKEN) {
            return res.status(500).json({error: 'No hay access token configurado en el servidor'});
        }

        const items = [{
            title: "Cita Psicologia / PS. Deniss Beltran Varela",
            quantity: 1,
            unit_price: parseFloat(comprador.totalPagado),
            currency_id: "CLP"
        }];

        // Preparar el objeto 'preference' usando los items y metadata
        const preference = {
            items,
            back_urls: {
                success: `${BACKEND}/pagosMercadoPago/success`,
                failure: `${BACKEND}/pagosMercadoPago/failure`,
                pending: `${BACKEND}/pagosMercadoPago/pending`,
            },
            metadata: {
                nombre_comprador: comprador.nombre_comprador,
                email: comprador.email_Comprador,
                telefono: comprador.telefono_comprador,
                direccion: comprador.direccion_despacho,
                comuna: comprador.comuna,
                region: comprador.regionPais
            },
            auto_return: "approved",
            notification_url: `${BACKEND}/pagosMercadoPago/notificacionPago`,
        };


        //resultBody: donde se va a guardar la respuesta correcta de Mercado Pago.
        let resultBody;

        const client = new mpNamed.MercadoPagoConfig({accessToken: ACCESS_TOKEN});
        const prefClient = new mpNamed.Preference(client);

        const resp = await prefClient.create({body: preference});
        resultBody = resp;

        if (!resultBody) {
            console.error('No se pudo crear la preferencia. Detalles');
            return res.status(500).json({error: 'Error al crear la orden de pago'});

        } else {

            const nombre_comprador = comprador.nombre_comprador;
            const apellidosComprador = comprador.apellidosComprador;
            const telefono_comprador = comprador.telefono_comprador;
            const email_Comprador = comprador.email_Comprador;
            const identificacion_comprador = comprador.identificacion_comprador;
            const direccion_despacho = comprador.direccion_despacho;
            const comuna = comprador.comuna;
            const regionPais = comprador.regionPais;
            const comentarios = comprador.comentarios;
            const totalPagado = comprador.totalPagado;
            const preference_id = resultBody.id;

            let id_pedido;

            try {
                const fecha_pedido = new Date().toISOString().slice(0, 19).replace('T', ' ');

                const pedidoComprasModel = new PedidoCompras();
                const resultadoInsert = await pedidoComprasModel.insertarPedidoCompra(fecha_pedido, nombre_comprador, apellidosComprador, telefono_comprador, email_Comprador, identificacion_comprador, direccion_despacho, comuna, regionPais, comentarios, totalPagado, preference_id);
                return res.status(200).json({
                    id: resultBody.id,
                    init_point: resultBody.init_point,
                    sandbox_init_point: resultBody.sandbox_init_point,
                });

            } catch (insertErr) {
                console.error('Error insertando pedido arrojado en el Try catch');
                return res.status(200).json({
                    id: resultBody.id,
                    init_point: resultBody.init_point,
                    sandbox_init_point: resultBody.sandbox_init_point,
                    insert_error: true
                });
            }

        }

    } catch (error) {
        console.error('Error creando preferencia:', error);
        const message = error?.response?.body || error.message || 'Error al crear la orden de pago';
        return res.status(500).json({error: 'Error al crear la orden de pago', details: message});
    }
};


/*
INFORMACIÓN RECIBIDA DESDE EL WEEBHOOK

Webhook:
→ Es un “mensaje automático” que un servicio externo envía a tu servidor cuando ocurre un evento.
→ Es una notificación en tiempo real.
→ Cuando ocurre un evento, ese servicio (Mercado Pago, Stripe, Clerk, GitHub, etc.)
→ Te manda un POST a esa URL automáticamente.
→ Tú respondes 200 OK rápido para que no lo reenvíen.
→ Tu backend recibe un body con información en el maso de mercado pago:

{
  action: "payment.updated",
  api_version: "v1",
  data: {"id":"123456"},
  date_created: "2021-11-01T02:02:02Z",
  id: "123456",
  live_mode: false,
  type: "payment",
  user_id: 2964661140
                       }

IMPORTANTE
1. paymentId = body.data.id, que es el ID del pago en Mercado Pago.
2. Igual de devuelve un status 200 para que Mercado Pago no re-intente el webhook como loco.
3. Con se consulta a la API de mercado pago por la transacción realizada Si va bien, payment es un objeto gigantesco con toda la info del pago.


 * */


export const recibirPago = async (req, res) => {
    const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
        return res.status(500).json({error: 'No hay access token configurado en el servidor'});
    }

    const body = req.body;

    /*
        console.log('==== WEBHOOK MP ====');
        console.log(JSON.stringify(body, null, 2));

    * */

    try {
        // 1) CASO PAYMENT (como ya lo tenías)
        if (body.type === 'payment' || body.topic === 'payment') {
            const paymentId = body.data && body.data.id;
            if (!paymentId) {
                console.error('No viene data.id en webhook de payment');
                return res.status(200).json({received: true, lookup_error: true});
            }

            const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
            const resp = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });

            const payment = await resp.json();
//            console.log('PAYMENT DETAIL:', payment);

            // Aquí podrías usar payment.order.id o payment.external_reference, etc.
            // TODO: actualizar pedido según payment

            return res.status(200).json({received: true});
        }

        // 2) CASO MERCHANT_ORDER  👇 **LO NUEVO**
        if (body.topic === 'merchant_order' && body.resource) {
            const merchantOrderUrl = body.resource;

            const resp = await fetch(merchantOrderUrl, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!resp.ok) {
                const txt = await resp.text();
                console.error('Error consultando merchant_order:', resp.status, txt);
                return res.status(200).json({received: true, lookup_error: true});
            }

            const merchantOrder = await resp.json();
            console.log('MERCHANT ORDER DETAIL:', merchantOrder);

            const preferenceId = merchantOrder.preference_id;
            const payments = merchantOrder.payments || [];
            const pagoAprobado = payments.some(p => p.status === 'approved');
            const preference_id = merchantOrder.preference_id;

            // Ejemplo de log rápido
            console.log("");
            console.log("-----------------------------------------");
            console.log('WEB HOOK ENVIA : preference_id:', preferenceId);
            console.log('WEB HOOK ENVIA :pagoAprobado:', pagoAprobado);
            console.log("-----------------------------------------");
            console.log("");

            // 👉 AQUÍ VA TU LÓGICA DE NEGOCIO
            // Buscar el pedido en MySQL por preference_id y actualizar el estado.

            //SE DEBE CONSIDERAR SI O SI EL ESTADO DE PAGO A APROVED PARA PRODUCCION

            try {
                const instanciaPedidoCompra = new PedidoCompras();
                const resultadoQuery = await instanciaPedidoCompra.cambiarEstadoaPagado(preference_id)
                if (resultadoQuery.affectedRows > 0) {


                    console.log(" --------> SE HA CAMBIADO EL ESTADO A 1 (PAGADO / PENDIENTE ENVIO)");
                    return res.status(200).json({received: true});
                    console.log('')
                    console.log('')

                } else {

                    console.log('')
                    console.log('')
                    console.log("--------> NO SE HA CAMBIADO EL ESTADO. NO HAY SIMILITUDES CON EL  --> preference_id <-- :  " + preference_id);
                    console.log('')
                    console.log('')
                    return res.status(200).json({received: true});

                }

            } catch (error) {
                return console.error('Error al validar preference_id:', error);
            }


            return res.status(200).json({received: true});
        }

        // 3) CUALQUIER OTRO TIPO
        console.log('Webhook no manejado. topic/type:', body.topic, body.type);
        return res.status(200).json({received: true, ignored: true});

    } catch (err) {
        console.error('Error en recibirPago:', err);
        return res.status(500).json({error: 'Error interno al procesar webhook'});
    }
};
