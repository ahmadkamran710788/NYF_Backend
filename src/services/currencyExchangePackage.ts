// import axios from "axios";
// import { HolidayPackage } from "../models/HolidayPackage"; // Adjust import based on your Mongoose model

// export interface ExchangeRates {
//   [currency: string]: number;
// }

// export interface CleanedActivity {
//   _id: string;
//   name: string;
//   category: string;
//   city: string;
//   description: string;
//   images: string[];
//   originalPrice: number;
//   discountPrice: number;
//   baseCurrency: string;
//   duration: string;
//   includes: string[];
//   highlights: string[];
//   isInstantConfirmation: boolean;
//   isMobileTicket: boolean;
//   isRefundable: boolean;
//   ratings: number;
//   reviewCount: number;
// }

// export interface CleanedItineraryDay {
//   day: number;
//   title: string;
//   description: string;
//   activities: CleanedActivity[];
//   includedMeals: string[];
//   transport: string;
//   _id: string;
// }

// export interface CleanedDestination {
//   _id: string;
//   name: string;
//   country: string;
//   description: string;
//   image: string;
// }

// export interface CleanedHolidayPackage {
//   _id: string;
//   name: string;
//   type: string;
//   destination: CleanedDestination;
//   destinationType: string;
//   nights: number;
//   days: number;
//   description: string;
//   images: string[];
//   originalPrice: number;
//   discountPrice: number;
//   baseCurrency: string;
//   includes: string[];
//   excludes: string[];
//   highlights: string[];
//   itinerary: CleanedItineraryDay[];
//   hotelStars: number;
//   hasTransport: boolean;
//   hasAccommodation: boolean;
//   hasActivities: boolean;
//   staycation: boolean;
//   terms: string[];
//   notes: string[];
//   paymentPolicy: string;
//   isRefundable: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface CurrencyConversionResponse {
//   success: boolean;
//   data: CleanedHolidayPackage[];
//   // currencyInfo: {
//   //   sourceCurrency: string;
//   //   targetCurrency: string;
//   //   conversionRate: number;
//   //   lastUpdated: Date;
//   // };
// }

// // In-memory cache for exchange rates
// let exchangeRatesCache: ExchangeRates = {};
// let lastUpdated: Date | null = null;
// const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// // Fetch exchange rates from API
// const fetchExchangeRates = async (): Promise<ExchangeRates> => {
//   try {
//     const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
//     return response.data.rates;
//   } catch (error) {
//     console.error('Failed to fetch exchange rates:', error);
//     // Fallback rates
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
//       BRL: 5.66,
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

//   return Math.round((amount * rate) * 100) / 100;
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

//   return Math.round((amount / rate) * 100) / 100;
// };

// // Get conversion rate
// export const getConversionRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
//   if (fromCurrency === toCurrency) {
//     return 1;
//   }

//   const rates = await getExchangeRates();
  
//   if (fromCurrency === 'USD') {
//     const rate = rates[toCurrency.toUpperCase()];
//     if (!rate) throw new Error(`Rate not found for ${toCurrency}`);
//     return rate;
//   }
  
//   if (toCurrency === 'USD') {
//     const rate = rates[fromCurrency.toUpperCase()];
//     if (!rate) throw new Error(`Rate not found for ${fromCurrency}`);
//     return 1 / rate;
//   }
  
//   const fromRate = rates[fromCurrency.toUpperCase()];
//   const toRate = rates[toCurrency.toUpperCase()];
  
//   if (!fromRate || !toRate) {
//     throw new Error(`Rate not found for ${fromCurrency} or ${toCurrency}`);
//   }
  
//   return toRate / fromRate;
// };

// // Clean and remove unwanted MongoDB/Mongoose properties
// const cleanObject = (obj: any): any => {
//   if (obj === null || obj === undefined) return obj;
  
//   if (Array.isArray(obj)) {
//     return obj.map(item => cleanObject(item));
//   }
  
//   if (typeof obj === 'object') {
//     const cleaned: any = {};
    
