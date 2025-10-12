import axios from "axios";

export interface ExchangeRates {
  [currency: string]: number;
}

export interface CleanedComboActivity {
  tour: string;
  tourOption: string;
  activityDiscount: number;
  tourLowestPrice: number;
}

export interface CleanedSEOContent {
  metaTitle?: string;
  metaDescription?: string;
  oldURL?: string;
  faqs?: Array<{ question: string; answer: string }>;
}

export interface CleanedComboOffer {
  _id: string;
  name: string;
  permalink: string;
  headerCaption?: string;
  isPopular: boolean;
  isActive: boolean;
  shortDescription?: string;
  description?: string;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  category?: string[];
  featuredImage?: string;
  images?: string[];
  featuredVideo?: string;
  baseCurrency: string;
  comboCurrency: string;
  comboDiscount: number;
  comboDiscountType: "percentage" | "fixed";
  country: string;
  city: string;
  activities: CleanedComboActivity[];
  totalPrice?: number;
  totalSavings?: number;
  originalTotalPrice?: number;
  seoContent?: CleanedSEOContent;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ComboOfferCurrencyConversionResponse {
  success: boolean;
  data: CleanedComboOffer[];
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

// Fetch exchange rates from API (using AED as base)
const fetchExchangeRates = async (): Promise<ExchangeRates> => {
  try {
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const usdRates = response.data.rates;
    
    const aedToUsdRate = 1 / usdRates.AED;
    const aedBasedRates: ExchangeRates = {
      AED: 1,
    };
    
    Object.keys(usdRates).forEach(currency => {
      if (currency !== 'AED') {
        aedBasedRates[currency] = usdRates[currency] * aedToUsdRate;
      }
    });
    
    return aedBasedRates;
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    return {
      AED: 1,
      USD: 0.272,
      EUR: 0.231,
      GBP: 0.199,
      SAR: 1.021,
      QAR: 0.991,
      KWD: 0.082,
      BHD: 0.103,
      OMR: 0.105,
      JPY: 29.92,
      INR: 20.13,
      CAD: 0.340,
      AUD: 0.367,
      CNY: 1.756,
      BRL: 1.540,
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
  
  const fromRate = rates[fromCurrency.toUpperCase()];
  const toRate = rates[toCurrency.toUpperCase()];
  
  if (!fromRate || !toRate) {
    throw new Error(`Rate not found for ${fromCurrency} or ${toCurrency}`);
  }
  
  return toRate / fromRate;
};

// Convert combo activity prices
const convertComboActivity = async (
  activity: any,
  sourceCurrency: string,
  targetCurrency: string
): Promise<CleanedComboActivity> => {
  let convertedPrice: number;
  let convertedDiscount: number;

  if (sourceCurrency === targetCurrency) {
    convertedPrice = activity.tourLowestPrice;
    convertedDiscount = activity.activityDiscount;
  } else if (sourceCurrency === 'AED') {
    convertedPrice = await convertFromAED(activity.tourLowestPrice, targetCurrency);
    convertedDiscount = await convertFromAED(activity.activityDiscount, targetCurrency);
  } else if (targetCurrency === 'AED') {
    convertedPrice = await convertToAED(activity.tourLowestPrice, sourceCurrency);
    convertedDiscount = await convertToAED(activity.activityDiscount, sourceCurrency);
  } else {
    const priceInAED = await convertToAED(activity.tourLowestPrice, sourceCurrency);
    const discountInAED = await convertToAED(activity.activityDiscount, sourceCurrency);
    
    convertedPrice = await convertFromAED(priceInAED, targetCurrency);
    convertedDiscount = await convertFromAED(discountInAED, targetCurrency);
  }

  return {
    tour: activity.tour,
    tourOption: activity.tourOption,
    activityDiscount: convertedDiscount,
    tourLowestPrice: convertedPrice,
  };
};

// Convert a single combo offer to target currency
export const convertComboOfferWithCleanResponse = async (
  comboOffer: any,
  targetCurrency: string,
  sourceCurrency?: string
): Promise<CleanedComboOffer> => {
  const effectiveSourceCurrency = sourceCurrency || comboOffer.baseCurrency || 'AED';
  
  // Convert all activities
  const convertedActivities = await Promise.all(
    (comboOffer.activities || []).map((activity: any) =>
      convertComboActivity(activity, effectiveSourceCurrency, targetCurrency)
    )
  );

  // Calculate totals
  const originalTotalPrice = convertedActivities.reduce((sum, activity) => {
    return sum + activity.tourLowestPrice;
  }, 0);

  let totalPrice: number;
  let totalSavings: number;
  let convertedDiscount: number;

  if (effectiveSourceCurrency === targetCurrency) {
    convertedDiscount = comboOffer.comboDiscount;
  } else if (effectiveSourceCurrency === 'AED') {
    convertedDiscount = await convertFromAED(comboOffer.comboDiscount, targetCurrency);
  } else if (targetCurrency === 'AED') {
    convertedDiscount = await convertToAED(comboOffer.comboDiscount, effectiveSourceCurrency);
  } else {
    const discountInAED = await convertToAED(comboOffer.comboDiscount, effectiveSourceCurrency);
    convertedDiscount = await convertFromAED(discountInAED, targetCurrency);
  }

  if (comboOffer.comboDiscountType === 'percentage') {
    totalSavings = originalTotalPrice * (comboOffer.comboDiscount / 100);
    totalPrice = originalTotalPrice - totalSavings;
    convertedDiscount = comboOffer.comboDiscount; // Percentage stays the same
  } else {
    totalSavings = convertedDiscount;
    totalPrice = originalTotalPrice - convertedDiscount;
  }

  return {
    _id: comboOffer._id,
    name: comboOffer.name,
    permalink: comboOffer.permalink,
    headerCaption: comboOffer.headerCaption,
    isPopular: comboOffer.isPopular,
    isActive: comboOffer.isActive,
    shortDescription: comboOffer.shortDescription,
    description: comboOffer.description,
    highlights: comboOffer.highlights || [],
    inclusions: comboOffer.inclusions || [],
    exclusions: comboOffer.exclusions || [],
    category: comboOffer.category || [],
    featuredImage: comboOffer.featuredImage,
    featuredVideo: comboOffer.featuredVideo,
    baseCurrency: targetCurrency.toUpperCase(),
    comboCurrency: targetCurrency.toUpperCase(),
    comboDiscount: convertedDiscount,
    comboDiscountType: comboOffer.comboDiscountType,
    country: comboOffer.country,
    city: comboOffer.city,
    activities: convertedActivities,
    totalPrice: Math.round(totalPrice * 100) / 100,
    totalSavings: Math.round(totalSavings * 100) / 100,
    originalTotalPrice: Math.round(originalTotalPrice * 100) / 100,
    seoContent: comboOffer.seoContent,
    images: comboOffer.images,
    createdAt: comboOffer.createdAt,
    updatedAt: comboOffer.updatedAt,
  };
};

// Convert multiple combo offers with cleaned response
export const convertComboOffersWithCleanResponse = async (
  comboOffers: any[],
  targetCurrency: string = 'AED',
  sourceCurrency?: string
): Promise<ComboOfferCurrencyConversionResponse> => {
  try {
    const effectiveSourceCurrency = sourceCurrency || comboOffers[0]?.baseCurrency || 'AED';
    
    const conversionRate = await getConversionRate(effectiveSourceCurrency, targetCurrency);
    
    const convertedOffers = await Promise.all(
      comboOffers.map(offer => 
        convertComboOfferWithCleanResponse(offer, targetCurrency, effectiveSourceCurrency)
      )
    );

    return {
      success: true,
      data: convertedOffers,
      currencyInfo: {
        sourceCurrency: effectiveSourceCurrency.toUpperCase(),
        targetCurrency: targetCurrency.toUpperCase(),
        conversionRate: conversionRate,
        lastUpdated: lastUpdated || new Date(),
      },
    };
  } catch (error) {
    console.error('Error converting combo offers:', error);
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

// Format combo offer pricing summary
export const formatComboOfferPricing = (offer: CleanedComboOffer): string => {
  const originalPrice = formatPrice(offer.originalTotalPrice || 0, offer.baseCurrency);
  const finalPrice = formatPrice(offer.totalPrice || 0, offer.baseCurrency);
  const savings = formatPrice(offer.totalSavings || 0, offer.baseCurrency);
  
  return `Original: ${originalPrice} | Final: ${finalPrice} | You Save: ${savings}`;
};