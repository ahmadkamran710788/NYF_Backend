import { Request, Response } from "express";
import { Continent } from "../models/Continent";

export class ContinentController {
  // Get continent with all nested data
  static getContinentWithAll = async (req: Request, res: Response) => {
    try {
      const continent = await Continent.findById(
        req.params.continentId
      ).populate({
        path: "countries",
        populate: {
          path: "cities",
          populate: {
            path: "activities",
          },
        },
      });

      if (!continent) {
        return res.status(404).json({ message: "Continent not found" });
      }

      const allActivities = continent.countries.flatMap((country) =>
        country.cities.flatMap((city) => city.activities)
      );

      res.json({
        continent,
        activities: allActivities,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  // Get activities by category for a continent
  static getContinentActivitiesByCategory = async (
    req: Request,
    res: Response
  ) => {
    try {
      const continent = await Continent.findById(
        req.params.continentId
      ).populate({
        path: "countries",
        populate: {
          path: "cities",
          populate: {
            path: "activities",
            match: { category: req.params.category },
          },
        },
      });

      if (!continent) {
        return res.status(404).json({ message: "Continent not found" });
      }

      const activities = continent.countries.flatMap((country) =>
        country.cities.flatMap((city) => city.activities)
      );

      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
}
