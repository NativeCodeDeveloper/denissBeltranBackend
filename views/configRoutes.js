import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const configPath = path.join(__dirname, '../config/site-config.json');

// Obtener configuración del sitio
router.get('/', (req, res) => {
  try {
    let config = {
      fotoPerfil: 'nube.png'
    };

    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(data);
    }

    res.json(config);
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// Actualizar foto de perfil en configuración
router.put('/foto-perfil', (req, res) => {
  try {
    const { fotoPerfil } = req.body;
    
    let config = {
      fotoPerfil: 'nube.png'
    };

    // Leer configuración existente
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(data);
    }

    // Actualizar foto de perfil
    config.fotoPerfil = fotoPerfil;

    // Crear directorio config si no existe
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Guardar configuración
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      config: config
    });

  } catch (error) {
    console.error('Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración' });
  }
});

export default router;