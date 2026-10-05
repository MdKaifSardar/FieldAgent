'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage } from '../../adapters/speechAdapter';

export interface Translations {
  appName: string;
  tagline: string;
  liveWeather: string;
  offlineCache: string;
  syncNow: string;
  irrigateNow: string;
  waitAndReassess: string;
  resourceDeficit: string;
  environmentalLedger: string;
  waterDeferred: string;
  pumpRuntimeSaved: string;
  carbonAvoided: string;
  rupeesSaved: string;
  listenAdvisory: string;
  speaking: string;
  stopAudio: string;
  editFarm: string;
  onboardingTitle: string;
  onboardingSubtitle: string;
  nextStep: string;
  prevStep: string;
  finishSetup: string;
  locationStep: string;
  soilStep: string;
  cropStep: string;
  reserveStep: string;
  gpsButton: string;
  gpsLocating: string;
  temp: string;
  humidity: string;
  wind: string;
  et0: string;
  rainForecast: string;
  rainProb: string;
  availableReserve: string;
  farmDemand: string;
  shortfall: string;
  stressDeadline: string;
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
    liveWeather: 'Live Meteorological Station',
    offlineCache: 'Cached Agro-Climatic Baseline',
    syncNow: 'Sync Weather',
    irrigateNow: 'IRRIGATE NOW',
    waitAndReassess: 'WAIT & REASSESS',
    resourceDeficit: 'WATER DEFICIT ALERT',
    environmentalLedger: 'Environmental Impact Ledger',
    waterDeferred: 'Groundwater Deferred',
    pumpRuntimeSaved: 'Pump Runtime Saved',
    carbonAvoided: 'CO₂ Grid Emissions Offset',
    rupeesSaved: 'Energy Expense Saved',
    listenAdvisory: 'Listen to Advisory',
    speaking: 'Speaking...',
    stopAudio: 'Stop Audio',
    editFarm: 'Edit Farm Profile',
    onboardingTitle: '60-Second Farm Setup',
    onboardingSubtitle: 'Calibrate your soil, crop, and water reserve',
    nextStep: 'Continue',
    prevStep: 'Back',
    finishSetup: 'Generate Irrigation Plan',
    locationStep: 'Field Location',
    soilStep: 'Soil Texture',
    cropStep: 'Crop & Land',
    reserveStep: 'Water Reserve',
    gpsButton: '1-Tap GPS',
    gpsLocating: 'Locating via GPS...',
    temp: 'Temperature',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    et0: 'Solar Evaporation (ET₀)',
    rainForecast: 'Rain Forecast',
    rainProb: 'Rain Probability',
    availableReserve: 'Available Water',
    farmDemand: 'Gross Farm Demand',
    shortfall: 'Shortfall Volume',
    stressDeadline: 'Stress Deadline',
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
    liveWeather: 'लाइव मौसम केंद्र',
    offlineCache: 'ऑफलाइन क्षेत्रीय मौसम अनुमान',
    syncNow: 'मौसम ताज़ा करें',
    irrigateNow: 'तुरंत सिंचाई करें',
    waitAndReassess: 'रुकें और समीक्षा करें',
    resourceDeficit: 'जल संकट चेतावनी',
    environmentalLedger: 'पर्यावरण बचत खाता',
    waterDeferred: 'बचाया गया भूजल',
    pumpRuntimeSaved: 'पंप का समय बचा',
    carbonAvoided: 'CO₂ उत्सर्जन में कमी',
    rupeesSaved: 'बिजली/डीजल खर्च की बचत',
    listenAdvisory: 'सलाह सुनें (ऑडियो)',
    speaking: 'बोल रहे हैं...',
    stopAudio: 'आवाज रोकें',
    editFarm: 'खेत प्रोफाइल बदलें',
    onboardingTitle: '60-सेकंड खेत सेटअप',
    onboardingSubtitle: 'अपनी मिट्टी, फसल और जल भंडारण की जानकारी दें',
    nextStep: 'आगे बढ़ें',
    prevStep: 'पीछे जाएं',
    finishSetup: 'सिंचाई योजना तैयार करें',
    locationStep: 'खेत का स्थान',
    soilStep: 'मिट्टी की बनावट',
    cropStep: 'फसल और ज़मीन',
    reserveStep: 'जल भंडारण',
    gpsButton: 'जीपीएस से स्थान लें',
    gpsLocating: 'जीपीएस खोज रहे हैं...',
    temp: 'तापमान',
    humidity: 'नमी (आर्द्रता)',
    wind: 'हवा की गति',
    et0: 'धूप वाष्पीकरण (ET₀)',
    rainForecast: 'बारिश का अनुमान',
    rainProb: 'बारिश की संभावना',
    availableReserve: 'उपलब्ध पानी',
    farmDemand: 'कुल सिंचाई आवश्यकता',
    shortfall: 'पानी की कमी',
    stressDeadline: 'तनाव समय सीमा',
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
    liveWeather: 'লাইভ আবহাওয়া কেন্দ্র',
    offlineCache: 'অফলাইন আঞ্চলিক আবহাওয়া পূর্বাভাস',
    syncNow: 'আবহাওয়া আপডেট করুন',
    irrigateNow: 'এখনই সেচ দিন',
    waitAndReassess: 'অপেক্ষা করুন ও পর্যবেক্ষণ করুন',
    resourceDeficit: 'জলের ঘাটতি সতর্কবার্তা',
    environmentalLedger: 'পরিবেশগত সঞ্চয় খতিয়ান',
    waterDeferred: 'সংরক্ষিত ভূগর্ভস্থ জল',
    pumpRuntimeSaved: 'পাম্প চালনার সময় বাঁচল',
    carbonAvoided: 'CO₂ নির্গমন হ্রাস',
    rupeesSaved: 'বিদ্যুৎ/ডিজেল খরচ সাশ্রয়',
    listenAdvisory: 'পরামর্শ শুনুন (অডিও)',
    speaking: 'বলছে...',
    stopAudio: 'অডিও থামান',
    editFarm: 'জমির তথ্য পরিবর্তন',
    onboardingTitle: '৬০-সেকেন্ডে খামার সেটআপ',
    onboardingSubtitle: 'মাটি, ফসল ও জল মজুত নির্ধারণ করুন',
    nextStep: 'পরবর্তী ধাপ',
    prevStep: 'পূর্ববর্তী ধাপ',
    finishSetup: 'সেচ পরিকল্পনা তৈরি করুন',
    locationStep: 'জমির অবস্থান',
    soilStep: 'মাটির গঠন',
    cropStep: 'ফসল ও জমির পরিমাপ',
    reserveStep: 'জলের মজুত',
    gpsButton: 'জিপিএস অবস্থান',
    gpsLocating: 'জিপিএস অবস্থান খোঁজা হচ্ছে...',
    temp: 'তাপমাত্রা',
    humidity: 'বাতাসের আর্দ্রতা',
    wind: 'বাতাসের গতিবেগ',
    et0: 'বাষ্পীভবন হার (ET₀)',
    rainForecast: 'বৃষ্টিপাতের পূর্বাভাস',
    rainProb: 'বৃষ্টির সম্ভাবনা',
    availableReserve: 'মজুত জল',
    farmDemand: 'মোট সেচের প্রয়োজন',
    shortfall: 'জলের ঘাটতি',
    stressDeadline: 'খরা সংকটের সময়সীমা',
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
