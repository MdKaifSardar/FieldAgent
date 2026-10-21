import { SupportedLanguage } from '../adapters/speechAdapter';
import { localizeAddressWithGazetteer } from '../data/indiaGazetteer';

// 1. CROPS MAPPING
const CROP_MAP: Record<string, { hi: string; bn: string }> = {
  wheat: { hi: 'गेहूं', bn: 'গম' },
  paddy: { hi: 'धान', bn: 'ধান' },
  rice: { hi: 'धान', bn: 'ধান' },
  tomato: { hi: 'टमाटर', bn: 'টমেটো' },
  spinach: { hi: 'पालक', bn: 'পালং শাক' },
  potato: { hi: 'आलू', bn: 'আলু' },
  mustard: { hi: 'सरसों', bn: 'সরিষা' },
  onion: { hi: 'प्याज', bn: 'পেঁয়াজ' },
  maize: { hi: 'मक्का', bn: 'ভুট্টা' },
  corn: { hi: 'मक्का', bn: 'ভুট্টা' },
  chilli: { hi: 'मिर्च', bn: 'লঙ্কা' },
  pepper: { hi: 'मिर्च', bn: 'লঙ্কা' },
  brinjal: { hi: 'बैंगन', bn: 'বেগুন' },
  eggplant: { hi: 'बैंगन', bn: 'বেগুন' },
  gram: { hi: 'चना', bn: 'ছোলা' },
  chickpea: { hi: 'चना', bn: 'ছোলা' },
  cotton: { hi: 'कपास', bn: 'তুলা' },
  sugarcane: { hi: 'गन्ना', bn: 'আখ' },
  crop: { hi: 'फसल', bn: 'ফসল' },
};

export function localizeCrop(cropName: string | undefined | null, lang: SupportedLanguage): string {
  if (!cropName) return lang === 'hi' ? 'फसल' : lang === 'bn' ? 'ফসল' : 'Crop';
  if (lang === 'en') return cropName;

  const key = cropName.trim().toLowerCase();
  if (CROP_MAP[key]) {
    return CROP_MAP[key][lang];
  }

  // Check partial match (e.g., "Wheat (Rabi)" -> "गेहूं (Rabi)")
  for (const [k, v] of Object.entries(CROP_MAP)) {
    if (key.includes(k)) {
      return cropName.replace(new RegExp(k, 'gi'), v[lang]);
    }
  }

  return cropName;
}

// 2. SOIL TEXTURES MAPPING
const SOIL_MAP: Record<string, { hi: string; bn: string }> = {
  loamy: { hi: 'दोमट मिट्टी', bn: 'দোআঁশ মাটি' },
  'loamy soil': { hi: 'दोमट मिट्टी', bn: 'দোআঁশ মাটি' },
  alluvial: { hi: 'जलोढ़ दोमट मिट्टी', bn: 'পলি দোআঁশ মাটি' },
  'alluvial soil': { hi: 'जलोढ़ दोमट मिट्टी', bn: 'পলি দোআঁশ মাটি' },
  clayey: { hi: 'चिकनी मिट्टी', bn: 'এঁটেল মাটি' },
  'clayey soil': { hi: 'चिकनी मिट्टी', bn: 'এঁটেল মাটি' },
  black_clay: { hi: 'काली चिकनी मिट्टी', bn: 'কালো এঁটেল মাটি' },
  sandy: { hi: 'बलुई मिट्टी', bn: 'বেলে মাটি' },
  'sandy soil': { hi: 'बलुई मिट्टी', bn: 'বেলে মাটি' },
  sandy_loam: { hi: 'बलुई दोमट मिट्टी', bn: 'বেলে দোআঁশ মাটি' },
  'sandy loam': { hi: 'बलुई दोमट मिट्टी', bn: 'বেলে দোআঁশ মাটি' },
  red: { hi: 'लाल मिट्टी', bn: 'লাল মাটি' },
  'red soil': { hi: 'लाल मिट्टी', bn: 'লাল মাটি' },
};

export function localizeSoil(soilTexture: string | undefined | null, lang: SupportedLanguage): string {
  if (!soilTexture) return lang === 'hi' ? 'दोमट मिट्टी' : lang === 'bn' ? 'দোআঁশ মাটি' : 'Loamy Soil';
  if (lang === 'en') {
    return soilTexture.toLowerCase().endsWith('soil') ? soilTexture : `${soilTexture} Soil`;
  }

  const key = soilTexture.trim().toLowerCase();
  if (SOIL_MAP[key]) {
    return SOIL_MAP[key][lang];
  }

  for (const [k, v] of Object.entries(SOIL_MAP)) {
    if (key.includes(k)) {
      return v[lang];
    }
  }

  return lang === 'hi' ? `${soilTexture} मिट्टी` : lang === 'bn' ? `${soilTexture} মাটি` : `${soilTexture} Soil`;
}

