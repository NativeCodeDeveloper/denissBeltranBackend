import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
const router = express.Router();

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dauhxormz',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de multer para manejar archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo JPG, PNG y WebP.'), false);
    }
  }
});

// Endpoint para subir imágenes
router.post('/upload', upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se ha seleccionado ningún archivo' 
      });
    }

    console.log('📸 Subiendo imagen a Cloudinary...');
    console.log('📁 Archivo:', req.file.originalname);
    console.log('📊 Tamaño:', (req.file.size / 1024).toFixed(1) + 'KB');

    // Upload signed a Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'medify/publicaciones',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto', fetch_format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('❌ Error de Cloudinary:', error);
            reject(error);
          } else {
            console.log('✅ Upload exitoso:', result.secure_url);
            resolve(result);
          }
        }
      ).end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    });

  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

// Endpoint para eliminar imágenes
router.delete('/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    res.json({
      success: true,
      result: result
    });
  } catch (error) {
    console.error('❌ Error al eliminar imagen:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;