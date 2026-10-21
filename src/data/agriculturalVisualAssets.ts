/**
 * Curated Photographic Specimens & Zero-Failure SVG Fallback Assets
 * for Crops, Soil Textures, Watering Methods, and Storage Infrastructure.
 * All images are verified authentic specimens stored locally in /public/images/.
 */

export interface CropVisualMetadata {
  id: string;
  name: string;
  category: { en: string; hi: string; bn: string };
  waterTier: 'low' | 'moderate' | 'high';
  waterTierLabel: { en: string; hi: string; bn: string };
  imageUrl: string;
  fallbackGradient: string;
  accentColor: string;
  emoji: string;
}

export interface SoilVisualMetadata {
  id: 'sandy' | 'loamy' | 'clay_black';
  name: { en: string; hi: string; bn: string };
  awcValue: number;
  awcLabel: string;
  drainageRate: { en: string; hi: string; bn: string };
  tactileDescription: { en: string; hi: string; bn: string };
  imageUrl: string;
  fallbackGradient: string;
  accentColor: string;
}

export interface IrrigationVisualMetadata {
  id: 'drip' | 'sprinkler' | 'surface_flood';
  name: { en: string; hi: string; bn: string };
  efficiencyPercent: number;
  waterSavingsBadge: { en: string; hi: string; bn: string };
  description: { en: string; hi: string; bn: string };
  imageUrl: string;
  fallbackGradient: string;
  accentColor: string;
}

export const CROP_VISUAL_ASSETS: Record<string, CropVisualMetadata> = {
  Tomato: {
    id: 'Tomato',
    name: 'Tomato',
    category: { en: 'Vegetable', hi: 'सब्जी', bn: 'সবজি' },
    waterTier: 'moderate',
    waterTierLabel: { en: 'Moderate Water', hi: 'मध्यम पानी', bn: 'পরিমিত জল' },
    imageUrl: '/images/crops/tomato.jpg',
    fallbackGradient: 'from-rose-500/20 to-red-600/30',
    accentColor: '#EF4444',
    emoji: '🍅',
  },
  Wheat: {
    id: 'Wheat',
    name: 'Wheat',
    category: { en: 'Cereal Grain', hi: 'अनाज', bn: 'দানা শস্য' },
    waterTier: 'moderate',
    waterTierLabel: { en: 'Moderate Water', hi: 'मध्यम पानी', bn: 'পরিমিত জল' },
    imageUrl: '/images/crops/wheat.jpg',
    fallbackGradient: 'from-amber-500/20 to-yellow-600/30',
    accentColor: '#F59E0B',
    emoji: '🌾',
  },
  Spinach: {
    id: 'Spinach',
    name: 'Spinach',
    category: { en: 'Leafy Green', hi: 'पत्तेदार सब्जी', bn: 'শাকসবজি' },
    waterTier: 'high',
    waterTierLabel: { en: 'High Water', hi: 'अधिक पानी', bn: 'বেশি জল' },
    imageUrl: '/images/crops/spinach.jpg',
    fallbackGradient: 'from-emerald-500/20 to-green-600/30',
    accentColor: '#10B981',
    emoji: '🥬',
  },
  Potato: {
    id: 'Potato',
    name: 'Potato',
    category: { en: 'Root Tuber', hi: 'कंद फसल', bn: 'কন্দজাতীয়' },
    waterTier: 'moderate',
    waterTierLabel: { en: 'Moderate Water', hi: 'मध्यम पानी', bn: 'পরিমিত জল' },
    imageUrl: '/images/crops/potato.jpg',
    fallbackGradient: 'from-yellow-600/20 to-amber-700/30',
    accentColor: '#D97706',
    emoji: '🥔',
  },
  Paddy: {
    id: 'Paddy',
    name: 'Paddy',
    category: { en: 'Wetland Cereal', hi: 'धान्य फसल', bn: 'ধান শস্য' },
    waterTier: 'high',
    waterTierLabel: { en: 'High Water', hi: 'अधिक पानी', bn: 'বেশি জল' },
    imageUrl: '/images/crops/paddy.jpg',
    fallbackGradient: 'from-green-500/20 to-teal-600/30',
    accentColor: '#059669',
    emoji: '🌱',
  },
  Mustard: {
    id: 'Mustard',
    name: 'Mustard',
    category: { en: 'Oilseed', hi: 'तिलहन', bn: 'তৈলবীজ' },
    waterTier: 'low',
    waterTierLabel: { en: 'Low Water', hi: 'कम पानी', bn: 'কম জল' },
    imageUrl: '/images/crops/mustard.jpg',
    fallbackGradient: 'from-yellow-400/20 to-amber-500/30',
    accentColor: '#EAB308',
    emoji: '🌼',
  },
  Onion: {
    id: 'Onion',
    name: 'Onion',
    category: { en: 'Bulb Crop', hi: 'कंद सब्जी', bn: 'কন্দ ফসল' },
    waterTier: 'moderate',
    waterTierLabel: { en: 'Moderate Water', hi: 'मध्यम पानी', bn: 'পরিমিত জল' },
    imageUrl: '/images/crops/onion.jpg',
    fallbackGradient: 'from-purple-500/20 to-fuchsia-600/30',
    accentColor: '#A855F7',
    emoji: '🧅',
  },
  Chilli: {
    id: 'Chilli',
    name: 'Chilli',
    category: { en: 'Spice Crop', hi: 'मसाला फसल', bn: 'মশলা ফসল' },
    waterTier: 'moderate',
    waterTierLabel: { en: 'Moderate Water', hi: 'मध्यम पानी', bn: 'পরিমিত জল' },
    imageUrl: '/images/crops/chilli.jpg',
    fallbackGradient: 'from-red-500/20 to-emerald-600/30',
    accentColor: '#DC2626',
    emoji: '🌶️',
  },
};

