import dotenv from "dotenv";
dotenv.config();

import "reflect-metadata";
import express from "express";
import "colors";
import { createServer } from "node:http";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../dist/swagger.json" assert { type: "json" };
import "./workers";
import "./helper/utils/promiseAny";
import { expressAuthentication } from "./auth/expressAuthentication";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
// @ts-ignore
import { initSocket } from "./helper/utils/socket";
import { connectDB } from "./config/database";

(global as any).expressAuthentication = expressAuthentication;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
initSocket(server);
const PORT = process.env.PORT || 5500;
app.use(cors());

// Serve static files from public directory
app.use("/uploads", express.static(join(__dirname, "../public/uploads")));

// Add JSON parsing middleware for TSOA routes
app.use(express.json());

const apiRouter = express.Router();
const { RegisterRoutes } = await import("../dist/routes");
RegisterRoutes(apiRouter);
app.use("/api", apiRouter);

// Multer middleware will be applied in the controller

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/", async (req, res) => {
  return res.status(200).send("Hello, John Doe");
});

app.use((err: any, req: any, res: any, next: any) => {
  console.error("Caught by global handler:", err);
  const status = err.status || 500;
  const message = err.message || "Unexpected error";
  res.status(status).json({ error: message });
});

(async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`.blue.bold);
  });
})();
