// src/controllers/customerController.ts
import { Request, Response } from "express";
import { Customer } from "../models/Customer";
import mongoose from "mongoose";

// Get all customers
// export const getAllCustomers = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const { 
//       search,
//       page = 1, 
//       limit = 25,
//       sortBy = 'firstName',
//       sortOrder = 'asc',
//       status,
//       approved,
//       newsletter,
//       country
//     } = req.query;

//     // Build filter based on search query and filters
//     const filter: any = {};
    
//     if (search) {
//       const searchRegex = new RegExp(String(search), 'i');
//       filter.$or = [
//         { firstName: searchRegex },
//         { lastName: searchRegex },
//         { email: searchRegex },
//         { phone: searchRegex },
//         { passport: searchRegex },
//         { trnNumber: searchRegex },
//         { address: searchRegex },
//         { country: searchRegex }
//       ];
//     }

//     // Add status filters
//     if (status !== undefined) {
//       filter.status = status === 'true';
//     }
//     if (approved !== undefined) {
//       filter.approved = approved === 'true';
//     }
//     if (newsletter !== undefined) {
//       filter.newsletter = newsletter === 'true';
//     }
//     if (country) {
//       filter.country = new RegExp(String(country), 'i');
//     }

//     // Build sort object
//     const sort: any = {};
//     sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

//     // Calculate pagination
//     const skip = (Number(page) - 1) * Number(limit);
    
//     // Execute query
//     const customers = await Customer.find(filter)
//       .sort(sort)
//       .skip(skip)
//       .limit(Number(limit));

//     // Get total count for pagination
//     const totalCustomers = await Customer.countDocuments(filter);
    
//     res.status(200).json({
//       success: true,
//       count: customers.length,
//       total: totalCustomers,
//       totalPages: Math.ceil(totalCustomers / Number(limit)),
//       currentPage: Number(page),
//       data: customers,
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching customers",
//       error: error.message,
//     });
//   }
// };
export const getAllCustomers = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      search,
      sortBy = 'firstName',
      sortOrder = 'asc',
      status,
      approved,
      newsletter,
      country
    } = req.query;

    // Build filter based on search query and filters
    const filter: any = {};
    
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { passport: searchRegex },
        { trnNumber: searchRegex },
        { address: searchRegex },
        { country: searchRegex }
      ];
    }

    // Add status filters
    if (status !== undefined) {
      filter.status = status === 'true';
    }
    if (approved !== undefined) {
      filter.approved = approved === 'true';
    }
    if (newsletter !== undefined) {
      filter.newsletter = newsletter === 'true';
    }
    if (country) {
      filter.country = new RegExp(String(country), 'i');
    }

    // Build sort object
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    // Execute query without pagination
    const customers = await Customer.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
      error: error.message,
    });
  }
};
// Get customer by ID
export const getCustomerById = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }
    
    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching customer",
      error: error.message,
    });
  }
};

// Add a new customer
export const addCustomer = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      title,
      firstName,
      lastName,
      email,
      phone,
      passport,
      passportExpiry,
      address,
      country,
      trnNumber,
      newsletter = false,
      approved = false,
      status = true
    } = req.body;

    // Check required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    // Check if customer with same email already exists (if email provided)
    if (email) {
      const existingCustomer = await Customer.findOne({ 
        email: email.toLowerCase() 
      });
      
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: "Customer with this email already exists",
        });
      }
    }

    // Check if customer with same passport already exists (if passport provided)
    if (passport) {
      const existingPassport = await Customer.findOne({ 
        passport: passport.toUpperCase() 
      });
      
      if (existingPassport) {
        return res.status(400).json({
          success: false,
          message: "Customer with this passport already exists",
        });
      }
    }

    // Check if customer with same TRN number already exists (if TRN provided)
    if (trnNumber) {
      const existingTrn = await Customer.findOne({ 
        trnNumber: trnNumber.toUpperCase() 
      });
      
      if (existingTrn) {
        return res.status(400).json({
          success: false,
          message: "Customer with this TRN number already exists",
        });
      }
    }

    // Validate passport expiry date
    if (passportExpiry && new Date(passportExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Passport expiry date cannot be in the past",
      });
    }

    // Create new customer
    const customer = new Customer({
      title,
      firstName,
      lastName,
      email,
      phone,
      passport: passport ? passport.toUpperCase() : passport,
      passportExpiry,
      address,
      country,
      trnNumber: trnNumber ? trnNumber.toUpperCase() : trnNumber,
      newsletter,
      approved,
      status
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error: any) {
    console.error("Error adding customer:", error);
    res.status(500).json({
      success: false,
      message: "Error adding customer",
      error: error.message,
    });
  }
};

