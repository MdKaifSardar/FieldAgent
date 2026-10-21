import { SupportedLanguage } from '../adapters/speechAdapter';

export interface LocalizedScript {
  en: string;
  hi: string;
  bn: string;
}

export const FIELD_VOICE_SCRIPTS: Record<string, LocalizedScript> = {
  // --- STEP 1: LOCATION ---
  step1_overview: {
    bn: 'আপনার জমির সঠিক ভৌগোলিক অবস্থান নির্বাচন করুন। এতে আপনার এলাকার প্রকৃত আবহাওয়া ও বৃষ্টির পূর্বাভাস সঠিকভাবে পাওয়া যাবে।',
    hi: 'अपने खेत का सही स्थान चुनें। इससे आपके क्षेत्र के वास्तविक मौसम और बारिश का सटीक पूर्वानुमान मिल सकेगा।',
    en: 'Pinpoint your farm location to fetch hyper-local meteorological and rainfall forecasts.',
  },
  step1_search: {
    bn: 'এখানে আপনার গ্রাম, ব্লক, থানা বা ৬ সংখ্যার পিনকোড লিখে সরাসরি খুঁজে বের করুন।',
    hi: 'यहाँ अपने गाँव, ब्लॉक, तहसील या 6 अंकों का पिनकोड लिखकर खोजें।',
    en: 'Search directly by village name, district, or 6-digit postal pincode.',
  },
  step1_gps: {
    bn: 'আপনার মোবাইল বা ডিভাইসের জিপিএস থেকে সরাসরি এক ক্লিকে সঠিক অক্ষাংশ ও দ্রাঘিমাংশ শনাক্ত করতে এখানে চাপুন।',
    hi: 'अपने मोबाइल या डिवाइस के जीपीएस से एक क्लिक में सही स्थान दर्ज करने के लिए यहाँ दबाएं।',
    en: 'Tap to instantly detect your farm coordinates using your device GPS.',
  },
  step1_map: {
    bn: 'মানচিত্রের ওপর ক্লিক করে বা মার্কারটি টেনে আপনার জমির সঠিক সীমানা ও অবস্থান নির্ধারণ করুন।',
    hi: 'मानचित्र पर क्लिक करके या मार्कर खींचकर अपने खेत का सही स्थान तय करें।',
    en: 'Click on the map or drag the pin to precisely pinpoint your parcel.',
  },

  // --- STEP 2: SOIL TEXTURE ---
  step2_overview: {
    bn: 'আপনার জমির মাটির প্রকার নির্বাচন করুন। মাটির জল ধারণ ক্ষমতার ওপর ভিত্তি করে সেচের পরিমাণ ও সময়সীমা ঠিক হয়।',
    hi: 'अपने खेत की मिट्टी का प्रकार चुनें। मिट्टी की जल धारण क्षमता के आधार पर ही सिंचाई की मात्रा तय होती है।',
    en: 'Select your soil texture. Available Water Capacity determines the exact irrigation depth and depletion buffer.',
  },
  soil_sandy: {
    bn: 'বালি দোআঁশ মাটি হালকা এবং এতে জল খুব দ্রুত নেমে যায়। জল ধারণ ক্ষমতা প্রতি মিটারে ৯০ মিলিমিটার। সবজি ও আলুর জন্য ভালো।',
    hi: 'रेतीली दोमट मिट्टी हल्की होती है और पानी तेजी से नीचे रिसता है। जल धारण क्षमता 90 मिमी है। यह आलू और सब्जियों के लिए उपयुक्त है।',
    en: 'Sandy loam is light and rapidly draining with 90 mm per meter water capacity. Ideal for tubers and vegetables.',
  },
  soil_loamy: {
    bn: 'পলি দোআঁশ বা নদী তীরবর্তী উর্বর মাটি। এতে জল ও বাতাসের নিখুঁত ভারসাম্য থাকে। জল ধারণ ক্ষমতা প্রতি মিটারে ১৫০ মিলিমিটার।',
    hi: 'जलोढ़ दोमट सबसे उपजाऊ मिट्टी है जिसमें पानी और हवा का सही संतुलन रहता है। जल धारण क्षमता 150 मिमी प्रति मीटर है।',
    en: 'Alluvial loam is the ideal agricultural loam with balanced aeration and 150 mm per meter water retention.',
  },
  soil_clay_black: {
    bn: 'কালো এঁটেল মাটি খুব বেশি জল ধরে রাখতে পারে। ধারণ ক্ষমতা প্রতি মিটারে ১৮০ মিলিমিটার। শুকিয়ে গেলে ফাটল ধরে।',
    hi: 'काली चिकनी मिट्टी में पानी सोखने की सर्वाधिक क्षमता होती है। जल धारण क्षमता 180 मिमी है। यह कपास, दलहन और गेहूँ के लिए उत्तम है।',
    en: 'Black clay provides dense water retention at 180 mm per meter. Excellent for cotton, pulses, and wheat.',
  },

  // --- STEP 3: CROPS & MULTI-PLOT ---
  step3_overview: {
    bn: 'আপনার জমিতে লাগানো ফসল, তার বৃদ্ধির পর্যায় এবং এলাকা নির্বাচন করুন। এক জমিতে একাধিক ফসল থাকলে আলাদা সেকশন যোগ করতে পারেন।',
    hi: 'अपने खेत में बोई गई फसल, उसकी विकास अवस्था और रकबा चुनें। यदि एक से अधिक फसलें हैं तो अलग खंड जोड़ें।',
    en: 'Configure your crops, growth stages, and acreage. You can partition your land into multiple intercropped plots.',
  },
  crop_Tomato: {
    bn: 'টমেটো ফসলের ফল বৃদ্ধি ও ফুল আসার সময় নিয়মিত আর্দ্রতা প্রয়োজন। অনিয়মিত সেচ দিলে ফল ফেটে যেতে পারে।',
    hi: 'टमाटर की फसल में फल बनने और फूल आने के समय नियमित नमी जरूरी है। अनियमित सिंचाई से फल फट सकते हैं।',
    en: 'Tomato requires steady root moisture. Irregular watering causes blossom end rot and fruit splitting.',
  },
  crop_Wheat: {
    bn: 'গম একটি প্রধান রবি ফসল। শিকড় বের হওয়া এবং শীষ আসার সময় পর্যাপ্ত সেচ দেওয়া সবচেয়ে জরুরি।',
    hi: 'गेहूँ में मुकुट जड़ बनते समय और बालियाँ निकलते समय सिंचाई सबसे ज्यादा जरूरी होती है।',
    en: 'Wheat is a rabi cereal. Crown root initiation and flowering are the most critical moisture stages.',
  },
  crop_Spinach: {
    bn: 'পালং শাকের শিকড় অগভীর থাকে। পাতা সতেজ রাখতে ঘন ঘন কিন্তু হালকা সেচ দিন।',
    hi: 'पालक की जड़ें उथली होती हैं। पत्तों की गुणवत्ता के लिए बार-बार लेकिन हल्की सिंचाई करें।',
    en: 'Spinach has shallow roots requiring frequent light moisture applications to prevent wilting.',
  },
  crop_Potato: {
    bn: 'আলু ফসলে কন্দ গঠন ও বৃদ্ধির সময় সঠিক আর্দ্রতা বজায় রাখুন। অতিরিক্ত জল জমলে কন্দ পচে যেতে পারে।',
    hi: 'आलू में कंद बनने के समय पर्याप्त नमी जरूरी है, लेकिन जलभराव से कंद सड़ सकते हैं।',
    en: 'Potatoes need consistent moisture during tuber bulking, avoiding waterlogging to prevent rot.',
  },
  crop_Paddy: {
    bn: 'ধান ফসলের জন্য প্রচুর জলের প্রয়োজন। চারা লাগানো এবং ফুল আসার সময় জমিতে আর্দ্রতার স্তর বজায় রাখুন।',
    hi: 'धान की फसल को भरपूर पानी चाहिए। कल्ले फूटते समय और फूल आते समय खेत में पर्याप्त नमी रखें।',
    en: 'Paddy rice requires high water depth. Tillering and panicle development are critical stages.',
  },
  crop_Mustard: {
    bn: 'সরিষায় কম জল লাগে। ফুল আসার আগে এবং শুঁটি বা দানা বাঁধার সময় দুটি হালকা সেচই যথেষ্ট।',
    hi: 'सरसों को कम पानी चाहिए। फूल आने से पहले और दाना भरते समय दो हल्की सिंचाइयाँ पर्याप्त हैं।',
    en: 'Mustard is a low-water oilseed requiring typically two light irrigations at pre-bloom and pod fill.',
  },
  crop_Onion: {
    bn: 'পেঁয়াজের শিকড় অগভীর। কন্দ বৃদ্ধির সময় নিয়মিত জল দিন এবং তোলার ১৫ দিন আগে সেচ বন্ধ করুন।',
    hi: 'प्याज की जड़ें उथली होती हैं। कंद विकास के समय नमी रखें और खुदाई से 15 दिन पहले पानी बंद करें।',
    en: 'Onions have shallow feeder roots. Keep topsoil moist during bulb enlargement and cure before harvest.',
  },
  crop_Chilli: {
    bn: 'লঙ্কা ফসলে পরিমিত জল লাগে। ফুল আসার সময় অতিরিক্ত জল দিলে ফুল ঝরে যেতে পারে।',
    hi: 'मिर्च में संतुलित पानी चाहिए। फूल आने के समय अधिक पानी देने से फूल गिर सकते हैं।',
    en: 'Chilli needs moderate moisture. Excess water during flowering can cause blossom drop.',
  },

  // --- GROWTH STAGES ---
  growth_stage: {
    bn: 'ফসলের বর্তমান বৃদ্ধির অবস্থা বা স্টেজ নির্বাচন করুন—চারা অবস্থা, বৃদ্ধি, ফুল ও ফল, নাকি পাকা অবস্থা।',
    hi: 'फसल की वर्तमान अवस्था चुनें—शुरुआती अंकुरण, बढ़वार, फूल व फल, या पकने की अवस्था।',
    en: 'Select growth stage: initial seedling, vegetative development, mid-season flowering, or late maturity.',
  },

  // --- WATERING / IRRIGATION METHODS ---
  irrigation_drip: {
    bn: 'ড্রিপ বা বিন্দু সেচ সরাসরি শিকড়ে ফোঁটা ফোঁটা জল পৌঁছে দেয়। এতে ৯০ শতাংশ জল বাঁচে এবং সার সরাসরি দেওয়া যায়।',
    hi: 'ड्रिप सिंचाई सीधे पौधे की जड़ों में बूँद-बूँद पानी देती है। यह 90% पानी की बचत करती है।',
    en: 'Drip irrigation delivers targeted water directly to the crop root zone at 90% water application efficiency.',
  },
  irrigation_sprinkler: {
    bn: 'স্প্রিংকলার সেচ বৃষ্টির মতো ফোয়ারার আকারে জল ছড়ায়। ৭৫ শতাংশ কার্যকর এবং অসম জমিতেও চমৎকার কাজ করে।',
    hi: 'फव्वारा सिंचाई कृत्रिम बारिश की तरह समान रूप से पानी देती है। इसकी कार्यक्षमता 75% है।',
    en: 'Sprinkler irrigation sprays overhead droplet mist at 75% efficiency, ideal for undulating terrain.',
  },
  irrigation_surface_flood: {
    bn: 'প্লাবন বা সনাতন নালা দিয়ে ভাসিয়ে সেচ। এতে ৬০ শতাংশ জল পৌঁছায় এবং বাষ্পীভবনে কিছু জল অপচয় হয়।',
    hi: 'पारंपरिक नाली या बहाव सिंचाई। इसमें 60% पानी काम आता है और वाष्पीकरण में अधिक पानी खर्च होता है।',
    en: 'Surface flood furrow irrigation delivers water via open field channels at 60% efficiency.',
  },

  // --- STEP 4: STORAGE & PUMP INFRASTRUCTURE ---
  step4_overview: {
    bn: 'আপনার জমিতে মজুত থাকা জলের উৎস ও ধারণক্ষমতা জানান। এতে কত দিন সেচ চালানো সম্ভব তা নির্ভুল হিসেব করা যাবে।',
    hi: 'अपने खेत के जल भंडार और पंप की जानकारी दें ताकि यह तय हो सके कि कितने दिनों का पानी सुरक्षित है।',
    en: 'Configure your water reserve infrastructure so the engine can calculate your days-of-buffer and deficit alerts.',
  },
  storage_sintex_tank: {
    bn: 'জমিতে বসানো প্লাস্টিক বা সিনটেক্স ট্যাংক। এর মোট ক্ষমতা লিটারে নির্বাচন করুন।',
    hi: 'खेत में रखा सिंटेक्स या पीवीसी पानी का टैंक। इसकी कुल क्षमता लीटर में चुनें।',
    en: 'Overhead or ground-mounted PVC storage tank. Specify total rated volume in liters.',
  },
  storage_custom_sump: {
    bn: 'ইঁট বা কংক্রিটের তৈরি মাটির নিচের পাকা চৌবাচ্চা বা হাউস। এর দৈর্ঘ্য, প্রস্থ ও গভীরতা মিটারে দিন।',
    hi: 'ईंट या कंक्रीट का बना भूमिगत पक्का हौज। इसकी लंबाई, चौड़ाई और गहराई मीटर में दर्ज करें।',
    en: 'Underground masonry reservoir. Enter length, width, and depth in meters to calculate volume.',
  },
  storage_borewell: {
    bn: 'নলকূপ বা বোরওয়েল পাম্প। প্রতিদিন কত ঘণ্টা জল তোলার অনুমতি বা বিদ্যুৎ থাকে তা দিন।',
    hi: 'नलकूप या बोरवेल। बिजली या पानी मिलने के आधार पर दैनिक उपलब्ध घंटे दर्ज करें।',
    en: 'Direct tubewell or borewell pump. Specify daily pumping allowance in hours.',
  },
  pump_hp: {
    bn: 'আপনার সেচ পাম্পের অশ্বশক্তি বা এইচপি নির্বাচন করুন। এতে সেচের সময়কাল ও জল নির্গমনের গতি হিসেব হবে।',
    hi: 'अपने सिंचाई पंप की हॉर्सपावर चुनें ताकि जल प्रवाह और सिंचाई समय की सही गणना हो सके।',
    en: 'Select your pump horsepower rating to calculate flow rate and required irrigation run-time.',
  },
};

/**
 * Helper to fetch localized speech text with graceful fallback
 */
export function getFieldVoiceScript(key: string, lang: SupportedLanguage): string {
  const script = FIELD_VOICE_SCRIPTS[key];
  if (!script) return '';
  return script[lang] || script.en || '';
}
