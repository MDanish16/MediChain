import React, { useState, useEffect } from 'react';
import { explorerService, batchService } from '../services/api';
import Navbar from '../components/Navbar';
import BatchStatusBadge from '../components/BatchStatusBadge';
import { 
  Layers, 
  Activity, 
  CheckCircle2, 
  Server, 
  Search, 
  RefreshCw, 
  Copy, 
  Check, 
  ExternalLink, 
  FileText, 
  ShieldCheck,
  Building2,
  Clock,
  X
} from 'lucide-react';

export default function BlockchainExplorerPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedTx, setCopiedTx] = useState(null);
  const [selectedBatchHistory, setSelectedBatchHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await explorerService.getOverview();
      if (res.data.success) {
        setOverview(res.data);
      }
    } catch (err) {
      console.error('Failed to load explorer overview:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleCopy = (txId) => {
    navigator.clipboard.writeText(txId);
    setCopiedTx(txId);
    setTimeout(() => setCopiedTx(null), 2000);
  };

  const inspectHistory = async (batchId) => {
    setHistoryLoading(true);
    try {
      const res = await batchService.getHistory(batchId);
      if (res.data.success) {
        setSelectedBatchHistory({
          batchId: batchId,
          history: res.data.history
        });
      }
    } catch (err) {
      alert(`Could not fetch ledger history: ${err.message}`);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredTransactions = (overview?.recentTransactions || []).filter(tx => {
    const term = searchTerm.toLowerCase();
    return (
      (tx.txId && tx.txId.toLowerCase().includes(term)) ||
      (tx.batchId && tx.batchId.toLowerCase().includes(term)) ||
      (tx.actor && tx.actor.toLowerCase().includes(term)) ||
      (tx.stage && tx.stage.toLowerCase().includes(term)) ||
      (tx.medicineName && tx.medicineName.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-teal-400 text-xs font-semibold mb-2">
              <Layers className="w-3.5 h-3.5" />
              Hyperledger Fabric Ledger Explorer
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              Blockchain Transaction Explorer
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live block commits, cryptographic endorsements, and state history on channel <code>medichain-channel</code>.
            </p>
          </div>

          <button
            onClick={fetchOverview}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-600' : ''}`} />
            <span>Refresh Ledger</span>
          </button>
        </div>

        {/* Network Infrastructure Panel */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
              <div>
                <h3 className="font-bold text-sm">Hyperledger Fabric 2.5 Consortium</h3>
                <p className="text-xs text-slate-400">Channel: <span className="text-teal-400 font-mono">medichain-channel</span> | Chaincode: <span className="text-teal-400 font-mono">medichain:2.0</span></p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Orderer: <span className="text-teal-400">Raft Consensus</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                Gateway: <span className="text-emerald-400">Connected</span>
              </div>
            </div>
          </div>

          {/* Peer Nodes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">peer0.org1.example.com</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">ACTIVE</span>
              </div>
              <p className="font-bold text-white mt-1">Org1MSP (Manufacturer & Retail)</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Endpoint: localhost:7051 (TLS)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">peer0.org2.example.com</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">ACTIVE</span>
              </div>
              <p className="font-bold text-white mt-1">Org2MSP (Distributor & Wholesaler)</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Endpoint: localhost:9051 (TLS)</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">orderer.example.com</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">ACTIVE</span>
              </div>
              <p className="font-bold text-white mt-1">Ordering Service Node</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">Endpoint: localhost:7050 (mTLS)</p>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Batches</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{overview?.metrics?.totalBatches || 0}</h3>
            <span className="text-[11px] text-teal-600 font-medium">On Distributed Ledger</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Committed Transactions</span>
            <h3 className="text-2xl font-bold text-teal-700 mt-1">{overview?.metrics?.totalTransactions || 0}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Cryptographic Hashes</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">In Transit</span>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{overview?.metrics?.inTransitBatches || 0}</h3>
            <span className="text-[11px] text-slate-500 font-medium">Active Transfers</span>
          </div>
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Recalled Batches</span>
            <h3 className="text-2xl font-bold text-rose-600 mt-1">{overview?.metrics?.recalledBatches || 0}</h3>
            <span className="text-[11px] text-rose-500 font-medium">Flagged on Chain</span>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Committed Ledger Transactions</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every record corresponds to an actual committed block transaction on Hyperledger Fabric.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search TxID, Batch, Actor..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4">Batch ID / Medicine</th>
                  <th className="py-3 px-4">Supply Chain Action</th>
                  <th className="py-3 px-4">Invoking Actor</th>
                  <th className="py-3 px-4">MSP</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ledger History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-8 text-slate-400">
                      No matching transactions found on ledger.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="text-teal-700 font-semibold max-w-[150px] truncate" title={tx.txId}>
                            {tx.txId}
                          </span>
                          <button
                            onClick={() => handleCopy(tx.txId)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded"
                            title="Copy TxID"
                          >
                            {copiedTx === tx.txId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold font-mono text-slate-900 block">{tx.batchId}</span>
                        <span className="text-[11px] text-slate-500">{tx.medicineName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                          {tx.stage ? tx.stage.replace(/_/g, ' ') : 'ACTION'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800 block">{tx.actor}</span>
                        <span className="text-[10px] text-slate-400">{tx.role}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {tx.msp || 'Org1MSP'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(tx.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>VALID</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => inspectHistory(tx.batchId)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <FileText className="w-3 h-3 text-teal-600" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* History Modal */}
        {selectedBatchHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Blockchain History for Batch: <span className="font-mono text-teal-700">{selectedBatchHistory.batchId}</span>
                  </h3>
                  <p className="text-xs text-slate-500">Retrieved via ctx.stub.getHistoryForKey</p>
                </div>
                <button
                  onClick={() => setSelectedBatchHistory(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                {selectedBatchHistory.history.map((record, index) => (
                  <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 text-xs space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <span className="font-bold text-slate-700">Modification #{index + 1}</span>
                      <span className="text-slate-400">{new Date(record.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="font-mono text-[11px] text-slate-600 break-all">
                      <span className="text-slate-400">TxID:</span> {record.txId}
                    </div>
                    <div>
                      <span className="text-slate-400 block mb-1">State Snapshot:</span>
                      <pre className="p-2.5 rounded-lg bg-slate-900 text-teal-300 font-mono text-[10px] overflow-x-auto">
                        {JSON.stringify(record.value, null, 2)}
                      </pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

