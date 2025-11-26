import React, { useState } from 'react';
import { MOCK_SMART_CONTRACT } from '../constants';
import { analyzeSmartContract } from '../services/geminiService';
import { ContractAnalysis } from '../types';
import { ShieldCheck, ShieldAlert, Bot, CheckCircle2 } from 'lucide-react';

export const ContractViewer: React.FC = () => {
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSmartContract(MOCK_SMART_CONTRACT);
    setAnalysis(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold font-display">Smart Contract</h2>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
        >
          {isAnalyzing ? (
             <>
               <Bot className="w-4 h-4 animate-spin" />
               Analyzing...
             </>
          ) : (
             <>
               <Bot className="w-4 h-4" />
               Audit with Gemini
             </>
          )}
        </button>
      </div>

      {analysis && (
        <div className={`p-5 rounded-xl border ${
            analysis.riskScore > 50 ? 'bg-red-900/10 border-red-800' : 'bg-green-900/10 border-green-800'
        }`}>
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${analysis.riskScore > 50 ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'}`}>
                    {analysis.riskScore > 50 ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                </div>
                <div>
                    <h3 className={`font-bold ${analysis.riskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>
                        Risk Score: {analysis.riskScore}/100
                    </h3>
                    <p className="text-slate-300 text-sm mt-1">{analysis.summary}</p>
                    <div className="mt-3 flex gap-2 flex-wrap">
                        {analysis.functions.map(fn => (
                            <span key={fn} className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-400 font-mono">
                                {fn}()
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      )}

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-transparent pointer-events-none rounded-xl" />
        <pre className="bg-slate-950 p-6 rounded-xl border border-slate-800 overflow-x-auto font-mono text-sm text-slate-400 leading-relaxed max-h-[500px] overflow-y-auto">
            {MOCK_SMART_CONTRACT}
        </pre>
        <div className="absolute top-4 right-4 text-xs text-slate-600 font-mono">
            DailyAuction.sol
        </div>
      </div>
    </div>
  );
};