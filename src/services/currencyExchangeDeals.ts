// import axios from "axios";

// export interface ExchangeRates {
//   [currency: string]: number;
// }

// export interface CleanedDealPricing {
//   date: Date;
//   adultPrice: number;
//   childPrice: number;
// }

// export interface CleanedActivityDetails {
//   _id: string;
//   name: string;
//   category: string;
//   description?: string;
//   images?: string[];
// }

// export interface CleanedDeal {
//   _id: string;
//   title: string;
//   description: string;
//   image?: string;
//   pricing: CleanedDealPricing[];
//   includes: string[];
//   highlights: string[];
//   restrictions: string[];
//   baseCurrency: string;
//   activity?: CleanedActivityDetails;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// export interface DealCurrencyConversionResponse {
//   success: boolean;
//   data: CleanedDeal[];
//   currencyInfo: {
//     sourceCurrency: string;
//     targetCurrency: string;
//     conversionRate: number;
//     lastUpdated: Date;
//   };
// }

// // In-memory cache for exchange rates (reusing from package service)
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

// // Helper function to get currency conversion rate
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
  
//   // Convert via USD
//   const fromRate = rates[fromCurrency.toUpperCase()];
//   const toRate = rates[toCurrency.toUpperCase()];
  
//   if (!fromRate || !toRate) {
//     throw new Error(`Rate not found for ${fromCurrency} or ${toCurrency}`);
//   }
  
//   return toRate / fromRate;
// };

// // Clean activity details
// const cleanActivityDetails = (activity: any): CleanedActivityDetails => {
//   return {
//     _id: activity._id,
//     name: activity.name,
//     category: activity.category,
//     description: activity.description,
//     images: activity.images || [],
//   };
// };

// // Convert deal pricing array to target currency
// const convertDealPricing = async (
//   pricing: any[], 
//   sourceCurrency: string, 
//   targetCurrency: string
// ): Promise<CleanedDealPricing[]> => {
//   if (!pricing || !Array.isArray(pricing)) {
//     return [];
//   }

//   return await Promise.all(
//     pricing.map(async (priceEntry: any) => {
//       let convertedAdultPrice: number;
//       let convertedChildPrice: number;

//       if (sourceCurrency === targetCurrency) {
//         convertedAdultPrice = priceEntry.adultPrice;
//         convertedChildPrice = priceEntry.childPrice;
//       } else if (sourceCurrency === 'USD') {
//         convertedAdultPrice = await convertFromUSD(priceEntry.adultPrice, targetCurrency);
//         convertedChildPrice = await convertFromUSD(priceEntry.childPrice, targetCurrency);
//       } else if (targetCurrency === 'USD') {
//         convertedAdultPrice = await convertToUSD(priceEntry.adultPrice, sourceCurrency);
//         convertedChildPrice = await convertToUSD(priceEntry.childPrice, sourceCurrency);
//       } else {
//         const adultPriceInUSD = await convertToUSD(priceEntry.adultPrice, sourceCurrency);
//         const childPriceInUSD = await convertToUSD(priceEntry.childPrice, sourceCurrency);
        
//         convertedAdultPrice = await convertFromUSD(adultPriceInUSD, targetCurrency);
//         convertedChildPrice = await convertFromUSD(childPriceInUSD, targetCurrency);
//       }

//       return {
//         date: priceEntry.date,
//         adultPrice: convertedAdultPrice,
//         childPrice: convertedChildPrice,
//       };
//     })
//   );
// };

// // Convert a single deal to target currency with cleaned response
// export const convertDealWithCleanResponse = async (
//   deal: any, 
//   targetCurrency: string,
//   sourceCurrency: string = 'USD'
// ): Promise<CleanedDeal> => {
//   // Convert pricing array
//   const convertedPricing = await convertDealPricing(
//     deal.pricing, 
//     sourceCurrency, 
//     targetCurrency
//   );

//   return {
//     _id: deal._id,
//     title: deal.title,
//     description: deal.description,
//     image: deal.image,
//     pricing: convertedPricing,
//     includes: deal.includes || [],
//     highlights: deal.highlights || [],
//     restrictions: deal.restrictions || [],
//     baseCurrency: targetCurrency.toUpperCase(),
//     activity: deal.activity ? cleanActivityDetails(deal.activity) : undefined,
//     createdAt: deal.createdAt,
//     updatedAt: deal.updatedAt,
//   };
// };

