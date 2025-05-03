import { Request, Response } from 'express';
import { Enquiry, IEnquiry } from '../models/Enquiry';
import { HolidayPackage } from '../models/HolidayPackage';
import { Vehicle } from '../models/Vehicle';
import mongoose from 'mongoose';

// Fetch package price
export const getPackagePrice = async (req: Request, res: Response): Promise<any> => {
  try {
    const { packageId } = req.params;

    // Validate packageId
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: 'Invalid package ID' });
    }

    // Find the holiday package
    const holidayPackage = await HolidayPackage.findById(packageId);

    if (!holidayPackage) {
      return res.status(404).json({ 
        message: 'Package not found' 
      });
    }

    // Return the discounted price
    res.status(200).json({
      packageName: holidayPackage.name,
      originalPrice: holidayPackage.originalPrice,
      discountPrice: holidayPackage.discountPrice
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error fetching package price', 
      error: error.message 
    });
  }
};

// Create a new enquiry
// export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       // phoneCountryCode,
//       phoneNumber,
//       travelDate,
//       adults,
//       children,
//       childAge,
//       budget,
//       message,
//       packageId
//     } = req.body;

//     // Validate package
//     if (!mongoose.Types.ObjectId.isValid(packageId)) {
//       return res.status(400).json({ message: 'Invalid package ID' });
//     }

//     const packageExists = await HolidayPackage.findById(packageId);
//     if (!packageExists) {
//       return res.status(400).json({ 
//         message: 'Invalid package selected' 
//       });
//     }

//     // Determine budget (use package discounted price if not provided)
//     const finalBudget = budget || packageExists.discountPrice;

//     // Create new enquiry
//     const newEnquiry = new Enquiry({
//       firstName,
//       lastName,
//       email,
//       // phoneCountryCode,
//       phoneNumber,
//       travelDate: new Date(travelDate),
//       adults,
//       children,
//       childAge,
//       budget: finalBudget,
//       message,
//       packageId
//     });

//     // Save enquiry
//     const savedEnquiry = await newEnquiry.save();

//     res.status(201).json({
//       message: 'Enquiry submitted successfully',
//       enquiry: savedEnquiry
//     });
//   } catch (error: any) {
//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map((err: any) => err.message);
//       return res.status(400).json({ 
//         message: 'Validation Error', 
//         errors 
//       });
//     }

//     res.status(500).json({ 
//       message: 'Error creating enquiry', 
//       error: error.message 
//     });
//   }
// };


// export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const {
//       firstName,
//       lastName,
//       email,
//       // phoneCountryCode,
//       phoneNumber,
//       travelDate,
//       adults,
//       children,
//       childAges, // Changed from childAge to childAges (array)
//       budget,
//       message,
//       packageId
//     } = req.body;
    
//     // Validate package
//     if (!mongoose.Types.ObjectId.isValid(packageId)) {
//       return res.status(400).json({ message: 'Invalid package ID' });
//     }
    
//     const packageExists = await HolidayPackage.findById(packageId);
//     if (!packageExists) {
//       return res.status(400).json({
//         message: 'Invalid package selected'
//       });
//     }
    
//     // Determine budget (use package discounted price if not provided)
//     const finalBudget = budget || packageExists.discountPrice;
    
//     // Validate childAges if children are present
//     if (children > 0) {
//       // Check if childAges is provided and is an array
//       if (!childAges || !Array.isArray(childAges)) {
//         return res.status(400).json({
//           message: 'Child ages must be provided as an array when children are present'
//         });
//       }
      
//       // Check if the number of ages matches the number of children
//       if (childAges.length !== children) {
//         return res.status(400).json({
//           message: 'Number of child ages must match the number of children'
//         });
//       }
      
//       // Validate each age
//       for (const age of childAges) {
//         if (typeof age !== 'number' || age < 0 || age > 17) {
//           return res.status(400).json({
//             message: 'Each child age must be a number between 0 and 17'
//           });
//         }
//       }
//     }
    
//     // Create new enquiry
//     const newEnquiry = new Enquiry({
//       firstName,
//       lastName,
//       email,
//       // phoneCountryCode,
//       phoneNumber,
//       travelDate: new Date(travelDate),
//       adults,
//       children,
//       childAges: children > 0 ? childAges : undefined, // Only include if children present
//       budget: finalBudget,
//       message,
//       packageId
//     });
    
//     // Save enquiry
//     const savedEnquiry = await newEnquiry.save();
    
//     res.status(201).json({
//       message: 'Enquiry submitted successfully',
//       enquiry: savedEnquiry
//     });
//   } catch (error: any) {
//     // Handle validation errors
//     if (error.name === 'ValidationError') {
//       const errors = Object.values(error.errors).map((err: any) => err.message);
//       return res.status(400).json({
//         message: 'Validation Error',
//         errors
//       });
//     }
    
//     res.status(500).json({
//       message: 'Error creating enquiry',
//       error: error.message
//     });
//   }
// };




