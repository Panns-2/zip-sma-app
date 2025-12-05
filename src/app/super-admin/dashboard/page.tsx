
'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LogOut, Loader2, ShieldCheck, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { School, getAllSchools, toggleSchoolLock } from '@/lib/data-store';
import { useFirebase } from '@/firebase/client-provider';

function SuperAdminDashboard() {
    const router = useRouter();
    const { toast } = useToast();
    const { auth, db } = useFirebase();

    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [schools, setSchools] = useState<School[]>([]);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const superAdminEmail = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL;

    const fetchSchools = useCallback(async () => {
        if (!db) return;
        setIsLoading(true);
        try {
            const allSchools = await getAllSchools(db);
            setSchools(allSchools.sort((a,b) => a.name.localeCompare(b.name)));
        } catch (error: any) {
            console.error("Failed to fetch schools:", error);
            toast({
                title: "Error",
                description: "Could not fetch the list of schools.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, db]);
    
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser && currentUser.email === superAdminEmail) {
                setUser(currentUser);
            } else {
                router.replace('/super-admin/login');
                toast({ title: "Access Denied", description: "You are not authorized to view this page.", variant: "destructive" });
            }
        });
        return () => unsubscribe();
    }, [auth, router, toast, superAdminEmail]);

    useEffect(() => {
        if (user && db) {
            fetchSchools();
        }
    }, [user, db, fetchSchools]);


    const handleLogout = async () => {
        await auth.signOut();
        router.push('/super-admin/login');
        toast({ title: 'Logged Out' });
    };

    const handleLockToggle = async (schoolId: string, isCurrentlyLocked: boolean) => {
        if (!db || !auth) return;
        setIsUpdating(schoolId);
        try {
            await toggleSchoolLock(db, auth, schoolId, !isCurrentlyLocked);
            setSchools(prevSchools => 
                prevSchools.map(s => s.id === schoolId ? { ...s, isLocked: !isCurrentlyLocked } : s)
            );
            toast({
                title: "Success",
                description: `School has been ${!isCurrentlyLocked ? 'locked' : 'unlocked'}.`,
                variant: !isCurrentlyLocked ? 'destructive' : 'default'
            });
        } catch (error) {
            console.error("Failed to toggle lock:", error);
            toast({ title: "Error", description: "Could not update school status.", variant: "destructive" });
        } finally {
            setIsUpdating(null);
        }
    }


    if (!user || !auth || !db) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-slate-100 text-foreground">
            <header className="bg-card shadow-sm sticky top-0 z-40 border-b">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-primary" />
                        <h1 className="text-xl font-bold text-primary font-headline">Super Admin</h1>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm">
                        <LogOut className="mr-2 h-4 w-4" />Logout
                    </Button>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card>
                    <CardHeader>
                        <CardTitle>School Management</CardTitle>
                        <CardDescription>A list of all registered schools. You can lock or unlock their access to the portal.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>School Name</TableHead>
                                        <TableHead>School ID</TableHead>
                                        <TableHead>Admin Email</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-right">Lock/Unlock Portal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {schools.map(school => (
                                        <TableRow key={school.id}>
                                            <TableCell className="font-medium">{school.name}</TableCell>
                                            <TableCell>{school.id}</TableCell>
                                            <TableCell>{school.adminEmail}</TableCell>
                                            <TableCell className="text-center">
                                                {school.isLocked ? (
                                                    <Badge variant="destructive" className="flex items-center gap-1">
                                                        <Lock className="h-3 w-3" /> Locked
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="text-green-700 flex items-center gap-1">
                                                        <Unlock className="h-3 w-3" /> Active
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isUpdating === school.id ? (
                                                    <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                                                ) : (
                                                    <Switch
                                                        checked={!school.isLocked}
                                                        onCheckedChange={() => handleLockToggle(school.id, !!school.isLocked)}
                                                        aria-label="Toggle school lock"
                                                    />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}


export default function SuperAdminDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SuperAdminDashboard />
        </Suspense>
    )
}
