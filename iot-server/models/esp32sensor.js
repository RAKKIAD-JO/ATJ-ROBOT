const mongodb = require('mongoose')

const esp32Sensor = new mongodb.Schema({
  formID: { type: String, required: true, },
  device_id: { type: String, required: true },
  battery: { type: Number, required: true },
  pumpStatus: { type: String, required: true },
  sprayRate: { type: Number, required: true },
  flowRate: { type: Number, required: true, default: 0 },
  waterLevel: { type: Number, required: true },
  liquidType: { type: String, required: false },
  totalVolume: { type: Number, required: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongodb.model('Esp32Sensor', esp32Sensor)