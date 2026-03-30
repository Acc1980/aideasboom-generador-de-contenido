/**
 * Modelo Strategy – Almacena la estrategia por período para un cliente.
 *
 * Tipos de período: 'annual', 'quarterly', 'monthly'.
 * Cada registro contiene el JSON de la estrategia correspondiente.
 * El campo conversionActive indica si hay un objetivo de conversión
 * activo, lo que afecta la distribución del embudo (BOFU sube a 30%).
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Client = require('../clients/client.model');

const Strategy = sequelize.define('Strategy', {
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
  periodType: {
    type: DataTypes.ENUM('annual', 'quarterly', 'monthly'),
    allowNull: false,
    field: 'period_type',
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  quarter: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 4 },
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 12 },
  },
  strategyData: {
    type: DataTypes.JSONB,
    allowNull: false,
    field: 'strategy_data',
    comment: 'Contenido estratégico: objetivos, temas clave, pilares, mensajes, etc.',
  },
  conversionActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'conversion_active',
    comment: 'Si true, la distribución BOFU sube de 20% a 30%',
  },
}, {
  tableName: 'strategies',
  underscored: true,
  timestamps: true,
});

// Relaciones
Client.hasMany(Strategy, { foreignKey: 'client_id', as: 'strategies' });
Strategy.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Strategy;
