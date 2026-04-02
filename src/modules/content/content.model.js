/**
 * Modelo Content – Pieza de contenido individual generada.
 *
 * Cada pieza pertenece a una planeación y contiene todos los datos
 * necesarios para producción: copy, CTA, hashtags, guion (si es reel), etc.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Planning = require('../planning/planning.model');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  planningId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'planning_id',
    references: { model: 'plannings', key: 'id' },
  },
  format: {
    type: DataTypes.ENUM('reel', 'post', 'carrusel'),
    allowNull: false,
  },
  funnelStage: {
    type: DataTypes.ENUM('tofu', 'mofu', 'bofu'),
    allowNull: false,
    field: 'funnel_stage',
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  hook: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Gancho inicial para captar atención',
  },
  copy: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  cta: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Call to action alineado con la etapa del embudo',
  },
  hashtags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  script: {
    type: DataTypes.JSONB,
    allowNull: true,
    comment: 'Guion por escenas (solo para reels)',
  },
  carouselSlides: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'carousel_slides',
    comment: 'Slides del carrusel con texto e indicación visual',
  },
  visualDirection: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'visual_direction',
    comment: 'Dirección visual / indicaciones para diseño',
  },
  status: {
    type: DataTypes.ENUM('generated', 'reviewed', 'approved', 'published'),
    defaultValue: 'generated',
  },
  clientComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'client_comments',
    comment: 'Comentarios del cliente desde el sheet de aprobación',
  },
  approvalStatus: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'cambios', 'no_va'),
    defaultValue: 'pendiente',
    field: 'approval_status',
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de publicación dentro del mes',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
    comment: 'URL de la imagen generada (cover para carruseles)',
  },
  videoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'video_url',
    comment: 'URL del video generado con Veo 3.1 (solo reels)',
  },
}, {
  tableName: 'contents',
  underscored: true,
  timestamps: true,
});

Planning.hasMany(Content, { foreignKey: 'planning_id', as: 'contents' });
Content.belongsTo(Planning, { foreignKey: 'planning_id', as: 'planning' });

module.exports = Content;
