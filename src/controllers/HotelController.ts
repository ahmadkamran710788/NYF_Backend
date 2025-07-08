// src/controllers/hotelController.ts
import { Request, Response } from "express";
import { Hotel } from "../models/Hotel";
import { Country } from "../models/Country";
import { City } from "../models/City";
import mongoose from "mongoose";

// Get all hotelsxss
export const getAllHotels = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      country, 
      city, 
      stars, 
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter based on query parameters
    const filter: any = {};
    
    if (country) {
      const countryIds = Array.isArray(country) 
        ? country.join(',').split(',') 
        : String(country).split(',');
      
      if (countryIds.length > 0) {
        filter.country = { $in: countryIds };
      }
    }
    
    if (city) {
      const cityIds = Array.isArray(city) 
        ? city.join(',').split(',') 
        : String(city).split(',');
      
      if (cityIds.length > 0) {
        filter.city = { $in: cityIds };
      }
    }
    
    if (stars) {
      filter.stars = Number(stars);
    }
    
    if (minPrice || maxPrice) {
      filter.sellRatePerNight = {};
      if (minPrice) filter.sellRatePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.sellRatePerNight.$lte = Number(maxPrice);
    }

    // Build sort object
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query with population
    const hotels = await Hotel.find(filter)
      .populate({
        path: "country",
        select: "name continent",
        populate: {
          path: "continent",
          select: "name",
        },
      })
      .populate({
        path: "city",
        select: "name description",
      })
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalHotels = await Hotel.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: hotels.length,
      total: totalHotels,
      totalPages: Math.ceil(totalHotels / Number(limit)),
      currentPage: Number(page),
      data: hotels,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching hotels",
      error: error.message,
    });
  }
};

// Get hotel by ID
export const getHotelById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    const hotel = await Hotel.findById(id)
      .populate({
        path: "country",
        select: "name continent",
        populate: {
          path: "continent",
          select: "name",
        },
      })
      .populate({
        path: "city",
        select: "name description",
      });
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching hotel",
      error: error.message,
    });
  }
};

// Add a new hotel
export const addHotel = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      name,
      email,
      phone,
      address,
      country,
      city,
      zip,
      website,
      netRatePerNight,
      sellRatePerNight,
      commission,
      tax,
      currency,
      stars,
      note,
      amenities
    } = req.body;

    // Check required fields
    if (!name || !country || !city || !sellRatePerNight) {
      return res.status(400).json({
        success: false,
        message: "Name, country, city, and sell rate per night are required fields",
      });
    }

    // Check if hotel already exists in the same city
    const existingHotel = await Hotel.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }, 
      city: city 
    });
    
    if (existingHotel) {
      return res.status(400).json({
        success: false,
        message: "Hotel with this name already exists in this city",
      });
    }

    // Validate country exists
    const countryDoc = await Country.findById(country);
    if (!countryDoc) {
      return res.status(404).json({
        success: false,
        message: "Country not found",
      });
    }

    // Validate city exists
    const cityDoc = await City.findById(city);
    if (!cityDoc) {
      return res.status(404).json({
        success: false,
        message: "City not found",
      });
    }

    // Parse amenities if it's a string
    let parsedAmenities: string[] = [];
    if (amenities) {
      if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch {
          parsedAmenities = amenities.split(',').map(a => a.trim());
        }
      } else if (Array.isArray(amenities)) {
        parsedAmenities = amenities;
      }
    }

    // Create new hotel
    const hotel = new Hotel({
      name,
      email,
      phone,
      address,
      country,
      city,
      zip,
      website,
      netRatePerNight: Number(netRatePerNight) || 0,
      sellRatePerNight: Number(sellRatePerNight),
      commission: Number(commission) || 0,
      tax: Number(tax) || 0,
      currency: currency || 'AED',
      stars: Number(stars) || 3,
      note,
      amenities: parsedAmenities,
    });

    await hotel.save();

    // Populate the saved hotel before returning
    const populatedHotel = await Hotel.findById(hotel._id)
      .populate({
        path: "country",
        select: "name continent",
        populate: {
          path: "continent",
          select: "name",
        },
      })
      .populate({
        path: "city",
        select: "name description",
      });

    res.status(201).json({
      success: true,
      message: "Hotel created successfully",
      data: populatedHotel,
    });
  } catch (error: any) {
    console.error("Error adding hotel:", error);
    res.status(500).json({
      success: false,
      message: "Error adding hotel",
      error: error.message,
    });
  }
};

