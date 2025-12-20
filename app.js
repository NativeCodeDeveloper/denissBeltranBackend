import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import {fileURLToPath} from 'url';
import dotenv from 'dotenv';
import mercadoPagoRouter from "./views/mercadoPagoRoutes.js";
import pedidosRoutes from "./views/pedidosRoutes.js";
import reservaPacienteRoutes from "./views/reservaPacienteRoutes.js";

// Cargar variables de entorno PRIMERO
dotenv.config();

// Verificar que las variables se cargaron
console.log('Variables de entorno cargadas:');
console.log('  - JWT_SECRET:', process.env.JWT_SECRET ? 'Sí' : 'No');
console.log('  - MYSQL_HOST:', process.env.MYSQL_HOST ? 'Sí' : 'No');

import tituloRoutes from "./views/tituloRoutes.js";
import textosRoutes from "./views/textosRoutes.js";
import proyectoRouter from "./views/proyectosRoutes.js";
import contactoRouter from "./views/contactoRoutes.js";
import calendarRoutes from "./views/calendar.js";
import pacienteRoutes from "./views/pacientesRoutes.js";
import fichaRoutes from "./views/fichaRoutes.js";
import publicacionesRoutes from "./views/publicacionesRoutes.js";
import reservasRoutes from "./views/reservasRoutes.js";
import cloudinaryRoutes from "./views/cloudinaryRoutes.js";
import uploadRoutes from "./views/uploadRoutes.js";


// Para obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json()); // NECESARIO para leer req.body
app.use(cookieParser()); // Necesario para leer/escribir cookies (JWT)

// Servir archivos estáticos desde la carpeta uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const corsConfig = {
    origin: true,           // refleja el origin de la petición (permite cualquier origen)
    credentials: true,      // permite envío de cookies; poner false si no quieres cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsConfig));


app.get("/", (req, res) => {
    res.send("Hola mundo");
});

// Ruta para obtener configuración del sitio
app.get("/config", (req, res) => {
    try {
        const configPath = path.join(__dirname, 'config/site-config.json');

        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            const config = JSON.parse(data);
            res.json(config);
        } else {
            // Devolver configuración por defecto si no existe el archivo
            res.json({fotoPerfil: "nube.png"});
        }
    } catch (error) {
        console.error('Error leyendo configuración:', error);
        res.json({fotoPerfil: "nube.png"});
    }
});

app.use("/titulo", tituloRoutes);
app.use("/reservaPacientes", reservaPacienteRoutes);
app.use("/pagosMercadoPago", mercadoPagoRouter);
app.use("/pedidos", pedidosRoutes);
app.use("/textos", textosRoutes);
app.use("/proyectos", proyectoRouter);
app.use('/contacto', contactoRouter)
app.use('/calendar', calendarRoutes);
app.use('/pacientes', pacienteRoutes);
app.use('/ficha', fichaRoutes);
app.use('/api/publicaciones', publicacionesRoutes);
app.use('/reservas', reservasRoutes);
app.use('/upload', uploadRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

// app.set("trust proxy", 1); // Descomenta en producción detrás de proxy (para cookies 'secure')
app.listen(3001, () => {
    console.log('http://localhost:3001/')
})