// 3. GROWTH STAGE MAPPING
const STAGE_MAP: Record<string, { hi: string; bn: string; en: string }> = {
  initial: { hi: 'प्रारंभिक अवस्था', bn: 'প্রাথমিক পর্যায়', en: 'Initial Stage' },
  development: { hi: 'विकास अवस्था', bn: 'বর্ধনশীল পর্যায়', en: 'Development Stage' },
  mid_season: { hi: 'मध्य मौसम अवस्था', bn: 'ফসলের মধ্যবর্তী পর্যায়', en: 'Mid-Season' },
  midseason: { hi: 'मध्य मौसम अवस्था', bn: 'ফসলের মধ্যবর্তী পর্যায়', en: 'Mid-Season' },
  late_season: { hi: 'पकने की अवस्था', bn: 'ফসল কাটার পূর্ব পর্যায়', en: 'Late Season / Maturity' },
  lateseason: { hi: 'पकने की अवस्था', bn: 'ফসল কাটার পূর্ব পর্যায়', en: 'Late Season / Maturity' },
  growing: { hi: 'बढ़त पर', bn: 'বর্ধনশীল', en: 'Growing' },
};

export function localizeGrowthStage(stage: string | undefined | null, lang: SupportedLanguage): string {
  if (!stage) return lang === 'hi' ? 'मध्य मौसम अवस्था' : lang === 'bn' ? 'ফসলের মধ্যবর্তী পর্যায়' : 'Mid-Season';
  const key = stage.trim().toLowerCase();
  if (STAGE_MAP[key]) {
    return STAGE_MAP[key][lang];
  }
  return stage;
}

// 4. STORAGE INFRASTRUCTURE LABELS
export function localizeStorageType(
  type: string | undefined | null,
  lang: SupportedLanguage,
  hp?: number
): string {
  const pumpHp = hp || 5;
  switch (type) {
    case 'borewell_hours':
      if (lang === 'hi') return `${pumpHp} एचपी नलकूप / बोरवेल`;
      if (lang === 'bn') return `${pumpHp} এইচপি নলকূপ / বোরওয়েল`;
      return `${pumpHp} HP Tube-well`;
    case 'custom_sump':
      if (lang === 'hi') return 'पक्का हौज / तालाब';
      if (lang === 'bn') return 'পাকা হাউজ / পুকুর';
      return 'Masonry Sump / Pond';
    case 'sintex_tank':
    default:
      if (lang === 'hi') return 'ओवरहेड सिंटेक्स टैंक';
      if (lang === 'bn') return 'ওভারহেড সিনটেক্স ট্যাংক';
      return 'Overhead Tank (Sintex)';
  }
}

// 5. GEOGRAPHIC ENTITIES RESOLUTION VIA CANONICAL INDIA GAZETTEER

export function localizeLocation(locationStr: string | undefined | null, lang: SupportedLanguage): string {
  return localizeAddressWithGazetteer(locationStr, lang);
}

// 6. METEOROLOGICAL SOURCE FEEDS
const SOURCE_FEED_MAP: Record<string, { hi: string; bn: string }> = {
  'Open-Meteo Meteorological Feed': {
    hi: 'ओपन-मेटियो मौसम पूर्वानुमान फीड',
    bn: 'ওপেন-মেটিও আবহাওয়া পূর্বাভাস ফিড',
  },
  'Open-Meteo High-Resolution Numerical Model': {
    hi: 'ओपन-मेटियो हाई-रेजोल्यूशन मॉडल',
    bn: 'ওপেন-মেটিও হাই-রেজোলিউশন মডেল',
  },
  'Open-Meteo ECMWF High-Res Grid': {
    hi: 'ओपन-मेटियो ईसीएमडब्ल्यूएफ ग्रिड',
    bn: 'ওপেন-মেটিও ইসিএমডাব্লুএফ গ্রিড',
  },
  'Penman-Monteith Solar': {
    hi: 'पेनमैन-मोंटेथ सौर मॉडल',
    bn: 'পেনম্যান-মন্টেথ সৌর মডেল',
  },
};

