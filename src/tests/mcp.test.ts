import { describe, it, expect } from 'vitest';
import {
  handleListMyFarms,
  handleGetFarmContext,
  handleGetPlotWaterStatus,
  handleAllocateLimitedWater,
  handleCompareIrrigationMethods,
  handleSaveIrrigationPlan,
  handleGetSavedIrrigationPlan,
} from '../mcp/tools';
import { createFieldGuardMcpServer } from '../mcp/server';

describe('FieldGuard MCP Server & Tool Handlers', () => {
  it('initializes the MCP server with all 8 agronomic tools', () => {
    const server = createFieldGuardMcpServer();
    expect(server).toBeDefined();
    expect(server.server).toBeDefined();
  });

  it('tool: list_my_farms returns registered demo parcels', async () => {
    const res = await handleListMyFarms({});
    expect(res.content).toHaveLength(1);
    const data = JSON.parse(res.content[0].text);
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);
    expect(data[0]).toHaveProperty('farmId');
    expect(data[0]).toHaveProperty('plots');
  });

  it('tool: get_farm_context retrieves valid farm profile and soil specs', async () => {
    const res = await handleGetFarmContext({ farmId: 'farm-bardhaman-01' });
    expect(res.isError).toBeFalsy();
    const farm = JSON.parse(res.content[0].text);
    expect(farm.farmName).toContain('Tomato');
    expect(farm.soil.texture).toBe('loamy');
    expect(farm.soil.awc_mm_per_m).toBe(150);
  });

  it('tool: get_plot_water_status runs FAO-56 calculations on farm plots', async () => {
    const res = await handleGetPlotWaterStatus({ farmId: 'farm-bardhaman-01' });
    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.farmId).toBe('farm-bardhaman-01');
    expect(data.plots.length).toBeGreaterThan(0);
    const plot = data.plots[0];
    expect(plot).toHaveProperty('currentDepletion_mm');
    expect(plot).toHaveProperty('raw_mm');
    expect(plot).toHaveProperty('grossWaterNeeded_liters');
    expect(plot).toHaveProperty('urgencyLevel');
  }, 15000);

  it('tool: allocate_limited_water deterministically rations 800L budget', async () => {
    const res = await handleAllocateLimitedWater({
      farmId: 'farm-nashik-02',
      availableBudgetLiters: 800,
      irrigationMethod: 'drip',
    });

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.availableBudgetLiters).toBe(800);
    expect(data.totalAllocatedLiters).toBeLessThanOrEqual(800);
    expect(data.allocations.length).toBeGreaterThan(0);
    expect(data.triageRationale).toBeDefined();
    
    // Check that pump minutes are calculated
    const firstAlloc = data.allocations[0];
    expect(typeof firstAlloc.pumpRuntimeMinutes).toBe('number');
  });

  it('tool: compare_irrigation_methods compares Drip (90%) vs Flood (60%)', async () => {
    const res = await handleCompareIrrigationMethods({
      farmId: 'farm-bardhaman-01',
    });

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.comparisonTable).toHaveLength(3);
    
    const drip = data.comparisonTable.find((c: any) => c.method === 'drip');
    const flood = data.comparisonTable.find((c: any) => c.method === 'surface_flood');
    
    expect(drip.efficiencyPct).toBe(90);
    expect(flood.efficiencyPct).toBe(60);
    // Drip must require fewer gross liters than Flood
    expect(drip.grossWaterRequired_liters).toBeLessThan(flood.grossWaterRequired_liters);
    expect(data.savingsWithDripVsFlood.waterSavedLiters).toBeGreaterThan(0);
  });

  it('tool: save_irrigation_plan and get_saved_irrigation_plan persist and retrieve', async () => {
    const saveRes = await handleSaveIrrigationPlan({
      farmId: 'farm-bardhaman-01',
      planName: 'Test 800L Drip Plan',
      allocatedPlots: [
        { plotId: 'plot-tomato-01', cropName: 'Tomato', allocated_liters: 800, irrigationMethod: 'drip' },
      ],
      totalAllocatedLiters: 800,
      notes: 'Automated unit test execution',
    });

    expect(saveRes.content).toHaveLength(1);
    const saved = JSON.parse(saveRes.content[0].text);
    expect(saved.success).toBe(true);
    expect(saved.planId).toBeDefined();

    const getRes = await handleGetSavedIrrigationPlan({ farmId: 'farm-bardhaman-01' });
    expect(getRes.content).toHaveLength(1);
    const retrieved = JSON.parse(getRes.content[0].text);
    expect(retrieved.farmId).toBe('farm-bardhaman-01');
    expect(retrieved.activePlan).toBeDefined();
  });

  it('tool: update_water_reserve updates tank level and recalculates deficit', async () => {
    const { handleUpdateWaterReserve } = await import('../mcp/tools');
    const res = await handleUpdateWaterReserve({
      farmId: 'farm-bardhaman-01',
      fillPercent: 50,
    });

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.fillPercent).toBe(50);
    expect(data.availableLiters).toBe(Math.round(data.totalCapacityLiters * 0.5));
    expect(data.advisoryDirective).toBeDefined();
    expect(data.updatedFarm).toBeDefined();
  });

  it('tool: log_irrigation_event logs watering and resets root depletion Dr', async () => {
    const { handleLogIrrigationEvent } = await import('../mcp/tools');
    const res = await handleLogIrrigationEvent({
      farmId: 'farm-bardhaman-01',
      cropName: 'Tomato',
      irrigationDate: 'yesterday',
    });

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.daysElapsedSinceWatering).toBe(1);
    expect(data.currentDepletion_mm).toBeLessThan(data.rawThreshold_mm);
    expect(data.daysUntilNextIrrigation).toBeGreaterThan(0);
  });

  it('tool: update_plot_method switches irrigation method and computes water savings', async () => {
    const { handleUpdatePlotMethod } = await import('../mcp/tools');
    const res = await handleUpdatePlotMethod({
      farmId: 'farm-bardhaman-01',
      cropName: 'Tomato',
      irrigationMethod: 'drip',
    });

    expect(res.isError).toBeFalsy();
    const data = JSON.parse(res.content[0].text);
    expect(data.success).toBe(true);
    expect(data.newMethod).toBe('drip');
    expect(data.newEfficiencyPct).toBe(90);
  });

  it('agent: handles colloquial percentage tank modification and deficit valve directive', async () => {
    const { runAlexaAgent } = await import('../core/agent/bedrockAgent');
    
    // Test colloquial half full
    const res1 = await runAlexaAgent('My tank is half full', [], 'farm-bardhaman-01');
    expect(res1.activeScenario).toBe('reserve_updated');
    expect(res1.structuredData.fillPercent).toBe(50);

    // Test watering log
    const res2 = await runAlexaAgent('I watered my onion plot yesterday', [], 'farm-bardhaman-01');
    expect(res2.activeScenario).toBe('irrigation_logged');
    expect(res2.reply).toContain('Logged');

    // Test deficit advice has valve cutoff and evening timing
    const res3 = await runAlexaAgent('I only have 250 L of water available', [], 'farm-nashik-02');
    expect(res3.activeScenario).toBe('water_allocation');
    expect(res3.reply).toContain('valves');
    expect(res3.reply).toContain('6:00 PM');
  });
});
