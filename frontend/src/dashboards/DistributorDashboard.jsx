import React, { useState, useEffect } from 'react';
import { batchService, transferService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BatchStatusBadge from '../components/BatchStatusBadge';
import QRCodeModal from '../components/QRCodeModal';
import { 
  Truck, 
  ArrowRightLeft, 
  Package, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  QrCode, 
  Building2 
} from 'lucide-react';

export default function DistributorDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'inventory'

  // Transfer to Wholesaler state
  const [transferModalBatch, setTransferModalBatch] = useState(null);
  const [wholesalerName, setWholesalerName] = useState('MedSupply Global Logistics');
  const [notes, setNotes] = useState('Consignment dispatch via refrigerated fleet');

  // QR Modal
  const [qrModalBatch, setQrModalBatch] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allRes, pendingRes] = await Promise.all([
        batchService.getAll(),
        transferService.getPending()
      ]);
      if (allRes.data.success) {
        setBatches(allRes.data.batches);
      }
      if (pendingRes.data.success) {
        setPendingTransfers(pendingRes.data.transfers);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (batchId) => {
    try {
      const res = await transferService.receive(batchId, 'Inspected at logistics distribution hub. Temperature and tamper seals intact.');
      if (res.data.success) {
        alert(`Transfer accepted on Hyperledger Fabric! TxID: ${res.data.txId}`);
        fetchData();
      }
    } catch (err) {
      alert(`Acceptance failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleReject = async (batchId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const res = await transferService.reject(batchId, reason);
      if (res.data.success) {
        alert(`Transfer rejected and returned to sender on Fabric.`);
        fetchData();
      }
    } catch (err) {
      alert(`Rejection failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleTransferToWholesaler = async (e) => {
    e.preventDefault();
    if (!transferModalBatch) return;
    try {
      const res = await transferService.initiate(transferModalBatch.batchId, {
        targetReceiver: wholesalerName,
        targetRole: 'WHOLESALER',
        notes: notes
      });
      if (res.data.success) {
        alert(`Transfer initiated to Wholesaler!`);
        setTransferModalBatch(null);
        fetchData();
      }
    } catch (err) {
      alert(`Transfer failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const heldInventory = batches.filter(b => b.currentOwnerRole === 'DISTRIBUTOR' || b.currentStatus === 'RECEIVED_BY_DISTRIBUTOR');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Distributor Logistics Portal</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{user?.organization || 'LogiCare Pharma Distribution'}</h1>
          <p className="text-xs text-slate-500">Validate incoming manufacturer consignments and transfer verified medicines to regional wholesalers.</p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-600' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Incoming Transfers ({pendingTransfers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Warehouse Inventory ({heldInventory.length})</span>
        </button>
      </div>

      {/* Tab 1: Incoming Transfers */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Awaiting Handover Acceptance</h3>
            <p className="text-xs text-slate-500">Inspect temperature logs and packaging integrity before accepting custody on-chain.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Sender (Current Owner)</th>
                  <th className="py-3 px-4">Designated Receiver</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pendingTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No pending transfers waiting for your acceptance.
                    </td>
                  </tr>
                ) : (
                  pendingTransfers.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-700">{b.batchId}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.medicineName}</span>
                        <span className="text-[11px] text-slate-500">{b.genericName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{b.currentOwner} ({b.currentOwnerRole})</td>
                      <td className="py-3 px-4 text-amber-800 font-semibold">{b.pendingReceiver}</td>
                      <td className="py-3 px-4 font-mono">{b.quantity} {b.unit}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleAccept(b.batchId)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Transfer</span>
                        </button>

                        <button
                          onClick={() => handleReject(b.batchId)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs inline-flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Held Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Warehouse Stock</h3>
            <p className="text-xs text-slate-500">Batches currently held and verified by the distributor.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {heldInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No active stock held in distributor warehouse.
                    </td>
                  </tr>
                ) : (
                  heldInventory.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{b.batchId}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.medicineName}</span>
                        <span className="text-[11px] text-slate-500">{b.genericName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{b.expiryDate}</td>
                      <td className="py-3 px-4 font-mono">{b.quantity} {b.unit}</td>
                      <td className="py-3 px-4">
                        <BatchStatusBadge status={b.currentStatus} isRecalled={b.isRecalled} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setQrModalBatch(b)}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs"
                        >
                          QR Code
                        </button>

                        {b.currentStatus !== 'IN_TRANSIT' && !b.isRecalled && (
                          <button
                            onClick={() => setTransferModalBatch(b)}
                            className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Transfer to Wholesaler</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer to Wholesaler Modal */}
      {transferModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Transfer Batch to Wholesaler</h3>
            <p className="text-xs text-slate-500 mt-1">
              Batch: <span className="font-mono text-teal-700 font-bold">{transferModalBatch.batchId}</span> ({transferModalBatch.medicineName})
            </p>

            <form onSubmit={handleTransferToWholesaler} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Wholesaler</label>
                <input
                  type="text"
                  required
                  value={wholesalerName}
                  onChange={(e) => setWholesalerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Consignment Notes</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalBatch(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Initiate Handover
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QRCodeModal
        batch={qrModalBatch}
        isOpen={!!qrModalBatch}
        onClose={() => setQrModalBatch(null)}
      />
    </div>
  );
}