export const createEnquiry = async (req: Request, res: Response): Promise<any> => {
  try {
    const {
      firstName,
      lastName,
      email,
      // phoneCountryCode,
      phoneNumber,
      travelDate,
      budget,
      message,
      enquiryType
    } = req.body;
    
    // Base enquiry data common to both types
    const enquiryData: any = {
      firstName,
      lastName,
      email,
      // phoneCountryCode,
      phoneNumber,
      travelDate: new Date(travelDate),
      budget,
      message,
      enquiryType
    };
    
    // Handle based on enquiry type
    if (enquiryType === 'holidayPackage') {
      await handleHolidayPackageEnquiry(req, res, enquiryData);
    } else if (enquiryType === 'carService') {
      await handleCarServiceEnquiry(req, res, enquiryData);
    } else {
      return res.status(400).json({
        message: 'Invalid enquiry type. Must be "holidayPackage" or "carService"'
      });
    }
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        message: 'Validation Error',
        errors
      });
    }
    
    res.status(500).json({
      message: 'Error creating enquiry',
      error: error.message
    });
  }
};

// Handler for holiday package enquiries
const handleHolidayPackageEnquiry = async (req: Request, res: Response, enquiryData: any): Promise<any> => {
  const {
    adults,
    children,
    childAges,
    packageId,
    budget
  } = req.body;
  
  // Validate package
  if (!mongoose.Types.ObjectId.isValid(packageId)) {
    return res.status(400).json({ message: 'Invalid package ID' });
  }
  
  const packageExists = await HolidayPackage.findById(packageId);
  if (!packageExists) {
    return res.status(400).json({
      message: 'Invalid package selected'
    });
  }
  
  // Determine budget (use package discounted price if not provided)
  const finalBudget = budget || packageExists.discountPrice;
  
  // Validate childAges if children are present
  if (children > 0) {
    // Check if childAges is provided and is an array
    if (!childAges || !Array.isArray(childAges)) {
      return res.status(400).json({
        message: 'Child ages must be provided as an array when children are present'
      });
    }
    
    // Check if the number of ages matches the number of children
    if (childAges.length !== children) {
      return res.status(400).json({
        message: 'Number of child ages must match the number of children'
      });
    }
    
    // Validate each age
    for (const age of childAges) {
      if (typeof age !== 'number' || age < 0 || age > 17) {
        return res.status(400).json({
          message: 'Each child age must be a number between 0 and 17'
        });
      }
    }
  }
  
  // Add holiday package specific fields
  enquiryData.adults = adults;
  enquiryData.children = children || 0;
  enquiryData.childAges = children > 0 ? childAges : undefined;
  enquiryData.packageId = packageId;
  enquiryData.budget = finalBudget;
  
  // Create and save enquiry
  const newEnquiry = new Enquiry(enquiryData);
  const savedEnquiry = await newEnquiry.save();
  
  res.status(201).json({
    message: 'Holiday package enquiry submitted successfully',
    enquiry: savedEnquiry
  });
};

// Handler for car service enquiries
const handleCarServiceEnquiry = async (req: Request, res: Response, enquiryData: any): Promise<any> => {
  const {
    pickupLocation,
    dropoffLocation,
    numberOfGuests,
    numberOfLuggageBags,
    vehicleId,
    budget
  } = req.body;
  


  
  // Validate vehicle
  if (!mongoose.Types.ObjectId.isValid(vehicleId)) {
    return res.status(400).json({ message: 'Invalid vehicle ID' });
  }
  
  const vehicleExists = await Vehicle.findById(vehicleId);
  if (!vehicleExists) {
    return res.status(400).json({
      message: 'Invalid vehicle selected'
    });
  }
  const finalBudget = budget || vehicleExists.ratePerKm;

  if (!vehicleExists.isAvailable) {
    return res.status(400).json({
      message: 'Selected vehicle is not currently available'
    });
  }
  
  // Validate required fields
  if (!pickupLocation || !dropoffLocation) {
    return res.status(400).json({
      message: 'Pickup location and dropoff location are required'
    });
  }
  
  if (!numberOfGuests || numberOfGuests < 1) {
    return res.status(400).json({
      message: 'Number of guests must be at least 1'
    });
  }
  
  // Add car service specific fields
  enquiryData.pickupLocation = pickupLocation;
  enquiryData.dropoffLocation = dropoffLocation;
  enquiryData.numberOfGuests = numberOfGuests;
  enquiryData.numberOfLuggageBags = numberOfLuggageBags || 0;
  enquiryData.vehicleId = vehicleId;
  enquiryData.budget = finalBudget;
  
  // Create and save enquiry
  const newEnquiry = new Enquiry(enquiryData);
  const savedEnquiry = await newEnquiry.save();
  
  res.status(201).json({
    message: 'Car service enquiry submitted successfully',
    enquiry: savedEnquiry
  });
};



// Get all enquiries
export const getAllEnquiries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('packageId', 'name destination')
      .populate('vehicleId', 'vehicleModel ratePerKm');

    const total = await Enquiry.countDocuments();

    res.status(200).json({
      enquiries,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalEnquiries: total
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error fetching enquiries', 
      error: error.message 
    });
  }
};

export const getAllEnquirieswithpagination = async (req: Request, res: Response) => {
  try {
    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 })
      .populate('packageId', 'name destination');

    const total = enquiries.length;

    res.status(200).json({
      enquiries,
      totalEnquiries: total
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error fetching enquiries', 
      error: error.message 
    });
  }
};

// Update enquiry status
export const updateEnquiryStatus = async (req: Request, res: Response) : Promise<any>=> {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'Contacted', 'Booked', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status' 
      });
    }

    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true, runValidators: true }
    );

    if (!updatedEnquiry) {
      return res.status(404).json({ 
        message: 'Enquiry not found' 
      });
    }

    res.status(200).json({
      message: 'Enquiry status updated successfully',
      enquiry: updatedEnquiry
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Error updating enquiry', 
      error: error.message 
    });
  }
};