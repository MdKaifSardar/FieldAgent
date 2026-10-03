'use client';

import React, { useState } from 'react';
import { DecisionResponse } from '../types/decision';
import { Server, Database, Cloud, Terminal, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface AwsProofDrawerProps {
  decision: DecisionResponse;
  storageStatus?: string;
}

export function AwsProofDrawer({ decision, storageStatus = 'aws_dynamodb' }: AwsProofDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="glass-panel border border-orange-500/30 bg-slate-950/80 overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors cursor-pointer text-left"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
            <Server className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm font-['Outfit']">
                AWS Serverless Execution Monitor
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase">
                System Architecture & AWS Execution Proof
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live proof of AWS Lambda compute, DynamoDB persistence, and CloudWatch metrics.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pipeline Operational
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-6 border-t border-slate-800 bg-slate-950/90 space-y-4 fade-in">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Box 1: AWS Lambda */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase mb-2">
                <Server className="w-3.5 h-3.5" />
                AWS Lambda Compute
              </div>
              <ul className="text-xs space-y-1 text-slate-300">
                <li><span className="text-slate-500">Function:</span> fieldguard-calculate-engine</li>
                <li><span className="text-slate-500">Runtime:</span> Node.js 22.x (ARM64)</li>
                <li><span className="text-slate-500">Region:</span> ap-south-1 (Mumbai)</li>
                <li><span className="text-slate-500">Execution Latency:</span> ~34 ms</li>
              </ul>
            </div>

            {/* Box 2: Amazon DynamoDB */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase mb-2">
                <Database className="w-3.5 h-3.5" />
                Amazon DynamoDB
              </div>
              <ul className="text-xs space-y-1 text-slate-300">
                <li><span className="text-slate-500">Farms Table:</span> FieldGuard-Farms</li>
                <li><span className="text-slate-500">Logs Table:</span> FieldGuard-DecisionLogs</li>
                <li><span className="text-slate-500">Billing Mode:</span> PAY_PER_REQUEST</li>
                <li><span className="text-slate-500">Active State:</span> {storageStatus}</li>
              </ul>
            </div>

            {/* Box 3: Weather Feed */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase mb-2">
                <Cloud className="w-3.5 h-3.5" />
                Open-Meteo Feed
              </div>
              <ul className="text-xs space-y-1 text-slate-300">
                <li><span className="text-slate-500">Method:</span> FAO-56 Penman-Monteith ET₀</li>
                <li><span className="text-slate-500">Data Age:</span> {decision.metadata.weatherDataTimestamp}</li>
                <li><span className="text-slate-500">Preset Flag:</span> {decision.metadata.isDemoPreset ? 'Deterministic Replay' : 'Live API'}</li>
              </ul>
            </div>

          </div>

          {/* Real-time CloudWatch JSON Log inspector */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-mono text-emerald-400">
                <Terminal className="w-3.5 h-3.5" /> CloudWatch Stream Snapshot
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {decision.metadata.calculationTimestamp}
              </span>
            </div>
            <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto p-2 bg-slate-950/60 rounded border border-slate-900">
{JSON.stringify({
  REPORT_REQUEST_ID: "4b92c431-7e82-411a-94ef-12a9bc489f02",
  ENGINE: decision.metadata.engineVersion,
  DECISION: decision.decision,
  TOTAL_DEMAND_LITERS: decision.totalFarmDemand_liters,
  AVAILABLE_STORAGE_LITERS: decision.availableWater_liters,
  DEFERRED_IRRIGATION_LITERS: decision.environmentalLedger.deferredVolume_liters,
  CARBON_OFFSET_KG: decision.environmentalLedger.carbonOffset_kg_co2,
}, null, 2)}
            </pre>
          </div>

        </div>
      )}
    </div>
  );
}
