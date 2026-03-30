require('dotenv').config();
const { sequelize } = require('../src/config/database');

(async () => {
  await sequelize.authenticate();
  const [rows] = await sequelize.query(
    `SELECT id, format, "order", image_url FROM contents WHERE planning_id = 'd5714ca3-1ad6-4621-9294-629a6ca04af5' ORDER BY "order" ASC`
  );
  rows.forEach(r => console.log(r.format.padEnd(10), r.order, JSON.stringify(r.image_url)));
  await sequelize.close();
})();
