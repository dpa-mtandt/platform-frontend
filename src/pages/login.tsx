import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, BarChart3, CheckCircle2, FileText, GraduationCap, KeyRound, LogIn, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { Button, Input, Label } from '@/components/ui/primitives';
import { EquipmentPattern } from '@/components/layout/brand-background';
import { apiErrorMessage } from '@/lib/utils';

const LOGIN_FEATURES = [
  { icon: GraduationCap, label: 'Training', desc: 'Courses, quizzes & certificates' },
  { icon: BarChart3, label: 'Dashboards', desc: 'Live Power BI analytics' },
  { icon: MessageSquare, label: 'Feedback', desc: 'Employee ratings & insights' },
  { icon: FileText, label: 'Reports', desc: 'Cross-module exports' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'signin' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: string } | null)?.from || '/';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#161b22] p-4">
      <div className="grid min-h-[550px] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl md:grid-cols-2">
        
        {/* Left Panel */}
        <div className="relative hidden flex-col overflow-hidden bg-gradient-to-br from-[#242424] to-[#131313] p-10 text-white md:flex">
          {/* MT&T-branded backdrop — one soft glow + a faint equipment texture */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-8 h-80 w-80 rounded-full bg-brand/[0.09] blur-[100px]" />
            <EquipmentPattern color="#FAE300" opacity={0.04} id="mt-login" />
          </div>

          {/* Wordmark */}
          <div className="relative z-10">
            <span className="text-lg font-semibold tracking-wide text-white/90">Welcome to Mtandt Group Platform</span>
          </div>

          {/* Hero + features, vertically centred */}
          <div className="relative z-10 my-auto max-w-sm py-6">
            <span className="mb-5 inline-flex items-center rounded-full bg-brand/15 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-wider text-brand ring-1 ring-brand/25">
              Dil Se Seva
            </span>
            <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight">
              One platform.<br />Every tool, your access.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Training, Dashboards, Feedback and more — unified for MTANDT Group. You see only what you're granted.
            </p>

            <div className="mt-8 space-y-4">
              {LOGIN_FEATURES.map((f) => (
                <div key={f.label} className="flex items-center gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.06] text-brand ring-1 ring-white/10">
                    <f.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold leading-tight text-white/90">{f.label}</div>
                    <div className="text-xs text-gray-500">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative z-10 border-t border-white/10 pt-4 text-xs text-gray-500">
            <p>© 2026 MTANDT Group</p>
            <p className="mt-0.5">Built and Managed by IT Team</p>
          </div>
        </div>

        {/* Right Panel (Form) */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <div className="mb-8 flex justify-center">
            <img 
              src="/logo.png" 
              alt="MT&T Logo" 
              className="h-16 w-auto object-contain" 
            />
          </div>
          
          {mode === 'signin' ? (
            <>
              <h2 className="mb-6 text-2xl font-semibold text-slate-900">Sign in</h2>

              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="bg-blue-50/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setError(''); }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="bg-blue-50/30"
                  />
                </div>

                {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                <Button
                  type="submit"
                  className="mt-4 w-full bg-[#111827] text-white hover:bg-gray-800"
                  size="lg"
                  loading={loading}
                >
                  <LogIn className="mr-2 h-4 w-4" /> Sign in
                </Button>
              </form>
            </>
          ) : (
            <ForgotPasswordFlow initialEmail={email} onBack={() => { setMode('signin'); setError(''); }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Forgot-password OTP flow (email → code → new password) ────────────────────
function ForgotPasswordFlow({ initialEmail, onBack }: { initialEmail?: string; onBack: () => void }) {
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setDevOtp(res.data?.data?.devOtp || '');
      setStep('otp');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/verify-otp', { email: email.trim(), otp: otp.trim() });
      setStep('reset');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function doReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), newPassword });
      setStep('done');
    } catch (err) {
      setError(apiErrorMessage(err));
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
        <h2 className="text-2xl font-semibold text-slate-900">Password reset</h2>
        <p className="mt-2 text-sm text-slate-500">Your password has been updated. Sign in with your new password.</p>
        <Button className="mt-6 w-full bg-[#111827] text-white hover:bg-gray-800" size="lg" onClick={onBack}>Back to sign in</Button>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </button>
      <h2 className="mb-1 text-2xl font-semibold text-slate-900">Reset your password</h2>
      <p className="mb-6 text-sm text-slate-500">
        {step === 'email' && "Enter your email and we'll send you a 6-digit code."}
        {step === 'otp' && <>Enter the 6-digit code sent to <b>{email}</b>.</>}
        {step === 'reset' && 'Choose a new password.'}
      </p>

      {devOtp && step !== 'reset' && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <b>Dev mode</b> (email not configured): your code is <code className="font-mono text-base font-bold">{devOtp}</code>
        </p>
      )}

      {step === 'email' && (
        <form onSubmit={sendCode} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="fp-email">Email</Label>
            <Input id="fp-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required className="bg-blue-50/30" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" className="w-full bg-[#111827] text-white hover:bg-gray-800" size="lg" loading={loading}>
            <KeyRound className="mr-2 h-4 w-4" /> Send code
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyCode} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="fp-otp">6-digit code</Label>
            <Input
              id="fp-otp"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              required
              className="bg-blue-50/30 text-center text-lg tracking-[0.5em]"
            />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" className="w-full bg-[#111827] text-white hover:bg-gray-800" size="lg" loading={loading} disabled={otp.length !== 6}>
            Verify code
          </Button>
          <button type="button" onClick={() => sendCode()} className="w-full text-center text-sm text-blue-600 hover:underline">Didn't get it? Resend code</button>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={doReset} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="fp-new">New password</Label>
            <Input id="fp-new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8, with upper/lower/number" required className="bg-blue-50/30" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fp-confirm">Confirm new password</Label>
            <Input id="fp-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required className="bg-blue-50/30" />
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <Button type="submit" className="w-full bg-[#111827] text-white hover:bg-gray-800" size="lg" loading={loading}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Reset password
          </Button>
        </form>
      )}
    </div>
  );
}
