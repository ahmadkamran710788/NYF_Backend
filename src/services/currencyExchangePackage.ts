import axios from "axios";

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

// Helper function to get currency conversion rate
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
  
  // Convert via USD
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
      // Skip MongoDB/Mongoose internal properties
      if (key.startsWith('$') || key.startsWith('_') && key !== '_id' || key === '__v') {
        continue;
      }
      
      // Clean nested objects recursively
      cleaned[key] = cleanObject(value);
    }
    
    return cleaned;
  }
  
  return obj;
};

// Clean activity data
const cleanActivity = (activity: any, targetCurrency: string): CleanedActivity => {
  return {
    _id: activity._id,
    name: activity.name,
    category: activity.category,
    city: activity.city,
    description: activity.description,
    images: activity.images || [],
    originalPrice: activity.originalPrice,
    discountPrice: activity.discountPrice,
    baseCurrency: targetCurrency.toUpperCase(),
    duration: activity.duration,
    includes: activity.includes || [],
    highlights: activity.highlights || [],
    isInstantConfirmation: activity.isInstantConfirmation,
    isMobileTicket: activity.isMobileTicket,
    isRefundable: activity.isRefundable,
    ratings: activity.ratings || 0,
    reviewCount: activity.reviewCount || 0,
  };
};

// Clean destination data
const cleanDestination = (destination: any): CleanedDestination => {
  return {
    _id: destination._id,
    name: destination.name,
    country: destination.country,
    description: destination.description,
    image: destination.image,
  };
};

// Convert a single holiday package to target currency with cleaned response
export const convertPackageWithCleanResponse = async (
  holidayPackage: any, 
  targetCurrency: string
): Promise<CleanedHolidayPackage> => {
  const sourceCurrency = holidayPackage.baseCurrency || 'USD';
  
  let convertedOriginalPrice: number;
  let convertedDiscountPrice: number;

  if (sourceCurrency === targetCurrency) {
    convertedOriginalPrice = holidayPackage.originalPrice;
    convertedDiscountPrice = holidayPackage.discountPrice;
  } else {
    if (sourceCurrency === 'USD') {
      convertedOriginalPrice = await convertFromUSD(holidayPackage.originalPrice, targetCurrency);
      convertedDiscountPrice = await convertFromUSD(holidayPackage.discountPrice, targetCurrency);
    } else if (targetCurrency === 'USD') {
      convertedOriginalPrice = await convertToUSD(holidayPackage.originalPrice, sourceCurrency);
      convertedDiscountPrice = await convertToUSD(holidayPackage.discountPrice, sourceCurrency);
    } else {
      const originalPriceInUSD = await convertToUSD(holidayPackage.originalPrice, sourceCurrency);
      const discountPriceInUSD = await convertToUSD(holidayPackage.discountPrice, sourceCurrency);
      
      convertedOriginalPrice = await convertFromUSD(originalPriceInUSD, targetCurrency);
      convertedDiscountPrice = await convertFromUSD(discountPriceInUSD, targetCurrency);
    }
  }

  // Convert activities within itinerary
  const convertedItinerary: CleanedItineraryDay[] = await Promise.all(
    (holidayPackage.itinerary || []).map(async (dayItem: any) => {
      let convertedActivities: CleanedActivity[] = [];
      
      if (dayItem.activities && Array.isArray(dayItem.activities)) {
        convertedActivities = await Promise.all(
          dayItem.activities.map(async (activity: any) => {
            const activitySourceCurrency = activity.baseCurrency || 'USD';
            
            let convertedActivityOriginalPrice: number;
            let convertedActivityDiscountPrice: number;

            if (activitySourceCurrency === targetCurrency) {
              convertedActivityOriginalPrice = activity.originalPrice;
              convertedActivityDiscountPrice = activity.discountPrice;
            } else if (activitySourceCurrency === 'USD') {
              convertedActivityOriginalPrice = await convertFromUSD(activity.originalPrice, targetCurrency);
              convertedActivityDiscountPrice = await convertFromUSD(activity.discountPrice, targetCurrency);
            } else if (targetCurrency === 'USD') {
              convertedActivityOriginalPrice = await convertToUSD(activity.originalPrice, activitySourceCurrency);
              convertedActivityDiscountPrice = await convertToUSD(activity.discountPrice, activitySourceCurrency);
            } else {
              const activityOriginalPriceInUSD = await convertToUSD(activity.originalPrice, activitySourceCurrency);
              const activityDiscountPriceInUSD = await convertToUSD(activity.discountPrice, activitySourceCurrency);
              
              convertedActivityOriginalPrice = await convertFromUSD(activityOriginalPriceInUSD, targetCurrency);
              convertedActivityDiscountPrice = await convertFromUSD(activityDiscountPriceInUSD, targetCurrency);
            }

            return cleanActivity({
              ...activity,
              originalPrice: convertedActivityOriginalPrice,
              discountPrice: convertedActivityDiscountPrice,
            }, targetCurrency);
          })
        );
      }

      return {
        day: dayItem.day,
        title: dayItem.title,
        description: dayItem.description,
        activities: convertedActivities,
        includedMeals: dayItem.includedMeals || [],
        transport: dayItem.transport,
        _id: dayItem._id,
      };
    })
  );

  return {
    _id: holidayPackage._id,
    name: holidayPackage.name,
    type: holidayPackage.type,
    destination: cleanDestination(holidayPackage.destination),
    destinationType: holidayPackage.destinationType,
    nights: holidayPackage.nights,
    days: holidayPackage.days,
    description: holidayPackage.description,
    images: holidayPackage.images || [],
    originalPrice: convertedOriginalPrice,
    discountPrice: convertedDiscountPrice,
    baseCurrency: targetCurrency.toUpperCase(),
    includes: holidayPackage.includes || [],
    excludes: holidayPackage.excludes || [],
    highlights: holidayPackage.highlights || [],
    itinerary: convertedItinerary,
    hotelStars: holidayPackage.hotelStars,
    hasTransport: holidayPackage.hasTransport,
    hasAccommodation: holidayPackage.hasAccommodation,
    hasActivities: holidayPackage.hasActivities,
    terms: holidayPackage.terms || [],
    notes: holidayPackage.notes || [],
    paymentPolicy: holidayPackage.paymentPolicy,
    isRefundable: holidayPackage.isRefundable,
    createdAt: holidayPackage.createdAt,
    updatedAt: holidayPackage.updatedAt,
  };
};

// Convert multiple holiday packages with cleaned response
export const convertPackagesWithCleanResponse = async (
  packages: any[], 
  targetCurrency: string = 'USD'
): Promise<CurrencyConversionResponse> => {
  try {
    // Determine source currency (assuming first package's currency or USD as default)
    const sourceCurrency = packages.length > 0 ? (packages[0].baseCurrency || 'USD') : 'USD';
    
    // Get conversion rate for currency info
    const conversionRate = await getConversionRate(sourceCurrency, targetCurrency);
    
    // Convert all packages
    const convertedPackages = await Promise.all(
      packages.map(pkg => convertPackageWithCleanResponse(pkg, targetCurrency))
    );

    return {
      success: true,
      data: convertedPackages,
      currencyInfo: {
        sourceCurrency: sourceCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        conversionRate: conversionRate,
        lastUpdated: lastUpdated || new Date(),
      },
    };
  } catch (error) {
    console.error('Error converting packages:', error);
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