// Update hotel
export const updateHotel = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      country,
      city,
      zip,
      website,
      netRatePerNight,
      sellRatePerNight,
      commission,
      tax,
      currency,
      stars,
      note,
      amenities
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    // Find existing hotel
    const existingHotel = await Hotel.findById(id);
    if (!existingHotel) {
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Check if another hotel with the same name exists in the same city (excluding current hotel)
    if (name && city) {
      const duplicateHotel = await Hotel.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        city: city,
        _id: { $ne: id }
      });
      
      if (duplicateHotel) {
        return res.status(400).json({
          success: false,
          message: "Hotel with this name already exists in this city",
        });
      }
    }

    // Validate country if provided
    if (country) {
      const countryDoc = await Country.findById(country);
      if (!countryDoc) {
        return res.status(404).json({
          success: false,
          message: "Country not found",
        });
      }
    }

    // Validate city if provided
    if (city) {
      const cityDoc = await City.findById(city);
      if (!cityDoc) {
        return res.status(404).json({
          success: false,
          message: "City not found",
        });
      }
    }

    // Parse amenities if it's a string
    let parsedAmenities = existingHotel.amenities;
    if (amenities !== undefined) {
      if (typeof amenities === 'string') {
        try {
          parsedAmenities = JSON.parse(amenities);
        } catch {
          parsedAmenities = amenities.split(',').map(a => a.trim());
        }
      } else if (Array.isArray(amenities)) {
        parsedAmenities = amenities;
      }
    }

    // Update hotel
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (city !== undefined) updateData.city = city;
    if (zip !== undefined) updateData.zip = zip;
    if (website !== undefined) updateData.website = website;
    if (netRatePerNight !== undefined) updateData.netRatePerNight = Number(netRatePerNight);
    if (sellRatePerNight !== undefined) updateData.sellRatePerNight = Number(sellRatePerNight);
    if (commission !== undefined) updateData.commission = Number(commission);
    if (tax !== undefined) updateData.tax = Number(tax);
    if (currency !== undefined) updateData.currency = currency;
    if (stars !== undefined) updateData.stars = Number(stars);
    if (note !== undefined) updateData.note = note;
    if (parsedAmenities !== undefined) updateData.amenities = parsedAmenities;

    const updatedHotel = await Hotel.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    })
    .populate({
      path: "country",
      select: "name continent",
      populate: {
        path: "continent",
        select: "name",
      },
    })
    .populate({
      path: "city",
      select: "name description",
    });

    res.status(200).json({
      success: true,
      message: "Hotel updated successfully",
      data: updatedHotel,
    });
  } catch (error: any) {
    console.error("Error updating hotel:", error);
    res.status(500).json({
      success: false,
      message: "Error updating hotel",
      error: error.message,
    });
  }
};

// Delete hotel
export const deleteHotel = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
      });
    }

    // Find the hotel first to check if it exists
    const hotel = await Hotel.findById(id).session(session);
    
    if (!hotel) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Hotel not found",
      });
    }

    // Hard delete the hotel
    const deletedHotel = await Hotel.findByIdAndDelete(id).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Hotel successfully deleted",
      data: deletedHotel,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: "Error deleting hotel",
      error: error.message,
    });
  }
};

// Get hotels by city
export const getHotelsByCity = async (req: Request, res: Response): Promise<any> => {
  try {
    const { cityId } = req.params;
    const { stars, minPrice, maxPrice } = req.query;
    
    if (!cityId) {
      return res.status(400).json({
        success: false,
        message: "City ID is required",
      });
    }

    // Build filter
    const filter: any = { city: cityId };
    
    if (stars) {
      filter.stars = Number(stars);
    }
    
    if (minPrice || maxPrice) {
      filter.sellRatePerNight = {};
      if (minPrice) filter.sellRatePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.sellRatePerNight.$lte = Number(maxPrice);
    }

    const hotels = await Hotel.find(filter)
      .populate({
        path: "country",
        select: "name continent",
      })
      .populate({
        path: "city",
        select: "name description",
      })
      .sort({ stars: -1, sellRatePerNight: 1 });

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching hotels by city",
      error: error.message,
    });
  }
};

export const getAllHotelsNoPagination = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      country, 
      city, 
      stars, 
      minPrice, 
      maxPrice, 
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    // Build filter based on query parameters
    const filter: any = {};
    
    if (country) {
      const countryIds = Array.isArray(country) 
        ? country.join(',').split(',') 
        : String(country).split(',');
      
      if (countryIds.length > 0) {
        filter.country = { $in: countryIds };
      }
    }
    
    if (city) {
      const cityIds = Array.isArray(city) 
        ? city.join(',').split(',') 
        : String(city).split(',');
      
      if (cityIds.length > 0) {
        filter.city = { $in: cityIds };
      }
    }
    
    if (stars) {
      filter.stars = Number(stars);
    }
    
    if (minPrice || maxPrice) {
      filter.sellRatePerNight = {};
      if (minPrice) filter.sellRatePerNight.$gte = Number(minPrice);
      if (maxPrice) filter.sellRatePerNight.$lte = Number(maxPrice);
    }

    // Build sort object
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with population (no pagination)
    const hotels = await Hotel.find(filter)
      .populate({
        path: "country",
        select: "name continent",
        populate: {
          path: "continent",
          select: "name",
        },
      })
      .populate({
        path: "city",
        select: "name description",
      })
      .sort(sort);

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching all hotels",
      error: error.message,
    });
  }
};