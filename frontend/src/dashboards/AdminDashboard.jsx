import React, { useState, useEffect } from 'react';
import { batchService, explorerService, authService } from '../services/api';
import BatchStatusBadge from '../components/BatchStatusBadge';
import QRCodeModal from '../components/QRCodeModal';
import { 
  Shield, 
  Activity, 
  Layers, 
  Users, 
  Package, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  Server
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

const COLORS = ['#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#64748B'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [batches, setBatches] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalBatch, setQrModalBatch] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, bRes, uRes] = await Promise.all([
        explorerService.getOverview(),
        batchService.getAll(),
        authService.getUsers()
      ]);
      if (ovRes.data.success) setOverview(ovRes.data);
      if (bRes.data.success) setBatches(bRes.data.batches);
      if (uRes.data.success) setUsers(uRes.data.users);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute status chart data
  const statusCounts = {};
  batches.forEach(b => {
    const key = b.isRecalled ? 'RECALLED' : b.currentStatus;
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });

  const chartData = Object.keys(statusCounts).map(k => ({
    name: k.replace(/_/g, ' '),
    count: statusCounts[k]
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consortium Administration</span>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">MediChain Network Control Center</h1>
          <p className="text-xs text-slate-500">Live oversight of Hyperledger Fabric peers, channel states, participant identities, and supply chain ledger records.</p>
        </div>

        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-600' : ''}`} />
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Batches</span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{batches.length}</h3>
          <p className="text-[11px] text-teal-600 mt-1 font-medium">Recorded on Ledger</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</span>
          <h3 className="text-3xl font-extrabold text-teal-700 mt-1">{overview?.metrics?.totalTransactions || 0}</h3>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">Valid Block Commits</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recalled Batches</span>
          <h3 className="text-3xl font-extrabold text-rose-600 mt-1">{overview?.metrics?.recalledBatches || 0}</h3>
          <p className="text-[11px] text-rose-500 mt-1 font-medium">Safety Quarantined</p>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consortium Nodes</span>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1">3 Active</h3>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">Org1 + Org2 + Orderer</p>
        </div>
      </div>

      {/* Analytics Chart & Peer Network */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-900 text-sm mb-4">Supply Chain Lifecycle Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0D9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Network Infrastructure Box */}
        <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-2xl shadow-xs border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm">Fabric Consortium Status</h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                ONLINE
              </span>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-mono text-slate-300">peer0.org1.example.com</span>
                <span className="text-teal-400 font-bold">Org1MSP (7051)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-mono text-slate-300">peer0.org2.example.com</span>
                <span className="text-teal-400 font-bold">Org2MSP (9051)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                <span className="font-mono text-slate-300">orderer.example.com</span>
                <span className="text-teal-400 font-bold">Raft Consensus (7050)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>Channel: medichain-channel</span>
            <span className="text-teal-400">Chaincode: medichain</span>
          </div>
        </div>
      </div>

      {/* Batches Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">All Ledger Medicine Batches</h3>
          <span className="text-xs text-slate-500">{batches.length} batches recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Batch ID</th>
                <th className="py-3 px-4">Medicine</th>
                <th className="py-3 px-4">Manufacturer</th>
                <th className="py-3 px-4">Current Owner</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">QR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {batches.map((b) => (
                <tr key={b.batchId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-teal-700">{b.batchId}</td>
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{b.medicineName}</span>
                    <span className="text-[11px] text-slate-500">{b.genericName}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{b.manufacturer}</td>
                  <td className="py-3 px-4 text-slate-800 font-semibold">{b.currentOwner} ({b.currentOwnerRole})</td>
                  <td className="py-3 px-4">
                    <BatchStatusBadge status={b.currentStatus} isRecalled={b.isRecalled} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setQrModalBatch(b)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-slate-700 text-xs hover:bg-slate-50"
                    >
                      View QR
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Enrolled Consortium Participants & Users</h3>
          <p className="text-xs text-slate-500">Authorized user credentials and MSP organization identities.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Fabric MSP</th>
                <th className="py-3 px-4">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.username}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 uppercase">
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-800">{u.organization}</td>
                  <td className="py-3 px-4 font-mono text-teal-700">{u.mspId}</td>
                  <td className="py-3 px-4 text-slate-500">{u.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <QRCodeModal
        batch={qrModalBatch}
        isOpen={!!qrModalBatch}
        onClose={() => setQrModalBatch(null)}
      />
    </div>
  );
}

