

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { signInUser, getSchoolForAdmin } from '@/lib/data-store';
import { Loader2, Monitor, Lock, Eye, EyeOff, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { useFirebase } from '@/firebase/client-provider';


export default function AdminLoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, db } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // @ts-ignore
    const isCapacitor = typeof window !== 'undefined' && !!window.Capacitor;
    setIsMobile(isCapacitor);
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const userCredential = await signInUser(auth, email, password);
      
      if (userCredential && userCredential.user) {
        // SUPER ADMIN CHECK
        if (email.toLowerCase() === process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL?.toLowerCase()) {
            toast({ title: 'Super Admin Login Successful', description: 'Redirecting to your dashboard...'});
            router.push('/super-admin/dashboard');
            return;
        }

        const resolvedSchoolId = await getSchoolForAdmin(db, userCredential.user.uid);
        if (resolvedSchoolId) {
          router.push(`/admin/dashboard?schoolId=${resolvedSchoolId}`);
        } else {
            toast({
                title: 'No School Found',
                description: 'Your account is valid, but not associated with a school. Please register your school.',
                variant: 'destructive',
                duration: 6000
            });
            setTimeout(() => router.push('/register'), 3000);
        }
      } else {
        throw new Error("Login failed. Please try again.");
      }
    } catch (error: any) {
      let description = "An unknown error occurred during login.";
       if (error.message === "Email not verified. Please check your inbox for a verification link.") {
            description = error.message;
       } else {
          switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
              description = 'Invalid credentials. Please check your email and password.';
              break;
            case 'auth/invalid-email':
              description = 'The email address is not valid.';
              break;
            case 'auth/too-many-requests':
              description = 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
              break;
            case 'auth/network-request-failed':
                description = 'A network error occurred. Please check your internet connection.';
                break;
            default:
              description = error.message || `An unexpected error occurred. Please try again.`;
              console.error("Firebase Auth Error:", error);
              break;
          }
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

  if (!isMounted) {
    return null;
  }

  if (isMobile) {
    return (
       <div className="pt-6">
        <Alert>
          <Monitor className="h-4 w-4" />
          <AlertTitle>Web Access Only</AlertTitle>
          <AlertDescription>
            The admin dashboard is only available on a computer's web browser.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="Email Address"
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
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
                <Checkbox id="remember-me" disabled={isLoading} />
                <Label htmlFor="remember-me" className="text-sm font-medium leading-none text-muted-foreground">Remember me</Label>
            </div>
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging In...</> : 'LOGIN'}
        </Button>
      </form>
    </>
  );
}
