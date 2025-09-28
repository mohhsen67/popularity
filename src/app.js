import express from "express";
import morgan from "morgan";
import reposRouter from "./routes/repos.js";
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

export function createApp() {
  const app = express();
  app.use(morgan("dev"));

  const openapiPath = path.resolve(process.cwd(), "openapi/openapi.yaml");
  const openapiDoc = YAML.parse(fs.readFileSync(openapiPath, "utf8"));

  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiDoc));
  app.get("/openapi.json", (_req, res) => res.json(openapiDoc));

  app.use("/repos", reposRouter);
  
  return app;
}