export function localizeSourceFeed(feedStr: string | undefined | null, lang: SupportedLanguage): string {
  if (!feedStr) return '';
  if (lang === 'en') return feedStr;

  const key = feedStr.trim();
  if (SOURCE_FEED_MAP[key]) {
    return SOURCE_FEED_MAP[key][lang];
  }

  let result = feedStr;
  for (const [enTerm, trans] of Object.entries(SOURCE_FEED_MAP)) {
    if (result.includes(enTerm)) {
      result = result.replace(enTerm, trans[lang]);
    }
  }
  return result;
}

// 7. DEFAULT FIELD / PARCEL TITLES (e.g. "Wheat Field (Local Parcel)")
export function localizeFieldTitle(title: string | undefined | null, lang: SupportedLanguage): string {
  if (!title) return '';
  if (lang === 'en') return title;

  let localized = title;

  // Localize phrases before individual words
  localized = localized.replace(/\bLocal Parcel\b/g, lang === 'hi' ? 'स्थानीय खेत' : 'স্থানীয় পার্সেল');
  localized = localized.replace(/\bField\b/g, lang === 'hi' ? 'खेत' : 'জমি');
  localized = localized.replace(/\bParcel\b/g, lang === 'hi' ? 'खेत' : 'পার্সেল');

  // Localize crops within title
  for (const [k, v] of Object.entries(CROP_MAP)) {
    const capitalized = k.charAt(0).toUpperCase() + k.slice(1);
    if (localized.includes(capitalized)) {
      localized = localized.replace(new RegExp(capitalized, 'g'), v[lang]);
    }
  }

  // Localize district within parentheses (e.g. "(South 24 Parganas)" -> "(দক্ষিণ ২৪ পরগনা)")
  localized = localizeLocation(localized, lang);

  return localized;
}

// 8. IRRIGATION METHODS
export function localizeIrrigationMethod(method: string | undefined | null, lang: SupportedLanguage): string {
  const m = (method || 'surface_flood').toLowerCase();
  switch (m) {
    case 'drip':
      return lang === 'hi' ? 'ड्रिप (टपक) सेच' : lang === 'bn' ? 'ড্রিপ সেচ' : 'DRIP';
    case 'sprinkler':
      return lang === 'hi' ? 'फव्वारा (स्प्रिंकलर)' : lang === 'bn' ? 'স্প্রিংকলার সেচ' : 'SPRINKLER';
    case 'surface_flood':
    case 'flood':
    default:
      return lang === 'hi' ? 'पारंपरिक नाली / बहाव' : lang === 'bn' ? 'প্লাবন / ভাসিয়ে সেচ' : 'SURFACE_FLOOD';
  }
}

// 9. CONFIDENCE & ACTION WINDOW
export function localizeConfidence(conf: string | undefined | null, lang: SupportedLanguage): string {
  const c = (conf || 'HIGH').toUpperCase();
  if (lang === 'hi') {
    if (c === 'HIGH') return 'उच्च (विश्वसनीय)';
    if (c === 'MEDIUM') return 'मध्यम';
    return 'सामान्य';
  }
  if (lang === 'bn') {
    if (c === 'HIGH') return 'উচ্চ (নির্ভরযোগ্য)';
    if (c === 'MEDIUM') return 'মাঝারি';
    return 'সাধারণ';
  }
  return c;
}

export function localizeActionWindow(window: string | undefined | null, lang: SupportedLanguage): string {
  if (!window) return '';
  if (lang === 'en') return window;

  // 1. Critical stress deadline template: "Critical stress deadline in 0 hours"
  const stressMatch = window.match(/Critical stress deadline in (\d+) hours?/i);
  if (stressMatch) {
    const hours = parseInt(stressMatch[1], 10);
    if (lang === 'bn') {
      return hours === 0
        ? 'সংকটজনক চাপের সময়সীমা: অবিলম্বে (০ ঘণ্টা)'
        : `${hours} ঘণ্টার মধ্যে সংকটজনক চাপের সময়সীমা`;
    }
    if (lang === 'hi') {
      return hours === 0
        ? 'गंभीर तनाव: तत्काल (0 घंटे)'
        : `${hours} घंटे में गंभीर तनाव की समयसीमा`;
    }
  }

  // 2. Post-rainfall reassessment: "Reassess within 24–36 hours post-rainfall"
  if (window.includes('post-rainfall') || window.includes('post-rain')) {
    return lang === 'hi' ? 'बारिश के बाद 24–36 घंटे में पुनः जांचें' : 'বৃষ্টির পর ২৪–৩৬ ঘণ্টার মধ্যে পুনরায় পর্যালোচনা';
  }

  // 3. Application window: "Apply within 12–24 hours"
  if (window.includes('Apply within') || window.includes('12–24') || window.includes('12-24')) {
    return lang === 'hi' ? '12–24 घंटे के भीतर सिंचाई करें' : '১২–২৪ ঘণ্টার মধ্যে সেচ প্রয়োগ করুন';
  }

  // 4. Safe buffer: "Safe for the next 48 hours"
  if (window.includes('48 hours') || window.includes('48h')) {
    return lang === 'hi' ? 'अगले 48 घंटों तक सुरक्षित' : 'পরবর্তী ৪৮ ঘণ্টার জন্য নিরাপদ';
  }
  if (window.includes('24 hours') || window.includes('24h')) {
    return lang === 'hi' ? 'अगले 24 घंटे में आवश्यक' : 'পরবর্তী ২৪ ঘণ্টায় প্রয়োজনীয়';
  }
  if (window.includes('12 hours') || window.includes('12h')) {
    return lang === 'hi' ? 'अति आवश्यक: 12 घंटे' : 'জরুরি: ১২ ঘণ্টার মধ্যে';
  }
  if (window.includes('Morning') || window.includes('morning')) {
    return lang === 'hi' ? 'सुबह के समय अनुकूल' : 'সকালের অনুকূল সময়';
  }

  return window;
}

