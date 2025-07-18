require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const iot_api = require('./robot-iot-api');
const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.json());
app.use('/api',iot_api);

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});