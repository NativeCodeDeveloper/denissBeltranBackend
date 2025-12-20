import nodemailer from 'nodemailer';

// Configuración del transporter de correos
export const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_PORT == 465, // true para puerto 465, false para otros puertos
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Función para enviar correo de confirmación de cita
export const enviarCorreoConfirmacion = async (datos) => {
  const { nombre, email, fecha, hora, meetLink = '' } = datos;

  // Formatear fecha para mostrar en el correo
  const fechaFormateada = new Date(fecha).toLocaleDateString('es-CL', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Mensaje en texto plano
  const mensajeTexto = `Estimado/a ${nombre},\n\nSu sesión con Denniss Psicóloga ha sido confirmada.\n\nDetalles de la sesión:\n- Paciente: ${nombre}\n- Profesional: Denniss Psicóloga\n- Fecha: ${fechaFormateada}\n- Hora: ${hora}\n${meetLink ? `- Enlace a videollamada: ${meetLink}\n` : ''}\nPor favor, conéctese puntual a la hora agendada.\n\nSi necesita reagendar o tiene dudas, responda este correo o contáctenos al WhatsApp +56 9 7322 2089.\n\nGracias por confiar en nuestro servicio.\n\nMedify Agenda`;

  // Mensaje en HTML
  const mensajeHtml = `
    <div style="font-family: Arial, sans-serif; color: #222; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #c026d3;">Sesión confirmada con Denniss Psicóloga</h2>
      <p>Estimado/a <strong>${nombre}</strong>,</p>
      <p>Su sesión ha sido confirmada. A continuación los detalles:</p>
      <ul style="line-height:1.7;">
        <li><strong>Paciente:</strong> ${nombre}</li>
        <li><strong>Profesional:</strong> Denniss Psicóloga</li>
        <li><strong>Fecha:</strong> ${fechaFormateada}</li>
        <li><strong>Hora:</strong> ${hora}</li>
        ${meetLink ? `<li><strong>Enlace a videollamada:</strong> <a href="${meetLink}" target="_blank">Unirse a la sesión</a></li>` : ''}
      </ul>
      <p>Por favor, conéctese puntual a la hora agendada.</p>
      <p>Si necesita reagendar o tiene dudas, responda este correo o contáctenos al WhatsApp <strong>+56 9 7322 2089</strong>.</p>
      <p style="margin-top:2em; color:#888; font-size:13px;">Gracias por confiar en nuestro servicio.<br>Medify Agenda</p>
    </div>
  `;

  const transporter = createEmailTransporter();
  const mailOptions = {
    from: `"Denniss Psicóloga" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Sesión de ${nombre} con Denniss Psicóloga – Confirmación de reserva`,
    text: mensajeTexto,
    html: mensajeHtml,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('Correo de confirmación enviado exitosamente:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error enviando correo de confirmación:', error);
    return { success: false, error: error.message };
  }
};