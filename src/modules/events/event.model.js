/**
 * Modelo Event – Eventos/entrenamientos de un cliente.
 *
 * Permite registrar eventos futuros para que el sistema
 * calcule automáticamente la etapa promocional (siembra → anuncio → urgencia)
 * y ajuste la distribución de embudo y prompts.
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Client = require('../clients/client.model');

const Event = sequelize.define('Event', {
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
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Nombre del evento (ej: "Reconociendo mi poder")',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción para contexto de IA',
  },
  eventType: {
    type: DataTypes.ENUM('entrenamiento', 'taller', 'masterclass', 'lanzamiento', 'retiro', 'otro'),
    allowNull: false,
    field: 'event_type',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'start_date',
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'end_date',
    comment: 'Fecha fin (null si es de un solo día)',
  },
  schedule: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Horario: "6:30 pm a 9:30 pm"',
  },
  registrationUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'registration_url',
  },
  keyBenefits: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'key_benefits',
    defaultValue: [],
    comment: 'Array de beneficios clave para prompts',
  },
  targetPrice: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'target_price',
    comment: 'Precio o rango para CTAs de conversión',
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'client_events',
  underscored: true,
  timestamps: true,
});

// Relaciones
Client.hasMany(Event, { foreignKey: 'client_id', as: 'events' });
Event.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Event;
