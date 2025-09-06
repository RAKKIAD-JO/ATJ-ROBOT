require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const iot_api = require('./robot-iot-api');
const {checkAndUpdateStatuses,checkingDataandDelete}  = require('./statusChecker');
const { set } = require('mongoose');
const app = express();
const port = 3000;

app.use(express.json());
app.use(bodyParser.json());
app.use('/api',iot_api);

setInterval(checkAndUpdateStatuses, (Number(process.env.TIME_CHECK) * 60) * 1000);//นาที่
setInterval(checkingDataandDelete, (Number(process.env.DATA_RETENTION_DAYS) * 24 * 60 * 60) * 1000);//วัน

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});