# Developer Friction Log — FieldGuard (Amazon Developer Hackathon 2026)

This document records the official developer friction log entries for the **Alexa+ Track** and **AWS Builder Mini-Challenge**, detailing specific tasks attempted, expected vs. actual outcomes, severity ratings, workarounds implemented, and actionable suggestions for the Amazon Developer Relations and AWS service teams.

---

## Friction Log Entry 1: `@modelcontextprotocol/sdk` Streamable HTTP Transport in Serverless / Next.js

* **Developer Tool / SDK**: `@modelcontextprotocol/sdk` (v1.32+)
* **Category**: Protocol & Transport Integration
* **Task Attempted**:
  Implement a self-hosted Model Context Protocol (MCP) server conforming to specification `2025-11-25` over Streamable HTTP inside Next.js App Router API Route Handlers (`src/app/api/mcp/route.ts`).
* **Steps Taken**:
  1. Installed `@modelcontextprotocol/sdk` and `zod`.
  2. Initialized `McpServer` and defined tools (`list_my_farms`, `allocate_limited_water`, `compare_irrigation_methods`, etc.).
  3. Attempted to connect using `WebStandardStreamableHTTPServerTransport`.
* **Expected Result**:
  Out-of-the-box documentation and pattern for wrapping Web Standard `Request` and `Response` objects in modern serverless frameworks (Next.js App Router / AWS Lambda).
* **Actual Result**:
  By default, `WebStandardStreamableHTTPServerTransport` assumes stateful session management. In a serverless runtime where containers can cold-start or scale horizontally across invocations, default session maps cause session loss or memory retention across warm instances.
* **Severity Rating**: **Medium**
* **Workaround Used**:
  Explicitly configured stateless mode:
  ```typescript
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode compliant with modern serverless
    enableJsonResponse: true,      // Direct JSON-RPC 2.0 response for HTTP POST calls
  });
  ```
* **Actionable Suggestion for Amazon / MCP Team**:
  Provide an official `@modelcontextprotocol/sdk/adapters/nextjs` or `@modelcontextprotocol/sdk/adapters/lambda` package with first-class Route Handler templates and pre-configured CORS/OPTIONS handling.

---

## Friction Log Entry 2: Bedrock Converse API Tool Schema vs. Zod Schema Dual Declaration

* **Developer Tool / SDK**: `@aws-sdk/client-bedrock-runtime` + `@modelcontextprotocol/sdk`
* **Category**: Developer Experience & Tool Chaining
* **Task Attempted**:
  Pass MCP tool definitions directly into the Amazon Bedrock Converse API (`ConverseCommand`) with tool-calling capabilities (`toolConfig.tools`).
* **Steps Taken**:
  1. Defined 8 agronomic tools in MCP using Zod schemas (`src/mcp/tools.ts`).
  2. Attempted to supply those tool schemas directly to `ConverseCommand({ toolConfig: { tools: [...] } })`.
* **Expected Result**:
  A single schema definition could be shared seamlessly between the MCP server registry and the Bedrock agent tool configuration.
* **Actual Result**:
  Bedrock Converse API expects a strict JSON Schema object wrapped inside `{ toolSpec: { name, description, inputSchema: { json: { type: 'object', properties: ... } } } }`, whereas `McpServer.tool` takes native Zod shapes (`ZodRawShapeCompat`). Developers must manually maintain parallel schema definitions or write a custom converter.
* **Severity Rating**: **Medium**
* **Workaround Used**:
  Authored mirrored JSON schemas for Bedrock Converse (`BEDROCK_TOOLS` in `src/core/agent/bedrockAgent.ts`) that map 1:1 to the Zod tool schemas in `src/mcp/tools.ts`.
* **Actionable Suggestion for AWS Team**:
  AWS SDK for JavaScript should provide a utility function or adapter (e.g., `mcpToBedrockToolConfig(mcpServer)`) that automatically extracts and compiles MCP tool specifications into Bedrock Converse `toolConfig` structures.

---

## Friction Log Entry 3: Cross-Region Model Inference Latency & Regional Quotas

* **Developer Tool / SDK**: Amazon Bedrock (`@aws-sdk/client-bedrock-runtime`) + AWS DynamoDB (`@aws-sdk/client-dynamodb`)
* **Category**: Architecture & Regional Deployment
* **Task Attempted**:
  Deploy an agentic workflow where persistent state and farmer data reside in `ap-south-1` (Mumbai), while invoking Anthropic Claude 3 Haiku for tool selection.
* **Steps Taken**:
  1. Configured AWS credentials for DynamoDB and Cognito in `ap-south-1`.
  2. Attempted to invoke Bedrock models in the same region (`ap-south-1`).
* **Expected Result**:
  All models available across all commercial AWS regions with uniform IAM and quota entitlements.
* **Actual Result**:
  Certain Claude models require cross-region inference profiles or routing to `us-east-1` / `us-west-2`. If an IAM role or hackathon account does not have model access activated in `ap-south-1`, calls fail with an unhandled exception unless region failover is explicitly coded.
* **Severity Rating**: **Important / High for Live Demos**
* **Workaround Used**:
  Decoupled `BEDROCK_REGION` (defaulting to `us-east-1`) from `AWS_REGION` (`ap-south-1`), and engineered a **deterministic agent fallback router** in `src/core/agent/bedrockAgent.ts`. If Bedrock model inference is throttled or offline, the fallback router executes the exact same verified MCP tools, returns real FAO-56 telemetry, and persists directly to DynamoDB without breaking the live UI demo.
* **Actionable Suggestion for AWS Team**:
  Provide unified cross-region inference endpoints that automatically route requests to the nearest region with available foundation model capacity without requiring developers to manually reconfigure region endpoints.

---

## Friction Log Entry 4: Browser Web Speech API Dialect Support vs. Amazon Polly Output

* **Developer Tool / SDK**: Web Speech API (`webkitSpeechRecognition`) + Amazon Polly (`@aws-sdk/client-polly`)
* **Category**: Multimodal Voice Experience
* **Task Attempted**:
  Create a hands-free conversational voice loop for rural Indian farmers with support for Indian English (`en-IN`) and Hindi (`hi-IN`).
* **Steps Taken**:
  1. Used `webkitSpeechRecognition` with `recognition.lang = 'hi-IN'` or `'en-IN'`.
  2. Synthesized responses via Amazon Polly neural voices (`Kajal` / `Aditi`).
* **Expected Result**:
  Consistent microphone capture across mobile browsers (Chrome, Safari, Firefox).
* **Actual Result**:
  Firefox on desktop does not support Web Speech API recognition natively, and mobile Chrome requires explicit user gestures to initiate audio playback.
* **Severity Rating**: **Low / Medium**
* **Workaround Used**:
  Added a dual-mode interface:
  - Hands-free microphone button with clear listening visual pulse when supported.
  - Text input bar + 1-tap quick action chips as instant fallback.
  - User-initiated audio playback controls with fallback to browser `SpeechSynthesis`.
* **Actionable Suggestion for Amazon Team**:
  Introduce a lightweight, client-side WebAssembly voice recognition module for Alexa+ web experiences that works consistently across all modern browsers without relying on browser-proprietary Web Speech implementations.
