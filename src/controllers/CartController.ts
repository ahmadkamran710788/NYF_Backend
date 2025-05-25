import { Request, Response } from 'express';
import { Cart, ICartItem } from '../models/Cart';
import { Deal } from '../models/Deal';
import { Activity } from '../models/Activity';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Booking, BookingStatus } from '../models/Booking';
import Stripe from 'stripe';
import dotenv from "dotenv";
import {sendEmailOfBookNotification} from '../utils/EmailHelper'
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_51RRPYdQOenfjOskFL99L99A8JXnhiCi1rs5kytJos6UR8oc2XzaEq6mIsiH4zoTmyhmvrCGkEz1niezeit9MZlnI00nW5R4x0L');

// Helper function for error handling
const handleError = (res: Response, error: unknown, message: string = 'An error occurred') => {
  console.error(message, error);
  res.status(500).json({ 
    message, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  });
};

// Session management helper
const getOrCreateSessionId = (req: Request): string => {
  if (!req.query.sessionid) {
    const sessionId = uuidv4();
    req.query.sessionid = sessionId;
    return sessionId;
  }
  return req.query.sessionid as string;
};

// Validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => mongoose.Types.ObjectId.isValid(id);

/**
 * Generate unique booking reference
 * @returns Unique booking reference string
 */
