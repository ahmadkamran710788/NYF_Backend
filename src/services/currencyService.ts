// import axios from "axios";

// export interface ExchangeRates {
//   [currency: string]: number;
// }

// export interface ConvertedActivity {
//   _id: any;
//   name: string;
//   category: string;
//   city: any;
//   description: string;
//   images: string[];
//   originalPrice: number; // Converted price
//   discountPrice: number; // Converted price
//   baseCurrency: string; // Target currency
//   duration: string;
//   includes: string[];
//   highlights: string[];
//   isInstantConfirmation: boolean;
//   isMobileTicket: boolean;
//   isRefundable: boolean;
//   ratings: number;
//   reviewCount: number;
// }

// // In-memory cache for exchange rates
// let exchangeRatesCache: ExchangeRates = {};
// let lastUpdated: Date | null = null;
// const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// // Fetch exchange rates from API
// const fetchExchangeRates = async (): Promise<ExchangeRates> => {
//   try {
//     // Using exchangerate-api.com (free tier available)
//     const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
//     return response.data.rates;
//   } catch (error) {
//     console.error('Failed to fetch exchange rates:', error);
//     // Fallback rates (you should implement proper error handling)
//     return {
//       USD: 1,
//       EUR: 0.85,
//       GBP: 0.73,
//       AED: 3.67,
//       SAR: 3.75,
//       QAR: 3.64,
//       KWD: 0.30,
//       BHD: 0.38,
//       OMR: 0.38,
//       JPY: 110,
//       INR: 74,
//       CAD: 1.25,
//       AUD: 1.35,
//       CNY: 6.45,
//     };
//   }
// };

// // Get current exchange rates (with caching)
// export const getExchangeRates = async (): Promise<ExchangeRates> => {
//   const now = new Date();
  
//   if (!lastUpdated || (now.getTime() - lastUpdated.getTime()) > CACHE_DURATION) {
//     exchangeRatesCache = await fetchExchangeRates();
//     lastUpdated = now;
//   }
  
//   return exchangeRatesCache;
// };

// // Convert amount from USD to target currency
// export const convertFromUSD = async (amount: number, targetCurrency: string): Promise<number> => {
//   if (targetCurrency === 'USD') {
//     return amount;
//   }

//   const rates = await getExchangeRates();
//   const rate = rates[targetCurrency.toUpperCase()];
  
//   if (!rate) {
//     throw new Error(`Exchange rate not found for currency: ${targetCurrency}`);
//   }

//   return Math.round((amount * rate) * 100) / 100; // Round to 2 decimal places
// };

// // Convert amount from any currency to USD
// export const convertToUSD = async (amount: number, fromCurrency: string): Promise<number> => {
//   if (fromCurrency === 'USD') {
//     return amount;
//   }

//   const rates = await getExchangeRates();
//   const rate = rates[fromCurrency.toUpperCase()];
  
//   if (!rate) {
//     throw new Error(`Exchange rate not found for currency: ${fromCurrency}`);
//   }

//   return Math.round((amount / rate) * 100) / 100; // Round to 2 decimal places
// };

// // Convert a single activity to target currency
// export const convertActivity = async (activity: any, targetCurrency: string): Promise<ConvertedActivity> => {
//   const convertedOriginalPrice = await convertFromUSD(
//     activity.originalPrice,
//     targetCurrency
//   );
  
//   const convertedDiscountPrice = await convertFromUSD(
//     activity.discountPrice,
//     targetCurrency
//   );

//   return {
//     ...activity,
//     originalPrice: convertedOriginalPrice,
//     discountPrice: convertedDiscountPrice,
//     baseCurrency: targetCurrency.toUpperCase(),
//   };
// };

// // Convert multiple activities to target currency
// export const convertActivities = async (activities: any[], targetCurrency: string): Promise<ConvertedActivity[]> => {
//   const convertedActivities = await Promise.all(
//     activities.map(activity => convertActivity(activity, targetCurrency))
//   );
//   return convertedActivities;
// };

// // Helper function to get supported currencies
// export const getSupportedCurrencies = async (): Promise<string[]> => {
//   const rates = await getExchangeRates();
//   return Object.keys(rates);
// };

