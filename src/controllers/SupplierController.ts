// src/controllers/supplierController.ts
import { Request, Response } from "express";
import { Supplier } from "../models/Supplier";
import mongoose from "mongoose";

// Get all suppliers
export const getAllSuppliers = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      search,
      page = 1, 
      limit = 25,
      sortBy = 'supplierName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter based on search query
    const filter: any = {};
    
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { supplierName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { address: searchRegex }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Execute query
    const suppliers = await Supplier.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const totalSuppliers = await Supplier.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: suppliers.length,
      total: totalSuppliers,
      totalPages: Math.ceil(totalSuppliers / Number(limit)),
      currentPage: Number(page),
      data: suppliers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers",
      error: error.message,
    });
  }
};

// Get supplier by ID
export const getSupplierById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID is required",
      });
    }

    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching supplier",
      error: error.message,
    });
  }
};

// Add a new supplier
export const addSupplier = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      supplierName,
      phone,
      email,
      address,
      latitude,
      longitude,
      ccEmail,
      apiPayload
    } = req.body;

    // Check required fields
    if (!supplierName) {
      return res.status(400).json({
        success: false,
        message: "Supplier name is required",
      });
    }

    // Check if supplier with same name already exists
    const existingSupplier = await Supplier.findOne({ 
      supplierName: { $regex: new RegExp(`^${supplierName}$`, 'i') }
    });
    
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: "Supplier with this name already exists",
      });
    }

    // Check if email already exists (if provided)
    if (email) {
      const emailExists = await Supplier.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Supplier with this email already exists",
        });
      }
    }

    // Parse coordinates if provided
    let parsedLatitude = latitude ? Number(latitude) : 0;
    let parsedLongitude = longitude ? Number(longitude) : 0;

    // Validate coordinates
    if (latitude && (isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90)) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude. Must be between -90 and 90",
      });
    }

    if (longitude && (isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180)) {
      return res.status(400).json({
        success: false,
        message: "Invalid longitude. Must be between -180 and 180",
      });
    }

    // Create new supplier
    const supplier = new Supplier({
      supplierName,
      phone,
      email,
      address,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      ccEmail,
      apiPayload
    });

    await supplier.save();

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });
  } catch (error: any) {
    console.error("Error adding supplier:", error);
    res.status(500).json({
      success: false,
      message: "Error adding supplier",
      error: error.message,
    });
  }
};

// Update supplier
export const updateSupplier = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      supplierName,
      phone,
      email,
      address,
      latitude,
      longitude,
      ccEmail,
      apiPayload
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID is required",
      });
    }

    // Find existing supplier
    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Check if another supplier with the same name exists (excluding current supplier)
    if (supplierName) {
      const duplicateSupplier = await Supplier.findOne({
        supplierName: { $regex: new RegExp(`^${supplierName}$`, 'i') },
        _id: { $ne: id }
      });
      
      if (duplicateSupplier) {
        return res.status(400).json({
          success: false,
          message: "Supplier with this name already exists",
        });
      }
    }

    // Check if email already exists (excluding current supplier)
    if (email) {
      const emailExists = await Supplier.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Supplier with this email already exists",
        });
      }
    }

    // Parse coordinates if provided
    let parsedLatitude = existingSupplier.latitude;
    let parsedLongitude = existingSupplier.longitude;

    if (latitude !== undefined) {
      parsedLatitude = Number(latitude);
      if (isNaN(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
        return res.status(400).json({
          success: false,
          message: "Invalid latitude. Must be between -90 and 90",
        });
      }
    }

    if (longitude !== undefined) {
      parsedLongitude = Number(longitude);
      if (isNaN(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
        return res.status(400).json({
          success: false,
          message: "Invalid longitude. Must be between -180 and 180",
        });
      }
    }

    // Update supplier
    const updateData: any = {};
    
    if (supplierName !== undefined) updateData.supplierName = supplierName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = parsedLatitude;
    if (longitude !== undefined) updateData.longitude = parsedLongitude;
    if (ccEmail !== undefined) updateData.ccEmail = ccEmail;
    if (apiPayload !== undefined) updateData.apiPayload = apiPayload;

    const updatedSupplier = await Supplier.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      data: updatedSupplier,
    });
  } catch (error: any) {
    console.error("Error updating supplier:", error);
    res.status(500).json({
      success: false,
      message: "Error updating supplier",
      error: error.message,
    });
  }
};

// Delete supplier
export const deleteSupplier = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Supplier ID is required",
      });
    }

    // Find the supplier first to check if it exists
    const supplier = await Supplier.findById(id).session(session);
    
    if (!supplier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // TODO: Add logic to check if supplier is referenced in other collections
    // For example, check if supplier is used in bookings, activities, etc.
    // If referenced, you might want to prevent deletion or handle it accordingly

    // Delete the supplier
    const deletedSupplier = await Supplier.findByIdAndDelete(id).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Supplier successfully deleted",
      data: deletedSupplier,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: "Error deleting supplier",
      error: error.message,
    });
  }
};

// Get suppliers by location (within a radius)
export const getSuppliersByLocation = async (req: Request, res: Response): Promise<any> => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    const radiusInKm = Number(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radiusInKm)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates or radius",
      });
    }

    // Find suppliers within the specified radius using MongoDB's geospatial query
    const suppliers = await Supplier.find({
      latitude: { $ne: 0 },
      longitude: { $ne: 0 },
      $expr: {
        $lte: [
          {
            $multiply: [
              6371, // Earth's radius in kilometers
              {
                $acos: {
                  $add: [
                    {
                      $multiply: [
                        { $sin: { $degreesToRadians: "$latitude" } },
                        { $sin: { $degreesToRadians: lat } }
                      ]
                    },
                    {
                      $multiply: [
                        { $cos: { $degreesToRadians: "$latitude" } },
                        { $cos: { $degreesToRadians: lat } },
                        { $cos: { $degreesToRadians: { $subtract: ["$longitude", lng] } } }
                      ]
                    }
                  ]
                }
              }
            ]
          },
          radiusInKm
        ]
      }
    }).sort({ supplierName: 1 });

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers by location",
      error: error.message,
    });
  }
};
export const getAllSuppliersNoPagination = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      search,
      sortBy = 'supplierName',
      sortOrder = 'asc'
    } = req.query;

    // Build filter based on search query
    const filter: any = {};
    
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { supplierName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { address: searchRegex }
      ];
    }

    // Build sort object
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    // Execute query without pagination
    const suppliers = await Supplier.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers",
      error: error.message,
    });
  }
};


// Get supplier statistics
export const getSupplierStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const suppliersWithEmail = await Supplier.countDocuments({ email: { $exists: true, $ne: "" } });
    const suppliersWithPhone = await Supplier.countDocuments({ phone: { $exists: true, $ne: "" } });
    const suppliersWithLocation = await Supplier.countDocuments({ 
      latitude: { $ne: 0 }, 
      longitude: { $ne: 0 } 
    });

    res.status(200).json({
      success: true,
      data: {
        totalSuppliers,
        suppliersWithEmail,
        suppliersWithPhone,
        suppliersWithLocation,
        emailPercentage: totalSuppliers > 0 ? ((suppliersWithEmail / totalSuppliers) * 100).toFixed(2) : 0,
        phonePercentage: totalSuppliers > 0 ? ((suppliersWithPhone / totalSuppliers) * 100).toFixed(2) : 0,
        locationPercentage: totalSuppliers > 0 ? ((suppliersWithLocation / totalSuppliers) * 100).toFixed(2) : 0
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching supplier statistics",
      error: error.message,
    });
  }
};