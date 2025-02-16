import express, { Request, Response } from "express";
import { Activity } from "../models/Activity";
import { Continent } from "../models/Continent";
import { Country } from "../models/Country";
import { City } from "../models/City";

const router = express.Router();