//     for (const [key, value] of Object.entries(obj)) {
//       if (key.startsWith('$') || key === '__v') {
//         continue;
//       }
      
//       cleaned[key] = cleanObject(value);
//     }
    
//     return cleaned;
//   }
  
//   return obj;
// };

// // Clean activity data
// const cleanActivity = (activity: any, targetCurrency: string): CleanedActivity => {
//   return {
//     _id: activity._id?.toString() || '',
//     name: activity.name || '',
//     category: activity.category || '',
//     city: activity.city?.toString() || '',
//     description: activity.description || '',
//     images: Array.isArray(activity.images) ? activity.images : [],
//     originalPrice: activity.originalPrice || 0,
//     discountPrice: activity.discountPrice || 0,
//     baseCurrency: targetCurrency.toUpperCase(),
//     duration: activity.duration || '',
//     includes: Array.isArray(activity.includes) ? activity.includes : [],
//     highlights: Array.isArray(activity.highlights) ? activity.highlights : [],
//     isInstantConfirmation: !!activity.isInstantConfirmation,
//     isMobileTicket: !!activity.isMobileTicket,
//     isRefundable: !!activity.isRefundable,
//     ratings: activity.ratings || 0,
//     reviewCount: activity.reviewCount || 0,
//   };
// };

// // Clean destination data
// const cleanDestination = (destination: any): CleanedDestination => {
//   return {
//     _id: destination._id?.toString() || '',
//     name: destination.name || '',
//     country: destination.country?.toString() || '',
//     description: destination.description || '',
//     image: destination.image || '',
//   };
// };

// // Convert a single holiday package to target currency with cleaned response
// export const convertPackageWithCleanResponse = async (
//   holidayPackage: any,
//   targetCurrency: string
// ): Promise<CleanedHolidayPackage> => {
//   // Convert Mongoose document to plain object
//   const packageObject = holidayPackage.toObject ? holidayPackage.toObject() : holidayPackage;

//   const sourceCurrency = packageObject.baseCurrency || 'USD';

//   let convertedOriginalPrice: number;
//   let convertedDiscountPrice: number;

//   if (sourceCurrency === targetCurrency) {
//     convertedOriginalPrice = packageObject.originalPrice;
//     convertedDiscountPrice = packageObject.discountPrice;
//   } else {
//     if (sourceCurrency === 'USD') {
//       convertedOriginalPrice = await convertFromUSD(packageObject.originalPrice, targetCurrency);
//       convertedDiscountPrice = await convertFromUSD(packageObject.discountPrice, targetCurrency);
//     } else if (targetCurrency === 'USD') {
//       convertedOriginalPrice = await convertToUSD(packageObject.originalPrice, sourceCurrency);
//       convertedDiscountPrice = await convertToUSD(packageObject.discountPrice, sourceCurrency);
//     } else {
//       const originalPriceInUSD = await convertToUSD(packageObject.originalPrice, sourceCurrency);
//       const discountPriceInUSD = await convertToUSD(packageObject.discountPrice, sourceCurrency);
//       convertedOriginalPrice = await convertFromUSD(originalPriceInUSD, targetCurrency);
//       convertedDiscountPrice = await convertFromUSD(discountPriceInUSD, targetCurrency);
//     }
//   }

//   // Convert activities within itinerary
//   const convertedItinerary: CleanedItineraryDay[] = await Promise.all(
//     (packageObject.itinerary || []).map(async (dayItem: any) => {
//       let convertedActivities: CleanedActivity[] = [];

//       if (dayItem.activities && Array.isArray(dayItem.activities)) {
//         convertedActivities = await Promise.all(
//           dayItem.activities.map(async (activity: any) => {
//             // Convert activity to plain object if it's a Mongoose document
//             const activityObject = activity.toObject ? activity.toObject() : activity;
//             const activitySourceCurrency = activityObject.baseCurrency || 'USD';

//             let convertedActivityOriginalPrice: number;
//             let convertedActivityDiscountPrice: number;

