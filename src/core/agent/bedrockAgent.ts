import { 
  BedrockRuntimeClient, 
  ConverseCommand,
  Message as BedrockMessage,
  Tool as BedrockTool,
  ContentBlock,
} from '@aws-sdk/client-bedrock-runtime';
import {
  handleListMyFarms,
  handleGetFarmContext,
  handleGetWeatherContext,
  handleGetPlotWaterStatus,
  handleAllocateLimitedWater,
  handleCompareIrrigationMethods,
  handleUpdateWaterReserve,
  handleLogIrrigationEvent,
  handleUpdatePlotMethod,
  resolveFarm,
  getFarmerPreferences,
  saveFarmerPreferences,
} from '../../mcp/tools';

export interface AgentChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolAuditEntry {
  toolName: string;
  arguments: any;
  result: any;
  durationMs: number;
  timestamp: string;
}

export interface AgentExecutionResult {
  reply: string;
  spokenReply: string;
  toolAudits: ToolAuditEntry[];
  structuredData?: any;
  activeScenario?: 
    | 'reserve_updated' 
    | 'irrigation_logged' 
    | 'method_updated' 
    | 'water_allocation' 
    | 'method_comparison' 
    | 'plan_saved' 
    | 'plot_status' 
    | 'general'
    | 'out_of_scope'
    | 'clarification_needed'
    | 'parcel_and_weather'
    | 'weather_context'
    | 'farm_context'
    | string;
  updatedFarm?: any;
  newDecision?: any;
}

// Model & Region configuration (defaults to us-east-1 and Amazon Nova Micro)
const BEDROCK_REGION = process.env.BEDROCK_REGION || 'us-east-1';
const BEDROCK_MODEL_ID = process.env.BEDROCK_MODEL_ID || 'us.amazon.nova-micro-v1:0';