const generateBookingReference = (): string => {
  return `BOOK-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
};

/**
 * Create or retrieve a cart
 * @param req Express request object
 * @param res Express response object
 */
export const getOrCreateCart = async (req: Request, res: Response): Promise<any> => {
  try {
    const sessionId = getOrCreateSessionId(req);
    let { cartId } = req.params;

    // Default to sessionId if no cartId is provided
    cartId = cartId || sessionId;

    const cart = await Cart.findOne({ cartId })
      .populate('items.activity', 'name category images')
      .populate('items.deal', 'title description');

    if (!cart) {
      const newCart = new Cart({
        cartId,
        items: [],
        totalAmount: 0,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      await newCart.save();

      return res.status(201).json({
        message: 'New cart created',
        cart: newCart,
        sessionId,
      });
    }

    res.status(200).json({
      message: 'Cart retrieved successfully',
      cart,
      sessionId,
    });

  } catch (error) {
    handleError(res, error, 'Error retrieving cart');
  }
};

/**
 * Add item to cart
 * @param req Express request object
 * @param res Express response object
 */
export const addItemToCart = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get cart ID (from params or session)
    let { cartId } = req.params;
    if (!cartId) {
      cartId = getOrCreateSessionId(req);
    }

    const { activity, deal, bookingDate, numberOfAdults, numberOfChildren } = req.body;

    // Validate input
    if (!cartId || !activity || !deal || !bookingDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!isValidObjectId(activity) || !isValidObjectId(deal)) {
      return res.status(400).json({ message: 'Invalid activity or deal ID' });
    }

    const parsedDate = new Date(bookingDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    // Find cart, activity, and deal
    const [cart, activityDoc, dealDoc] = await Promise.all([
      Cart.findOne({ cartId }),
      Activity.findById(activity),
      Deal.findById(deal)
    ]);

    // Check if entities exist
    if (!activityDoc) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (!dealDoc) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Pricing logic
    const pricing = dealDoc.pricing
      .filter(p => p.date <= parsedDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

    if (!pricing) {
      return res.status(400).json({ message: 'No pricing available for the selected date' });
    }

    const adultPrice = pricing.adultPrice;
    const childPrice = pricing.childPrice;
    const subtotal = (numberOfAdults * adultPrice) + (numberOfChildren * childPrice);

    // Create the cart item
    const newItem: ICartItem = {
      activity: new mongoose.Types.ObjectId(activity),
      deal: new mongoose.Types.ObjectId(deal),
      bookingDate: parsedDate,
      numberOfAdults,
      numberOfChildren,
      adultPrice,
      childPrice,
      subtotal
    };

    // If cart doesn't exist, create a new one and add the item
    if (!cart) {
      const newCart = new Cart({
        cartId,
        items: [newItem],
        totalAmount: subtotal,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
      await newCart.save();

      // Return the newly created cart with the added item
      const savedCart = await Cart.findOne({ cartId })
        .populate('items.activity', 'name category images')
        .populate('items.deal', 'title description');

      return res.status(200).json({
        message: 'Cart not found, created new cart with item',
        cart: savedCart,
        sessionId: req.query.sessionid
      });
    }

    // Otherwise, add the item to the existing cart
    const existingItemIndex = cart.items.findIndex(item =>
      item.activity.equals(activity) &&
      item.deal.equals(deal) &&
      item.bookingDate.toISOString().split('T')[0] === parsedDate.toISOString().split('T')[0]
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      cart.items[existingItemIndex] = newItem;
    } else {
      // Add new item to the cart
      cart.items.push(newItem);
    }

    // Update the total amount
    cart.totalAmount += subtotal;

    // Reset expiry and save cart
    cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await cart.save();

    // Populate and return updated cart
    const updatedCart = await Cart.findOne({ cartId })
      .populate('items.activity', 'name category images')
      .populate('items.deal', 'title description');

    res.status(200).json({
      message: 'Item added to cart successfully',
      cart: updatedCart,
      sessionId: req.query.sessionid
    });

  } catch (error) {
    console.error(error);
    handleError(res, error, 'Error adding item to cart');
  }
};



/**
 * Remove item from cart
 * @param req Express request object
 * @param res Express response object
 */
export const removeItemFromCart = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get cart ID (from params or session)
    let { cartId, itemIndex } = req.params;
    if (!cartId) {
      cartId = getOrCreateSessionId(req);
    }
    
    const index = parseInt(itemIndex, 10);
    
    // Validate index
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ 
        message: 'Invalid item index' 
      });
    }
    
    // Find cart
    const cart = await Cart.findOne({ cartId });
    
    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart not found' 
      });
    }
    
    // Check if item exists
    if (index >= cart.items.length) {
      return res.status(404).json({ 
        message: 'Item not found in cart' 
      });
    }
    
    // Remove item
    cart.items.splice(index, 1);
    
    // Reset expiry and save cart
    cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await cart.save();
    
    // Populate and return updated cart
    const updatedCart = await Cart.findOne({ cartId })
      .populate('items.activity', 'name category images')
      .populate('items.deal', 'title description');
    
    res.status(200).json({
      message: 'Item removed from cart successfully',
      cart: updatedCart,
      sessionId: req.query.sessionid
    });
    
  } catch (error) {
    handleError(res, error, 'Error removing item from cart');
  }
};

/**
 * Update cart item
 * @param req Express request object
 * @param res Express response object
 */
export const updateCartItem = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get cart ID (from params or session)
    let { cartId, itemIndex } = req.params;
    if (!cartId) {
      cartId = getOrCreateSessionId(req);
    }
    
    const { numberOfAdults, numberOfChildren } = req.body;
    const index = parseInt(itemIndex, 10);
    
    // Validate index
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ 
        message: 'Invalid item index' 
      });
    }
    
    // Find cart
    const cart = await Cart.findOne({ cartId });
    
    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart not found' 
      });
    }
    
    // Check if item exists
    if (index >= cart.items.length) {
      return res.status(404).json({ 
        message: 'Item not found in cart' 
      });
    }
    
    // Update quantities
    if (typeof numberOfAdults === 'number' && numberOfAdults >= 0) {
      cart.items[index].numberOfAdults = numberOfAdults;
    }
    
    if (typeof numberOfChildren === 'number' && numberOfChildren >= 0) {
      cart.items[index].numberOfChildren = numberOfChildren;
    }
    
    // Recalculate subtotal
    cart.items[index].subtotal = 
      (cart.items[index].numberOfAdults * cart.items[index].adultPrice) + 
      (cart.items[index].numberOfChildren * cart.items[index].childPrice);
    
    // Reset expiry and save cart
    cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await cart.save();
    
    // Populate and return updated cart
    const updatedCart = await Cart.findOne({ cartId })
      .populate('items.activity', 'name category images')
      .populate('items.deal', 'title description');
    
    res.status(200).json({
      message: 'Cart item updated successfully',
      cart: updatedCart,
      sessionId: req.query.sessionid
    });
    
  } catch (error) {
    handleError(res, error, 'Error updating cart item');
  }
};

/**
 * Clear cart
 * @param req Express request object
 * @param res Express response object
 */
export const clearCart = async (req: Request, res: Response): Promise<any> => {
  try {
    // Get cart ID (from params or session)
    let { cartId } = req.params;
    if (!cartId) {
      cartId = getOrCreateSessionId(req);
    }
    
    // Find cart
    const cart = await Cart.findOne({ cartId });
    
    if (!cart) {
      return res.status(404).json({ 
        message: 'Cart not found' 
      });
    }
    
    // Clear items
    cart.items = [];
    
    // Reset expiry and save cart
    cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await cart.save();
    
    res.status(200).json({
      message: 'Cart cleared successfully',
      cart,
      sessionId: req.query.sessionid
    });
    
  } catch (error) {
    handleError(res, error, 'Error clearing cart');
  }
};

/**
 * Checkout cart and create bookings
 * @param req Express request object
 * @param res Express response object
 */
// export const checkoutCart = async (req: Request, res: Response): Promise<any> => {
//   const session = await mongoose.startSession();
  
//   try {
//     // Start transaction
//     session.startTransaction();
    
//     // Get cart ID (from params or session)
//     let { cartId } = req.params;
//     if (!cartId) {
//       cartId = getOrCreateSessionId(req);
//     }
    
//     const { email, phoneNumber } = req.body;
    
//     // Validate required fields
//     if (!email || !phoneNumber) {
//       return res.status(400).json({ 
//         message: 'Email and phone number are required' 
//       });
//     }
    
//     // Validate email format
//     const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({ 
//         message: 'Invalid email format' 
//       });
//     }
    
//     // Validate phone number
//     const phoneRegex = /^\+?[1-9]\d{1,14}$/;
//     if (!phoneRegex.test(phoneNumber)) {
//       return res.status(400).json({ 
//         message: 'Invalid phone number format' 
//       });
//     }
    
//     // Find cart
//     const cart = await Cart.findOne({ cartId }).session(session);
    
//     if (!cart) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({ 
//         message: 'Cart not found' 
//       });
//     }
    
//     // Check if cart is empty
//     if (cart.items.length === 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({ 
//         message: 'Cart is empty' 
//       });
//     }
    
//     // Create bookings for each cart item
//     const bookings = [];
    
//     for (const item of cart.items) {
//       const booking = new Booking({
//         activity: item.activity,
//         deal: item.deal,
//         bookingDate: item.bookingDate,
//         numberOfAdults: item.numberOfAdults,
//         numberOfChildren: item.numberOfChildren,
//         totalPrice: item.subtotal,
//         email,
//         phoneNumber,
//         bookingReference: generateBookingReference(),
//         status: BookingStatus.COMPLETED
//       });
      
//       await booking.save({ session });
//       bookings.push(booking);
//     }
    
//     // Clear the cart
//     cart.items = [];
//     await cart.save({ session });
    
//     // Commit transaction
//     await session.commitTransaction();
    
//     res.status(201).json({
//       message: 'Checkout successful',
//       bookings,
//       totalBookings: bookings.length,
//       sessionId: req.query.sessionid
//     });
    
//   } catch (error) {
//     // Abort transaction on error
//     await session.abortTransaction();
//     handleError(res, error, 'Error during checkout');
//   } finally {
//     // End session
//     session.endSession();
//   }
// };
//this one is working
// export const checkoutCart = async (req: Request, res: Response): Promise<any> => {
//   const session = await mongoose.startSession();
     
//   try {
//     // Start transaction
//     session.startTransaction();
        
//     // Get cart ID (from params or session)
//     let { cartId } = req.params;
//     if (!cartId) {
//       cartId = getOrCreateSessionId(req);
//     }
        
//     const { email, phoneNumber } = req.body;
        
//     // Validate required fields
//     if (!email || !phoneNumber) {
//       return res.status(400).json({
//         message: 'Email and phone number are required'
//       });
//     }
        
//     // Validate email format
//     const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
//     if (!emailRegex.test(email)) {
//       return res.status(400).json({
//         message: 'Invalid email format'
//       });
//     }
        
//     // Validate phone number
//     const phoneRegex = /^\+?[1-9]\d{1,14}$/;
//     if (!phoneRegex.test(phoneNumber)) {
//       return res.status(400).json({
//         message: 'Invalid phone number format'
//       });
//     }
        
//     // Find cart and populate activity data
//     const cart = await Cart.findOne({ cartId })
//       .populate('items.activity', 'name')
//       .populate('items.deal', 'title')
//       .session(session);
        
//     if (!cart) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(404).json({
//         message: 'Cart not found'
//       });
//     }
        
//     // Check if cart is empty
//     if (cart.items.length === 0) {
//       await session.abortTransaction();
//       session.endSession();
//       return res.status(400).json({
//         message: 'Cart is empty'
//       });
//     }

//     // Create single booking for the entire cart
   
        
//     const booking = new Booking({
//       cart: cart._id, // Reference to the cart
//       totalPrice: cart.totalAmount,
//       email,
//       phoneNumber,
//       bookingReference: generateBookingReference(),
//       status: BookingStatus.PENDING
//     });
            
//     await booking.save({ session });
   

//     // Create Stripe checkout session
//     const stripeSession = await stripe.checkout.sessions.create({
//       line_items: cart.items.map(item => ({
//         price_data: {
//           currency: 'usd',
//           product_data: {
//             name: `${(item.activity as any).name}`,
//             description: `Booking Date: ${item.bookingDate.toDateString()}, Adults: ${item.numberOfAdults}, Children: ${item.numberOfChildren}`
//           },
//           unit_amount: Math.round(item.subtotal * 100) // Convert to cents
//         },
//         quantity: 1
//       })),
//       mode: 'payment',
//       shipping_address_collection: {
//         allowed_countries: ['US', 'BR']
//       },
//       success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}&cart_id=${cartId}`,
//       cancel_url: `${process.env.BASE_URL}/cancel?cart_id=${cartId}`,
//       metadata: {
//         cartId: cartId,
//         email: email,
//         phoneNumber: phoneNumber,
//       }
//     });
        
//     // DON'T clear the cart here - do it after successful payment
//     // The cart should be cleared in the success webhook or completion handler
//     // cart.items = [];
//     // await cart.save({ session });
        
//     // Commit transaction
//     await session.commitTransaction();
        
//     res.status(201).json({
//       message: 'Checkout initiated successfully',
//       booking:booking,
//       totalAmount: cart.totalAmount,
//       sessionId: req.query.sessionid,
//       stripeSessionUrl: stripeSession.url,
//       cartId: cartId
//     });
      
//   } catch (error) {
//     // Abort transaction on error
//     await session.abortTransaction();
//     handleError(res, error, 'Error during checkout');
//   } finally {
//     // End session
//     session.endSession();
//   }
// };
export const checkoutCart = async (req: Request, res: Response): Promise<any> => {
  const session = await mongoose.startSession();
  
  try {
    // Start transaction
    session.startTransaction();
    
    // Get cart ID (from params or session)
    let { cartId } = req.params;
    if (!cartId) {
      cartId = getOrCreateSessionId(req);
    }
    
    const { email, phoneNumber } = req.body;
    
    // Validate required fields
    if (!email || !phoneNumber) {
      return res.status(400).json({
        message: 'Email and phone number are required'
      });
    }
    
    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Invalid email format'
      });
    }
    
    // Validate phone number
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        message: 'Invalid phone number format'
      });
    }
    
    // Find cart and populate activity data
    const cart = await Cart.findOne({ cartId })
      .populate('items.activity', 'name')
      .populate('items.deal', 'title')
      .session(session);
    
    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        message: 'Cart not found'
      });
    }
    
    // Check if cart is empty
    if (cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: 'Cart is empty'
      });
    }

    // Create booking items from cart items
    const bookingItems = cart.items.map(item => ({
      activity: item.activity._id,
      deal: item.deal._id,
      bookingDate: item.bookingDate,
      numberOfAdults: item.numberOfAdults,
      numberOfChildren: item.numberOfChildren,
      adultPrice: item.adultPrice,
      childPrice: item.childPrice,
      subtotal: item.subtotal,
      // Store activity and deal names for easy reference
      activityName: (item.activity as any).name,
      dealTitle: (item.deal as any).title
    }));

    // Create single booking for the entire cart
    const booking = new Booking({
      cart: cart._id, // Reference to the cart
      items: bookingItems, // Store cart items in booking
      totalPrice: cart.totalAmount,
      email,
      phoneNumber,
      bookingReference: generateBookingReference(),
      status: BookingStatus.PENDING
    });
    
    await booking.save({ session });
    
    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      line_items: cart.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${(item.activity as any).name}`,
            description: `Booking Date: ${item.bookingDate.toDateString()}, Adults: ${item.numberOfAdults}, Children: ${item.numberOfChildren}`
          },
          unit_amount: Math.round(item.subtotal * 100) // Convert to cents
        },
        quantity: 1
      })),
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['US', 'BR']
      },
      success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}&cart_id=${cartId}`,
      cancel_url: `${process.env.BASE_URL}/cancel?cart_id=${cartId}`,
      metadata: {
        cartId: cartId,
        email: email,
        phoneNumber: phoneNumber,
      }
    });
    
    // DON'T clear the cart here - do it after successful payment
    // The cart should be cleared in the success webhook or completion handler
    // cart.items = [];
    // await cart.save({ session });
    
    // Commit transaction
    await session.commitTransaction();
    
    res.status(201).json({
      message: 'Checkout initiated successfully',
      booking: booking,
      totalAmount: cart.totalAmount,
      sessionId: req.query.sessionid,
      stripeSessionUrl: stripeSession.url,
      cartId: cartId
    });
    
  } catch (error) {
    // Abort transaction on error
    await session.abortTransaction();
    handleError(res, error, 'Error during checkout');
  } finally {
    // End session
    session.endSession();
  }
};

