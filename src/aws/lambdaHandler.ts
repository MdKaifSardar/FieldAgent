import { runFeasibilityPlanner, PlanningInput } from '../core/feasibilityPlanner';
import { executePreset } from '../core/demoPresets';

/**
 * Standalone AWS Lambda Handler for FieldGuard Core Calculation
 * Deployment: AWS Lambda (Node.js 20.x/22.x runtime)
 * Architecture: Serverless calculation engine triggered via API Gateway or Function URL
 */
export async function handler(event: any) {
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
    const { presetId, planningInput } = body;

    if (presetId) {
      const decision = executePreset(presetId);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          source: 'AWS Lambda (ap-south-1)',
          executionTimestamp: new Date().toISOString(),
          decision,
        }),
      };
    }

    if (planningInput) {
      const decision = runFeasibilityPlanner(planningInput as PlanningInput);
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          source: 'AWS Lambda (ap-south-1)',
          executionTimestamp: new Date().toISOString(),
          decision,
        }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing presetId or planningInput payload' }),
    };
  } catch (error: any) {
    console.error('AWS Lambda execution error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error?.message || 'Lambda execution failed' }),
    };
  }
}
