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
  updateWaterReserveSchema,
  handleUpdateWaterReserve,
  logIrrigationEventSchema,
  handleLogIrrigationEvent,
  updatePlotMethodSchema,
  handleUpdatePlotMethod,
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
    'Fetches hyper-local live weather (ET0, rainfall, temperature, humidity, wind) from Open-Meteo for a farm or coordinates.',
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

  // 7. Tool: update_water_reserve
  server.tool(
    'update_water_reserve',
    'Updates farm water tank capacity, available Liters, or fill percentage (with deficit recalculation).',
    updateWaterReserveSchema,
    handleUpdateWaterReserve
  );

  // 8. Tool: log_irrigation_event
  server.tool(
    'log_irrigation_event',
    'Logs that a specific crop or plot was irrigated on a date, resetting root-zone depletion Dr.',
    logIrrigationEventSchema,
    handleLogIrrigationEvent
  );

  // 9. Tool: update_plot_method
  server.tool(
    'update_plot_method',
    'Switches the irrigation method of a plot between drip (90%), sprinkler (75%), and flood (60%).',
    updatePlotMethodSchema,
    handleUpdatePlotMethod
  );

  return server;
}