// 9b. AGRONOMIC CONFIDENCE REASON
export function localizeConfidenceReason(
  reason: string | undefined | null,
  lang: SupportedLanguage
): string {
  if (!reason) return '';
  if (lang === 'en') return reason;

  // 1. Available reserve shortfall
  if (reason.includes('Available tank/reserve volume is insufficient')) {
    return lang === 'hi'
      ? 'उपलब्ध जल भंडार/टैंक जड़ क्षेत्र की पूरी आवश्यकता पूरी करने के लिए अपर्याप्त है।'
      : 'মজুত জল/ট্যাঙ্কের ধারণক্ষমতা ফসলের মূল অঞ্চলের সম্পূর্ণ চাহিদা মেটাতে অপ্রতুল।';
  }

  // 2. Incoming rain forecast (regex parameterized)
  const rainMatch = reason.match(/Rain forecast is (\d+)% probable \((\d+(?:\.\d+)?) mm expected\)\.?/i);
  if (rainMatch) {
    const prob = rainMatch[1];
    const mm = rainMatch[2];
    return lang === 'hi'
      ? `बारिश का पूर्वानुमान: ${prob}% संभावना (${mm} मिमी अपेक्षित)।`
      : `বৃষ্টির পূর্বাভাস: ${prob}% সম্ভাবনা (${mm} মিমি প্রত্যাশিত)।`;
  }

  // 3. Root-zone depletion approaching RAW threshold
  if (reason.includes('Root-zone depletion has reached') || reason.includes('rapidly approaching')) {
    return lang === 'hi'
      ? 'जड़ क्षेत्र में नमी की कमी फसल के तनाव स्तर तक पहुंच चुकी है या तेजी से पहुंच रही है।'
      : 'শিকড় অঞ্চলের আর্দ্রতা হ্রাস ফসলের চরম সংকট সীমায় পৌঁছেছে বা দ্রুত পৌঁছাচ্ছে।';
  }

  // 4. Safe moisture buffer
  if (reason.includes('adequate moisture buffer above critical stress')) {
    return lang === 'hi'
      ? 'सभी फसल भूखंडों में गंभीर तनाव स्तर से ऊपर पर्याप्त नमी का बफर है।'
      : 'সকল প্লটেই সংকটজনক স্তরের চেয়ে পর্যাপ্ত আর্দ্রতা সংরক্ষিত আছে।';
  }

  return reason;
}

// 10. WEEKDAY LOCALIZATION
const WEEKDAY_MAP: Record<number, { hi: string; bn: string; en: string }> = {
  0: { hi: 'रवि', bn: 'রবি', en: 'Sun' },
  1: { hi: 'सोम', bn: 'সোম', en: 'Mon' },
  2: { hi: 'मंगल', bn: 'মঙ্গল', en: 'Tue' },
  3: { hi: 'बुध', bn: 'বুধ', en: 'Wed' },
  4: { hi: 'गुरु', bn: 'বৃহঃ', en: 'Thu' },
  5: { hi: 'शुक्र', bn: 'শুক্র', en: 'Fri' },
  6: { hi: 'शनि', bn: 'শনি', en: 'Sat' },
};

export function localizeWeekday(dateStr: string, lang: SupportedLanguage): string {
  const date = new Date(dateStr);
  const dayIndex = isNaN(date.getDay()) ? 0 : date.getDay();
  return WEEKDAY_MAP[dayIndex]?.[lang] || WEEKDAY_MAP[dayIndex]?.en || 'Day';
}
