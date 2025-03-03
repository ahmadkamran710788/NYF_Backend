import { Request, Response } from "express";
import { Continent } from "../models/Continent";

export const getAllContinents = async (req: Request, res: Response) => {
  try {
    const continents = await Continent.find().populate("countries");
    res.status(200).json({
      success: true,
      data: continents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching continents",
      error: error.message,
    });
  }
};

export const addContinent = async (req: Request, res: Response) => {
  try {
    const { name, description, image } = req.body;

    const continent = new Continent({
      name,
      description,
      image,
      countries: [],
    });

    await continent.save();

    res.status(201).json({
      success: true,
      data: continent,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error adding continent",
      error: error.message,
    });
  }
};