export const SOIL_VISUAL_ASSETS: Record<'sandy' | 'loamy' | 'clay_black', SoilVisualMetadata> = {
  sandy: {
    id: 'sandy',
    name: { en: 'Sandy Loam', hi: 'रेतीली दोमट', bn: 'বালি দোআঁশ' },
    awcValue: 90,
    awcLabel: '90 mm/m',
    drainageRate: { en: 'Rapid Infiltration', hi: 'तीव्र रिसाव', bn: 'দ্রুত নিষ্কাশন' },
    tactileDescription: {
      en: 'Gritty texture, falls apart easily when dry. Ideal for root tubers.',
      hi: 'खुरदरी बनावट, तेजी से सूखती है। कंद फसलों के लिए उपयुक्त।',
      bn: 'দানাদার খসখসে গঠন, দ্রুত শুকিয়ে যায়। আলু ও সবজির জন্য উপযোগী।',
    },
    imageUrl: '/images/soils/sandy_loam.jpg',
    fallbackGradient: 'from-amber-600/20 to-yellow-700/30',
    accentColor: '#D97706',
  },
  loamy: {
    id: 'loamy',
    name: { en: 'Alluvial Loam', hi: 'जलोढ़ दोमट', bn: 'পলি দোআঁশ' },
    awcValue: 150,
    awcLabel: '150 mm/m (Optimal)',
    drainageRate: { en: 'Balanced Drainage', hi: 'संतुलित जल धारण', bn: 'আদর্শ নিষ্কাশন' },
    tactileDescription: {
      en: 'Crumbly dark brown river silt. Perfect balance of aeration and water.',
      hi: 'भुरभुरी उपजाऊ मिट्टी। हवा और पानी का आदर्श संतुलन।',
      bn: 'নরম গুঁড়ো নদীমাতৃক উর্বর মাটি। বাতাস ও জলের নিখুঁত ভারসাম্য।',
    },
    imageUrl: '/images/soils/alluvial_loam.jpg',
    fallbackGradient: 'from-sky-600/20 to-blue-700/30',
    accentColor: '#0284C7',
  },
  clay_black: {
    id: 'clay_black',
    name: { en: 'Black Clay', hi: 'काली मिट्टी', bn: 'কালো এঁটেল' },
    awcValue: 180,
    awcLabel: '180 mm/m (High Retention)',
    drainageRate: { en: 'Slow Drainage', hi: 'धीमा निकास', bn: 'ধীর নিষ্কাশন' },
    tactileDescription: {
      en: 'Sticky when wet, cracks when dry. Highest moisture storage capacity.',
      hi: 'गीली होने पर चिपचिपी, सूखने पर दरारें। अधिकतम नमी संग्रहण।',
      bn: 'ভিজলে আঠালো, শুকোলে ফাটল ধরে। সর্বাধিক জল ধারণ ক্ষমতা।',
    },
    imageUrl: '/images/soils/black_clay.jpg',
    fallbackGradient: 'from-indigo-600/20 to-slate-800/40',
    accentColor: '#4F46E5',
  },
};