// // Convert multiple deals with cleaned response
// export const convertDealsWithCleanResponse = async (
//   deals: any[], 
//   targetCurrency: string = 'USD',
//   sourceCurrency: string = 'USD'
// ): Promise<DealCurrencyConversionResponse> => {
//   try {
//     // Get conversion rate for currency info
//     const conversionRate = await getConversionRate(sourceCurrency, targetCurrency);
    
//     // Convert all deals
//     const convertedDeals = await Promise.all(
//       deals.map(deal => convertDealWithCleanResponse(deal, targetCurrency, sourceCurrency))
//     );

//     return {
//       success: true,
//       data: convertedDeals,
//       currencyInfo: {
//         sourceCurrency: sourceCurrency.toUpperCase(),
//         targetCurrency: targetCurrency.toUpperCase(),
//         conversionRate: conversionRate,
//         lastUpdated: lastUpdated || new Date(),
//       },
//     };
//   } catch (error) {
//     console.error('Error converting deals:', error);
//     throw error;
//   }
// };

// // Convert deal pricing for a specific date
// export const convertDealPricingForDate = async (
//   deal: any,
//   targetDate: Date,
//   targetCurrency: string,
//   sourceCurrency: string = 'USD'
// ): Promise<CleanedDealPricing | null> => {
//   if (!deal.pricing || !Array.isArray(deal.pricing)) {
//     return null;
//   }

//   // Find pricing for the specific date
//   const pricingForDate = deal.pricing.find((pricing: any) => {
//     const pricingDate = new Date(pricing.date);
//     const searchDate = new Date(targetDate);
    
//     return (
//       pricingDate.getFullYear() === searchDate.getFullYear() &&
//       pricingDate.getMonth() === searchDate.getMonth() &&
//       pricingDate.getDate() === searchDate.getDate()
//     );
//   });

//   if (!pricingForDate) {
//     return null;
//   }

//   // Convert the pricing
//   const convertedPricing = await convertDealPricing(
//     [pricingForDate], 
//     sourceCurrency, 
//     targetCurrency
//   );

//   return convertedPricing[0] || null;
// };

// // Get deals with pricing for specific activity and date with currency conversion
// export const getDealsWithCurrencyConversion = async (
//   deals: any[],
//   targetCurrency: string = 'USD',
//   sourceCurrency: string = 'USD',
//   filterDate?: Date
// ): Promise<DealCurrencyConversionResponse> => {
//   try {
//     let processedDeals = deals;

//     // If filterDate is provided, filter deals that have pricing for that date
//     if (filterDate) {
//       processedDeals = deals.filter(deal => {
//         if (!deal.pricing || !Array.isArray(deal.pricing)) {
//           return false;
//         }

//         return deal.pricing.some((pricing: any) => {
//           const pricingDate = new Date(pricing.date);
//           return (
//             pricingDate.getFullYear() === filterDate.getFullYear() &&
//             pricingDate.getMonth() === filterDate.getMonth() &&
//             pricingDate.getDate() === filterDate.getDate()
//           );
//         });
//       });

//       // For filtered deals, only keep pricing for the specific date
//       processedDeals = processedDeals.map(deal => ({
//         ...deal,
//         pricing: deal.pricing.filter((pricing: any) => {
//           const pricingDate = new Date(pricing.date);
//           return (
//             pricingDate.getFullYear() === filterDate.getFullYear() &&
//             pricingDate.getMonth() === filterDate.getMonth() &&
//             pricingDate.getDate() === filterDate.getDate()
//           );
//         })
//       }));
//     }

//     return await convertDealsWithCleanResponse(processedDeals, targetCurrency, sourceCurrency);
//   } catch (error) {
//     console.error('Error getting deals with currency conversion:', error);
//     throw error;
//   }
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

// // Format deal pricing for display
// export const formatDealPricing = (pricing: CleanedDealPricing, currency: string): string => {
//   const adultPrice = formatPrice(pricing.adultPrice, currency);
//   const childPrice = formatPrice(pricing.childPrice, currency);
//   const date = pricing.date.toISOString().split('T')[0];
  
//   return `Date: ${date} | Adult: ${adultPrice} | Child: ${childPrice}`;
// };


import axios from "axios";

export interface ExchangeRates {
  [currency: string]: number;
}

export interface CleanedDealPricing {
  date: Date;
  adultPrice: number;
  childPrice: number;
}

export interface CleanedActivityDetails {
  _id: string;
  name: string;
  category: string;
  description?: string;
  images?: string[];
}

