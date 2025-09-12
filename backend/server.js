require('dotenv').config();
const express = require('express');
const app = express();
const usersRouter = require("./users");
const path = require('path');
const cookieParser = require('cookie-parser');
const robotRoutes = require('./robot/robot');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger-output.json');
const cors = require('cors');

app.use(cors({
   origin: ['http://localhost:4000'],
   credentials: true
}));

const port = 5000;

app.use(express.json()); 
app.use(cookieParser());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use('/robot', robotRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use("/api/users", usersRouter);

app.get("/", (req, res) => {
  res.send("Welcome to the API");
});


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});