// Additional handlers for Stripe completion and cancellation
// export const completeCheckout = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const result = await Promise.all([
//       stripe.checkout.sessions.retrieve(req.query.session_id as string, { 
//         expand: ['payment_intent.payment_method'] 
//       }),
//       stripe.checkout.sessions.listLineItems(req.query.session_id as string)
//     ]);

//     console.log(JSON.stringify(result));


//     res.send('Your payment was successful');
//   } catch (error) {
//     handleError(res, error, 'Error completing checkout');
//   }
// };
// export const completeCheckout = async (req: Request, res: Response): Promise<any> => {
//   try {
//     const sessionId = req.query.session_id as string;
//     const cartId = req.query.cart_id as string;

//     // Retrieve Stripe session details
//     const result = await Promise.all([
//       stripe.checkout.sessions.retrieve(sessionId, { 
//         expand: ['payment_intent.payment_method'] 
//       }),
//       stripe.checkout.sessions.listLineItems(sessionId)
//     ]);

//     console.log(JSON.stringify(result));

//     // Update booking status to COMPLETED
//     if (cartId) {
//       const stripeSession = result[0];
//       const { email, phoneNumber } = stripeSession.metadata || {};

//       if (email && phoneNumber) {
//         await Booking.updateMany(
//           { 
//             email, 
//             phoneNumber, 
//             status: BookingStatus.PENDING,
//             cart: cartId 
//           },
//           { 
//             status: BookingStatus.COMPLETED 
//           }
//         );
//       }
//     }

