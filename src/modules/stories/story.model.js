/**
 * Modelo Story – Historia de Instagram diaria.
 *
 * Cada story pertenece a una planeación semanal y opcionalmente
 * refuerza una pieza de contenido aprobada. Se generan 4-5 stories
 * por día × 7 días = 28-35 stories por semana.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Planning = require('../planning/planning.model');
const Content = require('../content/content.model');

const Story = sequelize.define('Story', {
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
  relatedContentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'related_content_id',
    references: { model: 'contents', key: 'id' },
    comment: 'Pieza de contenido que esta story refuerza (opcional)',
  },
  dayOfWeek: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'day_of_week',
    comment: '1=Lunes … 7=Domingo',
    validate: { min: 1, max: 7 },
  },
  dayLabel: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'day_label',
    comment: 'Nombre del día: Lunes, Martes, etc.',
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Posición dentro del día (1-5)',
  },
  storyType: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'story_type',
    comment: 'Tipo decidido por la IA: teaser, encuesta, tip_experto, grabada_coach, pregunta, behind_the_scenes, dato_curioso, reflexion, cta_directa, etc.',
  },
  isRecorded: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_recorded',
    comment: 'true si la coach debe grabarla en cámara',
  },
  script: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Guion palabra por palabra (para stories grabadas)',
  },
  textContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'text_content',
    comment: 'Texto para story de imagen/texto',
  },
  visualDirection: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'visual_direction',
    comment: 'Indicaciones de diseño o escenario para grabación',
  },
  cta: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Call to action (si aplica)',
  },
  stickerSuggestion: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'sticker_suggestion',
    comment: 'Sugerencia de sticker interactivo: encuesta, pregunta, slider, quiz',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
    comment: 'URL de la imagen generada (null para stories grabadas)',
  },
  status: {
    type: DataTypes.ENUM('generated', 'reviewed', 'approved', 'published'),
    defaultValue: 'generated',
  },
  approvalStatus: {
    type: DataTypes.ENUM('pendiente', 'aprobado', 'cambios', 'no_va'),
    defaultValue: 'pendiente',
    field: 'approval_status',
  },
  clientComments: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'client_comments',
    comment: 'Comentarios del cliente desde el sheet de aprobación',
  },
  scheduledDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'scheduled_date',
    comment: 'Fecha de publicación calculada automáticamente (YYYY-MM-DD)',
  },
}, {
  tableName: 'stories',
  underscored: true,
  timestamps: true,
});

Planning.hasMany(Story, { foreignKey: 'planning_id', as: 'stories' });
Story.belongsTo(Planning, { foreignKey: 'planning_id', as: 'planning' });

Content.hasMany(Story, { foreignKey: 'related_content_id', as: 'stories' });
Story.belongsTo(Content, { foreignKey: 'related_content_id', as: 'relatedContent' });

module.exports = Story;
