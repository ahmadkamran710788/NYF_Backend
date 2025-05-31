import axios from "axios";
import { Cart, ICart, ICartItem } from "../models/Cart";
import { Activity } from "../models/Activity";
import { Deal } from "../models/Deal";

export interface ExchangeRates {
  [currency: string]: number;
}

export interface CleanedCartActivity {
  _id: string;
  name: string;
  category: string;
  images: string[];
}

export interface CleanedCartDeal {
  _id: string;
  title: string;
  description: string;
}

export interface CleanedCartItem {
  activity: CleanedCartActivity;
  deal: CleanedCartDeal;
  bookingDate: Date;
  numberOfAdults: number;
  numberOfChildren: number;
  adultPrice: number;
  childPrice: number;
  subtotal: number;
  baseCurrency: string;
}

export interface CleanedCart {
  _id: string;
  cartId: string;
  items: CleanedCartItem[];
  totalAmount: number;
  baseCurrency: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export interface CartCurrencyConversionResponse {
  success: boolean;
  data: CleanedCart;
  currencyInfo?: {
    sourceCurrency: string;
    targetCurrency: string;
    conversionRate: number;
    lastUpdated: Date;
  };
}

// In-memory cache for exchange rates
let exchangeRatesCache: ExchangeRates = {};
let lastUpdated: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fetch exchange rates from API
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    return response.data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Fallback rates
    return {
      USD: 1,
      EUR: 0.85,
      GBP: 0.73,
      AED: 3.67,
      SAR: 3.75,
      QAR: 3.64,
      KWD: 0.30,
      BHD: 0.38,
      OMR: 0.38,
      JPY: 110,
      INR: 74,
      CAD: 1.25,
      AUD: 1.35,
      CNY: 6.45,
      BRL: 5.66,
    };
  }
};

// Get current exchange rates (with caching)
export const getExchangeRates = async (): Promise<ExchangeRates> => {
  const now = new Date();
  
  if (!lastUpdated || (now.getTime() - lastUpdated.getTime()) > CACHE_DURATION) {
    exchangeRatesCache = await fetchExchangeRates();
    lastUpdated = now;
  }
  
  return exchangeRatesCache;
};

// Convert amount from USD to target currency
export const convertFromUSD = async (amount: number, targetCurrency: string): Promise<number> => {
  if (targetCurrency === 'USD') {
    return amount;
  }

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency.toUpperCase()];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${targetCurrency}`);
  }

  return Math.round((amount * rate) * 100) / 100;
};

// Convert amount from any currency to USD
export const convertToUSD = async (amount: number, fromCurrency: string): Promise<number> => {
  if (fromCurrency === 'USD') {
    return amount;
  }

  const rates = await getExchangeRates();
  const rate = rates[fromCurrency.toUpperCase()];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${fromCurrency}`);
  }

  return Math.round((amount / rate) * 100) / 100;
};

// Get conversion rate
export const getConversionRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rates = await getExchangeRates();
  
  if (fromCurrency === 'USD') {
    const rate = rates[toCurrency.toUpperCase()];
    if (!rate) throw new Error(`Rate not found for ${toCurrency}`);
    return rate;
  }
  
  if (toCurrency === 'USD') {
    const rate = rates[fromCurrency.toUpperCase()];
    if (!rate) throw new Error(`Rate not found for ${fromCurrency}`);
    return 1 / rate;
  }
  
  const fromRate = rates[fromCurrency.toUpperCase()];
  const toRate = rates[toCurrency.toUpperCase()];
  
  if (!fromRate || !toRate) {
    throw new Error(`Rate not found for ${fromCurrency} or ${toCurrency}`);
  }
  
  return toRate / fromRate;
};

// Clean cart item data
const cleanCartItem = (item: any, targetCurrency: string): CleanedCartItem => {
  return {
    activity: {
      _id: item.activity._id?.toString() || '',
      name: item.activity.name || '',
      category: item.activity.category || '',
      images: Array.isArray(item.activity.images) ? item.activity.images : [],
    },
    deal: {
      _id: item.deal._id?.toString() || '',
      title: item.deal.title || '',
      description: item.deal.description || '',
    },
    bookingDate: item.bookingDate,
    numberOfAdults: item.numberOfAdults || 0,
    numberOfChildren: item.numberOfChildren || 0,
    adultPrice: item.adultPrice || 0,
    childPrice: item.childPrice || 0,
    subtotal: item.subtotal || 0,
    baseCurrency: targetCurrency.toUpperCase(),
  };
};