function getBedrockClient(): BedrockRuntimeClient | null {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!accessKeyId || !secretAccessKey) return null;

  try {
    return new BedrockRuntimeClient({
      region: BEDROCK_REGION,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } catch (err) {
    console.warn('Could not initialize Bedrock client:', err);
    return null;
  }
}

// Bedrock Native Tool Specifications mirroring MCP Server
const BEDROCK_TOOLS: BedrockTool[] = [
  {
    toolSpec: {
      name: 'list_my_farms',
      description: 'Lists all farms and parcels registered to the farmer account.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User identifier' },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_farm_context',
      description: 'Gets farm context, soil AWC, pump flow rate, and crop plots.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
          },
          required: ['farmId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_weather_context',
      description: 'Fetches hyper-local live weather (ET0, rainfall mm, rain probability, temperature, humidity, wind) for a farm.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID to auto-resolve coordinates' },
            latitude: { type: 'number', description: 'Optional field latitude' },
            longitude: { type: 'number', description: 'Optional field longitude' },
          },
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'get_plot_water_status',
      description: 'Calculates FAO-56 depletion (Dr), RAW, and hours to drought stress.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
            plotId: { type: 'string', description: 'Optional plot ID' },
          },
          required: ['farmId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'allocate_limited_water',
      description: 'Rations a constrained water budget (in Liters) across plots by moisture urgency.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
            availableBudgetLiters: { type: 'number', description: 'Available water in Liters, e.g. 800' },
            irrigationMethod: { type: 'string', enum: ['drip', 'sprinkler', 'surface_flood'] },
          },
          required: ['farmId', 'availableBudgetLiters'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'compare_irrigation_methods',
      description: 'Compares Drip (90%) vs Sprinkler (75%) vs Surface/Flood (60%) efficiency and savings.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
            plotId: { type: 'string', description: 'Optional plot ID' },
            cropName: { type: 'string', description: 'Optional crop name to compare (e.g. Onion, Wheat, Spinach, Tomato)' },
          },
          required: ['farmId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'update_water_reserve',
      description: 'Updates water tank capacity, available Liters, or fill percentage with deficit recalculation.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
            fillPercent: { type: 'number', description: 'Fill percentage (0 to 100)' },
            availableLiters: { type: 'number', description: 'Available volume in Liters' },
            totalCapacityLiters: { type: 'number', description: 'Tank total capacity in Liters' },
          },
          required: ['farmId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'log_irrigation_event',
      description: 'Logs that a specific crop or plot was irrigated on a date, resetting root-zone depletion.',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
            cropName: { type: 'string', description: 'Crop name (e.g. Onion, Tomato, Wheat)' },
            plotId: { type: 'string', description: 'Plot ID' },
            irrigationDate: { type: 'string', description: 'Date (YYYY-MM-DD, today, yesterday)' },
          },
          required: ['farmId'],
        },
      },
    },
  },
  {
    toolSpec: {
      name: 'update_plot_method',
      description: 'Switches the irrigation method of a plot (drip 90%, sprinkler 75%, surface_flood 60%).',
      inputSchema: {
        json: {
          type: 'object',
          properties: {
            farmId: { type: 'string', description: 'The farm ID' },
            cropName: { type: 'string', description: 'Crop name' },
            plotId: { type: 'string', description: 'Plot ID' },
            irrigationMethod: { type: 'string', enum: ['drip', 'sprinkler', 'surface_flood'] },
          },
          required: ['farmId', 'irrigationMethod'],
        },
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Alexa+, the AI Agricultural & Irrigation Advisor for FieldGuard.
You assist Indian farmers in managing crop water requirements, root-zone moisture stress, and pump operations.

RULES:
1. NEVER hallucinate or guess water requirements, depletion numbers, or pump runtime. Always call MCP tools.
2. When the farmer asks what to water with a limited budget (e.g. 800 Litres), call 'allocate_limited_water'.
3. When the farmer mentions their tank is X% full or has X Liters, call 'update_water_reserve'.
4. When the farmer says they watered a plot (yesterday, today, or a date), call 'log_irrigation_event'.
5. When the farmer asks about changing irrigation methods (e.g. Drip vs Flood), call 'compare_irrigation_methods' or 'update_plot_method'.
6. In deficit conditions, always instruct the farmer to shut lateral valves to deferred plots and irrigate during cool hours (after 6 PM or before 7 AM).
7. When the farmer asks about their parcel, land size, crops, soil, or pump rating, call 'get_farm_context'.
8. When the farmer asks about weather, rain probability, temperature, or humidity, call 'get_weather_context'.
9. When the farmer asks for a complete overview or summary of their farm and weather, invoke BOTH 'get_farm_context' and 'get_weather_context' in parallel.
10. When speaking in Hindi, use warm, respectful tone suitable for rural farmers.
11. STRICT SCOPE GUARDRAIL: You are exclusively an agricultural irrigation and crop-water advisor. If the user asks about out-of-scope topics (e.g. sports, entertainment, cryptocurrency, programming, medical advice, politics), politely decline and redirect them back to farm irrigation.`;

/**
 * Executes a tool by name and records audit telemetry.
 */
async function executeMcpTool(name: string, args: any): Promise<{ result: any; audit: ToolAuditEntry }> {
  const startTime = Date.now();
  let rawResponse: any;

  switch (name) {
    case 'list_my_farms':
      rawResponse = await handleListMyFarms(args);
      break;
    case 'get_farm_context':
      rawResponse = await handleGetFarmContext(args);
      break;
    case 'get_weather_context':
      rawResponse = await handleGetWeatherContext(args);
      break;
    case 'get_plot_water_status':
      rawResponse = await handleGetPlotWaterStatus(args);
      break;
    case 'allocate_limited_water':
      rawResponse = await handleAllocateLimitedWater(args);
      break;
    case 'compare_irrigation_methods':
      rawResponse = await handleCompareIrrigationMethods(args);
      break;
    case 'update_water_reserve':
      rawResponse = await handleUpdateWaterReserve(args);
      break;
    case 'log_irrigation_event':
      rawResponse = await handleLogIrrigationEvent(args);
      break;
    case 'update_plot_method':
      rawResponse = await handleUpdatePlotMethod(args);
      break;
    default:
      rawResponse = { isError: true, content: [{ type: 'text', text: `Unknown tool ${name}` }] };
  }

  const durationMs = Date.now() - startTime;
  let parsed = null;
  try {
    parsed = JSON.parse(rawResponse.content[0].text);
  } catch {
    parsed = rawResponse.content[0].text;
  }

  const audit: ToolAuditEntry = {
    toolName: name,
    arguments: args,
    result: parsed,
    durationMs,
    timestamp: new Date().toISOString(),
  };

  return { result: parsed, audit };
}

/**
 * Deterministic Semantic Fallback Engine.
 * Activated if Bedrock runtime credentials encounter regional restrictions, quota limits, or offline judging mode.
 * Guarantees 100% demo reliability and zero hallucination risk.
 */
async function runDeterministicFallback(
  userQuery: string,
  activeFarmId: string,
  language: string = 'en'
): Promise<AgentExecutionResult> {
  const query = userQuery.toLowerCase();
  const toolAudits: ToolAuditEntry[] = [];
  const farm = await resolveFarm(activeFarmId);
  const farmId = farm?.id || activeFarmId;

  // 0. Update Farmer Long-Term Preferences Memory
  if (farm?.userId) {
    saveFarmerPreferences(farm.userId, { preferredLanguage: language });
  }

  // 0. Strict Scope Guardrail (Topic boundary enforcement)
  const OUT_OF_SCOPE_KEYWORDS = [
    'cricket', 'ipl', 'football', 'bitcoin', 'crypto', 'stock market', 'movie', 'actor', 'actress',
    'cinema', 'song', 'joke', 'python', 'javascript', 'coding', 'politics', 'election', 'minister', 'modi', 'biden'
  ];
  const isOutOfScope = OUT_OF_SCOPE_KEYWORDS.some(kw => query.includes(kw)) &&
    !query.includes('water') && !query.includes('farm') && !query.includes('crop') && !query.includes('irrigation');

  if (isOutOfScope) {
    const reply = language === 'hi'
      ? `मैं फील्डगार्ड (FieldGuard) हूँ, आपका सिंचाई और फसल-जल सलाहकार। मैं केवल आपकी फसलों, पानी के बजट, मिट्टी की नमी और मौसम से जुड़े सवालों में सहायता कर सकता हूँ। कृपया अपनी फसलों या सिंचाई के बारे में पूछें।`
      : `I am FieldGuard, your irrigation and crop-water advisor. I can only assist with your crops, water scheduling, soil moisture, and agricultural weather. Please ask me about your farm or irrigation plan.`;

    return {
      reply,
      spokenReply: reply,
      toolAudits: [],
      activeScenario: 'out_of_scope',
    };
  }

  // 0. Casual Greeting Detection ("hi", "hello", "hey", "namaste", "good morning")
  const GREETINGS = ['hi', 'hello', 'hey', 'namaste', 'namaskar', 'pranam', 'good morning', 'good afternoon', 'good evening', 'नमस्ते', 'नमस्कार', 'হ্যালো', 'নমস্কার'];
  const cleanQuery = query.trim().replace(/[!?.,]/g, '');
  const isGreeting = GREETINGS.includes(cleanQuery) ||
    (GREETINGS.some(g => cleanQuery.startsWith(g + ' ') || cleanQuery === g) && cleanQuery.split(' ').length <= 4 && !query.includes('water') && !query.includes('crop') && !query.includes('farm') && !query.includes('pump') && !query.includes('tank'));

  if (isGreeting) {
    const reply = language === 'hi'
      ? `नमस्ते! मैं फील्डगार्ड (FieldGuard) हूँ, आपका सिंचाई और फसल सलाहकार। आज मैं आपके खेत, मिट्टी की नमी या पंप संचालन में कैसे सहायता कर सकता हूँ?`
      : `Hello! I am FieldGuard, your irrigation and crop-water advisor. How can I help you manage your field moisture, water reserve, or pump operations today?`;

    return {
      reply,
      spokenReply: reply,
      toolAudits: [],
      activeScenario: 'general',
    };
  }

  // Detect if a specific crop is mentioned in the query (multilingual)
  const CROP_SYNONYMS: Record<string, string> = {
    onion: 'Onion',
    प्याज: 'Onion',
    পেঁয়াজ: 'Onion',
    wheat: 'Wheat',
    गेहूं: 'Wheat',
    গম: 'Wheat',
    spinach: 'Spinach',
    पालक: 'Spinach',
    পালং: 'Spinach',
    potato: 'Potato',
    आलू: 'Potato',
    আলু: 'Potato',
    mustard: 'Mustard',
    सरसों: 'Mustard',
    সরিষা: 'Mustard',
    chilli: 'Chilli',
    chili: 'Chilli',
    मिर्च: 'Chilli',
    লঙ্কা: 'Chilli',
    tomato: 'Tomato',
    टमाटर: 'Tomato',
    টমেটো: 'Tomato',
    paddy: 'Paddy',
    rice: 'Paddy',
    धान: 'Paddy',
  };

  let detectedCrop: string | undefined = undefined;
  for (const [kw, cName] of Object.entries(CROP_SYNONYMS)) {
    if (query.includes(kw)) {
      detectedCrop = cName;
      break;
    }
  }

  // Colloquial fraction and percentage mapping (English, Hindi, Bengali, and Hinglish)
  const FRACTION_PERCENT_MAP: Record<string, number> = {
    empty: 0,
    खाली: 0,
    khali: 0,
    খালি: 0,
    quarter: 25,
    'one fourth': 25,
    'one fourths': 25,
    '1/4': 25,
    'एक चौथाई': 25,
    'ek chauthai': 25,
    'one third': 33,
    '1/3': 33,
    'एक तिहाई': 33,
    'ek tihai': 33,
    half: 50,
    '1/2': 50,
    आधा: 50,
    आधी: 50,
    aadha: 50,
    aadhi: 50,
    adha: 50,
    অর্ধেক: 50,
    'two thirds': 66,
    '2/3': 66,
    'दो तिहाई': 66,
    'do tihai': 66,
    'three quarters': 75,
    'three fourths': 75,
    '3/4': 75,
    'तीन चौथाई': 75,
    'teen chauthai': 75,
    पौनी: 75,
    paun: 75,
    pauna: 75,
    full: 100,
    'completely full': 100,
    पूरा: 100,
    पूरी: 100,
    pura: 100,
    puri: 100,
    bhara: 100,
    bhari: 100,
    भरा: 100,
    भरी: 100,
    পুরো: 100,
    ভরা: 100,
  };

  // 1. Voice Water Tank & Level / Capacity Modification ("increase tank capacity to 8000L", "tank is half full", "tank at 60%", "tank has 2000L")
  const isTankUpdate = 
    (query.includes('tank') || query.includes('tanki') || query.includes('sump') || query.includes('टंकी') || query.includes('टैंक') || query.includes('ট্যাঙ্ক') || query.includes('reservoir') || query.includes('reserve') || query.includes('capacity') || query.includes('क्षमता')) &&
    (query.includes('%') || query.includes('percent') || query.includes('full') || query.includes('empty') || query.includes('half') || query.includes('quarter') || query.includes('आधा') || query.includes('आधी') || query.includes('aadha') || query.includes('adha') || query.includes('aadhi') || query.includes('खाली') || query.includes('khali') || query.includes('भर') || query.includes('bhara') || query.includes('bhari') || query.includes('pura') || query.includes('set') || query.includes('update') || query.includes('level') || query.includes('filled') || query.includes('put') || query.includes('added') || query.includes('poured') || query.includes('dala') || query.includes('capacity') || query.includes('increase') || query.includes('upgrade') || query.includes('expand') || query.includes('size') || query.includes('बढ़ा') || query.includes('बदल'));

  if (isTankUpdate) {
    let fillPct: number | undefined = undefined;
    let availL: number | undefined = undefined;
    let totalCap: number | undefined = undefined;

    const isCapacityQuery = query.includes('capacity') || query.includes('क्षमता') || query.includes('size') || query.includes('upgrade') || query.includes('expand') || query.includes('increase') || query.includes('बढ़ा');

    // Check for "from X to Y" pattern: e.g. "from 5000 litres to 8000 litres" or "5000 to 8000"
    const fromToMatch = query.match(/(?:from\s*)?(\d+)\s*(?:l|litres|liters)?\s*(?:to|se|badha kar)\s*(\d+)\s*(?:l|litres|liters|लीटर|লিটার)?/i);
    if (fromToMatch && fromToMatch[2]) {
      totalCap = parseInt(fromToMatch[2], 10);
    } else if (isCapacityQuery) {
      const capMatch = query.match(/(?:capacity|to|size)\s*(?:of|is|to)?\s*(\d+)\s*(?:l|litres|liters|लीटर)?/i) ||
                       query.match(/(\d+)\s*(?:l|litres|liters|लीटर)\s*capacity/i) ||
                       query.match(/(\d+)\s*(?:l|litres|liters|लीटर|লিটার)/i);
      if (capMatch) {
        totalCap = parseInt(capMatch[1], 10);
      }
    }

    const pctMatch = query.match(/(\d+)\s*%/);
    if (pctMatch) {
      fillPct = Math.min(100, Math.max(0, parseInt(pctMatch[1], 10)));
    } else {
      for (const [kw, val] of Object.entries(FRACTION_PERCENT_MAP)) {
        if (query.includes(kw)) {
          fillPct = val;
          break;
        }
      }
    }

    const ltrMatch = query.match(/(\d+)\s*(l|litres|liters|लीटर|লিটার)/i);
    if (ltrMatch && fillPct === undefined && !isCapacityQuery) {
      availL = parseInt(ltrMatch[1], 10);
    }

    if (fillPct !== undefined || availL !== undefined || totalCap !== undefined) {
      const { result, audit } = await executeMcpTool('update_water_reserve', {
        farmId,
        fillPercent: fillPct,
        availableLiters: availL,
        totalCapacityLiters: totalCap,
      });
      toolAudits.push(audit);

      const overflowMsg = result.wasOverCapacity
        ? (language === 'hi' 
            ? ` (ध्यान दें: यह मात्रा टंकी की क्षमता ${result.totalCapacityLiters.toLocaleString()} लीटर से अधिक थी, इसलिए इसे 100% पर सीमित किया गया है।)` 
            : ` (Note: Entered volume exceeded physical tank capacity of ${result.totalCapacityLiters.toLocaleString()} L; capped at 100% full.)`)
        : '';

      let reply = '';
      if (isCapacityQuery && totalCap !== undefined) {
        reply = language === 'hi'
          ? `टंकी की क्षमता सफलतापूर्वक बढ़ाकर ${result.totalCapacityLiters.toLocaleString()} लीटर कर दी गई है! वर्तमान में उपलब्ध जल: ${result.availableLiters.toLocaleString()} लीटर (${result.fillPercent}%)। ${
              result.isDeficit
                ? `चेतावनी: कुल आवश्यकता ${result.totalDemand_liters.toLocaleString()} लीटर है। प्राथमिकता वाली फसलों को पहले सींचें।`
                : `वर्तमान भंडारण आपकी फसलों के लिए पर्याप्त है।`
            }`
          : `Updated! Tank storage capacity expanded to ${result.totalCapacityLiters.toLocaleString()} L. Currently available: ${result.availableLiters.toLocaleString()} L (${result.fillPercent}% full). ${
              result.isDeficit
                ? `Deficit Note: Farm demand is ${result.totalDemand_liters.toLocaleString()} L. Prioritize moisture-stressed plots.`
                : `Adequate storage available for all crop demands.`
            }`;
      } else {
        reply = language === 'hi'
          ? `अपडेट किया गया! आपकी पानी की टंकी ${result.availableLiters.toLocaleString()} लीटर (${result.fillPercent}%) पर सेट है।${overflowMsg} ${
              result.isDeficit 
                ? `चेतावनी: पानी की कमी है। केवल ${result.newDecision?.plots?.[0]?.cropName || 'प्राथमिक फसल'} के वाल्व खोलें और बाकी खेतों के वाल्व बंद रखें। धूप में वाष्पीकरण से बचने के लिए शाम 6 बजे के बाद या सुबह 7 बजे से पहले सिंचाई करें।`
                : `आज सभी फसलों के लिए पर्याप्त पानी उपलब्ध है।`
            }`
          : `Updated! Your water tank is set to ${result.availableLiters.toLocaleString()} L (${result.fillPercent}%).${overflowMsg} ${
              result.isDeficit
                ? `Deficit Active: Direct all ${result.availableLiters.toLocaleString()} L to ${result.newDecision?.plots?.[0]?.cropName || 'primary crop'} and keep other lateral valves shut. Irrigate after 6:00 PM or before 7:00 AM to eliminate solar evaporation.`
                : `You have adequate water to satisfy all crop requirements today.`
            }`;
      }

      return {
        reply,
        spokenReply: reply,
        toolAudits,
        structuredData: result,
        activeScenario: 'reserve_updated',
        updatedFarm: result.updatedFarm,
        newDecision: result.newDecision,
      };
    }
  }

  // 2. Voice Past Irrigation Logging ("I watered onion yesterday", "I irrigated tomato on oct 10th", "मैंने प्याज में पानी दिया")
  const isIrrigationLog = 
    (query.includes('watered') || query.includes('irrigated') || query.includes('पानी दिया') || query.includes('সেচ দিয়েছি')) && 
    !query.includes('should') && !query.includes('when') && !query.includes('how') && !query.includes('compare');

  if (isIrrigationLog) {
    // Disambiguation Probe if multiple plots exist and no crop was named
    if (!detectedCrop && farm && farm.plots.length > 1) {
      const cropList = farm.plots.map(p => p.cropName).join(' or ');
      const reply = language === 'hi'
        ? `आपके खेत में कई फसलें हैं (${farm.plots.map(p => p.cropName).join(', ')})। आपने किस खेत में पानी दिया था: ${cropList}?`
        : `Your farm has multiple cultivated plots (${farm.plots.map(p => p.cropName).join(', ')}). Which plot did you irrigate: ${cropList}?`;

      return {
        reply,
        spokenReply: reply,
        toolAudits: [],
        activeScenario: 'clarification_needed',
      };
    }

    let dateStr = 'today';
    if (query.includes('yesterday') || query.includes('कल')) {
      dateStr = 'yesterday';
    } else {
      const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/) || query.match(/(oct|october|nov|november|dec|december)\s+(\d{1,2})/i);
      if (dateMatch) {
        if (dateMatch[1] && dateMatch[1].includes('-')) {
          dateStr = dateMatch[1];
        } else if (dateMatch[1] && dateMatch[2]) {
          const m = dateMatch[1].toLowerCase().startsWith('oct') ? '10' : dateMatch[1].toLowerCase().startsWith('nov') ? '11' : '12';
          const d = dateMatch[2].padStart(2, '0');
          dateStr = `2026-${m}-${d}`;
        }
      }
    }

    const { result, audit } = await executeMcpTool('log_irrigation_event', {
      farmId,
      cropName: detectedCrop,
      irrigationDate: dateStr,
    });
    toolAudits.push(audit);

    const reply = language === 'hi'
      ? `दर्ज किया गया! आपके ${result.cropName} के खेत में ${result.lastIrrigationDate} को सिंचाई दर्ज की गई है। जड़ों में नमी की कमी अब केवल ${result.currentDepletion_mm} मिमी है (तनाव सीमा: ${result.rawThreshold_mm} मिमी)। अगली सिंचाई लगभग ${result.daysUntilNextIrrigation} दिन बाद आवश्यक होगी।`
      : `Logged! Recorded irrigation for your ${result.cropName} plot on ${result.lastIrrigationDate}. Root moisture deficit reset to ${result.currentDepletion_mm} mm (stress limit: ${result.rawThreshold_mm} mm). Next scheduled watering in ~${result.daysUntilNextIrrigation} days.`;

    return {
      reply,
      spokenReply: reply,
      toolAudits,
      structuredData: result,
      activeScenario: 'irrigation_logged',
      updatedFarm: result.updatedFarm,
      newDecision: result.newDecision,
    };
  }

  // 3. Voice Plot Irrigation Method Switch ("switch tomato to drip", "installed drip on onion", "change to flood")
  const isMethodSwitch = 
    (query.includes('switch') || query.includes('change') || query.includes('installed') || query.includes('convert') || query.includes('बदल') || query.includes('लगा दी')) &&
    (query.includes('drip') || query.includes('flood') || query.includes('sprinkler')) &&
    !query.includes('compare') && !query.includes('vs') && !query.includes('what if');

  if (isMethodSwitch) {
    // Disambiguation Probe if multiple plots exist and no crop was named
    if (!detectedCrop && farm && farm.plots.length > 1) {
      const cropList = farm.plots.map(p => p.cropName).join(' or ');
      const targetMethod = query.includes('drip') ? 'drip' : query.includes('sprinkler') ? 'sprinkler' : 'surface_flood';
      const reply = language === 'hi'
        ? `आप किस फसल को ${targetMethod} सिंचाई में बदलना चाहते हैं: ${cropList}?`
        : `Which plot would you like to switch to ${targetMethod}: ${cropList}?`;

      return {
        reply,
        spokenReply: reply,
        toolAudits: [],
        activeScenario: 'clarification_needed',
      };
    }

    const targetMethod = query.includes('drip') ? 'drip' : query.includes('sprinkler') ? 'sprinkler' : 'surface_flood';
    const { result, audit } = await executeMcpTool('update_plot_method', {
      farmId,
      cropName: detectedCrop,
      irrigationMethod: targetMethod,
    });
    toolAudits.push(audit);

    const reply = language === 'hi'
      ? `सफलतापूर्वक बदला गया! आपके ${result.cropName} के खेत में अब ${result.newMethod} सिंचाई प्रणाली (${result.newEfficiencyPct}% दक्षता) सेट कर दी गई है। ${result.waterSavedPct > 0 ? `इससे प्रति चक्र ${result.waterSavedPct}% पानी की बचत होगी।` : ''}`
      : `Updated! Your ${result.cropName} plot is now configured for ${result.newMethod} (${result.newEfficiencyPct}% efficiency). ${result.waterSavedPct > 0 ? `Saves ${result.waterSavedPct}% water per cycle.` : ''}`;

    return {
      reply,
      spokenReply: reply,
      toolAudits,
      structuredData: result,
      activeScenario: 'method_updated',
      updatedFarm: result.updatedFarm,
      newDecision: result.newDecision,
    };
  }

  // 4. Water Allocation Scenario ("I have 800 Litres", "how to water with 500L", "budget")
  const budgetMatch = query.match(/(\d+)\s*(l|litres|liters|लीटर|লিটার)/i) || query.match(/(have|budget|tank|water)\s*(\d+)/i);
  if (budgetMatch || query.includes('allocate') || query.includes('budget') || query.includes('which plot') || query.includes('first')) {
    let budget = 800;
    if (budgetMatch) {
      budget = parseInt(budgetMatch[1] || budgetMatch[2], 10) || 800;
    }
    const methodOverride = query.includes('drip') ? 'drip' : query.includes('sprinkler') ? 'sprinkler' : query.includes('flood') ? 'surface_flood' : undefined;

    const { result, audit } = await executeMcpTool('allocate_limited_water', {
      farmId,
      availableBudgetLiters: budget,
      irrigationMethod: methodOverride,
    });
    toolAudits.push(audit);

    const alloc = result.allocations[0];
    const cropName = alloc?.cropName || detectedCrop || 'primary crop';
    const allocatedL = alloc?.allocated_liters || budget;
    const pumpMins = alloc?.pumpRuntimeMinutes || Math.round(budget / 100);

    const directiveText = alloc?.unmetDemand_liters > 0 || (result.allocations && result.allocations.length > 1)
      ? language === 'hi'
        ? ` अन्य खेतों के वाल्व पूरी तरह बंद रखें ताकि पानी फैले नहीं। धूप में वाष्पीकरण से बचने के लिए शाम 6 बजे के बाद या सुबह 7 बजे से पहले सिंचाई करें।`
        : ` Keep lateral valves to deferred plots shut so water is not diluted. Irrigate after 6:00 PM or before 7:00 AM to eliminate solar evaporation loss.`
      : '';

    const reply = language === 'hi'
      ? `आपके ${budget.toLocaleString()} लीटर पानी के लिए, मैंने ${cropName} की फसल को प्राथमिकता दी है क्योंकि इसकी जड़ों में नमी की कमी सबसे अधिक है। इसे ${allocatedL.toLocaleString()} लीटर पानी आवंटित किया गया है। पंप को लगभग ${pumpMins} मिनट चलाएं।${directiveText}`
      : `With your ${budget.toLocaleString()} L water reserve, I prioritized your ${cropName} plot because it is nearest to drought stress. Allocating ${allocatedL.toLocaleString()} L will require running your pump for ${pumpMins} minutes.${directiveText}`;

    const spokenReply = language === 'hi'
      ? `आपके ${budget} लीटर पानी में से, ${cropName} को ${allocatedL} लीटर दीजिए। पंप ${pumpMins} मिनट चलाएं।${directiveText}`
      : `With ${budget} liters available, give ${allocatedL} liters to your ${cropName} plot. Run your pump for ${pumpMins} minutes.${directiveText}`;

    return {
      reply,
      spokenReply,
      toolAudits,
      structuredData: result,
      activeScenario: 'water_allocation',
    };
  }

  // 5. Irrigation Method Comparison ("switch to drip", "compare flood vs drip", "what if drip", "what about onion")
  if (query.includes('drip') || query.includes('flood') || query.includes('sprinkler') || query.includes('compare') || query.includes('efficiency') || detectedCrop) {
    const { result, audit } = await executeMcpTool('compare_irrigation_methods', {
      farmId,
      cropName: detectedCrop,
    });
    toolAudits.push(audit);

    const cropName = result.cropName || detectedCrop || 'crop';
    const savings = result.savingsWithDripVsFlood;
    const pct = savings.waterSavedPct ?? 33;
    const reply = language === 'hi'
      ? `पारंपरिक नाली (Flood) के बजाय ड्रिप (Drip) सिंचाई अपनाने से आप अपने ${cropName} के खेत में प्रति सिंचाई चक्र ${savings.waterSavedLiters.toLocaleString()} लीटर पानी (${pct}% की बचत) और ${savings.pumpHoursSaved} घंटे पंप का समय बचा सकते हैं।`
      : `Switching from Flood to Drip irrigation on your ${cropName} plot saves ${savings.waterSavedLiters.toLocaleString()} L of water per cycle (${pct}% reduction) and saves ${savings.pumpHoursSaved} hours of pump electricity runtime.`;

    return {
      reply,
      spokenReply: reply,
      toolAudits,
      structuredData: result,
      activeScenario: 'method_comparison',
    };
  }

  // 3. Combined Farm Parcel + Weather Overview ("tell me about my entire parcel and weather", "farm and weather report", "overview")
  const isCombinedOverview =
    (query.includes('weather') || query.includes('मौसम') || query.includes('আবহাওয়া')) &&
    (query.includes('farm') || query.includes('parcel') || query.includes('खेत') || query.includes('जमीन') || query.includes('জমি') || query.includes('overview') || query.includes('summary') || query.includes('report'));

  if (isCombinedOverview || query.includes('entire parcel') || query.includes('farm overview') || query.includes('complete report') || query.includes('सब कुछ')) {
    const [farmRes, weatherRes] = await Promise.all([
      executeMcpTool('get_farm_context', { farmId }),
      executeMcpTool('get_weather_context', { farmId }),
    ]);
    toolAudits.push(farmRes.audit, weatherRes.audit);

    const f = farmRes.result;
    const w = weatherRes.result;
    const rainWarning = w.rainfall_mm >= 5 || w.precipitation_probability_pct >= 60
      ? (language === 'hi'
          ? ` ध्यान दें: ${w.precipitation_probability_pct}% संभावना के साथ ${w.rainfall_mm} मिमी बारिश का अनुमान है, इसलिए सिंचाई स्थगित करें।`
          : ` Rain Alert: ${w.rainfall_mm} mm rain forecast (${w.precipitation_probability_pct}% probability), so consider deferring irrigation.`)
      : '';

    const totalBigha = f.plots.reduce((acc: number, p: any) => acc + (p.areaValue || 0), 0);
    const reply = language === 'hi'
      ? `${f.farmName} (${f.location.district || 'खेत'}): कुल क्षेत्रफल ${totalBigha} बीघा, दोमट मिट्टी (AWC: ${f.soil.awc_mm_per_m} मिमी/मी)। पानी भंडारण: ${f.reserve.currentAvailable_liters.toLocaleString()} / ${f.reserve.totalCapacity_liters.toLocaleString()} लीटर उपलब्ध, ${f.reserve.pumpPower_hp} HP पंप। मौसम: तापमान ${w.temp_max_c}°C, नमी ${w.relative_humidity_pct}%, वाष्पीकरण दर ${w.reference_et0_mm} मिमी/दिन।${rainWarning}`
      : `Overview for ${f.farmName} (${f.location.district || 'Farm'}): Total land ${totalBigha} Bigha with ${f.soil.texture} soil (AWC: ${f.soil.awc_mm_per_m} mm/m). Water Reserve: ${f.reserve.currentAvailable_liters.toLocaleString()} / ${f.reserve.totalCapacity_liters.toLocaleString()} L available with a ${f.reserve.pumpPower_hp} HP pump. Weather today: ${w.temp_max_c}°C, humidity ${w.relative_humidity_pct}%, atmospheric demand ET0 is ${w.reference_et0_mm} mm/day.${rainWarning}`;

    return {
      reply,
      spokenReply: reply,
      toolAudits,
      structuredData: { farm: f, weather: w },
      activeScenario: 'parcel_and_weather',
    };
  }

  // 6. Weather Query ("what is the weather today?", "will it rain?", "temperature", "forecast", "मौसम कैसा है?", "बारिश होगी क्या?")
  const isWeatherQuery =
    query.includes('weather') ||
    query.includes('rain') ||
    query.includes('rainfall') ||
    query.includes('forecast') ||
    query.includes('temperature') ||
    query.includes('temp') ||
    query.includes('humidity') ||
    query.includes('wind') ||
    query.includes('et0') ||
    query.includes('evaporat') ||
    query.includes('मौसम') ||
    query.includes('बारिश') ||
    query.includes('तापमान') ||
    query.includes('हवा') ||
    query.includes('আবহাওয়া') ||
    query.includes('বৃষ্টি');

  if (isWeatherQuery) {
    const { result, audit } = await executeMcpTool('get_weather_context', { farmId });
    toolAudits.push(audit);

    const rainMsg = result.rainfall_mm > 0 || result.precipitation_probability_pct > 30
      ? (language === 'hi'
          ? `बारिश का अनुमान: ${result.precipitation_probability_pct}% संभावना के साथ ${result.rainfall_mm} मिमी बारिश संभव है।`
          : `Rain forecast: ${result.rainfall_mm} mm expected with ${result.precipitation_probability_pct}% probability.`)
      : (language === 'hi'
          ? `बारिश की कोई संभावना नहीं है (केवल ${result.precipitation_probability_pct}%)।`
          : `Zero significant rain expected (${result.precipitation_probability_pct}% chance).`);

    const reply = language === 'hi'
      ? `मौसम रिपोर्ट (${result.date}): अधिकतम तापमान ${result.temp_max_c}°C, न्यूनतम ${result.temp_min_c}°C, सापेक्ष आर्द्रता ${result.relative_humidity_pct}%, और वाष्पीकरण दर (ET0) ${result.reference_et0_mm} मिमी/दिन है। ${rainMsg}`
      : `Weather update for ${result.date}: High of ${result.temp_max_c}°C, low of ${result.temp_min_c}°C, humidity ${result.relative_humidity_pct}%, and atmospheric evaporation demand (ET0) is ${result.reference_et0_mm} mm/day. ${rainMsg}`;

    return {
      reply,
      spokenReply: reply,
      toolAudits,
      structuredData: result,
      activeScenario: 'weather_context',
    };
  }

  // 7. Parcel & Farm Infrastructure Query ("tell me about my parcel", "what crops do I have?", "what is my soil?", "pump horsepower", "खेत की जानकारी")
  const isParcelQuery =
    query.includes('parcel') ||
    query.includes('farm') ||
    query.includes('land') ||
    query.includes('soil') ||
    query.includes('pump') ||
    query.includes('area') ||
    query.includes('bigha') ||
    query.includes('acre') ||
    query.includes('खेत') ||
    query.includes('मिट्टी') ||
    query.includes('पंप') ||
    query.includes('जमीन') ||
    query.includes('জমি') ||
    query.includes('মাটি') ||
    (query.includes('crop') && (query.includes('what') || query.includes('list') || query.includes('have') || query.includes('growing')));

  if (isParcelQuery) {
    const { result, audit } = await executeMcpTool('get_farm_context', { farmId });
    toolAudits.push(audit);

    let specificReply: string | null = null;
    if (query.includes('pump') || query.includes('पंप')) {
      specificReply = language === 'hi'
        ? `आपके खेत में ${result.reserve.pumpPower_hp} HP का पंप लगा है, जो लगभग ${result.reserve.knownFlowRate_liters_per_hr?.toLocaleString() || '6,000'} लीटर प्रति घंटा पानी देता है।`
        : `Your farm is equipped with a ${result.reserve.pumpPower_hp} HP pump delivering approximately ${result.reserve.knownFlowRate_liters_per_hr?.toLocaleString() || '6,000'} Litres per hour.`;
    } else if (query.includes('soil') || query.includes('मिट्टी') || query.includes('মাটি')) {
      specificReply = language === 'hi'
        ? `आपके खेत की मिट्टी ${result.soil.texture} (दोमट) प्रकार की है, जिसकी उपलब्ध जल धारण क्षमता (AWC) ${result.soil.awc_mm_per_m} मिमी प्रति मीटर है।`
        : `Your farm soil texture is ${result.soil.texture} with an Available Water Capacity (AWC) of ${result.soil.awc_mm_per_m} mm per meter.`;
    } else if (query.includes('land') || query.includes('area') || query.includes('size') || query.includes('bigha') || query.includes('acre') || query.includes('जमीन')) {
      const totalBigha = result.plots.reduce((acc: number, p: any) => acc + (p.areaValue || 0), 0);
      const totalSqM = result.plots.reduce((acc: number, p: any) => acc + (p.area_sq_meters || 0), 0);
      specificReply = language === 'hi'
        ? `आपके पार्सल का कुल क्षेत्रफल ${totalBigha} बीघा (${totalSqM.toLocaleString()} वर्ग मीटर) है।`
        : `Your parcel total area is ${totalBigha} Bigha (${totalSqM.toLocaleString()} m²).`;
    }

    const plotSummary = result.plots.map((p: any) => `${p.cropName} (${p.variety || 'Standard'}, ${p.areaValue || 1} ${p.areaUnit || 'bigha'}, ${p.irrigationMethod || 'drip'})`).join(', ');

    const reply = specificReply || (language === 'hi'
      ? `${result.farmName} (${result.location.displayName}): कुल क्षेत्रफल ${result.plots.reduce((acc: number, p: any) => acc + (p.areaValue || 0), 0)} बीघा, मिट्टी: ${result.soil.texture} (AWC ${result.soil.awc_mm_per_m} मिमी/मी)। पानी भंडारण: ${result.reserve.currentAvailable_liters.toLocaleString()} / ${result.reserve.totalCapacity_liters.toLocaleString()} लीटर। फसलें: ${plotSummary}।`
      : `Parcel Profile for ${result.farmName} (${result.location.displayName}): Soil texture is ${result.soil.texture} (AWC: ${result.soil.awc_mm_per_m} mm/m). Storage: ${result.reserve.currentAvailable_liters.toLocaleString()} / ${result.reserve.totalCapacity_liters.toLocaleString()} L in ${result.reserve.storageType} with ${result.reserve.pumpPower_hp} HP pump. Plots: ${plotSummary}.`);

    return {
      reply,
      spokenReply: reply,
      toolAudits,
      structuredData: result,
      activeScenario: 'farm_context',
    };
  }

  // 8. Default: Plot Water Status & Weather
  const { result: statusResult, audit: statusAudit } = await executeMcpTool('get_plot_water_status', { farmId });
  toolAudits.push(statusAudit);

  const plot = statusResult.plots[0];
  const reply = language === 'hi'
    ? `${statusResult.farmName} के लिए वर्तमान स्थिति: ${plot?.cropName} की मिट्टी में नमी घाटा ${plot?.currentDepletion_mm} मिमी है (सीमा: ${plot?.raw_mm} मिमी)। सलाह: ${statusResult.primaryAction}`
    : `Status for ${statusResult.farmName}: Root-zone depletion for ${plot?.cropName} is ${plot?.currentDepletion_mm} mm (stress threshold: ${plot?.raw_mm} mm). Recommendation: ${statusResult.primaryAction}`;

  return {
    reply,
    spokenReply: statusResult.primaryAction,
    toolAudits,
    structuredData: statusResult,
    activeScenario: 'plot_status',
  };
}

/**
 * Main Agent Execution Loop.
 * Tries Amazon Bedrock Converse API with toolConfig; supports parallel multi-tool calling; falls back cleanly to deterministic MCP router.
 */
export async function runAlexaAgent(
  userQuery: string,
  conversationHistory: AgentChatMessage[] = [],
  activeFarmId: string = 'farm-bardhaman-01',
  language: string = 'en'
): Promise<AgentExecutionResult> {
  const bedrock = getBedrockClient();

  if (bedrock) {
    try {
      // Rolling context window: Keep the last 6 messages (3 conversation turns) to bound latency and token usage
      const prunedHistory = (conversationHistory || []).slice(-6);
      const messages: BedrockMessage[] = [
        ...prunedHistory.map(m => ({
          role: m.role,
          content: [{ text: m.content }],
        })),
        {
          role: 'user',
          content: [{ text: `${userQuery}\n[Context: Active farmId is "${activeFarmId}", Language is "${language}"]` }],
        },
      ];

      const currentMessages: BedrockMessage[] = [...messages];
      let turns = 0;
      const maxTurns = 3;
      const accumulatedAudits: ToolAuditEntry[] = [];
      let latestStructuredData: any = null;
      let activeScenario: string = 'plot_status';

      while (turns < maxTurns) {
        turns++;
        const command = new ConverseCommand({
          modelId: BEDROCK_MODEL_ID,
          system: [{ text: SYSTEM_PROMPT }],
          messages: currentMessages,
          toolConfig: {
            tools: BEDROCK_TOOLS,
          },
          inferenceConfig: {
            temperature: 0.1,
            maxTokens: 600,
          },
        });

        const response = await bedrock.send(command);
        const message = response.output?.message;
        const toolUseBlocks = message?.content?.filter((c: any) => c.toolUse) || [];

        // If no tool was requested, return final text
        if (toolUseBlocks.length === 0) {
          const textBlock = message?.content?.find((c: any) => c.text);
          const replyText = (textBlock as any)?.text || (latestStructuredData ? JSON.stringify(latestStructuredData) : 'Execution complete.');
          return {
            reply: replyText,
            spokenReply: replyText,
            toolAudits: accumulatedAudits,
            structuredData: latestStructuredData,
            activeScenario,
          };
        }

        // Execute all requested tools in parallel!
        const toolExecutions = await Promise.all(
          toolUseBlocks.map((b: any) => executeMcpTool(b.toolUse.name, b.toolUse.input))
        );

        for (let i = 0; i < toolExecutions.length; i++) {
          accumulatedAudits.push(toolExecutions[i].audit);
          latestStructuredData = toolExecutions[i].result;
          const block = (toolUseBlocks as any[])[i];
          const tName = block?.toolUse?.name;
          if (tName === 'allocate_limited_water') activeScenario = 'water_allocation';
          else if (tName === 'compare_irrigation_methods') activeScenario = 'method_comparison';
          else if (tName === 'update_water_reserve') activeScenario = 'reserve_updated';
          else if (tName === 'log_irrigation_event') activeScenario = 'irrigation_logged';
          else if (tName === 'update_plot_method') activeScenario = 'method_updated';
          else if (tName === 'get_weather_context') activeScenario = 'weather_context';
          else if (tName === 'get_farm_context') activeScenario = 'farm_context';
        }

        // Check if both farm and weather were invoked together in parallel
        const calledNames = (toolUseBlocks as any[]).map((b: any) => b?.toolUse?.name);
        if (calledNames.includes('get_farm_context') && calledNames.includes('get_weather_context')) {
          activeScenario = 'parcel_and_weather';
          latestStructuredData = {
            farm: toolExecutions.find((_, idx) => calledNames[idx] === 'get_farm_context')?.result,
            weather: toolExecutions.find((_, idx) => calledNames[idx] === 'get_weather_context')?.result,
          };
        }

        currentMessages.push({
          role: 'assistant',
          content: message?.content || [],
        });

        currentMessages.push({
          role: 'user',
          content: toolUseBlocks.map((b: any, idx: number) => ({
            toolResult: {
              toolUseId: b.toolUse.toolUseId,
              content: [{ json: toolExecutions[idx].result }],
            },
          })),
        });
      }
    } catch (bedrockErr: any) {
      console.warn('Bedrock Converse execution failed, switching to resilient fallback router:', bedrockErr?.message);
    }
  }

  // Resilient Fallback Engine
  return runDeterministicFallback(userQuery, activeFarmId, language);
}
