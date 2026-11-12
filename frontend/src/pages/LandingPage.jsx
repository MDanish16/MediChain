import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { explorerService } from '../services/api';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, 
  ArrowRight, 
  QrCode, 
  Layers, 
  CheckCircle2, 
  Building2, 
  Package, 
  Truck, 
  Store, 
  Sparkles,
  AlertTriangle,
  FileCheck2,
  Lock,
  ChevronRight,
  Database
} from 'lucide-react';

export default function LandingPage() {
  const [stats, setStats] = useState({
    totalBatches: 6,
    totalTransactions: 18,
    activeBatches: 5,
    recalledBatches: 1
  });

  useEffect(() => {
    explorerService.getOverview().then(res => {
      if (res.data.success && res.data.metrics) {
        setStats(res.data.metrics);
      }
    }).catch(() => {});
  }, []);

  const stages = [
    { title: '1. Manufacturer', role: 'PharmaCorp Labs', desc: 'Registers batch with formula, lab tests, and dates on Fabric ledger.', icon: Package, msp: 'Org1MSP' },
    { title: '2. Distributor', role: 'LogiCare Pharma', desc: 'Accepts temperature-controlled custody transfer and coordinates transit.', icon: Truck, msp: 'Org2MSP' },
    { title: '3. Wholesaler', role: 'MedSupply Global', desc: 'Verifies seal integrity, manages regional stock, and issues consignments.', icon: Building2, msp: 'Org2MSP' },
    { title: '4. Pharmacy', role: 'CarePlus Pharmacy', desc: 'Accepts store delivery, verifies on-chain journey, and marks available for sale.', icon: Store, msp: 'Org1MSP' },
    { title: '5. Patient Verification', role: 'Public Consumer', desc: 'Scans QR code to verify complete blockchain provenance before consumption.', icon: QrCode, msp: 'Public Query' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></span>
              Hyperledger Fabric 2.5 Enterprise Blockchain
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Trust Every Dose. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-teal-700 to-slate-900">
                Trace Every Journey.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 leading-relaxed">
              MediChain is a permissioned pharmaceutical supply chain and anti-counterfeit verification platform built on <strong>Hyperledger Fabric</strong>. Guaranteeing tamper-evident custody, transparent ownership handovers, and instant public QR verification.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                to="/verify"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition-all hover:scale-102"
              >
                <QrCode className="w-4 h-4" />
                <span>Verify Medicine (QR / Batch ID)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>

              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow-md transition-all"
              >
                <Sparkles className="w-4 h-4 text-teal-400" />
                <span>Participant Portal (Demo Login)</span>
              </Link>
            </div>

            {/* Quick Demo Batch Pills */}
            <div className="mt-8 pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Quick Demo Batches:</span>
              <Link to="/verify/MED-2026-90412" className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-teal-700 hover:border-teal-500 font-mono font-medium transition">
                Paracetamol (Safe)
              </Link>
              <Link to="/verify/MED-2026-61902" className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 hover:border-rose-500 font-mono font-medium transition">
                Azithromycin (Recalled)
              </Link>
              <Link to="/verify/MED-2024-11002" className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-500 font-mono font-medium transition">
                Pediatric Syrup (Expired)
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Blockchain Statistics Section */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Live Batches</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{stats.totalBatches}</h3>
              <p className="text-[11px] text-teal-600 font-medium mt-1">Recorded on Fabric Ledger</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Committed Transactions</p>
              <h3 className="text-3xl font-extrabold text-teal-700 mt-1">{stats.totalTransactions}</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Immutable Raft Consensus</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Participating Orgs</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">4</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Mfg, Dist, Ws, Pharmacy</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-500">Anti-Counterfeit Protection</p>
              <h3 className="text-3xl font-extrabold text-emerald-600 mt-1">100%</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1">Cryptographic Endorsement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Supply Chain Journey Visualization */}
      <section className="py-16 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              The Verified Pharmaceutical Supply Chain Journey
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Every step is validated through a two-step transfer workflow on Hyperledger Fabric, eliminating duplicate claims, expired distributions, and unauthorized diversions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              return (
                <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative flex flex-col justify-between hover:shadow-md transition">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-bold mb-3">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono text-teal-600 font-bold block">{stage.msp}</span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{stage.title}</h4>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">{stage.role}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{stage.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Stage {idx + 1} of 5</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Key Architectural Pillars */}
      <section className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Why Hyperledger Fabric for Pharmaceuticals?
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Unlike public cryptocurrencies, pharmaceutical track-and-trace mandates strict data privacy, high transaction throughput, and legally enforceable organizational identities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Permissioned MSP Consortium</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Only licensed manufacturers, registered distributors, and licensed pharmacies with verified X.509 certificates can submit transactions to the network.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Two-Step Custody Handover</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                A sender initiates a transfer specifying the exact recipient organization. Custody only transfers when the receiver physically inspects and endorses receipt on-chain.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Immediate Global Recalls</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                If safety issues arise, manufacturers trigger an instant smart contract recall that immediately prevents any onward transfers and alerts verifying consumers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-white text-base">MediChain</span>
                <p className="text-xs text-slate-500">B.Tech Blockchain Technology Capstone Project</p>
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs">
              <Link to="/verify" className="hover:text-teal-400 transition">QR Verification</Link>
              <Link to="/explorer" className="hover:text-teal-400 transition">Blockchain Explorer</Link>
              <Link to="/login" className="hover:text-teal-400 transition">Participant Login</Link>
            </div>

            <p className="text-xs text-slate-500">
              Powered by Hyperledger Fabric 2.5 & Node.js Gateway.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

