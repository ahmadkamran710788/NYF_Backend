import express, { Application } from "express";
// import {
//   AdminRoutes,
//   CustomerRoute,
//   ShoppingRoutes,
//   VenderRoutes,
// } from "../routes";
import routes from "../routes/index";
import path from "path";
import morgan from "morgan";
import helmet from "helmet";
import bodyParser from "body-parser";
import cors from "cors";

export default async (app: Application) => {
  app.use(bodyParser.json({ limit: "1gb" }));
  app.use(bodyParser.urlencoded({ limit: "1gb", extended: true }));
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || "https://16.170.56.82:3000",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(morgan("dev"));
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/image", express.static(path.join(__dirname, "image")));
  app.use("nyf", routes);
  //   app.use("/admin", AdminRoutes);
  //   app.use("/vender", VenderRoutes);
  //   app.use(ShoppingRoutes);
  //   app.use("/customer", CustomerRoute);

  return app;
};
