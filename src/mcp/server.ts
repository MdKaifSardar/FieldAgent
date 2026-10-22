import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  listMyFarmsSchema,
  handleListMyFarms,
  getFarmContextSchema,
  handleGetFarmContext,
  getWeatherContextSchema,
  handleGetWeatherContext,
  getPlotWaterStatusSchema,
  handleGetPlotWaterStatus,
  allocateLimitedWaterSchema,
  handleAllocateLimitedWater,
  compareIrrigationMethodsSchema,
  handleCompareIrrigationMethods,
  saveIrrigationPlanSchema,
  handleSaveIrrigationPlan,
  getSavedIrrigationPlanSchema,
  handleGetSavedIrrigationPlan,
} from './tools';

/**
 * Creates and initializes the FieldGuard MCP Server instance.
 * Conforms to MCP Specification 2025-11-25+ with capability negotiation and tools support.
 */
export function createFieldGuardMcpServer(): McpServer {
  const server = new McpServer({
    name: 'fieldguard-irrigation-mcp',
    version: '1.0.0',
  });

  // 1. Tool: list_my_farms
  server.tool(
    'list_my_farms',
    'Lists all agricultural fields, plots, crops, and storage reserves associated with the farmer account.',
    listMyFarmsSchema,
    handleListMyFarms
  );

  // 2. Tool: get_farm_context
  server.tool(
    'get_farm_context',
    'Retrieves detailed agronomic context for a specified farm, including soil AWC, pump specs, and crop blocks.',
    getFarmContextSchema,
    handleGetFarmContext
  );

  // 3. Tool: get_weather_context
  server.tool(
    'get_weather_context',
    'Fetches hyper-local live weather (ET0, rainfall, temperature, humidity) from Open-Meteo for given coordinates.',
    getWeatherContextSchema,
    handleGetWeatherContext
  );

  // 4. Tool: get_plot_water_status
  server.tool(
    'get_plot_water_status',
    'Calculates FAO-56 soil-water balance, root depletion (Dr), RAW, and hours until critical crop drought stress.',
    getPlotWaterStatusSchema,
    handleGetPlotWaterStatus
  );

  // 5. Tool: allocate_limited_water
  server.tool(
    'allocate_limited_water',
    'Deterministically rations a constrained water budget across farm plots based on root-zone urgency and method efficiency.',
    allocateLimitedWaterSchema,
    handleAllocateLimitedWater
  );

  // 6. Tool: compare_irrigation_methods
  server.tool(
    'compare_irrigation_methods',
    'Compares Drip (90%), Sprinkler (75%), and Surface/Flood (60%) irrigation for gross water, pump hours, and electricity savings.',
    compareIrrigationMethodsSchema,
    handleCompareIrrigationMethods
  );

  // 7. Tool: save_irrigation_plan
  server.tool(
    'save_irrigation_plan',
    'Persists an explicitly confirmed farmer irrigation allocation plan into Amazon DynamoDB.',
    saveIrrigationPlanSchema,
    handleSaveIrrigationPlan
  );

  // 8. Tool: get_saved_irrigation_plan
  server.tool(
    'get_saved_irrigation_plan',
    'Retrieves the latest confirmed irrigation plan saved for a farm from Amazon DynamoDB.',
    getSavedIrrigationPlanSchema,
    handleGetSavedIrrigationPlan
  );

  return server;
}
