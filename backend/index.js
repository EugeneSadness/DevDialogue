const express = require("express");
const http = require("http");
const sequelizePromise = require("./db.js");
const cors = require("cors");
const router = require("./routes/index");
const errorHandler = require("./middleware/ErrorHandlingMiddleware.js");
const setupSocket = require("./socket/index.js");
const Models = require("./models/models");
require("dotenv").config();

const PORT = +process.env.PORT;

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use(errorHandler);

const httpServer = http.createServer(app);

const io = setupSocket(httpServer);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server is working!" });
});

const start = async () => {
  try {
    // Await the Promise to get the Sequelize instance
    const sequelize = await sequelizePromise;
    
    // Now we can use the sequelize instance
    await sequelize.authenticate();
    await sequelize.sync();
    
    httpServer.listen(PORT, () => {
      console.log(`Server started on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1); // Exit the process with an error code
  }
};

start();
