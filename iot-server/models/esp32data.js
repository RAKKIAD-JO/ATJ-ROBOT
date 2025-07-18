const mongodb = require('mongoose');

const esp32DataSchema = new mongodb.Schema({
  device_id: { type: String, required: true },
  plantType: { type: String, required: true },
  liquidType: { type: String, required: true },
  chemicalName: { type: String, required: true },
  area: { type: String, required: true },
  other: { type: String, required: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongodb.model('Esp32Data', esp32DataSchema)