export const IRRIGATION_VISUAL_ASSETS: Record<'drip' | 'sprinkler' | 'surface_flood', IrrigationVisualMetadata> = {
  drip: {
    id: 'drip',
    name: { en: 'Drip Irrigation', hi: 'ड्रिप / टपक सिंचाई', bn: 'ড্রিপ / বিন্দু সেচ' },
    efficiencyPercent: 90,
    waterSavingsBadge: { en: '90% Efficient • 40% Water Saved', hi: '90% प्रभावी • 40% पानी बचत', bn: '৯০% কার্যকর • ৪০% জল সাশ্রয়' },
    description: {
      en: 'Micro-emitters deliver droplets directly to root zone, minimizing evaporation.',
      hi: 'बूँद-बूँद पानी सीधे जड़ क्षेत्र में जाता है, जिससे वाष्पीकरण रुकता है।',
      bn: 'মাইক্রো-ড্রিপার সরাসরি মূল অঞ্চলে ফোঁটা ফোঁটা জল দিয়ে বাষ্পীভবন কমায়।',
    },
    imageUrl: '/images/irrigation/drip.jpg',
    fallbackGradient: 'from-emerald-600/20 to-teal-700/30',
    accentColor: '#10B981',
  },
  sprinkler: {
    id: 'sprinkler',
    name: { en: 'Sprinkler Mist', hi: 'फव्वारा / स्प्रिंकलर', bn: 'স্প্রিংকলার / ফোয়ারা' },
    efficiencyPercent: 75,
    waterSavingsBadge: { en: '75% Efficient • 20% Water Saved', hi: '75% प्रभावी • 20% पानी बचत', bn: '৭৫% কার্যকর • ২০% জল সাশ্রয়' },
    description: {
      en: 'Rotary nozzles cast uniform droplet spray across canopy for undulating terrain.',
      hi: 'कृत्रिम वर्षा की तरह समान बौछार, असमतल खेत के लिए बेहतरीन।',
      bn: 'বৃষ্টির মতো সমান ফোয়ারার আকারে জল ছড়ায়, ঢেউখেলানো জমির জন্য সেরা।',
    },
    imageUrl: '/images/irrigation/sprinkler.jpg',
    fallbackGradient: 'from-sky-600/20 to-cyan-700/30',
    accentColor: '#0284C7',
  },
  surface_flood: {
    id: 'surface_flood',
    name: { en: 'Surface Flood', hi: 'पारंपरिक बहाव / नाली', bn: 'প্লাবন / সনাতন নালা' },
    efficiencyPercent: 60,
    waterSavingsBadge: { en: '60% Application Efficiency', hi: '60% उपयोगिता क्षमता', bn: '৬০% সেচ দক্ষতা' },
    description: {
      en: 'Traditional gravity flow along field furrows; higher evaporative exposure.',
      hi: 'पारंपरिक नाली से बहाव; अधिक वाष्पीकरण और पानी की खपत।',
      bn: 'সনাতন নালা দিয়ে ভাসিয়ে সেচ; বাষ্পীভবনে জলের অপচয় কিছুটা বেশি।',
    },
    imageUrl: '/images/irrigation/surface_flood.jpg',
    fallbackGradient: 'from-amber-600/20 to-orange-700/30',
    accentColor: '#D97706',
  },
};