//             if (activitySourceCurrency === targetCurrency) {
//               convertedActivityOriginalPrice = activityObject.originalPrice || 0;
//               convertedActivityDiscountPrice = activityObject.discountPrice || 0;
//             } else if (activitySourceCurrency === 'USD') {
//               convertedActivityOriginalPrice = await convertFromUSD(
//                 activityObject.originalPrice || 0,
//                 targetCurrency
//               );
//               convertedActivityDiscountPrice = await convertFromUSD(
//                 activityObject.discountPrice || 0,
//                 targetCurrency
//               );
//             } else if (targetCurrency === 'USD') {
//               convertedActivityOriginalPrice = await convertToUSD(
//                 activityObject.originalPrice || 0,
//                 activitySourceCurrency
//               );
//               convertedActivityDiscountPrice = await convertToUSD(
//                 activityObject.discountPrice || 0,
//                 activitySourceCurrency
//               );
//             } else {
//               const activityOriginalPriceInUSD = await convertToUSD(
//                 activityObject.originalPrice || 0,
//                 activitySourceCurrency
//               );
//               const activityDiscountPriceInUSD = await convertToUSD(
//                 activityObject.discountPrice || 0,
//                 activitySourceCurrency
//               );
//               convertedActivityOriginalPrice = await convertFromUSD(
//                 activityOriginalPriceInUSD,
//                 targetCurrency
//               );
//               convertedActivityDiscountPrice = await convertFromUSD(
//                 activityDiscountPriceInUSD,
//                 targetCurrency
//               );
//             }

//             return cleanActivity(
//               {
//                 ...activityObject,
//                 originalPrice: convertedActivityOriginalPrice,
//                 discountPrice: convertedActivityDiscountPrice,
//               },
//               targetCurrency
//             );
//           })
//         );
//       }

//       return {
//         day: dayItem.day || 0,
//         title: dayItem.title || '',
//         description: dayItem.description || '',
//         activities: convertedActivities,
//         includedMeals: Array.isArray(dayItem.includedMeals) ? dayItem.includedMeals : [],
//         transport: dayItem.transport || '',
//         _id: dayItem._id?.toString() || '',
//       };
//     })
//   );

//   return {
//     _id: packageObject._id?.toString() || '',
//     name: packageObject.name || '',
//     type: packageObject.type || '',
//     destination: cleanDestination(packageObject.destination || {}),
//     destinationType: packageObject.destinationType || '',
//     nights: packageObject.nights || 0,
//     days: packageObject.days || 0,
//     description: packageObject.description || '',
//     images: Array.isArray(packageObject.images) ? packageObject.images : [],
//     originalPrice: convertedOriginalPrice,
//     discountPrice: convertedDiscountPrice,
//     baseCurrency: targetCurrency.toUpperCase(),
//     includes: Array.isArray(packageObject.includes) ? packageObject.includes : [],
//     excludes: Array.isArray(packageObject.excludes) ? packageObject.excludes : [],
//     highlights: Array.isArray(packageObject.highlights) ? packageObject.highlights : [],
//     itinerary: convertedItinerary,
//     hotelStars: packageObject.hotelStars || 0,
//     hasTransport: !!packageObject.hasTransport,
//     hasAccommodation: !!packageObject.hasAccommodation,
//     hasActivities: !!packageObject.hasActivities,
//     staycation: !!packageObject.staycation,
//     terms: Array.isArray(packageObject.terms) ? packageObject.terms : [],
//     notes: Array.isArray(packageObject.notes) ? packageObject.notes : [],
//     paymentPolicy: packageObject.paymentPolicy || '',
//     isRefundable: !!packageObject.isRefundable,
//     createdAt: packageObject.createdAt ? new Date(packageObject.createdAt) : undefined,
//     updatedAt: packageObject.updatedAt ? new Date(packageObject.updatedAt) : undefined,
//   };
// };

