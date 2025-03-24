import { Request, Response } from "express";
import { Cart } from "../models/Cart";
import { Activity } from "../models/Activity";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// Helper function to create session ID if not present
const getOrCreateSessionId = (req: Request): string => {
  if (!req.query.sessionid) {
    const sessionId = uuidv4();
    req.query.sessionid = sessionId;
    return sessionId;
  }
  return req.query.sessionid as string;
};

// Get cart by session ID
export const getCart = async (req: Request, res: Response) => {
  try {
    const sessionId = getOrCreateSessionId(req);

    // Find or create cart for the session
    let cart = await Cart.findOne({ sessionId });
    
    if (!cart) {
      cart = new Cart({
        sessionId,
        items: [],
        totalAmount: 0
      });
      await cart.save();
    }

    // Populate activity details for each item
    const populatedCart = await Cart.findOne({ sessionId })
      .populate({
        path: 'items.activityId',
        model: 'Activity',
        select: 'name images duration category'
      });

    res.status(200).json({
      success: true,
      data: populatedCart,
      sessionId
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response): Promise<any> => {
  try {
    const sessionId = getOrCreateSessionId(req);
    const { activityId, numberOfAdults, numberOfChildren, bookingDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(activityId)) {
      return res.status(400).json({ success: false, message: "Invalid activity ID format" });
    }

    if (!numberOfAdults || numberOfAdults < 1) {
      return res.status(400).json({ success: false, message: "At least one adult is required" });
    }

    if (!bookingDate) {
      return res.status(400).json({ success: false, message: "Booking date is required" });
    }

    // Check if activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ success: false, message: "Activity not found" });
    }

    // Calculate prices
    const pricePerAdult = activity.discountPrice || activity.originalPrice;
    const pricePerChild = (activity.discountPrice || activity.originalPrice) * 0.7; // Assume 30% discount for children
    const totalPrice = (numberOfAdults * pricePerAdult) + (numberOfChildren * pricePerChild);

    // Find or create cart
    let cart = await Cart.findOne({ sessionId });
    
    if (!cart) {
      cart = new Cart({
        sessionId,
        items: [],
        totalAmount: 0
      });
    }

    // Check if same activity with same date exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.activityId.toString() === activityId && 
      new Date(item.bookingDate).toDateString() === new Date(bookingDate).toDateString()
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      cart.items[existingItemIndex].numberOfAdults = numberOfAdults;
      cart.items[existingItemIndex].numberOfChildren = numberOfChildren || 0;
      cart.items[existingItemIndex].totalPrice = totalPrice;
    } else {
      // Add new item
      cart.items.push({
        activityId: new mongoose.Types.ObjectId(activityId),
        numberOfAdults,
        numberOfChildren: numberOfChildren || 0,
        bookingDate: new Date(bookingDate),
        pricePerAdult,
        pricePerChild,
        totalPrice
      });
    }

    // Recalculate total amount
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.updatedAt = new Date();

    await cart.save();

    // Populate activity details for response
    const populatedCart = await Cart.findOne({ sessionId })
      .populate({
        path: 'items.activityId',
        model: 'Activity',
        select: 'name images duration category'
      });

    res.status(200).json({
      success: true,
      data: populatedCart,
      message: "Item added to cart successfully",
      sessionId
    });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) : Promise<any>=> {
  try {
    const sessionId = getOrCreateSessionId(req);
    const { itemId } = req.params;

    // Find cart
    const cart = await Cart.findOne({ sessionId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // Find item index
    const itemIndex = cart.items.findIndex(item => item.activityId._id.toString() === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart" });
    }

    // Remove item
    cart.items.splice(itemIndex, 1);
    
    // Recalculate total amount
    cart.totalAmount = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
    cart.updatedAt = new Date();

    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      message: "Item removed from cart successfully"
    });
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};

// Clear cart
export const clearCart = async (req: Request, res: Response): Promise<any> => {
  try {
    const sessionId = getOrCreateSessionId(req);

    // Find cart
    const cart = await Cart.findOne({ sessionId });
    
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found" });
    }

    // Clear items and reset total
    cart.items = [];
    cart.totalAmount = 0;
    cart.updatedAt = new Date();

    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
      message: "Cart cleared successfully"
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ success: false, message: "Server error", error: (error as Error).message });
  }
};
