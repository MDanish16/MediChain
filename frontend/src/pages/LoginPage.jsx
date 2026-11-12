import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  Building2, 
  Package, 
  Truck, 
  Store, 
  Shield, 
  Sparkles 
} from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e, customUser = null, customPass = null) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);

    const userToLogin = customUser || username;
    const passToLogin = customPass || password;

    try {
      const loggedUser = await login(userToLogin, passToLogin);
      const targetPath = getDashboardPath(loggedUser.role);
      navigate(targetPath);
    } catch (err) {
      setError(err.message || 'Invalid credentials or connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    {
      role: 'MANUFACTURER',
      title: 'PharmaCorp Labs',
      user: 'manufacturer',
      pass: 'Password@123',
      icon: Package,
      desc: 'Batch registration, production tracking, recalls',
      color: 'hover:border-blue-500 hover:bg-blue-50/50'
    },
    {
      role: 'DISTRIBUTOR',
      title: 'LogiCare Pharma',
      user: 'distributor',
      pass: 'Password@123',
      icon: Truck,
      desc: 'In-transit custody intake, freight dispatch',
      color: 'hover:border-amber-500 hover:bg-amber-50/50'
    },
    {
      role: 'WHOLESALER',
      title: 'MedSupply Global',
      user: 'wholesaler',
      pass: 'Password@123',
      icon: Building2,
      desc: 'Regional inventory, pharmacy consignment',
      color: 'hover:border-purple-500 hover:bg-purple-50/50'
    },
    {
      role: 'PHARMACY',
      title: 'CarePlus Pharmacy',
      user: 'pharmacy',
      pass: 'Password@123',
      icon: Store,
      desc: 'Store intake, mark for sale, dispensing',
      color: 'hover:border-teal-500 hover:bg-teal-50/50'
    },
    {
      role: 'SUPER_ADMIN',
      title: 'Consortium Admin',
      user: 'admin',
      pass: 'Password@123',
      icon: Shield,
      desc: 'Network health, audit logs, consortium oversight',
      color: 'hover:border-slate-800 hover:bg-slate-100'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          
          {/* Left Column: Fast Faculty Demo Selector */}
          <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-8 text-white flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Faculty 1-Click Fast Switch
              </div>
              <h3 className="text-xl font-bold tracking-tight">Supply Chain Roles</h3>
              <p className="text-xs text-slate-400 mt-1">
                Click any participant below to instantly authenticate and evaluate their role-specific dashboard.
              </p>

              <div className="mt-5 space-y-2.5">
                {demoAccounts.map((acc) => {
                  const Icon = acc.icon;
                  return (
                    <button
                      key={acc.user}
                      type="button"
                      onClick={() => {
                        setUsername(acc.user);
                        setPassword(acc.pass);
                        handleLogin(null, acc.user, acc.pass);
                      }}
                      className="w-full text-left p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/90 hover:border-teal-500/50 transition group flex items-start gap-3"
                    >
                      <div className="p-2 rounded-lg bg-slate-800 text-teal-400 group-hover:text-teal-300 transition mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-200 group-hover:text-white truncate">
                            {acc.title}
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            {acc.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{acc.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800/80 text-[11px] text-slate-500">
              Credentials preset: <code className="text-teal-400">Password@123</code>
            </div>
          </div>

          {/* Right Column: Standard Login Form */}
          <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            <div className="max-w-sm w-full mx-auto">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Participant Sign In</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Authenticate with your enrolled Fabric organization identity.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Username / Role ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. manufacturer, distributor, pharmacy"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-teal-700/20 transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <span>Authenticating on Fabric...</span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                <Link
                  to="/verify"
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Looking for public verification? No login needed →
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

