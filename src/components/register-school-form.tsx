

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, School, Mail, Lock, Eye, EyeOff, Upload } from 'lucide-react';
import { registerSchool } from '@/lib/data-store';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useFirebase } from '@/firebase/client-provider';
import Link from 'next/link';

export default function RegisterSchoolForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, db, storage } = useFirebase();
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      await registerSchool(auth, db, storage, schoolName, email, password, logoFile);
      setIsSuccess(true);
      
    } catch (error: any) {
      let description = "An unknown error occurred during registration.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          description = 'This email address is already in use by another account.';
          break;
        case 'auth/invalid-email':
          description = 'The email address is not valid.';
          break;
        case 'auth/weak-password':
          description = 'The password is too weak. Please use at least 6 characters.';
          break;
        case 'auth/network-request-failed':
            description = 'A network error occurred. Please check your internet connection.';
            break;
        default:
          description = `An unexpected error occurred. Please try again.`;
          console.error("Registration Error:", error); 
          break;
      }
      toast({
        title: 'Registration Failed',
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <h3 className="text-xl font-semibold">Registration Successful!</h3>
        <p className="text-muted-foreground">
          A verification link has been sent to <span className="font-bold text-foreground">{email}</span>. Please check your inbox and click the link to complete your registration.
        </p>
        <p className="text-sm text-muted-foreground">
          After verifying, you can log in.
        </p>
        <Button asChild className="w-full">
          <Link href="/">Back to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <School className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
            id="school-name"
            type="text"
            placeholder="School Name"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            disabled={isLoading}
            className="pl-10"
        />
      </div>
       <div className="relative">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
            id="register-email"
            type="email"
            placeholder="Admin Email"
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
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password (at least 6 characters)"
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
       <div className="space-y-2">
            <Label>School Logo (Optional)</Label>
            <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                    <AvatarImage src={logoPreview || undefined} alt="School logo preview" />
                    <AvatarFallback><School/></AvatarFallback>
                </Avatar>
                <Label htmlFor="school-logo" className="cursor-pointer flex items-center gap-2 border p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors text-sm">
                    <Upload className="h-4 w-4" />
                    <span>Upload Logo</span>
                </Label>
                <Input id="school-logo" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </div>
       </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : 'CREATE ACCOUNT'}
        </Button>
    </form>
  );
}