// Update customer
export const updateCustomer = async (req: Request, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const {
      title,
      firstName,
      lastName,
      email,
      phone,
      passport,
      passportExpiry,
      address,
      country,
      trnNumber,
      newsletter,
      approved,
      status
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Find existing customer
    const existingCustomer = await Customer.findById(id);
    if (!existingCustomer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // Check if another customer with the same email exists (excluding current customer)
    if (email) {
      const duplicateEmail = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      
      if (duplicateEmail) {
        return res.status(400).json({
          success: false,
          message: "Customer with this email already exists",
        });
      }
    }

    // Check if another customer with the same passport exists (excluding current customer)
    if (passport) {
      const duplicatePassport = await Customer.findOne({
        passport: passport.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (duplicatePassport) {
        return res.status(400).json({
          success: false,
          message: "Customer with this passport already exists",
        });
      }
    }

    // Check if another customer with the same TRN exists (excluding current customer)
    if (trnNumber) {
      const duplicateTrn = await Customer.findOne({
        trnNumber: trnNumber.toUpperCase(),
        _id: { $ne: id }
      });
      
      if (duplicateTrn) {
        return res.status(400).json({
          success: false,
          message: "Customer with this TRN number already exists",
        });
      }
    }

    // Validate passport expiry date
    if (passportExpiry && new Date(passportExpiry) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Passport expiry date cannot be in the past",
      });
    }

    // Update customer
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (passport !== undefined) updateData.passport = passport ? passport.toUpperCase() : passport;
    if (passportExpiry !== undefined) updateData.passportExpiry = passportExpiry;
    if (address !== undefined) updateData.address = address;
    if (country !== undefined) updateData.country = country;
    if (trnNumber !== undefined) updateData.trnNumber = trnNumber ? trnNumber.toUpperCase() : trnNumber;
    if (newsletter !== undefined) updateData.newsletter = newsletter;
    if (approved !== undefined) updateData.approved = approved;
    if (status !== undefined) updateData.status = status;

    const updatedCustomer = await Customer.findByIdAndUpdate(id, updateData, { 
      new: true, 
      runValidators: true 
    });

    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: updatedCustomer,
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    res.status(500).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};

// Delete customer
export const deleteCustomer = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required",
      });
    }

    // Find the customer first to check if it exists
    const customer = await Customer.findById(id).session(session);
    
    if (!customer) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    // TODO: Add logic to check if customer is referenced in other collections
    // For example, check if customer is used in bookings, orders, etc.
    // If referenced, you might want to prevent deletion or handle it accordingly

    // Delete the customer
    const deletedCustomer = await Customer.findByIdAndDelete(id).session(session);
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: "Customer successfully deleted",
      data: deletedCustomer,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({
      success: false,
      message: "Error deleting customer",
      error: error.message,
    });
  }
};

// Get all customers without pagination
export const getAllCustomersNoPagination = async (req: Request, res: Response): Promise<any> => {
  try {
    const { 
      search,
      sortBy = 'firstName',
      sortOrder = 'asc',
      status,
      approved,
      newsletter,
      country
    } = req.query;

    // Build filter based on search query and filters
    const filter: any = {};
    
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { passport: searchRegex },
        { trnNumber: searchRegex },
        { address: searchRegex },
        { country: searchRegex }
      ];
    }

    // Add status filters
    if (status !== undefined) {
      filter.status = status === 'true';
    }
    if (approved !== undefined) {
      filter.approved = approved === 'true';
    }
    if (newsletter !== undefined) {
      filter.newsletter = newsletter === 'true';
    }
    if (country) {
      filter.country = new RegExp(String(country), 'i');
    }

    // Build sort object
    const sort: any = {};
    sort[String(sortBy)] = sortOrder === 'desc' ? -1 : 1;

    // Execute query without pagination
    const customers = await Customer.find(filter).sort(sort);

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching customers",
      error: error.message,
    });
  }
};

// Get customer statistics
export const getCustomerStats = async (req: Request, res: Response): Promise<any> => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const activeCustomers = await Customer.countDocuments({ status: true });
    const approvedCustomers = await Customer.countDocuments({ approved: true });
    const newsletterSubscribers = await Customer.countDocuments({ newsletter: true });
    const customersWithEmail = await Customer.countDocuments({ email: { $exists: true, $ne: "" } });
    const customersWithPhone = await Customer.countDocuments({ phone: { $exists: true, $ne: "" } });
    const customersWithPassport = await Customer.countDocuments({ passport: { $exists: true, $ne: "" } });
    
    // Get country distribution
    const countryStats = await Customer.aggregate([
      { $match: { country: { $exists: true, $ne: "" } } },
      { $group: { _id: "$country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        activeCustomers,
        approvedCustomers,
        newsletterSubscribers,
        customersWithEmail,
        customersWithPhone,
        customersWithPassport,
        activePercentage: totalCustomers > 0 ? ((activeCustomers / totalCustomers) * 100).toFixed(2) : 0,
        approvedPercentage: totalCustomers > 0 ? ((approvedCustomers / totalCustomers) * 100).toFixed(2) : 0,
        newsletterPercentage: totalCustomers > 0 ? ((newsletterSubscribers / totalCustomers) * 100).toFixed(2) : 0,
        emailPercentage: totalCustomers > 0 ? ((customersWithEmail / totalCustomers) * 100).toFixed(2) : 0,
        phonePercentage: totalCustomers > 0 ? ((customersWithPhone / totalCustomers) * 100).toFixed(2) : 0,
        passportPercentage: totalCustomers > 0 ? ((customersWithPassport / totalCustomers) * 100).toFixed(2) : 0,
        topCountries: countryStats
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching customer statistics",
      error: error.message,
    });
  }
};

// Get customers by country
export const getCustomersByCountry = async (req: Request, res: Response): Promise<any> => {
  try {
    const { country } = req.params;
    
    if (!country) {
      return res.status(400).json({
        success: false,
        message: "Country is required",
      });
    }

    const customers = await Customer.find({
      country: new RegExp(country, 'i')
    }).sort({ firstName: 1, lastName: 1 });

    res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error fetching customers by country",
      error: error.message,
    });
  }
};

// Bulk update customer status
export const bulkUpdateCustomerStatus = async (req: Request, res: Response): Promise<any> => {
  try {
    const { customerIds, status, approved, newsletter } = req.body;
    
    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer IDs array is required",
      });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (approved !== undefined) updateData.approved = approved;
    if (newsletter !== undefined) updateData.newsletter = newsletter;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field to update is required",
      });
    }

    const result = await Customer.updateMany(
      { _id: { $in: customerIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} customers updated successfully`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Error updating customers",
      error: error.message,
    });
  }
};