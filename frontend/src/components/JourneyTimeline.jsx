import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Copy, 
  Check, 
  AlertTriangle, 
  Package, 
  Truck, 
  Building2, 
  Store, 
  ShieldCheck 
} from 'lucide-react';

const stageIcons = {
  MANUFACTURED: Package,
  IN_TRANSIT: Truck,
  RECEIVED_BY_DISTRIBUTOR: Building2,
  RECEIVED_BY_WHOLESALER: Building2,
  RECEIVED_BY_PHARMACY: Store,
  AVAILABLE_FOR_SALE: ShieldCheck,
  RECALLED: AlertTriangle,
  TRANSFER_REJECTED: AlertTriangle
};

export default function JourneyTimeline({ journey = [] }) {
  const [copiedTx, setCopiedTx] = useState(null);

  const handleCopy = (txId) => {
    navigator.clipboard.writeText(txId);
    setCopiedTx(txId);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  if (!journey || journey.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No recorded supply chain journey checkpoints yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
      {journey.map((step, idx) => {
        const Icon = stageIcons[step.stage] || CheckCircle2;
        const isRecalled = step.stage === 'RECALLED';
        const isCurrent = idx === journey.length - 1;

        return (
          <div key={idx} className="relative group">
            {/* Step node icon */}
            <div className={`absolute -left-6 mt-1 flex items-center justify-center w-6 h-6 rounded-full border-2 bg-white text-xs ${
              isRecalled 
                ? 'border-rose-500 text-rose-600 bg-rose-50' 
                : isCurrent 
                  ? 'border-teal-500 text-teal-600 bg-teal-50' 
                  : 'border-slate-300 text-slate-500'
            }`}>
              <Icon className="w-3.5 h-3.5" />
            </div>

            {/* Content card */}
            <div className={`rounded-xl border p-4 transition-all ${
              isCurrent 
                ? 'bg-white border-teal-200 shadow-sm ring-1 ring-teal-500/10' 
                : 'bg-white/80 border-slate-200/80'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isRecalled
                      ? 'bg-rose-100 text-rose-800'
                      : isCurrent
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-slate-100 text-slate-700'
                  }`}>
                    {step.stage ? step.stage.replace(/_/g, ' ') : 'STEP'}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{step.actor}</span>
                  {step.role && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {step.role}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(step.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {step.notes && (
                <p className="text-xs text-slate-600 mt-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  {step.notes}
                </p>
              )}

              {/* Transaction ID & MSP verification footer */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="font-medium text-slate-600">MSP:</span>
                  <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-[11px]">{step.msp || 'Org1MSP'}</code>
                </div>

                {step.txId && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Tx:</span>
                    <code className="font-mono text-slate-600 text-[11px] bg-slate-100/90 px-1.5 py-0.5 rounded border border-slate-200/60 max-w-[170px] sm:max-w-[240px] truncate" title={step.txId}>
                      {step.txId}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(step.txId)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                      title="Copy Transaction Hash"
                    >
                      {copiedTx === step.txId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

