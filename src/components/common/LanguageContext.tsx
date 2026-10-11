'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../../adapters/speechAdapter';

export interface Translations {
  appName: string;
  tagline: string;
  overview: string;
  fieldAdvisor: string;
  signIn: string;
  signOut: string;
  setUpFarm: string;
  editFarm: string;
  trackBadge: string;
  heroHeadline: string;
  heroSubtitle: string;
  ctaConfigure: string;
  ctaConfigureEdit: string;
  ctaDashboard: string;
  ctaEngine: string;
  statWaterTitle: string;
  statWaterLabel: string;
  statWaterSub: string;
  statFaoTitle: string;
  statFaoLabel: string;
  statFaoSub: string;
  statIotTitle: string;
  statIotLabel: string;
  statIotSub: string;
  statSyncTitle: string;
  statSyncLabel: string;
  statSyncSub: string;
  liveWeather: string;
  offlineCache: string;
  syncNow: string;
  satelliteMap: string;
  hideMap: string;
  temp: string;
  humidity: string;
  wind: string;
  et0: string;
  rainForecast: string;
  rainProb: string;
  popChance: string;
  windSpeed: string;
  outlook7Day: string;
  today: string;
  irrigateNow: string;
  waitAndReassess: string;
  resourceDeficit: string;
  waitSubtitle: string;
  irrigateSubtitle: string;
  deficitSubtitle: string;
  confidence: string;
  actionWindow: string;
  reasoning: string;
  method: string;
  environmentalLedger: string;
  ledgerSubtitle: string;
  actionOutcome: string;
  waterDeferred: string;
  pumpRuntimeSaved: string;
  carbonAvoided: string;
  rupeesSaved: string;
  gridEmissionsAvoided: string;
  costExpenseSaved: string;
  noSessionAvoided: string;
  availableReserve: string;
  farmDemand: string;
  shortfall: string;
  stressDeadline: string;
  rootZoneMatrix: string;
  usableStorage: string;
  grossDemand: string;
  reserveSufficient: string;
  stressImminent: string;
  bufferSafe: string;
  listenAdvisory: string;
  speaking: string;
  stopAudio: string;
  onboardingTitle: string;
  onboardingSubtitle: string;
  nextStep: string;
  prevStep: string;
  finishSetup: string;
  locationStep: string;
  soilStep: string;
  cropStep: string;
  reserveStep: string;
  searchLocationPrompt: string;
  locatingGPS: string;
  findBtn: string;
  indianSuggestions: string;
  stepSoilSubtitle: string;
  stepCropSubtitle: string;
  stepReserveSubtitle: string;
  alluvialName: string;
  alluvialDesc: string;
  blackClayName: string;
  blackClayDesc: string;
  sandyLoamName: string;
  sandyLoamDesc: string;
  cropSpinach: string;
  cropWheat: string;
  cropPaddy: string;
  cropPotato: string;
  storageBorewell: string;
  storagePond: string;
  gpsButton: string;
  gpsLocating: string;
  hours: string;
  liters: string;
  irrigationMethod: string;
  drip: string;
  sprinkler: string;
  flood: string;
}

