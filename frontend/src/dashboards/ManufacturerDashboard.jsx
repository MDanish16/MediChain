import React, { useState, useEffect } from 'react';
import { batchService, transferService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BatchStatusBadge from '../components/BatchStatusBadge';
import QRCodeModal from '../components/QRCodeModal';
import { 
  Package, 
  PlusCircle, 
  ArrowRight, 
  QrCode, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  X,
  Truck
} from 'lucide-react';

export default function ManufacturerDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Register Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState({
    medicineName: '',
    genericName: '',
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '2028-06-30',
    quantity: 10000,
    unit: 'Boxes (10 strips)',
    composition: 'Active Pharma Ingredient IP 500mg, Excipients q.s.',
    storageConditions: 'Store below 25°C in dry place'
  });
  const [submitting, setSubmitting] = useState(false);
  const [newlyRegisteredBatch, setNewlyRegisteredBatch] = useState(null);

  // Transfer Modal state
  const [transferModalBatch, setTransferModalBatch] = useState(null);
  const [transferForm, setTransferForm] = useState({
    targetReceiver: 'LogiCare Pharma Distribution',
    notes: 'Cold chain container shipment'
  });

  // Recall Modal state
  const [recallModalBatch, setRecallModalBatch] = useState(null);
  const [recallReason, setRecallReason] = useState('');

  // QR Modal
  const [qrModalBatch, setQrModalBatch] = useState(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await batchService.getAll();
      if (res.data.success) {
        setBatches(res.data.batches);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await batchService.register(regForm);
      if (res.data.success) {
        setShowRegisterModal(false);
        setNewlyRegisteredBatch(res.data.batch);
        setQrModalBatch(res.data.batch);
        fetchBatches();
      }
    } catch (err) {
      alert(`Registration failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInitiateTransfer = async (e) => {
    e.preventDefault();
    if (!transferModalBatch) return;
    try {
      const res = await transferService.initiate(transferModalBatch.batchId, {
        targetReceiver: transferForm.targetReceiver,
        targetRole: 'DISTRIBUTOR',
        notes: transferForm.notes
      });
      if (res.data.success) {
        alert(`Transfer initiated for batch ${transferModalBatch.batchId}!`);
        setTransferModalBatch(null);
        fetchBatches();
      }
    } catch (err) {
      alert(`Transfer failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRecall = async (e) => {
    e.preventDefault();
    if (!recallModalBatch || !recallReason.trim()) return;
    try {
      const res = await batchService.recall(recallModalBatch.batchId, recallReason);
      if (res.data.success) {
        alert(`Batch ${recallModalBatch.batchId} marked RECALLED on Fabric blockchain.`);
        setRecallModalBatch(null);
        setRecallReason('');
        fetchBatches();
      }
    } catch (err) {
      alert(`Recall failed: ${err.response?.data?.message || err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Manufacturer Portal</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{user?.organization || 'PharmaCorp Labs'}</h1>
          <p className="text-xs text-slate-500">Produce, register, and transfer authentic pharmaceutical batches on Hyperledger Fabric.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBatches}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
          </button>

          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Register New Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Batch Production Inventory</h3>
          <span className="text-xs font-semibold text-slate-500">{batches.length} total batches</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Medicine Name</th>
                <th className="py-3 px-4">Mfg / Expiry</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Current Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-400">
                    No batches found. Click "Register New Batch" to add one!
                  </td>
                </tr>
              ) : (
                batches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-teal-700">{b.batchId}</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{b.medicineName}</span>
                      <span className="text-[11px] text-slate-500">{b.genericName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      <div>Mfg: {b.manufacturingDate}</div>
                      <div>Exp: {b.expiryDate}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.quantity} {b.unit}</td>
                    <td className="py-3 px-4 text-slate-800">{b.currentOwner}</td>
                    <td className="py-3 px-4">
                      <BatchStatusBadge status={b.currentStatus} isRecalled={b.isRecalled} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => setQrModalBatch(b)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs inline-flex items-center gap-1"
                        title="View QR Code"
                      >
                        <QrCode className="w-3 h-3 text-teal-600" />
                        <span>QR</span>
                      </button>

                      {b.currentStatus === 'MANUFACTURED' && !b.isRecalled && (
                        <button
                          onClick={() => setTransferModalBatch(b)}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 hover:bg-teal-100 text-xs font-semibold inline-flex items-center gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Transfer to Distributor</span>
                        </button>
                      )}

                      {!b.isRecalled && (
                        <button
                          onClick={() => setRecallModalBatch(b)}
                          className="px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                          title="Safety Recall"
                        >
                          Recall
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

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900">Register New Medicine Batch</h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Medicine Brand Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg"
                  value={regForm.medicineName}
                  onChange={(e) => setRegForm({ ...regForm, medicineName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Generic / Active Molecule *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acetaminophen"
                  value={regForm.genericName}
                  onChange={(e) => setRegForm({ ...regForm, genericName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Mfg Date *</label>
                  <input
                    type="date"
                    required
                    value={regForm.manufacturingDate}
                    onChange={(e) => setRegForm({ ...regForm, manufacturingDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={regForm.expiryDate}
                    onChange={(e) => setRegForm({ ...regForm, expiryDate: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    value={regForm.quantity}
                    onChange={(e) => setRegForm({ ...regForm, quantity: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Packaging Unit *</label>
                  <input
                    type="text"
                    required
                    value={regForm.unit}
                    onChange={(e) => setRegForm({ ...regForm, unit: e.target.value })}
                    className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Composition</label>
                <input
                  type="text"
                  value={regForm.composition}
                  onChange={(e) => setRegForm({ ...regForm, composition: e.target.value })}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  {submitting ? 'Committing to Fabric...' : 'Commit to Blockchain'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer to Distributor Modal */}
      {transferModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-base">Transfer Batch to Distributor</h3>
            <p className="text-xs text-slate-500 mt-1">
              Batch: <span className="font-mono text-teal-700 font-bold">{transferModalBatch.batchId}</span>
            </p>

            <form onSubmit={handleInitiateTransfer} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Recipient Distributor</label>
                <input
                  type="text"
                  required
                  value={transferForm.targetReceiver}
                  onChange={(e) => setTransferForm({ ...transferForm, targetReceiver: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Shipping & Cold Chain Notes</label>
                <textarea
                  rows="2"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
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
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Recall Modal */}
      {recallModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200">
            <h3 className="font-bold text-rose-700 text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Issue Safety Recall</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Batch: <span className="font-mono text-slate-800 font-bold">{recallModalBatch.batchId}</span>
            </p>

            <form onSubmit={handleRecall} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Specific Recall Reason *</label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Defective blister seal, contamination risk, dissolution rate deviation"
                  value={recallReason}
                  onChange={(e) => setRecallReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRecallModalBatch(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
                >
                  Confirm Blockchain Recall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      <QRCodeModal
        batch={qrModalBatch}
        isOpen={!!qrModalBatch}
        onClose={() => setQrModalBatch(null)}
      />
    </div>
  );
}

