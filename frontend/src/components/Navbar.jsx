import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NetworkStatusPill from './NetworkStatusPill';
import { 
  ShieldCheck, 
  Layers, 
  QrCode, 
  LogOut, 
  User, 
  ChevronDown, 
  Menu, 
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);

  const navLinks = [
    { label: 'Public Verification', path: '/verify', icon: QrCode },
    { label: 'Blockchain Explorer', path: '/explorer', icon: Layers },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-900 to-teal-700 flex items-center justify-center text-white shadow-md shadow-teal-900/10 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 text-teal-300" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                  MediChain
                  <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.5 rounded-full uppercase">
                    Fabric 2.5
                  </span>
                </span>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                  Pharma Blockchain Traceability
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname.startsWith(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
                      isActive 
                        ? 'text-teal-700 bg-teal-50/80 font-semibold' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Header Section */}
          <div className="hidden sm:flex items-center gap-4">
            <NetworkStatusPill />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {user.username.slice(0, 2)}
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-800 leading-tight">{user.username}</p>
                    <p className="text-[11px] text-slate-500 leading-tight">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 animate-fade-in z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">{user.organization}</p>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">MSP: {user.mspId}</p>
                    </div>

                    <Link
                      to={getDashboardPath(user.role)}
                      onClick={() => setUserDropdown(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      <User className="w-4 h-4 text-teal-600" />
                      <span>Role Dashboard</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdown(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/verify"
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-teal-700 transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-teal-600" />
                  <span>Verify Batch</span>
                </Link>

                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Participant Portal</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100">
            {user ? (
              <>
                <Link
                  to={getDashboardPath(user.role)}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-teal-700"
                >
                  <User className="w-4 h-4" />
                  <span>{user.username} ({user.role})</span>
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 w-full text-left"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold"
              >
                <span>Participant Portal</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

