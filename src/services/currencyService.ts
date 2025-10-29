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
  costPrice: number; // Converted price - FIXED: Added this conversion
  baseCurrency: string; // Target currency
  sourceCurrency?: string; // ADDED: To track original currency
  duration: string;
  includes: string;
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

// Fetch exchange rates from API (USD as base currency for more reliable rates)
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    // Using USD as base currency is more reliable for exchange rate APIs
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    
    // Log the fetched rates for debugging
    console.log('Fetched exchange rates:', response.data.rates);
    
    return response.data.rates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    // Enhanced fallback rates with more accurate values
    const fallbackRates = {
      USD: 1,
      AED: 3.67,
      EUR: 0.85,
      GBP: 0.73,
      SAR: 3.75,
      QAR: 3.64,
      KWD: 0.30,
      BHD: 0.38,
      OMR: 0.38,
      JPY: 149.50,
      INR: 83.25,
      CAD: 1.36,
      AUD: 1.52,
      CNY: 7.24,
    };
    
    console.log('Using fallback exchange rates:', fallbackRates);
    return fallbackRates;
  }
};

// Get current exchange rates (with caching)
export const getExchangeRates = async (): Promise<ExchangeRates> => {
  const now = new Date();
  
  if (!lastUpdated || (now.getTime() - lastUpdated.getTime()) > CACHE_DURATION) {
    console.log('Fetching fresh exchange rates...');
    exchangeRatesCache = await fetchExchangeRates();
    lastUpdated = now;
  } else {
    console.log('Using cached exchange rates');
  }
  
  return exchangeRatesCache;
};

// Convert amount between any two currencies
export const convertCurrency = async (
  amount: number, 
  fromCurrency: string, 
  toCurrency: string
): Promise<number> => {
  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    return amount;
  }

  const rates = await getExchangeRates();
  console.log('Available exchange rates:', rates);
  
  const fromRate = rates[fromCurrency.toUpperCase()];
  const toRate = rates[toCurrency.toUpperCase()];
  
  console.log(`${fromCurrency} rate:`, fromRate);
  console.log(`${toCurrency} rate:`, toRate);
  
  if (!fromRate) {
    throw new Error(`Exchange rate not found for source currency: ${fromCurrency}`);
  }
  
  if (!toRate) {
    throw new Error(`Exchange rate not found for target currency: ${toCurrency}`);
  }

  // FIXED: Proper conversion logic
  // Since the API returns rates with USD as base currency:
  // To convert FROM any currency TO USD: divide by the rate
  // To convert FROM USD TO any currency: multiply by the rate
  // To convert between non-USD currencies: convert through USD
  
  let convertedAmount: number;
  
  if (fromCurrency.toUpperCase() === 'USD') {
    // Converting FROM USD TO another currency
    convertedAmount = amount * toRate;
  } else if (toCurrency.toUpperCase() === 'USD') {
    // Converting FROM another currency TO USD
    convertedAmount = amount / fromRate;
  } else {
    // Converting between two non-USD currencies
    // Step 1: Convert from source to USD
    const usdAmount = amount / fromRate;
    // Step 2: Convert from USD to target
    convertedAmount = usdAmount * toRate;
  }
  
  console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency}: ${convertedAmount.toFixed(2)}`);
  console.log(`Calculation: ${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`);
  
  return Math.round(convertedAmount * 100) / 100; // Round to 2 decimal places
};

// FIXED: Convert a single activity to target currency
export const convertActivity = async (
  activity: any, 
  targetCurrency: string,
  sourceCurrency?: string // Make it optional so we can detect it
): Promise<ConvertedActivity> => {
  
  // CRITICAL FIX: Auto-detect source currency from activity data
  const actualSourceCurrency = sourceCurrency || activity.baseCurrency || activity.sourceCurrency || 'USD';
  
  console.log(`Converting activity "${activity.name}" from ${actualSourceCurrency} to ${targetCurrency}`);
  console.log(`Original prices - Original: ${activity.originalPrice}, Discount: ${activity.discountPrice}, Cost: ${activity.costPrice || 'N/A'}`);
  console.log(`Activity baseCurrency: ${activity.baseCurrency}, sourceCurrency: ${activity.sourceCurrency}`);
  
  try {
    const convertedOriginalPrice = await convertCurrency(
      activity.originalPrice,
      actualSourceCurrency,
      targetCurrency
    );
    
    const convertedDiscountPrice = await convertCurrency(
      activity.discountPrice,
      actualSourceCurrency,
      targetCurrency
    );
    
    // FIXED: Convert costPrice as well
    const convertedCostPrice = activity.costPrice 
      ? await convertCurrency(activity.costPrice, actualSourceCurrency, targetCurrency)
      : 0;

    const convertedActivity = {
      ...activity,
      originalPrice: convertedOriginalPrice,
      discountPrice: convertedDiscountPrice,
      costPrice: convertedCostPrice,
      baseCurrency: targetCurrency.toUpperCase(),
      sourceCurrency: actualSourceCurrency.toUpperCase(),
    };
    
    console.log(`Converted prices - Original: ${convertedOriginalPrice}, Discount: ${convertedDiscountPrice}, Cost: ${convertedCostPrice}`);
    
    return convertedActivity;
  } catch (error) {
    console.error(`Error converting activity "${activity.name}":`, error);
    throw error;
  }
};

// FIXED: Convert multiple activities to target currency
export const convertActivities = async (
  activities: any[], 
  targetCurrency: string,
  sourceCurrency?: string // Make optional for auto-detection
): Promise<ConvertedActivity[]> => {
  
  console.log(`Converting ${activities.length} activities to ${targetCurrency}`);
  
  const convertedActivities = await Promise.all(
    activities.map((activity, index) => {
      console.log(`Converting activity ${index + 1}/${activities.length}: ${activity.name}`);
      // Let convertActivity auto-detect source currency if not provided
      return convertActivity(activity, targetCurrency, sourceCurrency);
    })
  );
  
  console.log(`Successfully converted ${convertedActivities.length} activities`);
  return convertedActivities;
};

// Helper function to get supported currencies
export const getSupportedCurrencies = async (): Promise<string[]> => {
  const rates = await getExchangeRates();
  return Object.keys(rates).sort();
};

// Enhanced price formatting with better currency symbols
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
  
  // Format with appropriate decimal places (some currencies don't use decimals)
  const decimalPlaces = ['JPY', 'KRW', 'VND'].includes(currency.toUpperCase()) ? 0 : 2;
  
  return `${symbol}${amount.toFixed(decimalPlaces)}`;
};

// ADDED: Debug function to test conversion
export const debugConversion = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<void> => {
  try {
    const rates = await getExchangeRates();
    console.log('Available rates:', Object.keys(rates));
    console.log(`${fromCurrency} rate:`, rates[fromCurrency.toUpperCase()]);
    console.log(`${toCurrency} rate:`, rates[toCurrency.toUpperCase()]);
    
    const converted = await convertCurrency(amount, fromCurrency, toCurrency);
    console.log(`${amount} ${fromCurrency} = ${converted} ${toCurrency}`);
    console.log(`Formatted: ${formatPrice(converted, toCurrency)}`);
  } catch (error) {
    console.error('Debug conversion error:', error);
  }
};