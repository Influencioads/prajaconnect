'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api, apiError, tokenStore, API_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Logo } from '@/components/layout/logo';
import { useToast } from '@/components/ui/toast';

const DEMO = [
  { label: 'Constituency Leader', email: 'leader@praja.in' },
  { label: 'Super Admin', email: 'admin@praja.in' },
  { label: 'Volunteer', email: 'volunteer@praja.in' },
  { label: 'Govt Official', email: 'official@praja.in' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithTokens } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = React.useState('leader@praja.in');
  const [password, setPassword] = React.useState('Praja@123');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [apiReady, setApiReady] = React.useState<boolean | null>(null);

  // OTP placeholder
  const [mobile, setMobile] = React.useState('9000000004');
  const [otp, setOtp] = React.useState('');
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpLoading, setOtpLoading] = React.useState(false);

  React.useEffect(() => {
    if (tokenStore.access) router.replace('/dashboard');
  }, [router]);

  React.useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
        if (!cancelled) setApiReady(res.ok);
      } catch {
        if (!cancelled) setApiReady(false);
      }
    };
    check();
    const id = window.setInterval(check, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier, password);
      toast({ title: 'Welcome back', variant: 'success' });
      router.push('/dashboard');
    } catch (err) {
      toast({ title: 'Login failed', description: apiError(err), variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/otp/request', { mobile });
      setOtpSent(true);
      toast({
        title: 'OTP generated',
        description: data.devCode ? `Dev code: ${data.devCode}` : 'Check your SMS',
        variant: 'success',
      });
      if (data.devCode) setOtp(data.devCode);
    } catch (err) {
      toast({ title: 'Could not send OTP', description: apiError(err), variant: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  const verifyOtp = async () => {
    setOtpLoading(true);
    try {
      const { data } = await api.post('/auth/otp/verify', { mobile, code: otp });
      loginWithTokens(data.user, data.accessToken, data.refreshToken);
      toast({ title: 'Logged in', variant: 'success' });
      router.push('/dashboard');
    } catch (err) {
      toast({ title: 'Invalid OTP', description: apiError(err), variant: 'error' });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <Logo className="[&_p]:text-white" />
        <div>
          <h1 className="font-display text-4xl font-bold leading-tight">
            Governance, <span className="text-gold">connected</span> to every citizen.
          </h1>
          <p className="mt-4 max-w-md text-white/70">
            Praja Connect unifies cadre, citizens, grievances, schemes and field intelligence into
            one command center for Andhra Pradesh leaders.
          </p>
        </div>
        <div className="flex gap-6 text-sm text-white/60">
          <div>
            <p className="font-display text-2xl font-bold text-gold">175</p>
            <p>Constituencies</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-gold">9</p>
            <p>Role levels</p>
          </div>
          <div>
            <p className="font-display text-2xl font-bold text-gold">24/7</p>
            <p>Citizen support</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-canvas p-6 dark:bg-background">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Access your governance dashboard</p>

          {apiReady === false && (
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
              API is still starting. Wait for Docker to show{' '}
              <span className="font-medium">Praja Connect API running</span>, then try again.
            </p>
          )}

          <Tabs defaultValue="password" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="password">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="identifier">Email or Mobile</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="leader@praja.in"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={loading || apiReady === false}>
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mobile">Mobile number</Label>
                  <Input
                    id="mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="9000000004"
                  />
                </div>
                {otpSent && (
                  <div className="space-y-1.5">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} />
                  </div>
                )}
                {!otpSent ? (
                  <Button onClick={requestOtp} className="w-full" disabled={otpLoading}>
                    {otpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Send OTP
                  </Button>
                ) : (
                  <Button onClick={verifyOtp} className="w-full" disabled={otpLoading}>
                    {otpLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    Verify & Sign in
                  </Button>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  OTP is a placeholder — no SMS gateway is configured. The dev code is shown in the
                  toast.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 rounded-lg border bg-card p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Demo accounts · password Praja@123
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => setIdentifier(d.email)}
                  className="rounded-md border px-2 py-1.5 text-left text-xs hover:bg-muted"
                >
                  <span className="block font-semibold text-foreground">{d.label}</span>
                  <span className="text-muted-foreground">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