// Convert a single cart item to target currency
const convertCartItemCurrency = async (
  item: any,
  sourceCurrency: string,
  targetCurrency: string
): Promise<CleanedCartItem> => {
  let convertedAdultPrice: number;
  let convertedChildPrice: number;
  let convertedSubtotal: number;

  if (sourceCurrency === targetCurrency) {
    convertedAdultPrice = item.adultPrice;
    convertedChildPrice = item.childPrice;
    convertedSubtotal = item.subtotal;
  } else {
    if (sourceCurrency === 'USD') {
      convertedAdultPrice = await convertFromUSD(item.adultPrice, targetCurrency);
      convertedChildPrice = await convertFromUSD(item.childPrice, targetCurrency);
      convertedSubtotal = await convertFromUSD(item.subtotal, targetCurrency);
    } else if (targetCurrency === 'USD') {
      convertedAdultPrice = await convertToUSD(item.adultPrice, sourceCurrency);
      convertedChildPrice = await convertToUSD(item.childPrice, sourceCurrency);
      convertedSubtotal = await convertToUSD(item.subtotal, sourceCurrency);
    } else {
      const adultPriceInUSD = await convertToUSD(item.adultPrice, sourceCurrency);
      const childPriceInUSD = await convertToUSD(item.childPrice, sourceCurrency);
      const subtotalInUSD = await convertToUSD(item.subtotal, sourceCurrency);
      
      convertedAdultPrice = await convertFromUSD(adultPriceInUSD, targetCurrency);
      convertedChildPrice = await convertFromUSD(childPriceInUSD, targetCurrency);
      convertedSubtotal = await convertFromUSD(subtotalInUSD, targetCurrency);
    }
  }

  return cleanCartItem(
    {
      ...item,
      adultPrice: convertedAdultPrice,
      childPrice: convertedChildPrice,
      subtotal: convertedSubtotal,
    },
    targetCurrency
  );
};

// Convert cart to target currency with cleaned response
export const convertCartWithCleanResponse = async (
  cart: any,
  targetCurrency: string,
  sourceCurrency: string = 'USD'
): Promise<CleanedCart> => {
  // Convert Mongoose document to plain object
  const cartObject = cart.toObject ? cart.toObject() : cart;

  let convertedTotalAmount: number;

  if (sourceCurrency === targetCurrency) {
    convertedTotalAmount = cartObject.totalAmount;
  } else {
    if (sourceCurrency === 'USD') {
      convertedTotalAmount = await convertFromUSD(cartObject.totalAmount, targetCurrency);
    } else if (targetCurrency === 'USD') {
      convertedTotalAmount = await convertToUSD(cartObject.totalAmount, sourceCurrency);
    } else {
      const totalAmountInUSD = await convertToUSD(cartObject.totalAmount, sourceCurrency);
      convertedTotalAmount = await convertFromUSD(totalAmountInUSD, targetCurrency);
    }
  }

  // Convert cart items
  const convertedItems: CleanedCartItem[] = await Promise.all(
    (cartObject.items || []).map(async (item: any) => {
      return await convertCartItemCurrency(item, sourceCurrency, targetCurrency);
    })
  );

  return {
    _id: cartObject._id?.toString() || '',
    cartId: cartObject.cartId || '',
    items: convertedItems,
    totalAmount: convertedTotalAmount,
    baseCurrency: targetCurrency.toUpperCase(),
    createdAt: cartObject.createdAt ? new Date(cartObject.createdAt) : new Date(),
    updatedAt: cartObject.updatedAt ? new Date(cartObject.updatedAt) : new Date(),
    expiresAt: cartObject.expiresAt ? new Date(cartObject.expiresAt) : new Date(),
  };
};

// Convert cart with currency conversion response
export const convertCartCurrency = async (
  cartId: string,
  targetCurrency: string = 'USD',
  sourceCurrency: string = 'USD'
): Promise<CartCurrencyConversionResponse> => {
  try {
    // Find cart and populate activity and deal data
    const cart = await Cart.findOne({ cartId })
      .populate('items.activity', 'name category images')
      .populate('items.deal', 'title description');

    if (!cart) {
      throw new Error('Cart not found');
    }

    // Get conversion rate for currency info
    const conversionRate = await getConversionRate(sourceCurrency, targetCurrency);
    
    // Convert cart
    const convertedCart = await convertCartWithCleanResponse(cart, targetCurrency, sourceCurrency);

    return {
      success: true,
      data: convertedCart,
      currencyInfo: {
        sourceCurrency: sourceCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        conversionRate,
        lastUpdated: lastUpdated || new Date(),
      },
    };
  } catch (error) {
    console.error('Error converting cart currency:', error);
    throw error;
  }
};

// Helper function to get supported currencies
export const getSupportedCurrencies = async (): Promise<string[]> => {
  const rates = await getExchangeRates();
  return Object.keys(rates);
};

// Helper function to format price with currency symbol
export const formatPrice = (amount: number, currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    AED: 'د.إ',
    SAR: '﷼',
    QAR: 'ر.ق',
    KWD: 'د.ك',
    BHD: '.د.ب',
    OMR: 'ر.ع.',
    JPY: '¥',
    INR: '₹',
    CAD: 'C$',
    AUD: 'A$',
    CNY: '¥',
    BRL: 'R$',
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
  return `${symbol}${amount.toFixed(2)}`;
};

// Helper function to validate currency code
export const isValidCurrency = async (currencyCode: string): Promise<boolean> => {
  try {
    const rates = await getExchangeRates();
    return rates.hasOwnProperty(currencyCode.toUpperCase());
  } catch (error) {
    return false;
  }
};