import { describe, it, expect } from 'vitest';
import {
  localizeCrop,
  localizeSoil,
  localizeGrowthStage,
  localizeStorageType,
  localizeLocation,
  localizeSourceFeed,
  localizeFieldTitle,
  localizeIrrigationMethod,
} from '../utils/agriculturalLocalization';
import { resolveDistrict, resolveState } from '../data/indiaGazetteer';

describe('Agricultural Localization Engine', () => {
  it('localizes telemetry feed names in Bengali and Hindi', () => {
    expect(localizeSourceFeed('Open-Meteo Meteorological Feed', 'bn')).toBe('ওপেন-মেটিও আবহাওয়া পূর্বাভাস ফিড');
    expect(localizeSourceFeed('Open-Meteo Meteorological Feed', 'hi')).toBe('ओपन-मेटियो मौसम पूर्वानुमान फीड');
    expect(localizeSourceFeed('Penman-Monteith Solar', 'bn')).toBe('পেনম্যান-মন্টেথ সৌর মডেল');
    expect(localizeSourceFeed('Penman-Monteith Solar', 'hi')).toBe('पेनमैन-मोंटेथ सौर मॉडल');
  });

  it('localizes Indian state and district geographic entities via India Gazetteer', () => {
    const loc1 = 'Raina - I, Purba Bardhaman, West Bengal';
    expect(localizeLocation(loc1, 'bn')).toBe('Raina - I, পূর্ব বর্ধমান, পশ্চিমবঙ্গ');
    expect(localizeLocation(loc1, 'hi')).toBe('Raina - I, पूर्व बर्धमान, पश्चिम बंगाल');

    const loc2 = 'Kumrokhali, South 24 Parganas, West Bengal';
    expect(localizeLocation(loc2, 'bn')).toBe('Kumrokhali, দক্ষিণ ২৪ পরগনা, পশ্চিমবঙ্গ');
    expect(localizeLocation(loc2, 'hi')).toBe('Kumrokhali, दक्षिण २४ परगना, पश्चिम बंगाल');
  });

  it('resolves legacy and colonial district aliases (Burdwan -> Purba Bardhaman)', () => {
    expect(resolveDistrict('Burdwan', 'bn')).toBe('পূর্ব বর্ধমান');
    expect(resolveDistrict('Burdwan', 'hi')).toBe('पूर्व बर्धमान');
    expect(resolveDistrict('Midnapore', 'bn')).toBe('মেদিনীপুর');
    expect(resolveDistrict('Baroda', 'bn')).toBe('ভদোদরা');

    const aliasLoc = 'Village Center, Burdwan, West Bengal';
    expect(localizeLocation(aliasLoc, 'bn')).toBe('গ্রাম Center, পূর্ব বর্ধমান, পশ্চিমবঙ্গ');
  });

  it('resolves agricultural districts across all Indian regions', () => {
    expect(resolveDistrict('Alipurduar', 'bn')).toBe('আলিপুরদুয়ার');
    expect(resolveDistrict('Muzaffarpur', 'bn')).toBe('মুজাফফরপুর');
    expect(resolveDistrict('Nagpur', 'bn')).toBe('নাগপুর');
    expect(resolveDistrict('Kurnool', 'bn')).toBe('কুরনুল');

    expect(resolveState('Maharashtra', 'bn')).toBe('মহারাষ্ট্র');
    expect(resolveState('Punjab', 'hi')).toBe('पंजाब');
  });

  it('localizes default parcel titles with crops and districts', () => {
    expect(localizeFieldTitle('Wheat Field (Local Parcel)', 'bn')).toBe('গম জমি (স্থানীয় পার্সেল)');
    expect(localizeFieldTitle('Wheat Field (Local Parcel)', 'hi')).toBe('गेहूं खेत (स्थानीय खेत)');
    expect(localizeFieldTitle('Tomato Field (Purba Bardhaman)', 'bn')).toBe('টমেটো জমি (পূর্ব বর্ধমান)');
  });

  it('localizes agronomic crops, soil textures, and growth stages', () => {
    expect(localizeCrop('Wheat', 'bn')).toBe('গম');
    expect(localizeCrop('Wheat', 'hi')).toBe('गेहूं');
    expect(localizeCrop('Tomato', 'bn')).toBe('টমেটো');
    expect(localizeCrop('Mustard', 'hi')).toBe('सरसों');
    expect(localizeSoil('loamy', 'bn')).toBe('দোআঁশ মাটি');
    expect(localizeSoil('loamy', 'hi')).toBe('दोमट मिट्टी');
    expect(localizeGrowthStage('mid_season', 'bn')).toBe('ফসলের মধ্যবর্তী পর্যায়');
    expect(localizeGrowthStage('mid_season', 'hi')).toBe('मध्य मौसम अवस्था');
  });

  it('localizes irrigation methods and storage infrastructure', () => {
    expect(localizeIrrigationMethod('SURFACE_FLOOD', 'bn')).toBe('প্লাবন / ভাসিয়ে সেচ');
    expect(localizeIrrigationMethod('SURFACE_FLOOD', 'hi')).toBe('पारंपरिक नाली / बहाव');
    expect(localizeStorageType('sintex_tank', 'bn')).toBe('ওভারহেড সিনটেক্স ট্যাংক');
    expect(localizeStorageType('sintex_tank', 'hi')).toBe('ओवरहेड सिंटेक्स टैंक');
    expect(localizeStorageType('borewell_hours', 'bn', 5)).toBe('5 এইচপি নলকূপ / বোরওয়েল');
    expect(localizeStorageType('borewell_hours', 'hi', 5)).toBe('5 एचपी नलकूप / बोरवेल');
  });
});
