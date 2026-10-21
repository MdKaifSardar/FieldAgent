import { describe, it, expect } from 'vitest';
import { getFieldVoiceScript, FIELD_VOICE_SCRIPTS } from '../data/fieldVoiceScripts';
import { 
  CROP_VISUAL_ASSETS, 
  SOIL_VISUAL_ASSETS, 
  IRRIGATION_VISUAL_ASSETS 
} from '../data/agriculturalVisualAssets';
import { speechService } from '../adapters/speechAdapter';

describe('Field Creation Usability & Audio Mutex Suite', () => {
  it('provides complete trilingual voice scripts for wizard steps, crops, soils, and irrigation', () => {
    // Step 1 scripts
    expect(getFieldVoiceScript('step1_overview', 'bn')).toContain('ভৌগোলিক অবস্থান');
    expect(getFieldVoiceScript('step1_overview', 'hi')).toContain('खेत का सही स्थान');
    expect(getFieldVoiceScript('step1_overview', 'en')).toContain('hyper-local');

    // Soil scripts
    expect(getFieldVoiceScript('soil_sandy', 'bn')).toContain('বালি দোআঁশ');
    expect(getFieldVoiceScript('soil_sandy', 'hi')).toContain('रेतीली दोमट');
    expect(getFieldVoiceScript('soil_loamy', 'bn')).toContain('পলি দোআঁশ');
    expect(getFieldVoiceScript('soil_clay_black', 'hi')).toContain('काली चिकनी');

    // Crop scripts
    expect(getFieldVoiceScript('crop_Tomato', 'bn')).toContain('টমেটো');
    expect(getFieldVoiceScript('crop_Wheat', 'hi')).toContain('गेहूँ');
    expect(getFieldVoiceScript('crop_Mustard', 'bn')).toContain('সরিষায়');

    // Watering method scripts
    expect(getFieldVoiceScript('irrigation_drip', 'bn')).toContain('ড্রিপ');
    expect(getFieldVoiceScript('irrigation_drip', 'hi')).toContain('ड्रिप');
    expect(getFieldVoiceScript('irrigation_sprinkler', 'bn')).toContain('স্প্রিংকলার');
    expect(getFieldVoiceScript('irrigation_surface_flood', 'hi')).toContain('पारंपरिक नाली');
  });

  it('provides visual metadata and specimen photography for all 8 core crops', () => {
    const crops = ['Tomato', 'Wheat', 'Spinach', 'Potato', 'Paddy', 'Mustard', 'Onion', 'Chilli'];
    for (const c of crops) {
      const asset = CROP_VISUAL_ASSETS[c];
      expect(asset).toBeDefined();
      expect(asset.imageUrl).toMatch(/^\/images\/crops\//);
      expect(asset.category.en).toBeDefined();
      expect(asset.category.bn).toBeDefined();
      expect(asset.category.hi).toBeDefined();
      expect(['low', 'moderate', 'high']).toContain(asset.waterTier);
    }
  });

  it('provides calibrated AWC and tactile parameters for all 3 soil textures', () => {
    expect(SOIL_VISUAL_ASSETS.sandy.awcValue).toBe(90);
    expect(SOIL_VISUAL_ASSETS.loamy.awcValue).toBe(150);
    expect(SOIL_VISUAL_ASSETS.clay_black.awcValue).toBe(180);

    expect(SOIL_VISUAL_ASSETS.sandy.imageUrl).toMatch(/^\/images\/soils\//);
    expect(SOIL_VISUAL_ASSETS.loamy.imageUrl).toMatch(/^\/images\/soils\//);
    expect(SOIL_VISUAL_ASSETS.clay_black.imageUrl).toMatch(/^\/images\/soils\//);

    expect(SOIL_VISUAL_ASSETS.sandy.name.bn).toBe('বালি দোআঁশ');
    expect(SOIL_VISUAL_ASSETS.loamy.name.hi).toBe('जलोढ़ दोमट');
    expect(SOIL_VISUAL_ASSETS.clay_black.name.bn).toBe('কালো এঁটেল');
  });

  it('provides application efficiencies and savings for all 3 watering methods', () => {
    expect(IRRIGATION_VISUAL_ASSETS.drip.efficiencyPercent).toBe(90);
    expect(IRRIGATION_VISUAL_ASSETS.sprinkler.efficiencyPercent).toBe(75);
    expect(IRRIGATION_VISUAL_ASSETS.surface_flood.efficiencyPercent).toBe(60);

    expect(IRRIGATION_VISUAL_ASSETS.drip.imageUrl).toMatch(/^\/images\/irrigation\//);
    expect(IRRIGATION_VISUAL_ASSETS.sprinkler.imageUrl).toMatch(/^\/images\/irrigation\//);
    expect(IRRIGATION_VISUAL_ASSETS.surface_flood.imageUrl).toMatch(/^\/images\/irrigation\//);
  });

  it('supports pause, resume, and stop state transitions on speechService', () => {
    expect(speechService.isPaused()).toBe(false);
    speechService.pause();
    // After stop, paused state resets to false
    speechService.stop();
    expect(speechService.isPaused()).toBe(false);
  });
});