// // Convert multiple holiday packages with cleaned response
// export const convertPackagesWithCleanResponse = async (
//   packages: any[], 
//   targetCurrency: string = 'USD'
// ): Promise<CurrencyConversionResponse> => {
//   try {
//     // Determine source currency (assuming first package's currency or USD as default)
//     const sourceCurrency = packages.length > 0 ? (packages[0].baseCurrency || 'USD') : 'USD';
    
//     // Get conversion rate for currency info

//     const conversionRate = await getConversionRate(sourceCurrency, targetCurrency);
    
//     // Convert all packages
//     const convertedPackages = await Promise.all(
//       packages.map(pkg => convertPackageWithCleanResponse(pkg, targetCurrency))
//     );

//     return {
//       success: true,
//       data: convertedPackages
//     };
//   } catch (error) {
//     console.error('Error converting packages:', error);
//     throw error;
//   }
// };

// // Updated API endpoint to ensure proper population


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
//     BRL: 'R$',
//   };

//   const symbol = currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
//   return `${symbol}${amount.toFixed(2)}`;
// };

// // Helper function to validate currency code
// export const isValidCurrency = async (currencyCode: string): Promise<boolean> => {
//   try {
//     const rates = await getExchangeRates();
//     return rates.hasOwnProperty(currencyCode.toUpperCase());
//   } catch (error) {
//     return false;
//   }
// };


import axios from "axios";
import { HolidayPackage } from "../models/HolidayPackage"; // Adjust import based on your Mongoose model

export interface ExchangeRates {
  [currency: string]: number;
}

export interface CleanedActivity {
  _id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  images: string[];
  originalPrice: number;
  discountPrice: number;
  baseCurrency: string;
  duration: string;
  includes: string[];
  highlights: string[];
  isInstantConfirmation: boolean;
  isMobileTicket: boolean;
  isRefundable: boolean;
  ratings: number;
  reviewCount: number;
}

export interface CleanedItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: CleanedActivity[];
  includedMeals: string[];
  transport: string;
  _id: string;
}

export interface CleanedDestination {
  _id: string;
  name: string;
  country: string;
  description: string;
  image: string;
}

export interface CleanedHolidayPackage {
  _id: string;
  name: string;
  type: string;
  destination: CleanedDestination;
  destinationType: string;
  nights: number;
  days: number;
  description: string;
  images: string[];
  originalPrice: number;
  discountPrice: number;
  baseCurrency: string;
  includes: string[];
  excludes: string[];
  highlights: string[];
  itinerary: CleanedItineraryDay[];
  hotelStars: number;
  hasTransport: boolean;
  hasAccommodation: boolean;
  hasActivities: boolean;
  staycation: boolean;
  terms: string[];
  notes: string[];
  paymentPolicy: string;
  isRefundable: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CurrencyConversionResponse {
  success: boolean;
  data: CleanedHolidayPackage[];
  // currencyInfo: {
  //   sourceCurrency: string;
  //   targetCurrency: string;
  //   conversionRate: number;
  //   lastUpdated: Date;
  // };
}

// In-memory cache for exchange rates
let exchangeRatesCache: ExchangeRates = {};
let lastUpdated: Date | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

// Fetch exchange rates from API (AED as base currency)
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
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
      BRL: 1.53,
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

  return Math.round((amount * rate) * 100) / 100;
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

  return Math.round((amount / rate) * 100) / 100;
};

// Get conversion rate
export const getConversionRate = async (fromCurrency: string, toCurrency: string): Promise<number> => {
  if (fromCurrency === toCurrency) {
    return 1;
  }

  const rates = await getExchangeRates();
  
  if (fromCurrency === 'AED') {
    const rate = rates[toCurrency.toUpperCase()];
    if (!rate) throw new Error(`Rate not found for ${toCurrency}`);
    return rate;
  }
  
  if (toCurrency === 'AED') {
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

// Clean and remove unwanted MongoDB/Mongoose properties
const cleanObject = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObject(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('$') || key === '__v') {
        continue;
      }
      
      cleaned[key] = cleanObject(value);
    }
    
    return cleaned;
  }
  
  return obj;
};