const DICTIONARY: Record<SupportedLanguage, Translations> = {
  en: {
    appName: 'FieldGuard',
    tagline: 'Weather-Aware Precision Irrigation Decision System',
    overview: 'Overview',
    fieldAdvisor: 'Field Advisor',
    signIn: 'Sign In',
    signOut: 'Sign Out',
    setUpFarm: '+ Set Up Farm',
    editFarm: 'Edit Farm Profile',
    trackBadge: 'Autonomous Agronomic Decision Cockpit & Field Telemetry',
    heroHeadline: "Precision Irrigation Decisions for Bharat's Resilient Farmlands",
    heroSubtitle: 'Transform open weather telemetry and root-zone soil balance into definitive irrigation actions. Zero hardware sensors required.',
    ctaConfigure: 'Set Up My Field Parcel',
    ctaConfigureEdit: 'Configure Field Parcel',
    ctaDashboard: 'Open Field Dashboard',
    ctaEngine: 'View Decision Engine',
    statWaterTitle: '16,500 L',
    statWaterLabel: 'Avg. Water Conserved',
    statWaterSub: 'Per rain avoidance session',
    statFaoTitle: 'FAO-56',
    statFaoLabel: 'Penman-Monteith',
    statFaoSub: 'Solar evapotranspiration model',
    statIotTitle: 'Zero IoT',
    statIotLabel: 'Hardware Independent',
    statIotSub: 'Runs on open weather & soil grids',
    statSyncTitle: '< 50 ms',
    statSyncLabel: 'Sub-Second Decisions',
    statSyncSub: 'AWS Serverless computing',
    liveWeather: 'Live Meteorological Station',
    offlineCache: 'Cached Agro-Climatic Baseline',
    syncNow: 'Sync Weather',
    satelliteMap: 'Satellite Map',
    hideMap: 'Hide Map',
    temp: 'Temperature',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    et0: 'Solar Evaporation (ET₀)',
    rainForecast: 'Rain Forecast',
    rainProb: 'Rain Probability',
    popChance: 'chance (PoP)',
    windSpeed: 'km/h wind',
    outlook7Day: '7-Day Precipitation Outlook',
    today: 'Today',
    irrigateNow: 'IRRIGATE NOW',
    waitAndReassess: 'WAIT & REASSESS',
    resourceDeficit: 'WATER DEFICIT ALERT',
    waitSubtitle: 'Water Conserved — Rain Incoming',
    irrigateSubtitle: 'Depletion Near RAW Threshold',
    deficitSubtitle: 'Available Storage Below Requirement',
    confidence: 'Confidence',
    actionWindow: 'Action Window',
    reasoning: 'Reasoning',
    method: 'Method',
    environmentalLedger: 'Environmental Impact Ledger',
    ledgerSubtitle: 'Conserved Water & Emissions Balance',
    actionOutcome: 'Measurable Action Outcome',
    waterDeferred: 'Groundwater Deferred',
    pumpRuntimeSaved: 'Pump Runtime Saved',
    carbonAvoided: 'CO₂ Grid Emissions Offset',
    rupeesSaved: 'Energy Expense Saved',
    gridEmissionsAvoided: 'Grid emissions avoided',
    costExpenseSaved: 'Tariff & diesel expense',
    noSessionAvoided: 'No session avoided',
    availableReserve: 'Available Water',
    farmDemand: 'Gross Farm Demand',
    shortfall: 'Shortfall Volume',
    stressDeadline: 'Stress Deadline',
    rootZoneMatrix: 'Field Plots Root-Zone Stress Matrix',
    usableStorage: 'Usable Storage',
    grossDemand: 'Gross Demand',
    reserveSufficient: 'Reserve Sufficient',
    stressImminent: 'Stress Imminent',
    bufferSafe: 'Buffer Safe',
    listenAdvisory: 'Listen to Advisory',
    speaking: 'Speaking...',
    stopAudio: 'Stop Audio',
    onboardingTitle: '60-Second Farm Setup',
    onboardingSubtitle: 'Calibrate your soil, crop, and water reserve',
    nextStep: 'Continue',
    prevStep: 'Back',
    finishSetup: 'Generate Irrigation Plan',
    locationStep: 'Field Location',
    soilStep: 'Soil Texture',
    cropStep: 'Crop & Land',
    reserveStep: 'Water Reserve',
    searchLocationPrompt: 'Search Village, Pincode or Tehsil',
    locatingGPS: 'Locating GPS...',
    findBtn: 'Find',
    indianSuggestions: 'Indian Location Suggestions',
    stepSoilSubtitle: 'Choose the primary soil texture of your cultivated root zone',
    stepCropSubtitle: 'Specify crop variety, growth stage, and cultivated area',
    stepReserveSubtitle: 'Calibrate your on-farm water storage container or sump',
    alluvialName: 'Alluvial Loam',
    alluvialDesc: 'Indo-Gangetic & coastal plains. High nutrient retention (AWC: 150 mm/m).',
    blackClayName: 'Black Vertisol Clay',
    blackClayDesc: 'Deccan plateau. High water holding capacity (AWC: 180 mm/m).',
    sandyLoamName: 'Sandy Loam',
    sandyLoamDesc: 'High drainage & fast infiltration (AWC: 90 mm/m).',
    cropSpinach: 'Spinach (Palak)',
    cropWheat: 'Wheat (Gehun)',
    cropPaddy: 'Paddy Rice (Dhan)',
    cropPotato: 'Potato (Aloo)',
    storageBorewell: 'Borewell Overhead Tank',
    storagePond: 'Farm Pond / Dugout Sump',
    gpsButton: '1-Tap GPS',
    gpsLocating: 'Locating via GPS...',
    hours: 'hours',
    liters: 'Litres',
    irrigationMethod: 'Irrigation Method',
    drip: 'Drip (90% Eff.)',
    sprinkler: 'Sprinkler (75% Eff.)',
    flood: 'Surface / Flood (60% Eff.)',
  },
  hi: {
    appName: 'फील्डगार्ड (FieldGuard)',
    tagline: 'मौसम-आधारित सटीक सिंचाई निर्णय प्रणाली',
    overview: 'अवलोकन',
    fieldAdvisor: 'खेत सलाहकार',
    signIn: 'साइन इन',
    signOut: 'लॉग आउट',
    setUpFarm: '+ खेत जोड़ें',
    editFarm: 'खेत प्रोफाइल बदलें',
    trackBadge: 'स्वायत्त कृषि निर्णय कॉकपिट एवं फील्ड टेलीमेट्री',
    heroHeadline: 'भारत के लचीले खेतों के लिए सटीक सिंचाई निर्णय',
    heroSubtitle: 'खुले मौसम डेटा और जड़-क्षेत्रीय मिट्टी संतुलन को सटीक सिंचाई निर्णयों में बदलें। किसी हार्डवेयर सेंसर की आवश्यकता नहीं।',
    ctaConfigure: 'अपना खेत सेट करें',
    ctaConfigureEdit: 'खेत विवरण बदलें',
    ctaDashboard: 'खेत डैशबोर्ड खोलें',
    ctaEngine: 'निर्णय इंजन देखें',
    statWaterTitle: '16,500 L',
    statWaterLabel: 'औसत जल बचत',
    statWaterSub: 'प्रति बारिश टालने पर',
    statFaoTitle: 'FAO-56',
    statFaoLabel: 'पेनमैन-मोंटेथ मॉडल',
    statFaoSub: 'सौर वाष्पीकरण गणना',
    statIotTitle: 'शून्य IoT',
    statIotLabel: 'सेंसर मुक्त',
    statIotSub: 'ओपन सैटेलाइट डेटा पर आधारित',
    statSyncTitle: '< 50 ms',
    statSyncLabel: 'तत्काल निर्णय',
    statSyncSub: 'एडब्ल्यूएस सर्वरलेस कंप्यूट',
    liveWeather: 'लाइव मौसम केंद्र',
    offlineCache: 'ऑफलाइन क्षेत्रीय मौसम अनुमान',
    syncNow: 'मौसम ताज़ा करें',
    satelliteMap: 'उपग्रह मानचित्र',
    hideMap: 'मानचित्र छिपाएं',
    temp: 'तापमान',
    humidity: 'नमी (आर्द्रता)',
    wind: 'हवा की गति',
    et0: 'धूप वाष्पीकरण (ET₀)',
    rainForecast: 'बारिश का अनुमान',
    rainProb: 'बारिश की संभावना',
    popChance: 'संभावना (बारिश)',
    windSpeed: 'किमी/घंटा हवा',
    outlook7Day: '7-दिन की बारिश का पूर्वानुमान',
    today: 'आज',
    irrigateNow: 'तुरंत सिंचाई करें',
    waitAndReassess: 'रुकें और समीक्षा करें',
    resourceDeficit: 'जल संकट चेतावनी',
    waitSubtitle: 'भूजल बचत — बारिश आने वाली है',
    irrigateSubtitle: 'नमी में कमी क्रांतिक सीमा पर',
    deficitSubtitle: 'टंकी में पानी की कमी (मांग से कम)',
    confidence: 'सटीकता',
    actionWindow: 'समय सीमा',
    reasoning: 'कारण',
    method: 'विधि',
    environmentalLedger: 'पर्यावरण बचत खाता',
    ledgerSubtitle: 'बचाया गया पानी और उत्सर्जन बचत',
    actionOutcome: 'प्रमाणित बचत परिणाम',
    waterDeferred: 'बचाया गया भूजल',
    pumpRuntimeSaved: 'पंप का समय बचा',
    carbonAvoided: 'CO₂ उत्सर्जन में कमी',
    rupeesSaved: 'बिजली/डीजल खर्च की बचत',
    gridEmissionsAvoided: 'ग्रिड बिजली उत्सर्जन में कमी',
    costExpenseSaved: 'बिजली व डीजल खर्च की बचत',
    noSessionAvoided: 'कोई सिंचाई सत्र नहीं टला',
    availableReserve: 'उपलब्ध पानी',
    farmDemand: 'कुल सिंचाई आवश्यकता',
    shortfall: 'पानी की कमी',
    stressDeadline: 'तनाव समय सीमा',
    rootZoneMatrix: 'खेत के भूखंडों का जड़-क्षेत्र तनाव सूचकांक',
    usableStorage: 'उपलब्ध भंडारण',
    grossDemand: 'कुल मांग',
    reserveSufficient: 'पर्याप्त जल भंडारण',
    stressImminent: 'संकट निकट',
    bufferSafe: 'सुरक्षित',
    listenAdvisory: 'सलाह सुनें (ऑडियो)',
    speaking: 'बोल रहे हैं...',
    stopAudio: 'आवाज रोकें',
    onboardingTitle: '60-सेकंड खेत सेटअप',
    onboardingSubtitle: 'अपनी मिट्टी, फसल और जल भंडारण की जानकारी दें',
    nextStep: 'आगे बढ़ें',
    prevStep: 'पीछे जाएं',
    finishSetup: 'सिंचाई योजना तैयार करें',
    locationStep: 'खेत का स्थान',
    soilStep: 'मिट्टी की बनावट',
    cropStep: 'फसल और ज़मीन',
    reserveStep: 'जल भंडारण',
    searchLocationPrompt: 'गांव, पिनकोड या तहसील खोजें',
    locatingGPS: 'जीपीएस खोज रहे हैं...',
    findBtn: 'खोजें',
    indianSuggestions: 'भारतीय स्थान सुझाव',
    stepSoilSubtitle: 'अपनी मुख्य मिट्टी की बनावट चुनें',
    stepCropSubtitle: 'फसल की किस्म, विकास चरण और क्षेत्रफल चुनें',
    stepReserveSubtitle: 'अपनी पानी की टंकी या हौज का आकार दर्ज करें',
    alluvialName: 'जलोढ़ दोमट मिट्टी',
    alluvialDesc: 'गंगा-सिंधु का मैदान। उच्च जल धारण क्षमता (AWC: 150 मिमी/मी)।',
    blackClayName: 'काली कपास मिट्टी (रेगुर)',
    blackClayDesc: 'दक्कन का पठार। भारी नमी संचय (AWC: 180 मिमी/मी)।',
    sandyLoamName: 'बलुई दोमट मिट्टी',
    sandyLoamDesc: 'तेज रिसाव और जल निकास (AWC: 90 मिमी/मी)।',
    cropSpinach: 'पालक (Palak)',
    cropWheat: 'गेहूं (Gehun)',
    cropPaddy: 'धान (Dhan)',
    cropPotato: 'आलू (Aloo)',
    storageBorewell: 'बोरवेल सिंटेक्स टंकी',
    storagePond: 'खेत तालाब / पक्का हौज',
    gpsButton: 'जीपीएस से स्थान लें',
    gpsLocating: 'जीपीएस खोज रहे हैं...',
    hours: 'घंटे',
    liters: 'लीटर',
    irrigationMethod: 'सिंचाई की विधि',
    drip: 'ड्रिप / टपक (90% दक्षता)',
    sprinkler: 'फव्वारा (75% दक्षता)',
    flood: 'पारंपरिक नाली / बाढ़ (60% दक्षता)',
  },
  bn: {
    appName: 'ফিল্ডগার্ড (FieldGuard)',
    tagline: 'আবহাওয়া-সচেতন নির্ভুল সেচ সিদ্ধান্ত ব্যবস্থা',
    overview: 'সারসংক্ষেপ',
    fieldAdvisor: 'ক্ষেত উপদেষ্টা',
    signIn: 'লগইন',
    signOut: 'লগআউট',
    setUpFarm: '+ জমি যোগ করুন',
    editFarm: 'জমির তথ্য পরিবর্তন',
    trackBadge: 'স্বয়ংক্রিয় কৃষি সিদ্ধান্ত ককপিট ও ফিল্ড টেলিমেট্রি',
    heroHeadline: 'ভারতের খরা-সহনশীল ফসলের জন্য নির্ভুল সেচ সিদ্ধান্ত',
    heroSubtitle: 'উন্মুক্ত আবহাওয়া তথ্য ও মাটির আর্দ্রতার ভারসাম্যের ভিত্তিতে সঠিক সেচ সিদ্ধান্ত। কোনো হার্ডওয়্যার সেন্সরের প্রয়োজন নেই।',
    ctaConfigure: 'আমার জমি সেটআপ করুন',
    ctaConfigureEdit: 'জমির বিবরণ পরিবর্তন',
    ctaDashboard: 'ক্ষেতের ড্যাশবোর্ড খুলুন',
    ctaEngine: 'সিদ্ধান্ত ইঞ্জিন দেখুন',
    statWaterTitle: '১৬,৫০০ লিটার',
    statWaterLabel: 'গড় জল সাশ্রয়',
    statWaterSub: 'বৃষ্টির কারণে সেচ স্থগিত রাখলে',
    statFaoTitle: 'FAO-56',
    statFaoLabel: 'পেনম্যান-মন্টেথ মডেল',
    statFaoSub: 'সৌর বাষ্পীভবন মডেল',
    statIotTitle: 'জিরো IoT',
    statIotLabel: 'হার্ডওয়্যার মুক্ত',
    statIotSub: 'মুক্ত স্যাটেলাইট ডেটায় পরিচালিত',
    statSyncTitle: '< ৫০ মিলি/সে',
    statSyncLabel: 'তাৎক্ষণিক সিদ্ধান্ত',
    statSyncSub: 'এডব্লিউএস সার্ভারলেস প্রযুক্তি',
    liveWeather: 'লাইভ আবহাওয়া কেন্দ্র',
    offlineCache: 'অফলাইন আঞ্চলিক আবহাওয়া পূর্বাভাস',
    syncNow: 'আবহাওয়া আপডেট করুন',
    satelliteMap: 'স্যাটেলাইট মানচিত্র',
    hideMap: 'মানচিত্র লুকান',
    temp: 'তাপমাত্রা',
    humidity: 'বাতাসের আর্দ্রতা',
    wind: 'বাতাসের গতিবেগ',
    et0: 'বাষ্পীভবন হার (ET₀)',
    rainForecast: 'বৃষ্টিপাতের পূর্বাভাস',
    rainProb: 'বৃষ্টির সম্ভাবনা',
    popChance: 'সম্ভাবনা (বৃষ্টি)',
    windSpeed: 'কিমি/ঘণ্টা বাতাস',
    outlook7Day: '৭-দিনের বৃষ্টিপাতের পূর্বাভাস',
    today: 'আজ',
    irrigateNow: 'এখনই সেচ দিন',
    waitAndReassess: 'অপেক্ষা করুন ও পর্যবেক্ষণ করুন',
    resourceDeficit: 'জলের ঘাটতি সতর্কবার্তা',
    waitSubtitle: 'ভূগর্ভস্থ জল সাশ্রয় — বৃষ্টি আসন্ন',
    irrigateSubtitle: 'মাটিতে আর্দ্রতার ঘাটতি বিপদসীমার কাছে',
    deficitSubtitle: 'মজুত জল মোট প্রয়োজনের তুলনায় কম',
    confidence: 'নির্ভুলতা',
    actionWindow: 'সময়সীমা',
    reasoning: 'কারণ',
    method: 'পদ্ধতি',
    environmentalLedger: 'পরিবেশগত সঞ্চয় খতিয়ান',
    ledgerSubtitle: 'সংরক্ষিত জল ও নির্গমন সাশ্রয়',
    actionOutcome: 'পরিমাপযোগ্য সাশ্রয়',
    waterDeferred: 'সংরক্ষিত ভূগর্ভস্থ জল',
    pumpRuntimeSaved: 'পাম্প চালনার সময় বাঁচল',
    carbonAvoided: 'CO₂ নির্গমন হ্রাস',
    rupeesSaved: 'বিদ্যুৎ/ডিজেল খরচ সাশ্রয়',
    gridEmissionsAvoided: 'গ্রিড নির্গমন হ্রাস',
    costExpenseSaved: 'বিদ্যুৎ ও ডিজেল খরচ সাশ্রয়',
    noSessionAvoided: 'কোনো সেচ স্থগিত হয়নি',
    availableReserve: 'মজুত জল',
    farmDemand: 'মোট সেচের প্রয়োজন',
    shortfall: 'জলের ঘাটতি',
    stressDeadline: 'খরা সংকটের সময়সীমা',
    rootZoneMatrix: 'ফসলের মূল-অঞ্চলের খরা সংকট সূচক',
    usableStorage: 'ব্যবহারযোগ্য মজুত',
    grossDemand: 'মোট চাহিদা',
    reserveSufficient: 'পর্যাপ্ত জল মজুত',
    stressImminent: 'সংকট আসন্ন',
    bufferSafe: 'সুরক্ষিত',
    listenAdvisory: 'পরামর্শ শুনুন (অডিও)',
    speaking: 'বলছে...',
    stopAudio: 'অডিও থামান',
    onboardingTitle: '৬০-সেকেন্ডে খামার সেটআপ',
    onboardingSubtitle: 'মাটি, ফসল ও জল মজুত নির্ধারণ করুন',
    nextStep: 'পরবর্তী ধাপ',
    prevStep: 'পূর্ববর্তী ধাপ',
    finishSetup: 'সেচ পরিকল্পনা তৈরি করুন',
    locationStep: 'জমির অবস্থান',
    soilStep: 'মাটির গঠন',
    cropStep: 'ফসল ও জমির পরিমাপ',
    reserveStep: 'জলের মজুত',
    searchLocationPrompt: 'গ্রাম, পিনকোড বা তহশিল অনুসন্ধান করুন',
    locatingGPS: 'জিপিএস খোঁজা হচ্ছে...',
    findBtn: 'খুঁজুন',
    indianSuggestions: 'ভারতীয় অবস্থানের পরামর্শ',
    stepSoilSubtitle: 'আপনার জমির মাটির গঠন নির্বাচন করুন',
    stepCropSubtitle: 'ফসল, বৃদ্ধির পর্যায় ও জমির পরিমাণ নির্ধারণ করুন',
    stepReserveSubtitle: 'জলের ট্যাংক বা হাউজের মাপ নির্ধারণ করুন',
    alluvialName: 'পলি দোআঁশ মাটি',
    alluvialDesc: 'গাঙ্গেয় সমভূমি। উচ্চ জল ধারণ ক্ষমতা (AWC: ১৫০ মিমি/মি)।',
    blackClayName: 'কালো রেগুর মাটি',
    blackClayDesc: 'দাক্ষিণাত্যের মালভূমি। দীর্ঘস্থায়ী আর্দ্রতা (AWC: ১৮০ মিমি/মি)।',
    sandyLoamName: 'বেলে দোআঁশ মাটি',
    sandyLoamDesc: 'দ্রুত জল শোষণ ও নিষ্কাশন (AWC: ৯০ মিমি/মি)।',
    cropSpinach: 'পালং শাক (Palak)',
    cropWheat: 'গম (Gehun)',
    cropPaddy: 'ধান (Dhan)',
    cropPotato: 'আলু (Aloo)',
    storageBorewell: 'বোরওয়েল ওভারহেড ট্যাংক',
    storagePond: 'খামার পুকুর / পাকা চৌবাচ্চা',
    gpsButton: 'জিপিএস অবস্থান',
    gpsLocating: 'জিপিএস অবস্থান খোঁজা হচ্ছে...',
    hours: 'ঘণ্টা',
    liters: 'লিটার',
    irrigationMethod: 'সেচ পদ্ধতি',
    drip: 'ড্রিপ / বিন্দু সেচ (৯০% দক্ষতা)',
    sprinkler: 'স্প্রিংকলার / ফোয়ারা (৭৫% দক্ষতা)',
    flood: 'প্লাবন / নালা সেচ (৬০% দক্ষতা)',
  },
};

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: DICTIONARY.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    const saved = localStorage.getItem('fieldguard_lang') as SupportedLanguage;
    if (saved && (saved === 'en' || saved === 'hi' || saved === 'bn')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('fieldguard_lang', lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: DICTIONARY[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
