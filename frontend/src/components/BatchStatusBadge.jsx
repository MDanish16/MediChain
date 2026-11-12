import React from 'react';
import { 
  CheckCircle2, 
  Truck, 
  AlertTriangle, 
  Clock, 
  Package, 
  Building2, 
  Store, 
  ShieldCheck 
} from 'lucide-react';

const statusConfig = {
  MANUFACTURED: {
    label: 'Manufactured',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: Package
  },
  IN_TRANSIT: {
    label: 'In Transit',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: Truck
  },
  RECEIVED_BY_DISTRIBUTOR: {
    label: 'At Distributor',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    icon: Building2
  },
  RECEIVED_BY_WHOLESALER: {
    label: 'At Wholesaler',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: Building2
  },
  RECEIVED_BY_PHARMACY: {
    label: 'At Pharmacy',
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-200',
    icon: Store
  },
  AVAILABLE_FOR_SALE: {
    label: 'Available for Sale',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: ShieldCheck
  },
  RECALLED: {
    label: 'Recalled (Safety Alert)',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-300 font-semibold',
    icon: AlertTriangle
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    icon: Clock
  }
};

export default function BatchStatusBadge({ status, isRecalled, className = '' }) {
  const effectiveKey = isRecalled ? 'RECALLED' : (statusConfig[status] ? status : 'MANUFACTURED');
  const conf = statusConfig[effectiveKey] || statusConfig.MANUFACTURED;
  const Icon = conf.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${conf.bg} ${conf.text} ${conf.border} ${className}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span>{conf.label}</span>
    </span>
  );
}

