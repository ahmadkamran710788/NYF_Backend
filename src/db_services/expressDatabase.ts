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
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
  app.use(morgan("dev"));
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/image", express.static(path.join(__dirname, "image")));
  app.use("/nyf", routes);
  //   app.use("/admin", AdminRoutes);
  //   app.use("/vender", VenderRoutes);
  //   app.use(ShoppingRoutes);
  //   app.use("/customer", CustomerRoute);

  return app;
};
