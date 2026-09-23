import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, Store, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/pos-context';
import { API_BASE_URL } from '@/config/api';
import loginIllustration from '@/assets/login-illustration.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { login, setIsBackendConnected } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role,
        }),
      });

      if (response.ok) {
        setIsBackendConnected(true);
        const data = await response.json();
        const returnedRole = data.role ? String(data.role).toLowerCase() : null;
        if (!returnedRole) {
          setError('Invalid server response.');
          setIsLoading(false);
          return;
        }
        // Enforce role consistency: if user picked admin, server must return admin
        if (role === 'admin' && returnedRole !== 'admin') {
          setError('Access denied: Admin credentials required for Admin Portal.');
          setIsLoading(false);
          return;
        }
        const finalRole: 'admin' | 'employee' = returnedRole === 'admin' ? 'admin' : 'employee';
        login(email, password, finalRole, data.name || data.email?.split('@')[0]);
        navigate(finalRole === 'admin' ? '/admin' : '/order');
        return;
      } else {
        // Demo credentials fallback (offline/local)
        if (role === 'admin' && email === 'admin@tuckshop.com' && password === 'admin123') {
          setIsBackendConnected(false);
          login(email, password, 'admin', 'Admin');
          navigate('/admin');
          return;
        }
        if (role === 'employee' && (email === 'staff@tuckshop.com' || email === 'cashier@tuckshop.com') && password === 'emp123') {
          setIsBackendConnected(false);
          login(email, password, 'employee', email === 'cashier@tuckshop.com' ? 'Cashier' : 'Staff');
          navigate('/order');
          return;
        }
        setError(`Invalid credentials for ${role === 'admin' ? 'Admin' : 'Staff'} account.`);
      }
    } catch {
      // Backend offline fallback - demo logins
      if (role === 'admin' && email === 'admin@tuckshop.com' && password === 'admin123') {
        setIsBackendConnected(false);
        login(email, password, 'admin', 'Admin');
        navigate('/admin');
        return;
      }
      if (role === 'employee' && (email === 'staff@tuckshop.com' || email === 'cashier@tuckshop.com') && password === 'emp123') {
        setIsBackendConnected(false);
        login(email, password, 'employee', email === 'cashier@tuckshop.com' ? 'Cashier' : 'Staff');
        navigate('/order');
        return;
      }
      setIsBackendConnected(false);
      login(email, password, role);
      navigate(role === 'admin' ? '/admin' : '/order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={loginIllustration} alt="Tuck Shop" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-[hsl(250,85%,30%)]/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-elevated">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">TuckShop POS</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Smart Tuck Shop Management
            </span>
            <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
              Complete Tuck Shop & Inventory Automation
            </h1>
            <p className="text-primary-foreground/80 text-base max-w-md leading-relaxed">
              Lightning-fast checkout, barcode scanning, real-time stock tracking, GST-ready reports, automatic barcode generation, and smart inventory control for your tuck shop.
            </p>
          </motion.div>
          <div className="flex items-center justify-between text-xs text-primary-foreground/60">
            <p>© 2026 TuckShop Pro Suite. All rights reserved.</p>
            <span className="px-2.5 py-1 rounded-lg bg-white/10 text-white">v2.5.0</span>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">TuckShop POS</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 tracking-tight">Welcome to TuckShop POS</h2>
            <p className="text-muted-foreground text-sm">Sign in with your account credentials</p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </motion.div>
          )}

          {infoMsg && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 rounded-xl bg-primary/10 text-primary text-sm font-medium">
              {infoMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Toggle */}
            <div className="flex rounded-xl bg-muted p-1 gap-1">
              {(['admin', 'employee'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (r === 'admin') {
                      setEmail('admin@tuckshop.com');
                      setPassword('admin123');
                    } else {
                      setEmail('staff@tuckshop.com');
                      setPassword('emp123');
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
                    role === r
                      ? 'bg-card shadow-soft text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r === 'admin' ? (
                    <><ShieldCheck className="w-3.5 h-3.5" /> Admin Portal</>
                  ) : (
                    <><UserCheck className="w-3.5 h-3.5" /> Staff / Cashier</>
                  )}
                </button>
              ))}
            </div>

            {/* Role Info Badge */}
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${
              role === 'admin'
                ? 'bg-primary/10 border-primary/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
              <div>
                <p className={`text-xs font-bold ${role === 'admin' ? 'text-primary' : 'text-emerald-600'}`}>
                  {role === 'admin' ? 'Admin Portal Access' : 'Cashier / Counter Access'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {role === 'admin'
                    ? 'Full access: Dashboard, Reports, Inventory & Settings.'
                    : 'POS Counter only: Fast checkout, sales & returns (no admin panels).'}
                </p>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">
                {role === 'admin' ? 'Admin Email Address' : 'Staff Email Address'}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={role === 'admin' ? 'admin@tuckshop.com' : 'staff@tuckshop.com'}
                className="w-full h-11 px-4 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full h-11 px-4 pr-12 rounded-xl border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-muted-foreground">Keep me signed in</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (role === 'admin') {
                    setEmail('admin@tuckshop.com');
                    setPassword('admin123');
                    setInfoMsg('Demo Admin credentials loaded.');
                  } else {
                    setEmail('staff@tuckshop.com');
                    setPassword('emp123');
                    setInfoMsg('Demo Staff credentials loaded.');
                  }
                }}
                className="text-primary font-medium hover:underline"
              >
                Load Demo Credentials
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-elevated hover:shadow-float transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                role === 'admin' ? (
                  <><ShieldCheck className="w-4 h-4" /> Sign In as Admin</>
                ) : (
                  <><UserCheck className="w-4 h-4" /> Sign In as Staff</>
                )
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
