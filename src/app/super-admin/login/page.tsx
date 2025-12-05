
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { signInUser } from '@/lib/data-store';
import { Loader2, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useFirebase } from '@/firebase/client-provider';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!superAdminEmail) {
         toast({
            title: 'Configuration Error',
            description: 'The Super Admin email has not been set in the environment variables.',
            variant: 'destructive',
        });
        return;
    }
    
    if (email.toLowerCase() !== superAdminEmail.toLowerCase()) {
         toast({
            title: 'Access Denied',
            description: 'This email address is not authorized for super admin access.',
            variant: 'destructive',
        });
        return;
    }
    
    setIsLoading(true);

    try {
      await signInUser(auth, email, password);
      toast({ title: 'Login Successful', description: 'Redirecting to your dashboard...'});
      router.push('/super-admin/dashboard');
    } catch (error: any) {
      let description = "An unknown error occurred during login.";
      switch (error.code) {
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          description = 'Invalid credentials for the super admin account.';
          break;
        default:
          description = error.message || 'An unexpected error occurred.';
          break;
      }
      toast({
        title: 'Login Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <ShieldCheck className="mx-auto h-16 w-16 text-primary-foreground" />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-primary-foreground">Super Admin</h1>
            <p className="text-slate-400">Platform Management Portal</p>
        </div>
        <div className="rounded-xl bg-card p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="email"
                        type="email"
                        placeholder="Super Admin Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isLoading}
                        className="pl-10"
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        className="pl-10 pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Authenticating...</> : 'LOGIN'}
                </Button>
            </form>
        </div>
      </div>
    </main>
  );
}
