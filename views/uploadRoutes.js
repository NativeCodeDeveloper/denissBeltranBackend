import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configuración de multer para subida de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Guardar archivos en la carpeta public del frontend
    const uploadPath = path.join(__dirname, '../../frontend/public/');
    // Crear la carpeta si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generar un nombre único para evitar conflictos
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const nombre = 'perfil-' + uniqueSuffix + extension;
    cb(null, nombre);
  }
});

// Filtros para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB límite
  }
});

// Ruta para subir foto de perfil
router.post('/foto-perfil', upload.single('fotoPerfil'), (req, res) => {
  try {
    console.log('Archivo recibido:', req.file); // Para debugging
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No se recibió ningún archivo' 
      });
    }

    // Eliminar la imagen anterior si no es la por defecto
    const imagenAnterior = req.body.imagenAnterior;
    if (imagenAnterior && imagenAnterior !== 'nube.png' && imagenAnterior.startsWith('perfil-')) {
      const rutaAnterior = path.join(__dirname, '../../frontend/public/', imagenAnterior);
      if (fs.existsSync(rutaAnterior)) {
        try {
          fs.unlinkSync(rutaAnterior);
        } catch (error) {
          console.log('No se pudo eliminar imagen anterior:', error.message);
        }
      }
    }

    // Actualizar configuración
    const configPath = path.join(__dirname, '../config/site-config.json');
    let config = { fotoPerfil: 'nube.png' };
    
    if (fs.existsSync(configPath)) {
      try {
        const data = fs.readFileSync(configPath, 'utf8');
        config = JSON.parse(data);
      } catch (e) {
        console.log('Error leyendo config, usando default');
      }
    }

    config.fotoPerfil = req.file.filename;

    // Crear directorio config si no existe
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    res.json({
      success: true,
      nombreArchivo: req.file.filename,
      mensaje: 'Foto de perfil subida correctamente'
    });

  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor: ' + error.message 
    });
  }
});

// Manejo de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo es demasiado grande. Máximo 5MB.' });
    }
  }
  res.status(400).json({ error: error.message });
});

export default router;