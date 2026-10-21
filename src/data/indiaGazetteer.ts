import { SupportedLanguage } from '../adapters/speechAdapter';

export interface GeoEntity {
  en: string;
  hi: string;
  bn: string;
}

/**
 * 1. ALL 28 INDIAN STATES & 8 UNION TERRITORIES (100% CANONICAL COVERAGE)
 */
export const INDIAN_STATES: Record<string, GeoEntity> = {
  // 28 States
  'andhra pradesh': { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश', bn: 'অন্ধ্রপ্রদেশ' },
  'arunachal pradesh': { en: 'Arunachal Pradesh', hi: 'अरुणाचल प्रदेश', bn: 'অরুণাচল প্রদেশ' },
  'assam': { en: 'Assam', hi: 'असम', bn: 'আসাম' },
  'bihar': { en: 'Bihar', hi: 'बिहार', bn: 'বিহার' },
  'chhattisgarh': { en: 'Chhattisgarh', hi: 'छत्तीसगढ़', bn: 'ছত্তিশগড়' },
  'goa': { en: 'Goa', hi: 'गोवा', bn: 'গোয়া' },
  'gujarat': { en: 'Gujarat', hi: 'गुजरात', bn: 'গুজরাট' },
  'haryana': { en: 'Haryana', hi: 'हरियाणा', bn: 'হরিয়ানা' },
  'himachal pradesh': { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश', bn: 'হিমাচল প্রদেশ' },
  'jharkhand': { en: 'Jharkhand', hi: 'झारखंड', bn: 'ঝাড়খণ্ড' },
  'karnataka': { en: 'Karnataka', hi: 'कर्नाटक', bn: 'কর্ণাটক' },
  'kerala': { en: 'Kerala', hi: 'केरल', bn: 'কেরালা' },
  'madhya pradesh': { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश', bn: 'মধ্যপ্রদেশ' },
  'maharashtra': { en: 'Maharashtra', hi: 'महाराष्ट्र', bn: 'মহারাষ্ট্র' },
  'manipur': { en: 'Manipur', hi: 'मणिपुर', bn: 'মণিপুর' },
  'meghalaya': { en: 'Meghalaya', hi: 'मेघालय', bn: 'মেঘালয়' },
  'mizoram': { en: 'Mizoram', hi: 'मिजोरम', bn: 'মিজোরাম' },
  'nagaland': { en: 'Nagaland', hi: 'नागालैंड', bn: 'নাগাল্যান্ড' },
  'odisha': { en: 'Odisha', hi: 'ओडिशा', bn: 'ওড়িশা' },
  'orissa': { en: 'Odisha', hi: 'ओडिशा', bn: 'ওড়িশা' },
  'punjab': { en: 'Punjab', hi: 'पंजाब', bn: 'পাঞ্জাব' },
  'rajasthan': { en: 'Rajasthan', hi: 'राजस्थान', bn: 'রাজস্থান' },
  'sikkim': { en: 'Sikkim', hi: 'सिक्किम', bn: 'সিকিম' },
  'tamil nadu': { en: 'Tamil Nadu', hi: 'तमिलनाडु', bn: 'তামিলনাড়ু' },
  'telangana': { en: 'Telangana', hi: 'तेलंगाना', bn: 'তেলেঙ্গানা' },
  'tripura': { en: 'Tripura', hi: 'त्रिपुरा', bn: 'ত্রিপুরা' },
  'uttar pradesh': { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', bn: 'উত্তর প্রদেশ' },
  'uttarakhand': { en: 'Uttarakhand', hi: 'उत्तराखंड', bn: 'উত্তরাখণ্ড' },
  'west bengal': { en: 'West Bengal', hi: 'पश्चिम बंगाल', bn: 'পশ্চিমবঙ্গ' },

  // 8 Union Territories
  'andaman and nicobar islands': { en: 'Andaman and Nicobar', hi: 'अंडमान और निकोबार', bn: 'আন্দামান ও নিকোবর' },
  'chandigarh': { en: 'Chandigarh', hi: 'चंडीगढ़', bn: 'চণ্ডীগড়' },
  'dadra and nagar haveli and daman and diu': { en: 'Dadra and Nagar Haveli', hi: 'दादरा और नगर हवेली', bn: 'দাদরা ও নগর হাভেলি' },
  'delhi': { en: 'Delhi', hi: 'दिल्ली', bn: 'দিল্লি' },
  'national capital territory of delhi': { en: 'Delhi', hi: 'दिल्ली', bn: 'দিল্লি' },
  'jammu and kashmir': { en: 'Jammu and Kashmir', hi: 'जम्मू और कश्मीर', bn: 'জম্মু ও কাশ্মীর' },
  'ladakh': { en: 'Ladakh', hi: 'लद्दाख', bn: 'লাদাখ' },
  'lakshadweep': { en: 'Lakshadweep', hi: 'लक्षद्वीप', bn: 'লক্ষদ্বীপ' },
  'puducherry': { en: 'Puducherry', hi: 'पुदुचेरी', bn: 'পুদুচেরি' },
  'pondicherry': { en: 'Puducherry', hi: 'पुदुचेरी', bn: 'পুদুচেরি' },

  // Country
  'india': { en: 'India', hi: 'भारत', bn: 'ভারত' },
};

/**
 * 2. COMPREHENSIVE INDIAN DISTRICTS (KEY AGRICULTURAL & ALL WEST BENGAL / NORTH / EAST / CENTRAL)
 */
export const INDIAN_DISTRICTS: Record<string, GeoEntity> = {
  // All 23 West Bengal Districts (100% Complete)
  'purba bardhaman': { en: 'Purba Bardhaman', hi: 'पूर्व बर्धमान', bn: 'পূর্ব বর্ধমান' },
  'paschim bardhaman': { en: 'Paschim Bardhaman', hi: 'पश्चिम बर्धमान', bn: 'পশ্চিম বর্ধমান' },
  'bardhaman': { en: 'Purba Bardhaman', hi: 'पूर्व बर्धमान', bn: 'পূর্ব বর্ধমান' },
  'south 24 parganas': { en: 'South 24 Parganas', hi: 'दक्षिण २४ परगना', bn: 'দক্ষিণ ২৪ পরগনা' },
  'north 24 parganas': { en: 'North 24 Parganas', hi: 'उत्तर २४ परगना', bn: 'উত্তর ২৪ পরগনা' },
  'hooghly': { en: 'Hooghly', hi: 'हुगली', bn: 'হুগলি' },
  'hugli': { en: 'Hooghly', hi: 'हुगली', bn: 'হুগলি' },
  'howrah': { en: 'Howrah', hi: 'हावड़ा', bn: 'হাওড়া' },
  'haora': { en: 'Howrah', hi: 'हावड़ा', bn: 'হাওড়া' },
  'kolkata': { en: 'Kolkata', hi: 'कोलकाता', bn: 'কলকাতা' },
  'nadia': { en: 'Nadia', hi: 'नदिया', bn: 'নদিয়া' },
  'murshidabad': { en: 'Murshidabad', hi: 'मुर्शिदाबाद', bn: 'মুর্শিদাবাদ' },
  'birbhum': { en: 'Birbhum', hi: 'बीरभूम', bn: 'বীরভূম' },
  'bankura': { en: 'Bankura', hi: 'बांकुड़ा', bn: 'বাঁকুড়া' },
  'purulia': { en: 'Purulia', hi: 'पुरुलिया', bn: 'পুরুলিয়া' },
  'puruliya': { en: 'Purulia', hi: 'पुरुलिया', bn: 'পুরুলিয়া' },
  'paschim medinipur': { en: 'Paschim Medinipur', hi: 'पश्चिम मेदिनीपुर', bn: 'পশ্চিম মেদিনীপুর' },
  'purba medinipur': { en: 'Purba Medinipur', hi: 'पूर्व मेदिनीपुर', bn: 'পূর্ব মেদিনীপুর' },
  'medinipur': { en: 'Medinipur', hi: 'मेदिनीपुर', bn: 'মেদিনীপুর' },
  'jhargram': { en: 'Jhargram', hi: 'झाड़ग्राम', bn: 'ঝাড়গ্রাম' },
  'malda': { en: 'Malda', hi: 'मालदा', bn: 'মালদা' },
  'maldah': { en: 'Malda', hi: 'मालदा', bn: 'মালদা' },
  'uttar dinajpur': { en: 'Uttar Dinajpur', hi: 'उत्तर दिनाजपुर', bn: 'উত্তর দিনাজপুর' },
  'dakshin dinajpur': { en: 'Dakshin Dinajpur', hi: 'दक्षिण दिनाजपुर', bn: 'দক্ষিণ দিনাজপুর' },
  'jalpaiguri': { en: 'Jalpaiguri', hi: 'जलपाईगुड़ी', bn: 'জলপাইগুড়ি' },
  'alipurduar': { en: 'Alipurduar', hi: 'अलीपुरद्वार', bn: 'আলিপুরদুয়ার' },
  'cooch behar': { en: 'Cooch Behar', hi: 'कूचबिहार', bn: 'কোচবিহার' },
  'koch bihar': { en: 'Cooch Behar', hi: 'कूचबिहार', bn: 'কোচবিহার' },
  'darjeeling': { en: 'Darjeeling', hi: 'दार्जिलिंग', bn: 'দার্জিলিং' },
  'kalimpong': { en: 'Kalimpong', hi: 'कालिम्पोंग', bn: 'কালিম্পং' },

  // Key Agricultural Hubs: Bihar
  'patna': { en: 'Patna', hi: 'पटना', bn: 'পাটনা' },
  'gaya': { en: 'Gaya', hi: 'गया', bn: 'গয়া' },
  'muzaffarpur': { en: 'Muzaffarpur', hi: 'मुजफ्फरपुर', bn: 'মুজাফফরপুর' },
  'bhagalpur': { en: 'Bhagalpur', hi: 'भागलपुर', bn: 'ভাগলপুর' },
  'darbhanga': { en: 'Darbhanga', hi: 'दरभंगा', bn: 'দ্বারভাঙা' },
  'purnia': { en: 'Purnia', hi: 'पूर्णिया', bn: 'পূর্ণিয়া' },
  'rohtas': { en: 'Rohtas', hi: 'रोहतास', bn: 'রোহতাস' },
  'samastipur': { en: 'Samastipur', hi: 'समस्तीपुर', bn: 'সমস্তিপুর' },
  'nalanda': { en: 'Nalanda', hi: 'नालंदा', bn: 'নালন্দা' },
  'begusarai': { en: 'Begusarai', hi: 'बेगूसराय', bn: 'বেগুসরাই' },

  // Key Agricultural Hubs: Uttar Pradesh
  'lucknow': { en: 'Lucknow', hi: 'लखनऊ', bn: 'লখনউ' },
  'varanasi': { en: 'Varanasi', hi: 'वाराणसी', bn: 'বারাণসী' },
  'kanpur': { en: 'Kanpur', hi: 'कानपुर', bn: 'কানপুর' },
  'prayagraj': { en: 'Prayagraj', hi: 'प्रयागराज', bn: 'প্রয়াগরাজ' },
  'allahabad': { en: 'Prayagraj', hi: 'प्रयागराज', bn: 'প্রয়াগরাজ' },
  'agra': { en: 'Agra', hi: 'आगरा', bn: 'আগ্রা' },
  'meerut': { en: 'Meerut', hi: 'मेरठ', bn: 'মিরাট' },
  'gorakhpur': { en: 'Gorakhpur', hi: 'गोरखपुर', bn: 'গোরখপুর' },
  'ayodhya': { en: 'Ayodhya', hi: 'अयोध्या', bn: 'অযোধ্যা' },
  'aligarh': { en: 'Aligarh', hi: 'अलीगढ़', bn: 'আলিগড়' },
  'bareilly': { en: 'Bareilly', hi: 'बरेली', bn: 'বেরেলি' },
  'moradabad': { en: 'Moradabad', hi: 'मुरादाबाद', bn: 'মুরাদাবাদ' },
  'jhansi': { en: 'Jhansi', hi: 'झांसी', bn: 'ঝাঁসি' },
  'mathura': { en: 'Mathura', hi: 'मथुरा', bn: 'মথুরা' },

  // Key Agricultural Hubs: Punjab & Haryana
  'ludhiana': { en: 'Ludhiana', hi: 'लुधियाना', bn: 'লুধিয়ানা' },
  'amritsar': { en: 'Amritsar', hi: 'अमृतसर', bn: 'অমৃতসর' },
  'jalandhar': { en: 'Jalandhar', hi: 'जालंधर', bn: 'জলন্ধর' },
  'patiala': { en: 'Patiala', hi: 'पटियाला', bn: 'পাতিয়ালা' },
  'bathinda': { en: 'Bathinda', hi: 'बठिंडा', bn: 'ভাটিণ্ডা' },
  'karnal': { en: 'Karnal', hi: 'करनाल', bn: 'করনাল' },
  'hisar': { en: 'Hisar', hi: 'हिसार', bn: 'হিসার' },
  'ambala': { en: 'Ambala', hi: 'अंबाला', bn: 'আম্বালা' },
  'kurukshetra': { en: 'Kurukshetra', hi: 'कुरुक्षेत्र', bn: 'কুরুক্ষেত্র' },
  'rohtak': { en: 'Rohtak', hi: 'रोहतक', bn: 'রোহতক' },

  // Key Agricultural Hubs: Maharashtra
  'nashik': { en: 'Nashik', hi: 'नासिक', bn: 'নাসিক' },
  'pune': { en: 'Pune', hi: 'पुणे', bn: 'পুনে' },
  'nagpur': { en: 'Nagpur', hi: 'नागपुर', bn: 'নাগপুর' },
  'solapur': { en: 'Solapur', hi: 'सोलापुर', bn: 'সোলাপুর' },
  'aurangabad': { en: 'Chhatrapati Sambhajinagar', hi: 'छत्रपति संभाजीनगर', bn: 'ছত্রপতি সম্ভাজিনগর' },
  'chhatrapati sambhajinagar': { en: 'Chhatrapati Sambhajinagar', hi: 'छत्रपति संभाजीनगर', bn: 'ছত্রপতি সম্ভাজিনগর' },
  'kolhapur': { en: 'Kolhapur', hi: 'कोल्हापुर', bn: 'কোলহাপুর' },
  'satara': { en: 'Satara', hi: 'सतारा', bn: 'সাতারা' },
  'ahmednagar': { en: 'Ahmednagar', hi: 'अहमदनगर', bn: 'আহমেদনগর' },

  // Key Agricultural Hubs: Madhya Pradesh & Rajasthan
  'indore': { en: 'Indore', hi: 'इंदौर', bn: 'ইন্দোর' },
  'bhopal': { en: 'Bhopal', hi: 'भोपाल', bn: 'ভোপাল' },
  'ujjain': { en: 'Ujjain', hi: 'उज्जैन', bn: 'উজ্জয়িনী' },
  'gwalior': { en: 'Gwalior', hi: 'ग्वालियर', bn: 'গোয়ালিয়র' },
  'jabalpur': { en: 'Jabalpur', hi: 'जबलपुर', bn: 'জবলপুর' },
  'jaipur': { en: 'Jaipur', hi: 'जयपुर', bn: 'জয়পুর' },
  'jodhpur': { en: 'Jodhpur', hi: 'जोधपुर', bn: 'যোধপুর' },
  'kota': { en: 'Kota', hi: 'कोटा', bn: 'কোটা' },
  'udaipur': { en: 'Udaipur', hi: 'उदयपुर', bn: 'উদয়পুর' },
  'bikaner': { en: 'Bikaner', hi: 'बीकानेर', bn: 'বিকানের' },
  'ganganagar': { en: 'Sri Ganganagar', hi: 'श्रीगंगानगर', bn: 'শ্রী গঙ্গানগর' },

  // Key Agricultural Hubs: Gujarat
  'ahmedabad': { en: 'Ahmedabad', hi: 'अहमदाबाद', bn: 'আহমেদাবাদ' },
  'surat': { en: 'Surat', hi: 'सूरत', bn: 'সুরাত' },
  'vadodara': { en: 'Vadodara', hi: 'वडोदरा', bn: 'ভদোদরা' },
  'rajkot': { en: 'Rajkot', hi: 'राजकोट', bn: 'রাজকোট' },
  'anand': { en: 'Anand', hi: 'आणंद', bn: 'আনন্দ' },
  'mehsana': { en: 'Mehsana', hi: 'मेहसाणा', bn: 'মেহসানা' },

  // Key Agricultural Hubs: South India
  'kurnool': { en: 'Kurnool', hi: 'कुर्नूल', bn: 'কুরনুল' },
  'guntur': { en: 'Guntur', hi: 'गुंटूर', bn: 'গুন্টুর' },
  'thanjavur': { en: 'Thanjavur', hi: 'तंजावुर', bn: 'তাঞ্জাভুর' },
  'coimbatore': { en: 'Coimbatore', hi: 'कोयंबटूर', bn: 'কোয়েম্বাটোর' },
  'mandya': { en: 'Mandya', hi: 'मंड्या', bn: 'মান্ডিয়া' },
  'belagavi': { en: 'Belagavi', hi: 'बेलगावी', bn: 'বেলাগাভি' },
  'warangal': { en: 'Warangal', hi: 'वारंगल', bn: 'ওয়ারাঙ্গল' },
  'palakkad': { en: 'Palakkad', hi: 'पलक्कड़', bn: 'পালাক্কাড়' },

  // Key Agricultural Hubs: Odisha & Jharkhand
  'cuttack': { en: 'Cuttack', hi: 'कटक', bn: 'কটক' },
  'bhubaneswar': { en: 'Bhubaneswar', hi: 'भुवनेश्वर', bn: 'ভুবনেশ্বর' },
  'balasore': { en: 'Balasore', hi: 'बालेश्वर', bn: 'বালেশ্বর' },
  'sambalpur': { en: 'Sambalpur', hi: 'संबलपुर', bn: 'সম্বলপুর' },
  'ranchi': { en: 'Ranchi', hi: 'रांची', bn: 'রাঁচি' },
  'dhanbad': { en: 'Dhanbad', hi: 'धनबाद', bn: 'ধানবাদ' },
  'hazaribagh': { en: 'Hazaribagh', hi: 'हजारीबाग', bn: 'হাজারিবাগ' },
};

/**
 * 3. HISTORICAL & POPULAR ALIASES (COLONIAL / ALTERNATE SPELLINGS)
 */
export const DISTRICT_ALIASES: Record<string, string> = {
  'burdwan': 'purba bardhaman',
  'east burdwan': 'purba bardhaman',
  'west burdwan': 'paschim bardhaman',
  'midnapore': 'medinipur',
  'west midnapore': 'paschim medinipur',
  'east midnapore': 'purba medinipur',
  'calcutta': 'kolkata',
  'baroda': 'vadodara',
  'benares': 'varanasi',
  'banaras': 'varanasi',
  'cawnpore': 'kanpur',
  'poona': 'pune',
  'nasik': 'nashik',
  'waltair': 'visakhapatnam',
  'orissa': 'odisha',
  'trivandrum': 'thiruvananthapuram',
  'bangalore': 'bengaluru',
  'madras': 'chennai',
};

/**
 * Normalizes input string for reliable gazetteer matching
 */
function normalizeKey(str: string): string {
  return str.trim().toLowerCase().replace(/^(district|zilla|zila|of)\s+/i, '').replace(/\s+(district|zilla|zila)$/i, '');
}

/**
 * Resolves any Indian State name into the requested language
 */
export function resolveState(stateName: string | undefined | null, lang: SupportedLanguage): string {
  if (!stateName) return lang === 'hi' ? 'भारत' : lang === 'bn' ? 'ভারত' : 'India';
  if (lang === 'en') return stateName;

  const key = normalizeKey(stateName);
  const matched = INDIAN_STATES[key];
  if (matched) return matched[lang];

  // Partial match check
  for (const [k, entity] of Object.entries(INDIAN_STATES)) {
    if (key.includes(k) || k.includes(key)) {
      return entity[lang];
    }
  }

  return stateName;
}

/**
 * Resolves any Indian District (or legacy alias) into the requested language
 */
export function resolveDistrict(districtName: string | undefined | null, lang: SupportedLanguage): string {
  if (!districtName) return '';
  if (lang === 'en') return districtName;

  const clean = normalizeKey(districtName);

  // Check alias table first (e.g. Burdwan -> Purba Bardhaman)
  const canonicalKey = DISTRICT_ALIASES[clean] || clean;

  const matched = INDIAN_DISTRICTS[canonicalKey];
  if (matched) return matched[lang];

  // Substring search for composite names
  for (const [k, entity] of Object.entries(INDIAN_DISTRICTS)) {
    if (canonicalKey.includes(k) || k.includes(canonicalKey)) {
      return entity[lang];
    }
  }

  return districtName;
}

/**
 * Parses a standard Indian address string (e.g., "Raina - I, Purba Bardhaman, West Bengal")
 * and localizes all administrative boundaries cleanly using the gazetteer.
 */
export function localizeAddressWithGazetteer(addressStr: string | undefined | null, lang: SupportedLanguage): string {
  if (!addressStr) {
    return lang === 'hi' ? 'स्थान निर्धारित' : lang === 'bn' ? 'অবস্থান নির্ধারিত' : 'Location Set';
  }
  if (lang === 'en') return addressStr;

  let result = addressStr;

  // 1. Localize States
  for (const [k, entity] of Object.entries(INDIAN_STATES)) {
    const regex = new RegExp(`\\b${entity.en}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, entity[lang]);
    }
  }

  // 2. Localize Districts & Aliases
  for (const [k, entity] of Object.entries(INDIAN_DISTRICTS)) {
    const regex = new RegExp(`\\b${entity.en}\\b`, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, entity[lang]);
    }
  }

  // Check aliases (e.g., if address contains "Burdwan")
  for (const [alias, canonical] of Object.entries(DISTRICT_ALIASES)) {
    const targetEntity = INDIAN_DISTRICTS[canonical];
    if (targetEntity) {
      const aliasRegex = new RegExp(`\\b${alias}\\b`, 'gi');
      if (aliasRegex.test(result)) {
        result = result.replace(aliasRegex, targetEntity[lang]);
      }
    }
  }

  // 3. Localize Administrative Terms
  if (lang === 'hi') {
    result = result.replace(/\bDistrict\b/gi, 'जिला');
    result = result.replace(/\bBlock\b/gi, 'प्रखंड');
    result = result.replace(/\bVillage\b/gi, 'गांव');
  } else if (lang === 'bn') {
    result = result.replace(/\bDistrict\b/gi, 'জেলা');
    result = result.replace(/\bBlock\b/gi, 'ব্লক');
    result = result.replace(/\bVillage\b/gi, 'গ্রাম');
  }

  return result;
}
