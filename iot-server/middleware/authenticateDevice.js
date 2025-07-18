const Esp32Status = require('../models/esp32status');

const authenticateDevice = async (req, res, next) => {
  const { device_id, token } = req.headers;

  if (!device_id || !token) {
    console.log("Missing headers");
    return res.status(401).send('Authentication required!');
  }

  try {
    const device = await Esp32Status.findOne({ device_id, token });
    if (!device) {
      return res.status(403).send('Invalid token or device ID!');
    }
    next(); 
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).send('Server error!');
  }
};

module.exports = authenticateDevice;