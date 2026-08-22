import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, UtensilsCrossed, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/pos-context';
import loginIllustration from '@/assets/login-illustration.jpg';

const Login = () => {
  const [email, setEmail] = useState('admin@resto.com');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState<'admin' | 'employee'>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const navigate = useNavigate();
  const { login, setIsBackendConnected } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

  const handleQuickLogin = (selectedRole: 'admin' | 'employee') => {
    if (selectedRole === 'admin') {
      setEmail('admin@resto.com');
      setPassword('admin123');
      setRole('admin');
      login('admin@resto.com', 'admin123', 'admin', 'Admin');
      navigate('/admin');
    } else {
      setEmail('john@resto.com');
      setPassword('emp123');
      setRole('employee');
      login('john@resto.com', 'emp123', 'employee', 'John');
      navigate('/tables');
    }
  };

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
        login(email, password, role, data.name || data.email?.split('@')[0]);
        navigate(role === 'admin' ? '/admin' : '/tables');
        return;
      } else {
        // Check if demo credentials match
        if (
          (role === 'admin' && email === 'admin@resto.com') ||
          (role === 'employee' && (email === 'john@resto.com' || email === 'staff@restaurant.com'))
        ) {
          setIsBackendConnected(false);
          login(email, password, role);
          navigate(role === 'admin' ? '/admin' : '/tables');
          return;
        }
        setError('Invalid credentials on server');
      }
    } catch {
      // Backend offline fallback - allow local demo login
      setIsBackendConnected(false);
      login(email, password, role);
      navigate(role === 'admin' ? '/admin' : '/tables');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src={loginIllustration} alt="Restaurant" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-[hsl(250,85%,30%)]/90" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-elevated">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">RestoPOS</span>
          </div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Restaurant Management
            </span>
            <h1 className="text-4xl font-bold leading-tight mb-4 text-white">
              Enterprise Point of Sale & Table Automation
            </h1>
            <p className="text-primary-foreground/80 text-base max-w-md leading-relaxed">
              Real-time table orders, fast checkout, Kitchen Order Tickets (KOT), sales analytics, and complete staff control.
            </p>
          </motion.div>
          <div className="flex items-center justify-between text-xs text-primary-foreground/60">
            <p>© 2026 RestoPOS Pro Suite. All rights reserved.</p>
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
              <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">RestoPOS</span>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-1 tracking-tight">Welcome to RestoPOS</h2>
            <p className="text-muted-foreground text-sm">Sign in with your account or use quick demo access</p>
          </div>

          {/* Quick Demo Login Bar */}
          <div className="mb-6 p-3 rounded-2xl bg-muted/40 border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">⚡ Instant 1-Click Demo Login:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2 px-3 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Panel
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('employee')}
                className="py-2 px-3 rounded-xl bg-card hover:bg-primary hover:text-primary-foreground border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Tables & Orders
              </button>
            </div>
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
              {(['employee', 'admin'] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (r === 'admin') {
                      setEmail('admin@resto.com');
                      setPassword('admin123');
                    } else {
                      setEmail('john@resto.com');
                      setPassword('emp123');
                    }
                  }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    role === r
                      ? 'bg-card shadow-soft text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r === 'admin' ? '🛡️ Admin Role' : '🍽️ Staff / Waiter'}
                </button>
              ))}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@restaurant.com"
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
                onClick={() => setInfoMsg('Use demo credentials: admin@resto.com / admin123 or john@resto.com / emp123')}
                className="text-primary font-medium hover:underline"
              >
                Need Help?
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
                `Sign In as ${role === 'admin' ? 'Admin' : 'Staff'}`
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;

