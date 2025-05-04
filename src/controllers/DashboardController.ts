
// controllers/dashboardController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Booking } from '../models/Booking';
import { Enquiry } from '../models/Enquiry';
import { HolidayPackage } from '../models/HolidayPackage';
import { Vehicle } from '../models/Vehicle';

/**
 * Get summary statistics for the dashboard
 * @route GET /api/dashboard/summary
 * @access Private (Admin)
 */
export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    
    // Calculate date ranges
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 6); // Get 7 days including today
    
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 13);
    const lastWeekEnd = new Date(today);
    lastWeekEnd.setDate(today.getDate() - 7);
    
    const last12Months = new Date(today);
    last12Months.setMonth(today.getMonth() - 11);
    last12Months.setDate(1);
    
    // Calculate the start of each day for the past 7 days
    const dailyLabels = [];
    const dailyDates = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dailyLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
      dailyDates.push(new Date(date));
    }

    // Daily bookings (last 7 days)
    const dailyBookings = await Promise.all(
      dailyDates.map(async (startDate) => {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 1);
        
        return Booking.countDocuments({
          createdAt: { $gte: startDate, $lt: endDate }
        });
      })
    );

    // Last week's bookings
    const lastWeekBookingsCount = await Booking.countDocuments({
      createdAt: { $gte: lastWeekStart, $lt: lastWeekEnd }
    });

    // Monthly bookings (last 12 months)
    const monthlyBookings = [];
    const monthlyLabels = [];
    for (let i = 11; i >= 0; i--) {
      const startDate = new Date(today);
      startDate.setMonth(today.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      
      const count = await Booking.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      });
      
      monthlyBookings.push(count);
      monthlyLabels.push(startDate.toLocaleDateString('en-US', { month: 'short' }));
    }

    // Calculate yearly bookings (assuming last 12 months data)
    const yearlyBookings = [...monthlyBookings];

    // Total bookings
    const totalBookings = await Booking.countDocuments();

    // Calculate booking trend
    const previousPeriodBookings = await Booking.countDocuments({
      createdAt: { 
        $gte: new Date(today.setMonth(today.getMonth() - 2)),
        $lt: new Date(today.setMonth(today.getMonth() - 1))
      }
    });
    
    const currentPeriodBookings = await Booking.countDocuments({
      createdAt: { $gte: new Date(today.setMonth(today.getMonth() - 1)) }
    });
    
    const trend = currentPeriodBookings >= previousPeriodBookings ? "up" : "down";

    // Get recent bookings with activity and deal details
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('activity')
      .populate('deal')
      .lean();

    // Get total counts for other entities
    const totalEnquiries = await Enquiry.countDocuments();
    const totalPackages = await HolidayPackage.countDocuments();
    const totalVehicles = await Vehicle.countDocuments();

    res.status(200).json({
      bookings: {
        daily: dailyBookings,
        lastWeek: lastWeekBookingsCount,
        monthly: monthlyBookings,
        yearly: yearlyBookings,
        total: totalBookings,
        trend: trend
      },
      enquiries: {
        total: totalEnquiries
      },
      packages: {
        total: totalPackages
      },
      vehicles: {
        total: totalVehicles
      },
      recentBookings: recentBookings
    });
    
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};