require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser");
const app = express();
const usersRouter = require("./users");
const path = require('path');
const cookieParser = require('cookie-parser');
const robotRoutes = require('./robot/robot');

app.use(
  cors({
    origin: "http://localhost:4000", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(bodyParser.json());
app.use(express.json()); 
app.use(cookieParser());


app.use('/robot', robotRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/api/users", usersRouter);
const port = 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

