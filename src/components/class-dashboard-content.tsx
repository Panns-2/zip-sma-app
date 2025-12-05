

'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getStudentsByClass, setAttendance, Student, Homework, getHomeworkForClass, addHomework, deleteHomework, signOutUser } from '@/lib/data-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, Users, Loader2, BookCopy, PlusCircle, Trash2, GraduationCap, Bot } from 'lucide-react';
import { ZipSMALogo } from '@/components/zipsma-logo';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { useFirebase } from '@/firebase/client-provider';


const defaultHomeworkForm = { title: '', description: '', dueDate: new Date().toISOString().split('T')[0] };

export default function ClassDashboardContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { auth, db } = useFirebase();
    
    const className = Array.isArray(params.className) ? params.className[0] : params.className;
    const decodedClassName = useMemo(() => className ? decodeURIComponent(className).trim() : '', [className]);
    const schoolId = searchParams.get('schoolId');

    const [students, setStudents] = useState<Student[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAttendanceSubmitting, setIsAttendanceSubmitting] = useState<{[key: string]: boolean}>({});

    const [homeworkForm, setHomeworkForm] = useState(defaultHomeworkForm);
    const [homeworkToDelete, setHomeworkToDelete] = useState<Homework | null>(null);

    const fetchData = useCallback(async (currentClassName: string, currentSchoolId: string) => {
        if (!currentClassName || !currentSchoolId || !db) return;
        setIsLoading(true);
        try {
            const [classStudents, classHomework] = await Promise.all([
                getStudentsByClass(db, currentSchoolId, currentClassName),
                getHomeworkForClass(db, currentSchoolId, currentClassName)
            ]);
            setStudents(classStudents);
            setHomework(classHomework);

        } catch (error) {
            console.error("Failed to fetch data:", error);
            toast({ title: "Error", description: "Could not fetch class data. Please check your connection and try again.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    }, [toast, db]);

    useEffect(() => {
        // This effect should only run on the client
        if (typeof window === 'undefined' || !db) {
            return;
        }

        const staffId = sessionStorage.getItem('staffId');
        const staffClassName = sessionStorage.getItem('staffClassName');
        const sessionSchoolId = sessionStorage.getItem('schoolId');

        // URL parameters are the source of truth, but we verify against session storage
        if (!staffId || staffClassName !== decodedClassName || sessionSchoolId !== schoolId) {
            router.replace('/staff/login');
            toast({ title: 'Unauthorized', description: 'Your session is invalid. Please log in again.', variant: 'destructive' });
            return;
        }
        
        // Ensure we have the necessary IDs before fetching
        if (decodedClassName && schoolId) {
            fetchData(decodedClassName, schoolId);
        } else {
            // If the URL params are missing, something is wrong.
            setIsLoading(false);
            toast({ title: 'Error', description: 'Missing required class or school information.', variant: 'destructive' });
        }
    }, [router, toast, decodedClassName, schoolId, fetchData, db]);


    const handleLogout = async () => {
        sessionStorage.removeItem('staffId');
        sessionStorage.removeItem('staffClassName');
        sessionStorage.removeItem('schoolId');
        if (auth) {
            await signOutUser(auth);
        }
        router.push('/');
        toast({ title: 'Logged Out', description: 'You have been logged out.' });
    };

    const handleToggleAttendance = async (studentId: string, date: string, isChecked: boolean) => {
        if (!auth || !db) return;
        const key = `${studentId}-${date}`;
        setIsAttendanceSubmitting(prev => ({...prev, [key]: true}));
        try {
            await setAttendance(db, auth, studentId, date, isChecked);
            setStudents(prevStudents => prevStudents.map(s => {
                if (s.studentId === studentId) {
                    const attendance = s.attendance || [];
                    const recordIndex = attendance.findIndex(a => a.date === date);
                    if (recordIndex > -1) {
                        attendance[recordIndex].attended = isChecked;
                    } else {
                        attendance.push({ id: Date.now(), date: date, attended: isChecked });
                    }
                    return { ...s, attendance };
                }
                return s;
            }));
        } catch (error) {
            toast({ title: "Error", description: "Could not update attendance. You may not have permission.", variant: "destructive" });
        } finally {
             setIsAttendanceSubmitting(prev => ({...prev, [key]: false}));
        }
    };

    const handleAddHomework = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId || !auth || !db) return;
        setIsSubmitting(true);
        try {
            await addHomework(db, auth, schoolId, { ...homeworkForm, className: decodedClassName });
            toast({ title: 'Homework Assigned', description: `"${homeworkForm.title}" has been added.`});
            setHomeworkForm(defaultHomeworkForm);
            fetchData(decodedClassName, schoolId);
        } catch (error) {
            toast({ title: "Error", description: "Could not assign homework.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteHomework = (hw: Homework) => setHomeworkToDelete(hw);
    const confirmDeleteHomework = async () => {
        if(homeworkToDelete && schoolId && auth && db) {
            setIsSubmitting(true);
            try {
                await deleteHomework(db, auth, homeworkToDelete.id);
                toast({ title: 'Homework Deleted', description: `The assignment has been removed.`, variant: 'destructive'});
                fetchData(decodedClassName, schoolId);
            } catch (error) {
                toast({ title: "Error", description: "Could not delete homework.", variant: "destructive" });
            } finally {
                setHomeworkToDelete(null);
                setIsSubmitting(false);
            }
        }
    }
    
    const last5Weekdays = useMemo(() => {
        const weekdays: string[] = [];
        let currentDate = new Date();
        while (weekdays.length < 5) {
            const dayOfWeek = currentDate.getDay(); // Sunday is 0, Saturday is 6
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                weekdays.push(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return weekdays.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    }, []);

    if (isLoading) {
         return (
             <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
         )
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card shadow-sm sticky top-0 z-40 border-b">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <ZipSMALogo />
                            <h1 className="text-2xl font-bold text-primary font-headline hidden sm:block">Class Dashboard</h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold whitespace-nowrap">{decodedClassName}</h2>
                        <Button onClick={handleLogout} variant="outline" size="sm"><LogOut className="mr-2 h-4 w-4" />Logout</Button>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Card className="mb-6 bg-accent/10 border-accent/50">
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bot className="w-6 h-6 text-accent"/>
                            <div>
                                <CardTitle className="text-accent">AI Teacher's Corner</CardTitle>
                                <CardDescription className="text-accent/80">Access AI-powered tools for lesson planning and more.</CardDescription>
                            </div>
                        </div>
                        <Button asChild variant="destructive">
                            <Link href="/teachers-corner">
                                Open AI Assistant
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="attendance">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="attendance">Weekly Attendance</TabsTrigger>
                        <TabsTrigger value="homework">Manage Homework</TabsTrigger>
                    </TabsList>
                    <TabsContent value="attendance" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Attendance Overview</CardTitle>
                                <CardDescription>A log of student attendance for the last 5 school days.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Skeleton className="h-64 w-full" />
                                ) : students.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-medium">No Students in this Class</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">There are no students assigned to {decodedClassName}.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <Table className="min-w-full">
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[250px] sticky left-0 bg-card">Student Name</TableHead>
                                                    {last5Weekdays.map(day => (
                                                        <TableHead key={day} className="text-center">
                                                            {new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {students.map(student => {
                                                    return (
                                                        <TableRow key={student.studentId}>
                                                            <TableCell className="font-medium sticky left-0 bg-card">{student.name}</TableCell>
                                                            {last5Weekdays.map(day => {
                                                                const attendanceRecord = student.attendance?.find(a => a.date === day);
                                                                const isAttended = !!attendanceRecord?.attended;
                                                                const key = `${student.studentId}-${day}`;
                                                                const studentIsSubmitting = isAttendanceSubmitting[key];
                                                                return (
                                                                    <TableCell key={day} className="text-center">
                                                                        {studentIsSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
                                                                        <Checkbox
                                                                            id={`att-${key}`}
                                                                            checked={isAttended}
                                                                            onCheckedChange={(checked) => handleToggleAttendance(student.studentId, day, !!checked)}
                                                                            className="h-5 w-5 mx-auto"
                                                                        />}
                                                                    </TableCell>
                                                                )
                                                            })}
                                                        </TableRow>
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="homework" className="mt-6">
                        <div className="grid md:grid-cols-2 gap-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assign New Homework</CardTitle>
                                    <CardDescription>Create a new homework assignment for your class.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleAddHomework}>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="hw-title">Title</Label>
                                            <Input id="hw-title" placeholder="e.g. Mathematics Chapter 3" value={homeworkForm.title} onChange={e => setHomeworkForm({...homeworkForm, title: e.target.value})} required disabled={isSubmitting}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hw-desc">Description</Label>
                                            <Textarea id="hw-desc" placeholder="e.g. Complete exercises 1 to 10 on page 45." value={homeworkForm.description} onChange={e => setHomeworkForm({...homeworkForm, description: e.target.value})} required disabled={isSubmitting}/>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="hw-due">Due Date</Label>
                                            <Input id="hw-due" type="date" value={homeworkForm.dueDate} onChange={e => setHomeworkForm({...homeworkForm, dueDate: e.target.value})} required disabled={isSubmitting}/>
                                        </div>
                                    </CardContent>
                                    <div className="p-6 pt-0">
                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                            {isSubmitting ? <><Loader2 className="animate-spin" /> Assigning...</> : <><PlusCircle className="mr-2 h-4 w-4"/>Assign Homework</>}
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Assigned Homework</CardTitle>
                                    <CardDescription>A list of homework you have assigned.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? <Skeleton className="h-40 w-full" /> :
                                    homework.length === 0 ? (
                                        <div className="text-center py-12 px-4 text-muted-foreground">
                                            <BookCopy className="mx-auto h-12 w-12" />
                                            <p className="mt-4">No homework assigned yet.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                                            {homework.map(hw => (
                                                <div key={hw.id} className="p-4 border rounded-lg grid grid-cols-[1fr_auto] gap-4">
                                                    <div>
                                                        <p className="font-semibold">{hw.title}</p>
                                                        <p className="text-sm text-muted-foreground">{hw.description}</p>
                                                        <p className="text-xs text-primary font-medium mt-2">Due by: {new Date(hw.dueDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                                    </div>
                                                    <div className="flex items-center">
                                                         <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteHomework(hw)} disabled={isSubmitting}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>

            <AlertDialog open={!!homeworkToDelete} onOpenChange={(isOpen) => !isOpen && setHomeworkToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the homework assignment "{homeworkToDelete?.title}". This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteHomework} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