//     res.send('Your payment was successful and bookings have been confirmed!');

//   } catch (error) {
//     handleError(res, error, 'Error completing checkout');
//   }
// };

export const completeCheckout = async (req: Request, res: Response): Promise<any> => {
  try {
    const sessionId = req.query.session_id as string;
    const cartId = req.query.cart_id as string;

    if (!sessionId || !cartId) {
      return res.status(400).send('Missing session ID or cart ID');
    }

    // Retrieve Stripe session details
    const result = await Promise.all([
      stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent.payment_method']
      }),
      stripe.checkout.sessions.listLineItems(sessionId)
    ]);

    const stripeSession = result[0];
    console.log('Stripe session retrieved:', JSON.stringify(stripeSession, null, 2));

    // Verify payment was successful
    if (stripeSession.payment_status !== 'paid') {
      return res.status(400).send('Payment was not successful');
    }

    // Find the cart
    const cart = await Cart.findOne({ cartId });
    
    if (!cart) {
      return res.status(404).send('Cart not found');
    }

    // Update the single booking status to COMPLETED using cart reference
    const updateResult = await Booking.updateOne(
      {
        cart: cart._id,
        status: BookingStatus.PENDING
      },
      {
        status: BookingStatus.COMPLETED
      }
    );

    console.log(`Updated booking to COMPLETED status for cart ${cartId}`);

    // Clear the cart after successful payment
    cart.items = [];
    await cart.save();
    console.log(`Cleared cart ${cartId} after successful payment`);

    // Get the completed booking for confirmation
    const completedBooking = await Booking.findOne({
      cart: cart._id,
      status: BookingStatus.COMPLETED
    });

    // You might want to send confirmation emails here
    // await sendBookingConfirmationEmail(completedBooking);

    // res.status(200).json({
    //   message: 'Your payment was successful and booking has been confirmed!',
    //   paymentStatus: stripeSession.payment_status,
    //   booking: {
    //     bookingReference: completedBooking?.bookingReference,
    //     totalPrice: completedBooking?.totalPrice,
    //     status: completedBooking?.status,
    //     email: completedBooking?.email,
    //     phoneNumber: completedBooking?.phoneNumber
    //   }
    // });
     await sendEmailOfBookNotification(completedBooking,stripeSession);
     res.redirect(`${process.env.REDIRCT_URL_SUCCESS}`);

  } catch (error) {
    console.error('Error completing checkout:', error);
    handleError(res, error, 'Error completing checkout');
  }
};
export const cancelCheckout = async (req: Request, res: Response): Promise<any> => {
  try {
    const cartId = req.query.cart_id as string;
    const sessionId = req.query.session_id as string;
    console.log(sessionId, "session id for cancellation");
    console.log(cartId,"cart id for cancellation");

    // Cancel the Stripe session if session_id is provided
    if (sessionId) {
      try {
        await stripe.checkout.sessions.expire(sessionId);
        console.log(`Stripe session ${sessionId} has been cancelled`);
      } catch (stripeError) {
        console.error('Error cancelling Stripe session:', stripeError);
        // Continue execution even if Stripe cancellation fails
      }
    }

    // Update booking status to REJECTED for cancelled checkout
    if (cartId) {
      try {
        // Find the cart first
        const cart = await Cart.findOne({ cartId });
        
        if (cart) {
          // Update the single booking that references this cart
          const updateResult = await Booking.updateOne(
            {
              cart: cart._id,
              status: BookingStatus.PENDING
            },
            {
              status: BookingStatus.REJECTED
            }
          );
          
          console.log(`Updated booking to REJECTED status for cart ${cartId}`);
          
          if (updateResult.modifiedCount === 0) {
            console.log(`No pending booking found for cart ${cartId}`);
          }
        } else {
          console.log(`Cart with ID ${cartId} not found`);
        }
      } catch (error) {
        console.error('Error updating booking for cart:', error);
      }
    }

    // Keep the cart items so user can modify and try again
    // Don't clear the cart on cancellation

    res.redirect(`${process.env.REDIRCT_URL_CANCEL}`);
  } catch (error) {
    console.error('Error in cancel checkout:', error);
    res.redirect('/?error=cancel_failed');
  }
};