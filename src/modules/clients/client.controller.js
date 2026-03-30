/**
 * Controller de Clientes.
 * Maneja CRUD básico; la lógica de negocio pesada vive en los servicios.
 */

const path = require('path');
const multer = require('multer');
const Client = require('./client.model');
const logger = require('../../config/logger');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../public/logos'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    cb(null, `${req.params.id}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (/image\/(png|jpeg|jpg|svg\+xml|webp)/.test(file.mimetype)) cb(null, true);
    else cb(new Error('Solo se permiten imágenes PNG, JPG, SVG o WEBP'));
  },
});

const uploadMiddleware = upload.single('logo');

async function createClient(req, res, next) {
  try {
    const client = await Client.create(req.body);
    logger.info(`Cliente creado: ${client.name} (${client.packageType})`);
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
}

async function getAllClients(_req, res, next) {
  try {
    const clients = await Client.findAll({
      where: { active: true },
      order: [['created_at', 'DESC']],
    });
    res.json(clients);
  } catch (error) {
    next(error);
  }
}

async function getClientById(req, res, next) {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function updateClient(req, res, next) {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    await client.update(req.body);
    logger.info(`Cliente actualizado: ${client.name}`);
    res.json(client);
  } catch (error) {
    next(error);
  }
}

async function deleteClient(req, res, next) {
  try {
    const client = await Client.findByPk(req.params.id);
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

    // Soft delete: desactivar en lugar de borrar
    await client.update({ active: false });
    logger.info(`Cliente desactivado: ${client.name}`);
    res.json({ message: 'Cliente desactivado correctamente' });
  } catch (error) {
    next(error);
  }
}

function uploadLogo(req, res, next) {
  uploadMiddleware(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    try {
      const client = await Client.findByPk(req.params.id);
      if (!client) return res.status(404).json({ error: 'Cliente no encontrado' });

      const logoUrl = `/logos/${req.file.filename}`;
      await client.update({ logoUrl });
      logger.info(`Logo actualizado para ${client.name}: ${logoUrl}`);
      res.json({ ok: true, logoUrl });
    } catch (error) {
      next(error);
    }
  });
}

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  uploadLogo,
};
