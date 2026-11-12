import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Download, Printer, Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react';

export default function QRCodeModal({ batch, isOpen, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (batch && isOpen) {
      const verifyUrl = `${window.location.origin}/verify/${batch.batchId}`;
      QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'H',
        width: 320,
        margin: 2,
        color: {
          dark: '#0F172A',
          light: '#FFFFFF'
        }
      }).then(url => setQrDataUrl(url)).catch(console.error);
    }
  }, [batch, isOpen]);

  if (!isOpen || !batch) return null;

  const verifyUrl = `${window.location.origin}/verify/${batch.batchId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=700');
    printWindow.document.write(`
      <html>
        <head>
          <title>MediChain QR Label - ${batch.batchId}</title>
          <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; }
            .box { border: 2px solid #000; padding: 15px; max-width: 380px; margin: 0 auto; border-radius: 8px; }
            h2 { margin: 0 0 5px 0; color: #0f172a; }
            p { margin: 4px 0; font-size: 13px; color: #334155; }
            .batch { font-family: monospace; font-weight: bold; font-size: 16px; margin: 10px 0; }
            img { max-width: 240px; margin: 10px 0; }
            .footer { font-size: 10px; color: #64748b; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="box">
            <h2>MediChain Verified Medicine</h2>
            <p><strong>${batch.medicineName}</strong> (${batch.genericName || ''})</p>
            <div class="batch">BATCH: ${batch.batchId}</div>
            <img src="${qrDataUrl}" />
            <p><strong>Mfg:</strong> ${batch.manufacturer} | <strong>Exp:</strong> ${batch.expiryDate}</p>
            <p><strong>Qty:</strong> ${batch.quantity} ${batch.unit || ''}</p>
            <div class="footer">Secured by Hyperledger Fabric Distributed Ledger</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900">Blockchain Batch QR Code</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-center">
          <div className="inline-block p-3 rounded-2xl bg-white shadow-inner border border-slate-200/80 mb-4">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR for ${batch.batchId}`} className="w-52 h-52 mx-auto" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-400">Loading QR...</div>
            )}
          </div>

          <h4 className="font-bold text-slate-900 text-lg">{batch.medicineName}</h4>
          <p className="text-xs text-slate-500 mt-0.5">{batch.genericName}</p>

          <div className="mt-3 inline-block bg-slate-100 px-3 py-1 rounded-full text-xs font-mono font-semibold text-slate-700">
            {batch.batchId}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-left bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block">Manufacturer</span>
              <span className="font-semibold text-slate-800 truncate block">{batch.manufacturer}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Expiry Date</span>
              <span className="font-semibold text-slate-800">{batch.expiryDate}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <a
              href={qrDataUrl}
              download={`${batch.batchId}-QR.png`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Save</span>
            </a>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Link'}</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href={`/verify/${batch.batchId}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
            >
              <span>Preview public verification page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

