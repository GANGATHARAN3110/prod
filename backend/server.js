const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./utils/swagger");

// Centralized routes
const appRoutes = require("./routes/appRoutes.js");

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use("/api", appRoutes);

// Health check
app.get("/", (req, res) => res.send("Expense Tracker API is running..."));

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL connected successfully");
    connection.release();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("App Start Failed", error.message);
    process.exit(1);
  }
};

startServer();
