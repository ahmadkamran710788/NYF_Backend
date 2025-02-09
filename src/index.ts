import express from "express";
import App from "./db_services/expressDatabase";
import DBconnections from "./db_services/database";
import { PORT } from "./config";

const startServer = async () => {
  const app = express();
  await DBconnections();
  await App(app);
  app.listen(PORT, () => {
    console.log(`we are live on port ${PORT}`);
  });
};

startServer();
