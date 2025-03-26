import { Request, Response } from 'express';
import { Activity, IActivity, ActivityCategory } from '../models/Activity';
import { HolidayPackage, IHolidayPackage, PackageType } from '../models/HolidayPackage';





// export const globalSearch= async (req: Request, res: Response): Promise<any>  => {
//     try {
//       const { query, page = 1, limit = 10 } = req.query;

//       // If no query provided, return empty result
//       if (!query) {
//         return res.json({ 
//           activities: [], 
//           holidayPackages: [],
//           totalResults: 0 
//         });
//       }

//       const searchRegex = new RegExp(query as string, 'i');

//       // Parallel searches across activities and holiday packages
//       const [activities, holidayPackages] = await Promise.all([
//         Activity.find({ 
//           $or: [
//             { name: searchRegex },
//             { description: searchRegex },
//             { category: searchRegex }
//           ]
//         })
//         .populate('city').populate('city.activities')
//         .limit(Number(limit))
//         .skip((Number(page) - 1) * Number(limit)),

//         HolidayPackage.find({
//           $or: [
//             { name: searchRegex },
//             { description: searchRegex },
//             { type: searchRegex }
//           ]
//         })
//         .populate('destination')
//         .limit(Number(limit))
//         .skip((Number(page) - 1) * Number(limit))
//       ]);

//       res.json({
//         activities,
//         holidayPackages,
//         totalResults: activities.length + holidayPackages.length
//       });
//     } catch (error) {
//       res.status(500).json({ 
//         message: 'Error in global search', 
//         error: error instanceof Error ? error.message : 'Unknown error' 
//       });
//     }
//   }
export const globalSearch = async (req: Request, res: Response): Promise<any> => {
    try {
      const { query, page = 1, limit = 10 } = req.query;
      
      // If no query provided, return empty result
      if (!query) {
        return res.json({
          activities: [],
          holidayPackages: [],
          totalResults: 0
        });
      }
      
      const searchRegex = new RegExp(query as string, 'i');
      
      // Parallel searches across activities and holiday packages
      const [activities, holidayPackages] = await Promise.all([
        Activity.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { category: searchRegex }
          ]
        })
        .populate({
          path: 'city',
          populate: [
            { path: 'country' }, // Populate country details
            { 
              path: 'activities',
            //   select: '_id name' // Optionally select specific fields for activities
            }
          ]
        })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit)),
        
        HolidayPackage.find({
          $or: [
            { name: searchRegex },
            { description: searchRegex },
            { type: searchRegex }
          ]
        })
        .populate({
          path: 'destination',
          populate: [
            { path: 'country' }, // Populate country details
            { 
              path: 'activities', 
            //   select: '_id name' // Optionally select specific fields for activities
            }
          ]
        })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
      ]);
      
      res.json({
        activities,
        holidayPackages,
        totalResults: activities.length + holidayPackages.length
      });
    } catch (error) {
      res.status(500).json({
        message: 'Error in global search',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }