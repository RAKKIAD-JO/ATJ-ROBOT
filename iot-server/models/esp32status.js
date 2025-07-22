const mongodb = require('mongoose');

const esp32status = new mongodb.Schema({
  device_id: String,
  token: String,
  status: String,
  last_update: Date
});

module.exports = mongodb.model('Esp32Status', esp32status);