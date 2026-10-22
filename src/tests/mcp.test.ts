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
  });

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

  it('agent: runAlexaAgent executes water allocation scenario', async () => {
    const { runAlexaAgent } = await import('../core/agent/bedrockAgent');
    const result = await runAlexaAgent(
      'I have 800 Litres of water. Which plot should I irrigate first?',
      [],
      'farm-nashik-02'
    );

    expect(result.reply).toBeDefined();
    expect(result.spokenReply).toBeDefined();
    expect(result.toolAudits.length).toBeGreaterThan(0);
    expect(result.activeScenario).toBe('water_allocation');
    expect(result.structuredData).toBeDefined();
    expect(result.structuredData.availableBudgetLiters).toBe(800);
  });
});
