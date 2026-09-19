const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const app = express();
const usersRouter = require("./users");
const cookieParser = require('cookie-parser');
const robotRoutes = require('./robot/robot');
const cors = require('cors');

app.use(cors({
   origin: ['http://localhost:4000', 'http://127.0.0.1:4000'],
   credentials: true
}));

const port = 5000;

app.use(express.json()); 
app.use(cookieParser());

const chatRouter = require('./chat');

app.use('/robot', robotRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/users", usersRouter);
app.use("/api/chat", chatRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});