// Clean activity data
const cleanActivity = (activity: any, targetCurrency: string): CleanedActivity => {
  return {
    _id: activity._id?.toString() || '',
    name: activity.name || '',
    category: activity.category || '',
    city: activity.city?.toString() || '',
    description: activity.description || '',
    images: Array.isArray(activity.images) ? activity.images : [],
    originalPrice: activity.originalPrice || 0,
    discountPrice: activity.discountPrice || 0,
    baseCurrency: targetCurrency.toUpperCase(),
    duration: activity.duration || '',
    includes: Array.isArray(activity.includes) ? activity.includes : [],
    highlights: Array.isArray(activity.highlights) ? activity.highlights : [],
    isInstantConfirmation: !!activity.isInstantConfirmation,
    isMobileTicket: !!activity.isMobileTicket,
    isRefundable: !!activity.isRefundable,
    ratings: activity.ratings || 0,
    reviewCount: activity.reviewCount || 0,
  };
};

// Clean destination data
const cleanDestination = (destination: any): CleanedDestination => {
  return {
    _id: destination._id?.toString() || '',
    name: destination.name || '',
    country: destination.country?.toString() || '',
    description: destination.description || '',
    image: destination.image || '',
  };
};

// Convert a single holiday package to target currency with cleaned response
export const convertPackageWithCleanResponse = async (
  holidayPackage: any,
  targetCurrency: string
): Promise<CleanedHolidayPackage> => {
  // Convert Mongoose document to plain object
  const packageObject = holidayPackage.toObject ? holidayPackage.toObject() : holidayPackage;

  const sourceCurrency = packageObject.baseCurrency || 'AED';

  let convertedOriginalPrice: number;
  let convertedDiscountPrice: number;

  if (sourceCurrency === targetCurrency) {
    convertedOriginalPrice = packageObject.originalPrice;
    convertedDiscountPrice = packageObject.discountPrice;
  } else {
    if (sourceCurrency === 'AED') {
      convertedOriginalPrice = await convertFromAED(packageObject.originalPrice, targetCurrency);
      convertedDiscountPrice = await convertFromAED(packageObject.discountPrice, targetCurrency);
    } else if (targetCurrency === 'AED') {
      convertedOriginalPrice = await convertToAED(packageObject.originalPrice, sourceCurrency);
      convertedDiscountPrice = await convertToAED(packageObject.discountPrice, sourceCurrency);
    } else {
      const originalPriceInAED = await convertToAED(packageObject.originalPrice, sourceCurrency);
      const discountPriceInAED = await convertToAED(packageObject.discountPrice, sourceCurrency);
      convertedOriginalPrice = await convertFromAED(originalPriceInAED, targetCurrency);
      convertedDiscountPrice = await convertFromAED(discountPriceInAED, targetCurrency);
    }
  }

  // Convert activities within itinerary
  const convertedItinerary: CleanedItineraryDay[] = await Promise.all(
    (packageObject.itinerary || []).map(async (dayItem: any) => {
      let convertedActivities: CleanedActivity[] = [];

      if (dayItem.activities && Array.isArray(dayItem.activities)) {
        convertedActivities = await Promise.all(
          dayItem.activities.map(async (activity: any) => {
            // Convert activity to plain object if it's a Mongoose document
            const activityObject = activity.toObject ? activity.toObject() : activity;
            const activitySourceCurrency = activityObject.baseCurrency || 'AED';

            let convertedActivityOriginalPrice: number;
            let convertedActivityDiscountPrice: number;

            if (activitySourceCurrency === targetCurrency) {
              convertedActivityOriginalPrice = activityObject.originalPrice || 0;
              convertedActivityDiscountPrice = activityObject.discountPrice || 0;
            } else if (activitySourceCurrency === 'AED') {
              convertedActivityOriginalPrice = await convertFromAED(
                activityObject.originalPrice || 0,
                targetCurrency
              );
              convertedActivityDiscountPrice = await convertFromAED(
                activityObject.discountPrice || 0,
                targetCurrency
              );
            } else if (targetCurrency === 'AED') {
              convertedActivityOriginalPrice = await convertToAED(
                activityObject.originalPrice || 0,
                activitySourceCurrency
              );
              convertedActivityDiscountPrice = await convertToAED(
                activityObject.discountPrice || 0,
                activitySourceCurrency
              );
            } else {
              const activityOriginalPriceInAED = await convertToAED(
                activityObject.originalPrice || 0,
                activitySourceCurrency
              );
              const activityDiscountPriceInAED = await convertToAED(
                activityObject.discountPrice || 0,
                activitySourceCurrency
              );
              convertedActivityOriginalPrice = await convertFromAED(
                activityOriginalPriceInAED,
                targetCurrency
              );
              convertedActivityDiscountPrice = await convertFromAED(
                activityDiscountPriceInAED,
                targetCurrency
              );
            }

            return cleanActivity(
              {
                ...activityObject,
                originalPrice: convertedActivityOriginalPrice,
                discountPrice: convertedActivityDiscountPrice,
              },
              targetCurrency
            );
          })
        );
      }

      return {
        day: dayItem.day || 0,
        title: dayItem.title || '',
        description: dayItem.description || '',
        activities: convertedActivities,
        includedMeals: Array.isArray(dayItem.includedMeals) ? dayItem.includedMeals : [],
        transport: dayItem.transport || '',
        _id: dayItem._id?.toString() || '',
      };
    })
  );

  return {
    _id: packageObject._id?.toString() || '',
    name: packageObject.name || '',
    type: packageObject.type || '',
    destination: cleanDestination(packageObject.destination || {}),
    destinationType: packageObject.destinationType || '',
    nights: packageObject.nights || 0,
    days: packageObject.days || 0,
    description: packageObject.description || '',
    images: Array.isArray(packageObject.images) ? packageObject.images : [],
    originalPrice: convertedOriginalPrice,
    discountPrice: convertedDiscountPrice,
    baseCurrency: targetCurrency.toUpperCase(),
    includes: Array.isArray(packageObject.includes) ? packageObject.includes : [],
    excludes: Array.isArray(packageObject.excludes) ? packageObject.excludes : [],
    highlights: Array.isArray(packageObject.highlights) ? packageObject.highlights : [],
    itinerary: convertedItinerary,
    hotelStars: packageObject.hotelStars || 0,
    hasTransport: !!packageObject.hasTransport,
    hasAccommodation: !!packageObject.hasAccommodation,
    hasActivities: !!packageObject.hasActivities,
    staycation: !!packageObject.staycation,
    terms: Array.isArray(packageObject.terms) ? packageObject.terms : [],
    notes: Array.isArray(packageObject.notes) ? packageObject.notes : [],
    paymentPolicy: packageObject.paymentPolicy || '',
    isRefundable: !!packageObject.isRefundable,
    createdAt: packageObject.createdAt ? new Date(packageObject.createdAt) : undefined,
    updatedAt: packageObject.updatedAt ? new Date(packageObject.updatedAt) : undefined,
  };
};

// Convert multiple holiday packages with cleaned response
export const convertPackagesWithCleanResponse = async (
  packages: any[], 
  targetCurrency: string = 'AED'
): Promise<CurrencyConversionResponse> => {
  try {
    // Determine source currency (assuming first package's currency or AED as default)
    const sourceCurrency = packages.length > 0 ? (packages[0].baseCurrency || 'AED') : 'AED';
    
    // Get conversion rate for currency info
    const conversionRate = await getConversionRate(sourceCurrency, targetCurrency);
    
    // Convert all packages
    const convertedPackages = await Promise.all(
      packages.map(pkg => convertPackageWithCleanResponse(pkg, targetCurrency))
    );

    return {
      success: true,
      data: convertedPackages
    };
  } catch (error) {
    console.error('Error converting packages:', error);
    throw error;
  }
};

// Updated API endpoint to ensure proper population

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