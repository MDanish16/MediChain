import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Package, 
  ArrowRightLeft, 
  AlertTriangle, 
  Layers, 
  ShieldCheck, 
  Users, 
  LogOut,
  QrCode,
  Building,
  CheckCircle2
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role;

  // Build menu items based on role
  const getNavItems = () => {
    const common = [
      { to: '/explorer', label: 'Blockchain Explorer', icon: Layers }
    ];

    switch (role) {
      case 'SUPER_ADMIN':
        return [
          { to: '/admin', label: 'Network Overview', icon: LayoutDashboard },
          { to: '/admin/batches', label: 'All Ledger Batches', icon: Package },
          { to: '/admin/users', label: 'User Directory', icon: Users },
          ...common
        ];
      case 'MANUFACTURER':
        return [
          { to: '/manufacturer', label: 'Manufacturer Hub', icon: LayoutDashboard },
          { to: '/manufacturer/register', label: 'Register New Batch', icon: PlusCircle },
          { to: '/manufacturer/batches', label: 'Production Inventory', icon: Package },
          { to: '/manufacturer/recall', label: 'Batch Recall Console', icon: AlertTriangle },
          ...common
        ];
      case 'DISTRIBUTOR':
        return [
          { to: '/distributor', label: 'Distributor Hub', icon: LayoutDashboard },
          { to: '/distributor/pending', label: 'Incoming Transfers', icon: ArrowRightLeft },
          { to: '/distributor/inventory', label: 'Warehouse Inventory', icon: Package },
          ...common
        ];
      case 'WHOLESALER':
        return [
          { to: '/wholesaler', label: 'Wholesaler Hub', icon: LayoutDashboard },
          { to: '/wholesaler/pending', label: 'Incoming Consignments', icon: ArrowRightLeft },
          { to: '/wholesaler/inventory', label: 'Regional Depot', icon: Package },
          ...common
        ];
      case 'PHARMACY':
        return [
          { to: '/pharmacy', label: 'Pharmacy Dispensary', icon: LayoutDashboard },
          { to: '/pharmacy/pending', label: 'Incoming Deliveries', icon: ArrowRightLeft },
          { to: '/pharmacy/inventory', label: 'Retail Stock', icon: Package },
          { to: '/pharmacy/verify', label: 'Authenticity Scanner', icon: QrCode },
          ...common
        ];
      default:
        return common;
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-[calc(100vh-4rem)] border-r border-slate-800">
      {/* Participant Identity Panel */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-bold text-white text-sm truncate">{user.organization}</h4>
            <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-semibold bg-teal-950 text-teal-300 border border-teal-800">
              {user.role}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 font-mono flex items-center justify-between">
          <span>MSP:</span>
          <span className="text-teal-400 font-semibold">{user.mspId || 'Org1MSP'}</span>
        </div>
      </div>

      {/* Navigation links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin' || item.to === '/manufacturer' || item.to === '/distributor' || item.to === '/wholesaler' || item.to === '/pharmacy'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-900/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Signout and Verification Quick Link */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 space-y-2">
        <NavLink
          to="/verify"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-teal-400 hover:bg-slate-800/40 transition"
        >
          <QrCode className="w-4 h-4 text-teal-400" />
          <span>Public QR Scanner</span>
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

