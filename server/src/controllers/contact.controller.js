const nodemailer = require('nodemailer');

exports.sendContactEmail = async (req, res) => {
    const { name, gym, phone, email, message } = req.body;

    try {
        // Create a transporter. 
        // In production, the credentials should be in .env (e.g. process.env.EMAIL_USER)
        // Since we are mocking or preparing the structure, we use a basic config.
        const transporter = nodemailer.createTransport({
            service: 'gmail', // You can change this to your email provider
            auth: {
                user: process.env.EMAIL_USER || 'fluxergestion@gmail.com',
                pass: process.env.EMAIL_PASS || 'tu_contraseña_de_aplicacion' 
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER || 'fluxergestion@gmail.com',
            to: 'fluxergestion@gmail.com', // Receiver email
            subject: `Nuevo contacto desde Landing Page: ${gym}`,
            text: `
Has recibido un nuevo mensaje de contacto desde la Landing Page de Fluxer.

Detalles del contacto:
- Nombre: ${name}
- Complejo: ${gym}
- Teléfono: ${phone}
- Email: ${email}

Mensaje:
${message}
            `
        };

        // If credentials are valid, this will send the email.
        // For development without credentials, we might just log it and return success to test the flow.
        if (process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            console.log("Simulando envío de correo porque no hay EMAIL_PASS en .env:");
            console.log(mailOptions.text);
        }

        res.status(200).json({ success: true, message: 'Mensaje enviado correctamente.' });
    } catch (error) {
        console.error('Error al enviar email de contacto:', error);
        res.status(500).json({ success: false, message: 'Error interno al enviar el mensaje.' });
    }
};
