import React, { useState, useEffect } from 'react';
import { batchService, transferService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import BatchStatusBadge from '../components/BatchStatusBadge';
import QRCodeModal from '../components/QRCodeModal';
import { 
  Store, 
  ArrowRightLeft, 
  Package, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  QrCode,
  Check
} from 'lucide-react';

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'pending'
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

  const handleAcceptDelivery = async (batchId) => {
    try {
      const res = await transferService.receive(batchId, 'Received at CarePlus Pharmacy retail branch. Pharmacist inspected and verified packaging.');
      if (res.data.success) {
        alert(`Delivery accepted and registered on pharmacy ledger! TxID: ${res.data.txId}`);
        fetchData();
      }
    } catch (err) {
      alert(`Acceptance failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleRejectDelivery = async (batchId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      const res = await transferService.reject(batchId, reason);
      if (res.data.success) {
        alert('Delivery rejected and returned on Fabric.');
        fetchData();
      }
    } catch (err) {
      alert(`Rejection failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleMarkAvailableForSale = async (batchId) => {
    try {
      const res = await batchService.updateStatus(batchId, 'AVAILABLE_FOR_SALE', 'Medicine verified authentic by licensed pharmacist and placed in active dispensing inventory.');
      if (res.data.success) {
        alert(`Batch ${batchId} marked AVAILABLE FOR SALE on Hyperledger Fabric!`);
        fetchData();
      }
    } catch (err) {
      alert(`Status update failed: ${err.response?.data?.message || err.message}`);
    }
  };

  const pharmacyInventory = batches.filter(b => 
    b.currentOwnerRole === 'PHARMACY' || 
    b.currentStatus === 'RECEIVED_BY_PHARMACY' || 
    b.currentStatus === 'AVAILABLE_FOR_SALE'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Retail Pharmacy Dispensary</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{user?.organization || 'CarePlus Pharmacy Network'}</h1>
          <p className="text-xs text-slate-500">Receive verified wholesaler shipments, mark safe batches for patient sale, and generate public QR verification labels.</p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'inventory'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Pharmacy Stock ({pharmacyInventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'pending'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Incoming Deliveries ({pendingTransfers.length})</span>
        </button>
      </div>

      {/* Tab 1: Pharmacy Inventory */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Dispensary Stock & Shelf Status</h3>
            <p className="text-xs text-slate-500">Batches stored at pharmacy ready for dispensing to patients.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Medicine Name</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pharmacyInventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">
                      No stock held at pharmacy. Accept incoming deliveries in the tab above.
                    </td>
                  </tr>
                ) : (
                  pharmacyInventory.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">{b.batchId}</td>
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
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs inline-flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5 text-teal-600" />
                          <span>Dispense QR</span>
                        </button>

                        {b.currentStatus === 'RECEIVED_BY_PHARMACY' && !b.isRecalled && (
                          <button
                            onClick={() => handleMarkAvailableForSale(b.batchId)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Mark Available for Sale</span>
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

      {/* Tab 2: Incoming Deliveries */}
      {activeTab === 'pending' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">Incoming Shipments from Wholesaler</h3>
            <p className="text-xs text-slate-500">Verify packages and accept custody on Hyperledger Fabric.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Batch ID</th>
                  <th className="py-3 px-4">Medicine</th>
                  <th className="py-3 px-4">Wholesaler Sender</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {pendingTransfers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-slate-400">
                      No pending deliveries waiting for pharmacy acceptance.
                    </td>
                  </tr>
                ) : (
                  pendingTransfers.map((b) => (
                    <tr key={b.batchId} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-teal-700">{b.batchId}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{b.medicineName}</span>
                        <span className="text-[11px] text-slate-500">{b.genericName}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-800">{b.currentOwner}</td>
                      <td className="py-3 px-4 font-mono">{b.quantity} {b.unit}</td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleAcceptDelivery(b.batchId)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept Delivery</span>
                        </button>

                        <button
                          onClick={() => handleRejectDelivery(b.batchId)}
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

      <QRCodeModal
        batch={qrModalBatch}
        isOpen={!!qrModalBatch}
        onClose={() => setQrModalBatch(null)}
      />
    </div>
  );
}

