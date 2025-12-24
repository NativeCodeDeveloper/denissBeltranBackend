// services/emailService.js
import nodemailer from "nodemailer";

// OJO: idealmente estas cosas van en variables de entorno (.env)
const transporter = nodemailer.createTransport({
    service: "gmail", // o smtp de tu proveedor
    auth: {
        user: process.env.EMAIL_USER,      // tu correo
        pass: process.env.EMAIL_PASSWORD,  // contraseña o app password
    },
});

export async function enviarCorreoComprobante({correoDestino, nombre}) {
    const mailOptions = {
        from: `<${process.env.EMAIL_USER}>`,
        to: correoDestino,
        subject: "Gracias por Confiar en Nosotros",
        html: `
      <h1>Estimado/a ${nombre}</h1>
      <p>
      Su reserva ha sido realizada con éxito. 

Si desea modificar la fecha u hora de su cita, por favor contáctenos a través de nuestros canales habituales para realizar el reagendamiento correspondiente.
</p>
    `,
    };

    await transporter.sendMail(mailOptions);
}