export interface CleanedDeal {
  _id: string;
  title: string;
  description: string;
  image?: string;
  pricing: CleanedDealPricing[];
  includes: string[];
  highlights: string[];
  restrictions: string[];
  baseCurrency: string;
  activity?: CleanedActivityDetails;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DealCurrencyConversionResponse {
  success: boolean;
  data: CleanedDeal[];
  currencyInfo: {
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

// Fetch exchange rates from API (now using AED as base)
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    // Fetch USD-based rates and convert to AED-based rates
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const usdRates = response.data.rates;
    
    // Convert USD-based rates to AED-based rates
    const aedToUsdRate = 1 / usdRates.AED;
    const aedBasedRates: ExchangeRates = {
      AED: 1, // Base currency
    };
    
    // Convert all rates to AED base
    Object.keys(usdRates).forEach(currency => {
      if (currency !== 'AED') {
        aedBasedRates[currency] = usdRates[currency] * aedToUsdRate;
      }
    });
    
    return aedBasedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Fallback rates with AED as base (1 AED = x units of other currencies)
    return {
      AED: 1,
      USD: 0.272, // 1 AED = ~0.272 USD
      EUR: 0.231, // 1 AED = ~0.231 EUR
      GBP: 0.199, // 1 AED = ~0.199 GBP
      SAR: 1.021, // 1 AED = ~1.021 SAR
      QAR: 0.991, // 1 AED = ~0.991 QAR
      KWD: 0.082, // 1 AED = ~0.082 KWD
      BHD: 0.103, // 1 AED = ~0.103 BHD
      OMR: 0.105, // 1 AED = ~0.105 OMR
      JPY: 29.92, // 1 AED = ~29.92 JPY
      INR: 20.13, // 1 AED = ~20.13 INR
      CAD: 0.340, // 1 AED = ~0.340 CAD
      AUD: 0.367, // 1 AED = ~0.367 AUD
      CNY: 1.756, // 1 AED = ~1.756 CNY
      BRL: 1.540, // 1 AED = ~1.540 BRL
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

// Helper function to get currency conversion rate
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
  
  // Convert via AED
  const fromRate = rates[fromCurrency.toUpperCase()];
  const toRate = rates[toCurrency.toUpperCase()];
  
  if (!fromRate || !toRate) {
    throw new Error(`Rate not found for ${fromCurrency} or ${toCurrency}`);
  }
  
  return toRate / fromRate;
};

// Clean activity details
const cleanActivityDetails = (activity: any): CleanedActivityDetails => {
  return {
    _id: activity._id,
    name: activity.name,
    category: activity.category,
    description: activity.description,
    images: activity.images || [],
  };
};

// Convert deal pricing array to target currency
const convertDealPricing = async (
  pricing: any[], 
  sourceCurrency: string, 
  targetCurrency: string
): Promise<CleanedDealPricing[]> => {
  if (!pricing || !Array.isArray(pricing)) {
    return [];
  }

  return await Promise.all(
    pricing.map(async (priceEntry: any) => {
      let convertedAdultPrice: number;
      let convertedChildPrice: number;

      if (sourceCurrency === targetCurrency) {
        convertedAdultPrice = priceEntry.adultPrice;
        convertedChildPrice = priceEntry.childPrice;
      } else if (sourceCurrency === 'AED') {
        convertedAdultPrice = await convertFromAED(priceEntry.adultPrice, targetCurrency);
        convertedChildPrice = await convertFromAED(priceEntry.childPrice, targetCurrency);
      } else if (targetCurrency === 'AED') {
        convertedAdultPrice = await convertToAED(priceEntry.adultPrice, sourceCurrency);
        convertedChildPrice = await convertToAED(priceEntry.childPrice, sourceCurrency);
      } else {
        const adultPriceInAED = await convertToAED(priceEntry.adultPrice, sourceCurrency);
        const childPriceInAED = await convertToAED(priceEntry.childPrice, sourceCurrency);
        
        convertedAdultPrice = await convertFromAED(adultPriceInAED, targetCurrency);
        convertedChildPrice = await convertFromAED(childPriceInAED, targetCurrency);
      }

      return {
        date: priceEntry.date,
        adultPrice: convertedAdultPrice,
        childPrice: convertedChildPrice,
      };
    })
  );
};

// Convert a single deal to target currency with cleaned response
export const convertDealWithCleanResponse = async (
  deal: any, 
  targetCurrency: string,
  sourceCurrency: string = 'AED'
): Promise<CleanedDeal> => {
  // Convert pricing array
  const convertedPricing = await convertDealPricing(
    deal.pricing, 
    sourceCurrency, 
    targetCurrency
  );

  return {
    _id: deal._id,
    title: deal.title,
    description: deal.description,
    image: deal.image,
    pricing: convertedPricing,
    includes: deal.includes || [],
    highlights: deal.highlights || [],
    restrictions: deal.restrictions || [],
    baseCurrency: targetCurrency.toUpperCase(),
    activity: deal.activity ? cleanActivityDetails(deal.activity) : undefined,
    createdAt: deal.createdAt,
    updatedAt: deal.updatedAt,
  };
};

// Convert multiple deals with cleaned response
export const convertDealsWithCleanResponse = async (
  deals: any[], 
  targetCurrency: string = 'AED',
  sourceCurrency: string = 'AED'
): Promise<DealCurrencyConversionResponse> => {
  try {
    // Get conversion rate for currency info
    const conversionRate = await getConversionRate(sourceCurrency, targetCurrency);
    
    // Convert all deals
    const convertedDeals = await Promise.all(
      deals.map(deal => convertDealWithCleanResponse(deal, targetCurrency, sourceCurrency))
    );

    return {
      success: true,
      data: convertedDeals,
      currencyInfo: {
        sourceCurrency: sourceCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        conversionRate: conversionRate,
        lastUpdated: lastUpdated || new Date(),
      },
    };
  } catch (error) {
    console.error('Error converting deals:', error);
    throw error;
  }
};

// Convert deal pricing for a specific date
export const convertDealPricingForDate = async (
  deal: any,
  targetDate: Date,
  targetCurrency: string,
  sourceCurrency: string = 'AED'
): Promise<CleanedDealPricing | null> => {
  if (!deal.pricing || !Array.isArray(deal.pricing)) {
    return null;
  }

  // Find pricing for the specific date
  const pricingForDate = deal.pricing.find((pricing: any) => {
    const pricingDate = new Date(pricing.date);
    const searchDate = new Date(targetDate);
    
    return (
      pricingDate.getFullYear() === searchDate.getFullYear() &&
      pricingDate.getMonth() === searchDate.getMonth() &&
      pricingDate.getDate() === searchDate.getDate()
    );
  });

  if (!pricingForDate) {
    return null;
  }

  // Convert the pricing
  const convertedPricing = await convertDealPricing(
    [pricingForDate], 
    sourceCurrency, 
    targetCurrency
  );

  return convertedPricing[0] || null;
};

// Get deals with pricing for specific activity and date with currency conversion
export const getDealsWithCurrencyConversion = async (
  deals: any[],
  targetCurrency: string = 'AED',
  sourceCurrency: string = 'AED',
  filterDate?: Date
): Promise<DealCurrencyConversionResponse> => {
  try {
    let processedDeals = deals;

    // If filterDate is provided, filter deals that have pricing for that date
    if (filterDate) {
      processedDeals = deals.filter(deal => {
        if (!deal.pricing || !Array.isArray(deal.pricing)) {
          return false;
        }

        return deal.pricing.some((pricing: any) => {
          const pricingDate = new Date(pricing.date);
          return (
            pricingDate.getFullYear() === filterDate.getFullYear() &&
            pricingDate.getMonth() === filterDate.getMonth() &&
            pricingDate.getDate() === filterDate.getDate()
          );
        });
      });

      // For filtered deals, only keep pricing for the specific date
      processedDeals = processedDeals.map(deal => ({
        ...deal,
        pricing: deal.pricing.filter((pricing: any) => {
          const pricingDate = new Date(pricing.date);
          return (
            pricingDate.getFullYear() === filterDate.getFullYear() &&
            pricingDate.getMonth() === filterDate.getMonth() &&
            pricingDate.getDate() === filterDate.getDate()
          );
        })
      }));
    }

    return await convertDealsWithCleanResponse(processedDeals, targetCurrency, sourceCurrency);
  } catch (error) {
    console.error('Error getting deals with currency conversion:', error);
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

// Format deal pricing for display
export const formatDealPricing = (pricing: CleanedDealPricing, currency: string): string => {
  const adultPrice = formatPrice(pricing.adultPrice, currency);
  const childPrice = formatPrice(pricing.childPrice, currency);
  const date = pricing.date.toISOString().split('T')[0];
  
  return `Date: ${date} | Adult: ${adultPrice} | Child: ${childPrice}`;
};