
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { signInStaff } from '@/lib/data-store';
import { Loader2, Shield, Building } from 'lucide-react';
import { useFirebase } from '@/firebase/client-provider';

interface StaffLoginFormProps {
  schoolId?: string;
}

export default function StaffLoginForm({ schoolId: initialSchoolId }: StaffLoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { auth, db } = useFirebase();
  const [staffId, setStaffId] = useState('');
  const [schoolId, setSchoolId] = useState(initialSchoolId || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    try {
        const staffDoc = await signInStaff(auth, db, schoolId, staffId);
        if (staffDoc && staffDoc.className) {
            sessionStorage.setItem('schoolId', staffDoc.schoolId);
            sessionStorage.setItem('staffId', staffDoc.id);
            sessionStorage.setItem('staffClassName', staffDoc.className);
            // Correctly encode the className for the URL
            router.push(`/staff/class/${encodeURIComponent(staffDoc.className)}?schoolId=${staffDoc.schoolId}`);
        } else {
            // This case handles non-teaching staff or staff without an assigned class
            throw new Error("This Staff ID is not associated with a class.");
        }
    } catch (error: any) {
      console.error("Staff Login Error:", error);
      toast({
        title: 'Login Failed',
        description: error.message || "An unexpected error occurred.",
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                id="schoolId"
                placeholder="School ID"
                required
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                disabled={isLoading}
                className="pl-10"
            />
        </div>
        <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
                id="staff-id"
                placeholder="Staff ID"
                required
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                disabled={isLoading}
                className="pl-10"
            />
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 transition-opacity" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Logging In...</> : 'LOGIN'}
        </Button>
    </form>
  );
}
