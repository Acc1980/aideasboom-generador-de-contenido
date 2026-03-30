/**
 * Modelo Client – Representa a un cliente de la agencia.
 *
 * Campos clave:
 *  - packageType: 'basico' | 'premium' → determina la distribución de contenido.
 *  - brandIdentity: JSON con identidad de marca (tono, colores, palabras prohibidas, etc.).
 *  - active: soft-flag para pausar clientes sin borrar datos.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  packageType: {
    type: DataTypes.ENUM('basico', 'premium', 'personalizado_7'),
    allowNull: false,
    field: 'package_type',
  },
  brandIdentity: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'brand_identity',
    comment: 'Identidad de marca: tono, personalidad, colores, emojis permitidos, palabras prohibidas, hashtags base',
    defaultValue: {
      tone: '',
      personality: '',
      emojisAllowed: false,
      forbiddenWords: [],
      baseHashtags: [],
    },
  },
  industry: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  targetAudience: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'target_audience',
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'logo_url',
    comment: 'Ruta relativa del logo del cliente (ej: /logos/slug.png)',
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'clients',
  underscored: true,
  timestamps: true,
});

module.exports = Client;
