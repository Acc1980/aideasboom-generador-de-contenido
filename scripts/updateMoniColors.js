require('dotenv').config();
const { sequelize } = require('../src/config/database');
const Client = require('../src/modules/clients/client.model');

(async () => {
  await sequelize.authenticate();

  // Buscar Moni Grizales (nombre aproximado)
  const all = await Client.findAll({ attributes: ['id', 'name', 'brandIdentity'] });
  console.log('Clientes en BD:', all.map(c => c.name));

  const client = all.find(c => c.name.toLowerCase().includes('moni'));
  if (!client) {
    console.error('No se encontró cliente con "moni" en el nombre');
    process.exit(1);
  }

  const existing = client.brandIdentity || {};
  const updated = {
    ...existing,
    primaryColor: '#8fa394',
    accentColor:  '#c88d74',
    textColor:    '#2c2c2c',
    lightColor:   '#e8e6e1',
    titleFont:    'Cormorant Garamond',
    bodyFont:     'Montserrat',
  };

  await client.update({ brandIdentity: updated });
  console.log('\nOK - brandIdentity actualizado para:', client.name);
  console.log(JSON.stringify(updated, null, 2));
  await sequelize.close();
})().catch(e => { console.error(e.message); process.exit(1); });