// // Helper function to format price with currency symbol
// export const formatPrice = (amount: number, currency: string): string => {
//   const currencySymbols: { [key: string]: string } = {
//     USD: '$',
//     EUR: '€',
//     GBP: '£',
//     AED: 'د.إ',
//     SAR: '﷼',
//     QAR: 'ر.ق',
//     KWD: 'د.ك',
//     BHD: '.د.ب',
//     OMR: 'ر.ع.',
//     JPY: '¥',
//     INR: '₹',
//     CAD: 'C$',
//     AUD: 'A$',
//     CNY: '¥',
//   };

//   const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
//   return `${symbol}${amount.toFixed(2)}`;
// };

import axios from "axios";

export interface ExchangeRates {
  [currency: string]: number;
}

export interface ConvertedActivity {
  _id: any;
  name: string;
  category: string;
  city: any;
  description: string;
  images: string[];
  originalPrice: number; // Converted price
  discountPrice: number; // Converted price
  baseCurrency: string; // Target currency
  duration: string;
  includes: string[];
  highlights: string[];
  isInstantConfirmation: boolean;
  isMobileTicket: boolean;
  isRefundable: boolean;
  ratings: number;
  reviewCount: number;
}

// In-memory cache for exchange rates
let exchangeRatesCache: ExchangeRates = {};
let lastUpdated: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fetch exchange rates from API (AED as base currency)
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    // Using exchangerate-api.com with AED as base currency
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/AED');
    return response.data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Fallback rates with AED as base (1 AED = X other currencies)
    return {
      AED: 1,
      USD: 0.27, // 1 AED ≈ 0.27 USD
      EUR: 0.23,
      GBP: 0.20,
      SAR: 1.02,
      QAR: 0.99,
      KWD: 0.08,
      BHD: 0.10,
      OMR: 0.10,
      JPY: 30,
      INR: 20,
      CAD: 0.34,
      AUD: 0.37,
      CNY: 1.76,
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

// Convert amount from AED to target currency
export const convertFromAED = async (amount: number, targetCurrency: string): Promise<number> => {
  if (targetCurrency === 'AED') {
    return amount;
  }

  const rates = await getExchangeRates();
  const rate = rates[targetCurrency.toUpperCase()];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${targetCurrency}`);
  }

  return Math.round((amount * rate) * 100) / 100; // Round to 2 decimal places
};

// Convert amount from any currency to AED
export const convertToAED = async (amount: number, fromCurrency: string): Promise<number> => {
  if (fromCurrency === 'AED') {
    return amount;
  }

  const rates = await getExchangeRates();
  const rate = rates[fromCurrency.toUpperCase()];
  
  if (!rate) {
    throw new Error(`Exchange rate not found for currency: ${fromCurrency}`);
  }

  return Math.round((amount / rate) * 100) / 100; // Round to 2 decimal places
};

// Convert a single activity to target currency
export const convertActivity = async (activity: any, targetCurrency: string): Promise<ConvertedActivity> => {
  const convertedOriginalPrice = await convertFromAED(
    activity.originalPrice,
    targetCurrency
  );
  
  const convertedDiscountPrice = await convertFromAED(
    activity.discountPrice,
    targetCurrency
  );

  return {
    ...activity,
    originalPrice: convertedOriginalPrice,
    discountPrice: convertedDiscountPrice,
    baseCurrency: targetCurrency.toUpperCase(),
  };
};

// Convert multiple activities to target currency
export const convertActivities = async (activities: any[], targetCurrency: string): Promise<ConvertedActivity[]> => {
  const convertedActivities = await Promise.all(
    activities.map(activity => convertActivity(activity, targetCurrency))
  );
  return convertedActivities;
};

// Helper function to get supported currencies
export const getSupportedCurrencies = async (): Promise<string[]> => {
  const rates = await getExchangeRates();
  return Object.keys(rates);
};

// Helper function to format price with currency symbol
export const formatPrice = (amount: number, currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    AED: 'د.إ',
    USD: '$',
    EUR: '€',
    GBP: '£',
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
  };

  const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
  return `${symbol}${amount.toFixed(2)}`;
};