import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyService } from '../services/api';
import Navbar from '../components/Navbar';
import JourneyTimeline from '../components/JourneyTimeline';
import { 
  ShieldCheck, 
  Search, 
  QrCode, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  Package, 
  Truck, 
  Store, 
  Calendar, 
  Share2, 
  Printer, 
  Copy, 
  Check, 
  Camera, 
  Info,
  ExternalLink
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function PublicVerifyPage() {
  const { batchId: urlBatchId } = useParams();
  const navigate = useNavigate();

  const [inputBatchId, setInputBatchId] = useState(urlBatchId || '');
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [copied, setCopied] = useState(false);

  // Quick demo test batches
  const demoBatches = [
    { id: 'MED-2026-90412', name: 'Paracetamol 500mg', label: 'Verified & Safe (At Pharmacy)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { id: 'MED-2026-88124', name: 'Amoxicillin 250mg', label: 'In Supply Chain (Wholesaler)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { id: 'MED-2026-73591', name: 'Cetirizine 10mg', label: 'In Transit', color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'MED-2026-61902', name: 'Azithromycin 500mg', label: 'Safety Recall Alert', color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'MED-2024-11002', name: 'Pediatric Syrup', label: 'Expired Product Warning', color: 'text-slate-700 bg-slate-100 border-slate-300' },
    { id: 'MED-FAKE-99999', name: 'Fake Medicine', label: 'Counterfeit / Unregistered', color: 'text-red-800 bg-red-100 border-red-300' },
  ];

  const handleVerify = async (idToVerify) => {
    const id = (idToVerify || inputBatchId || '').trim().toUpperCase();
    if (!id) return;

    setLoading(true);
    setVerificationData(null);

    try {
      const res = await verifyService.verify(id);
      if (res.data.success) {
        setVerificationData(res.data);
      }
    } catch (err) {
      setVerificationData({
        exists: false,
        batchId: id,
        verificationStatus: 'INVALID',
        message: 'Network error or batch query failed on Fabric peer.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlBatchId) {
      setInputBatchId(urlBatchId);
      handleVerify(urlBatchId);
    }
  }, [urlBatchId]);

  // QR Camera Scanner setup
  useEffect(() => {
    let scanner = null;
    if (showScanner) {
      scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        rememberLastUsedCamera: true
      });

      scanner.render(
        (decodedText) => {
          let cleanId = decodedText;
          if (decodedText.includes('/verify/')) {
            cleanId = decodedText.split('/verify/')[1];
          }
          setInputBatchId(cleanId);
          setShowScanner(false);
          scanner.clear();
          navigate(`/verify/${cleanId}`);
        },
        (error) => {
          // ignore scan frame errors
        }
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(() => {});
      }
    };
  }, [showScanner]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBanner = (v) => {
    if (!v || !v.exists) {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        title: 'UNVERIFIED / COUNTERFEIT WARNING',
        subtitle: 'This batch identifier is NOT REGISTERED on the Hyperledger Fabric ledger.',
        icon: XCircle,
        badgeBg: 'bg-rose-600 text-white'
      };
    }

    const { isRecalled, verificationStatus, safetyStatus } = v.verification;

    if (isRecalled) {
      return {
        bg: 'bg-rose-50 border-rose-300 text-rose-900',
        title: 'SAFETY RECALL ALERT — DO NOT CONSUME',
        subtitle: `Batch has been officially RECALLED. Reason: "${v.verification.recallReason}"`,
        icon: AlertTriangle,
        badgeBg: 'bg-rose-700 text-white'
      };
    }

    if (verificationStatus === 'EXPIRED') {
      return {
        bg: 'bg-amber-50 border-amber-300 text-amber-900',
        title: 'EXPIRED MEDICINE WARNING',
        subtitle: `This medicine reached its expiry date on ${v.verification.expiryDate}. Do not consume expired medication.`,
        icon: Clock,
        badgeBg: 'bg-amber-600 text-white'
      };
    }

    if (verificationStatus === 'VERIFIED_AVAILABLE' || verificationStatus === 'VERIFIED_AT_PHARMACY') {
      return {
        bg: 'bg-emerald-50 border-emerald-300 text-emerald-900',
        title: 'VERIFIED AUTHENTIC & SAFE',
        subtitle: 'Full blockchain journey validated from manufacturer to licensed pharmacy.',
        icon: ShieldCheck,
        badgeBg: 'bg-emerald-600 text-white'
      };
    }

    return {
      bg: 'bg-blue-50 border-blue-200 text-blue-900',
      title: 'GENUINE BATCH IN PIPELINE',
      subtitle: `Authentic batch recorded on ledger, currently held by: ${v.verification.currentOwner} (${v.verification.currentOwnerRole}).`,
      icon: CheckCircle2,
      badgeBg: 'bg-blue-600 text-white'
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold mb-3">
            <QrCode className="w-3.5 h-3.5" />
            Public Verification Portal
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Verify Medicine Authenticity
          </h1>
          <p className="text-xs text-slate-600 mt-2">
            Scan package QR code or enter Batch ID to query real-time custody from the Hyperledger Fabric distributed ledger.
          </p>
        </div>

        {/* Search Bar & Camera Trigger */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-3 border border-slate-200 shadow-md mb-6">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/verify/${inputBatchId.trim()}`);
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={inputBatchId}
                onChange={(e) => setInputBatchId(e.target.value)}
                placeholder="Enter Batch ID (e.g. MED-2026-90412)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-teal-500 uppercase"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowScanner(!showScanner)}
                className="px-4 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
                title="Scan QR via Webcam"
              >
                <Camera className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">Camera</span>
              </button>

              <button
                type="submit"
                disabled={loading || !inputBatchId.trim()}
                className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                {loading ? 'Querying Ledger...' : 'Verify Batch'}
              </button>
            </div>
          </form>

          {/* Camera scanner box */}
          {showScanner && (
            <div className="mt-4 p-4 border border-teal-200 bg-teal-50/40 rounded-xl text-center">
              <p className="text-xs font-semibold text-slate-700 mb-2">Scan packaging QR code using your camera:</p>
              <div id="qr-reader" className="max-w-xs mx-auto overflow-hidden rounded-lg"></div>
              <button
                type="button"
                onClick={() => setShowScanner(false)}
                className="mt-3 px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 font-medium"
              >
                Close Scanner
              </button>
            </div>
          )}
        </div>

        {/* Demo Batch Quick Pickers */}
        <div className="max-w-2xl mx-auto mb-10 text-center">
          <p className="text-xs font-semibold text-slate-500 mb-2.5">Faculty Demo Quick Test Scenarios:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {demoBatches.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => {
                  setInputBatchId(demo.id);
                  navigate(`/verify/${demo.id}`);
                }}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition hover:scale-102 ${demo.color}`}
              >
                <span className="font-mono font-bold mr-1">{demo.id}</span>
                <span className="opacity-90">({demo.label})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Verification Result Card */}
        {verificationData && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Status Banner */}
            {(() => {
              const banner = getStatusBanner(verificationData);
              const Icon = banner.icon;
              return (
                <div className={`p-6 rounded-2xl border shadow-sm ${banner.bg}`}>
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-xs border border-current/20">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${banner.badgeBg}`}>
                          {verificationData.exists ? verificationData.verification.verificationStatus : 'INVALID'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCopyLink}
                            className="p-1.5 bg-white rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 text-xs flex items-center gap-1 transition"
                            title="Share Link"
                          >
                            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span>
                          </button>
                        </div>
                      </div>

                      <h2 className="text-xl font-bold mt-2">{banner.title}</h2>
                      <p className="text-xs mt-1 leading-relaxed opacity-90">{banner.subtitle}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Batch Details if found */}
            {verificationData.exists && verificationData.verification && (
              <>
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Medicine Name</span>
                      <h3 className="text-2xl font-bold text-slate-900">{verificationData.verification.medicineName}</h3>
                      <p className="text-xs text-teal-700 font-semibold">{verificationData.verification.genericName}</p>
                    </div>
                    {verificationData.qrCode && (
                      <img src={verificationData.qrCode} alt="Batch QR" className="w-20 h-20 rounded-xl border border-slate-200 p-1" />
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Batch ID</span>
                      <span className="font-bold text-slate-800 font-mono text-sm block mt-0.5">{verificationData.verification.batchId}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Manufacturer</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{verificationData.verification.manufacturer}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Mfg Date</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{verificationData.verification.manufacturingDate}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium">Expiry Date</span>
                      <span className="font-bold text-slate-800 block mt-0.5">{verificationData.verification.expiryDate}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Composition</span>
                      <p className="text-slate-700 font-medium mt-0.5">{verificationData.verification.composition || 'Standard formula'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Storage Requirements</span>
                      <p className="text-slate-700 font-medium mt-0.5">{verificationData.verification.storageConditions || 'Standard storage'}</p>
                    </div>
                  </div>
                </div>

                {/* Supply Chain Verification Checklist */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>On-Chain Supply Chain Handover Checkpoints</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 ${verificationData.verification.supplyChainStagesCompleted?.manufactured ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <div>
                        <span className="text-xs font-bold block text-slate-800">1. Manufacturer</span>
                        <span className="text-[10px] text-slate-500">Produced & Tested</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 ${verificationData.verification.supplyChainStagesCompleted?.distributorReceived ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <div>
                        <span className="text-xs font-bold block text-slate-800">2. Distributor</span>
                        <span className="text-[10px] text-slate-500">Cold Chain Intake</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 ${verificationData.verification.supplyChainStagesCompleted?.wholesalerReceived ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <div>
                        <span className="text-xs font-bold block text-slate-800">3. Wholesaler</span>
                        <span className="text-[10px] text-slate-500">Regional Depot</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-2.5">
                      <CheckCircle2 className={`w-4 h-4 ${verificationData.verification.supplyChainStagesCompleted?.pharmacyReceived ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <div>
                        <span className="text-xs font-bold block text-slate-800">4. Pharmacy</span>
                        <span className="text-[10px] text-slate-500">Retail Ready</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Blockchain Journey Timeline */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                  <h4 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                    <span>Cryptographic Blockchain Journey (Hyperledger Fabric)</span>
                  </h4>
                  <JourneyTimeline journey={verificationData.verification.journey} />
                </div>
              </>
            )}

            {/* Transparency Disclaimer */}
            <div className="p-4 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-600 text-xs flex items-start gap-3">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Academic & Regulatory Note:</strong> {verificationData.disclaimer || 'A blockchain record proves the immutable recorded supply-chain history and authorized custody transfers. It does not replace physical inspection of seals or licensed medical advice.'}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

