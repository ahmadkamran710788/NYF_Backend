import { Request, Response } from "express";
import { Continent } from "../models/Continent";
import { uploadToCloudinary } from "../utils/CloudinaryHelper";
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

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const addContinent = async (
  req: MulterRequest,
  res: Response
): Promise<any> => {
  try {
    const { name, description } = req.body;
    let image_url: string | undefined;

    // Validate continent exists
    if (!name || !description) {
      res.status(400).json({
        success: false,
        message: "Name and description are required fields",
      });
      return;
    }

    const existingContinent = await Continent.findOne({ name });
    if (existingContinent) {
      return res.status(400).json({
        success: false,
        message: "Continent already exists",
      });
    }

    // Handle image upload if file is present
    if (req.file) {
      try {
        const filePath = req.file.path;
        const uploadResult = await uploadToCloudinary(
          filePath,
          "continent_images"
        );
        image_url = uploadResult.url;

        // Optional: Clean up the temporary file
        // await fs.unlink(filePath);
      } catch (uploadError: any) {
        res.status(400).json({
          success: false,
          message: "Error uploading image",
          error: uploadError.message,
        });
        return;
      }
    }

    const continent = new Continent({
      name,
      description,
      image: image_url,
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
