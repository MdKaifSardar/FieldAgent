import { NextRequest, NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createFieldGuardMcpServer } from '../../../mcp/server';

// Singleton instance per serverless container
let transport: WebStandardStreamableHTTPServerTransport | null = null;
let mcpServerInstance: ReturnType<typeof createFieldGuardMcpServer> | null = null;

async function getMcpTransport(): Promise<WebStandardStreamableHTTPServerTransport> {
  if (!transport) {
    mcpServerInstance = createFieldGuardMcpServer();
    transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // Stateless mode compliant with modern serverless
      enableJsonResponse: true,      // Return standard JSON-RPC responses for HTTP POST
    });
    await mcpServerInstance.connect(transport);
  }
  return transport;
}

/**
 * Handle incoming MCP Streamable HTTP POST requests (tools/list, tools/call, initialize).
 */
export async function POST(req: Request) {
  try {
    const t = await getMcpTransport();
    const response = await t.handleRequest(req);
    return response;
  } catch (error: any) {
    console.error('MCP Server Streamable HTTP Error:', error);
    return NextResponse.json(
      {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: error?.message || 'Internal MCP server error',
        },
        id: null,
      },
      { status: 500 }
    );
  }
}

/**
 * Handle incoming MCP Streamable HTTP GET requests (SSE streaming or server info).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  
  // If client requests server status / health check
  if (url.searchParams.get('info') === 'true') {
    return NextResponse.json({
      name: 'fieldguard-irrigation-mcp',
      version: '1.0.0',
      specVersion: '2025-11-25',
      transport: 'Streamable HTTP (Web Standard)',
      tools: [
        'list_my_farms',
        'get_farm_context',
        'get_weather_context',
        'get_plot_water_status',
        'allocate_limited_water',
        'compare_irrigation_methods',
        'update_water_reserve',
        'log_irrigation_event',
        'update_plot_method',
      ],
      status: 'ONLINE',
    });
  }

  try {
    const t = await getMcpTransport();
    return await t.handleRequest(req);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Failed to handle MCP GET stream' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-mcp-session-id',
    },
  });
}
