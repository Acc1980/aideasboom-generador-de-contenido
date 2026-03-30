/**
 * Modelo Planning – Planeación mensual generada automáticamente.
 *
 * Cada registro representa la planeación de un mes completo para un cliente.
 * El campo pieces contiene el arreglo de piezas de contenido planificadas,
 * cada una con formato, etapa de embudo, tema, copy sugerido, etc.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Client = require('../clients/client.model');

const Planning = sequelize.define('Planning', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  clientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'client_id',
    references: { model: 'clients', key: 'id' },
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 12 },
  },
  week: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: { min: 1, max: 4 },
    comment: 'Semana del mes (1-4)',
  },
  packageType: {
    type: DataTypes.ENUM('basico', 'premium', 'personalizado_7'),
    allowNull: false,
    field: 'package_type',
  },
  distribution: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Distribución calculada: { total, reels, posts, carruseles, tofu, mofu, bofu }',
  },
  pieces: {
    type: DataTypes.JSONB,
    allowNull: false,
    comment: 'Arreglo de piezas planificadas con formato, embudo, tema, copy, CTA, hashtags',
    defaultValue: [],
  },
  status: {
    type: DataTypes.ENUM('draft', 'approved', 'in_production', 'completed'),
    defaultValue: 'draft',
  },
  generatedPrompt: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'generated_prompt',
    comment: 'Prompt enviado a OpenAI para trazabilidad',
  },
  approvalSheetUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'approval_sheet_url',
    comment: 'URL del Google Sheet de aprobación compartido con el cliente',
  },
  storiesSheetUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'stories_sheet_url',
    comment: 'URL del Google Sheet de aprobación de stories',
  },
  driveFolderUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'drive_folder_url',
    comment: 'URL de la carpeta de Drive con las imágenes generadas',
  },
}, {
  tableName: 'plannings',
  underscored: true,
  timestamps: true,
  indexes: [
    { unique: true, fields: ['client_id', 'year', 'month', 'week'] },
  ],
});

Client.hasMany(Planning, { foreignKey: 'client_id', as: 'plannings' });
Planning.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Planning;
