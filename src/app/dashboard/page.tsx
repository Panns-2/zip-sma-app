

'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/header';
import StudentProfile from '@/components/student-profile';
import GeneralFeesCard from '@/components/fees-section';
import FeedingFeesCard from '@/components/overall-summary';
import ContactBar from '@/components/contact-bar';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageCircle, Frown, Loader2, Megaphone, CalendarDays, CalendarIcon, RefreshCw, Notebook, BookCopy, PartyPopper, Pin, Bus, Bot, Sparkles, GraduationCap, HelpCircle, FileText, Copy, FileQuestion, CheckCircle, XCircle, Landmark, Info, Smartphone } from 'lucide-react';
import PaymentHistoryCard from '@/components/payment-history-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Student, getStudentById, Announcement, getAnnouncementsForStudent, CalendarEvent, getCalendarEvents, Homework, getHomeworkForClass, School, getSchoolDetails, signOutUser } from '@/lib/data-store';
import { explainConcept, summarizeTopic, generateQuiz, QuizQuestion, ExplainConceptInput } from '@/ai/flows/student-assistant-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { AttendanceCard } from '@/components/attendance-card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useFirebase } from '@/firebase/client-provider';


const FeeRow = ({ label, value, className, currency = 'GH¢' }: { label: string, value: number, className?: string, currency?: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn("font-semibold text-base", className)}>{currency}{value.toFixed(2)}</span>
  </div>
);

const GeneratedContentDisplay = ({ content, title }: { content: string, title: string }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        toast({ title: "Copied to Clipboard!" });
    }
    return (
        <div className="mt-6 p-4 border bg-background rounded-lg animate-in fade-in-50">
            <h4 className="font-semibold mb-2 flex justify-between items-center text-lg text-primary">
                {title}
                <div>
                     <Button variant="ghost" size="sm" onClick={handleCopy}><Copy className="w-4 h-4 mr-2" /> Copy</Button>
                </div>
            </h4>
            <div className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-ul:text-foreground prose-ol:text-foreground prose-strong:text-foreground prose-headings:text-primary">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    );
};


function DashboardContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { auth, db } = useFirebase();
    const studentId = searchParams.get('id');
    const schoolId = searchParams.get('schoolId');

    const [studentData, setStudentData] = useState<Student | null>(null);
    const [schoolDetails, setSchoolDetails] = useState<School | null>(null);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [homework, setHomework] = useState<Homework[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [notFound, setNotFound] = useState(false);
    
    // AI Assistant State
    const [activeTool, setActiveTool] = useState<any | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const [homeworkHelperInput, setHomeworkHelperInput] = useState({ question: '' });
    const [generatedExplanation, setGeneratedExplanation] = useState('');

    const [revisionInput, setRevisionInput] = useState({ topic: '' });
    const [generatedSummary, setGeneratedSummary] = useState('');

    const [quizGeneratorInput, setQuizGeneratorInput] = useState({ topic: '' });
    const [generatedQuiz, setGeneratedQuiz] = useState<any[]>([]);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showAnswers, setShowAnswers] = useState(false);
    
    const handleLogout = () => {
        if(auth) {
            signOutUser(auth);
        }
        router.push('/');
        toast({ title: 'Session Expired', description: 'You have been logged out due to inactivity.' });
    };

    useIdleTimeout({ onIdle: handleLogout, timeout: 1000 * 60 * 15 }); // 15 minutes

    const fetchAllData = async (isRefresh = false) => {
        if (studentId && schoolId && db) {
            if (isRefresh) {
                setIsRefreshing(true);
            } else {
                setIsLoading(true);
            }
            setNotFound(false);
            try {
                const [student, school] = await Promise.all([
                    getStudentById(db, schoolId, studentId),
                    getSchoolDetails(db, schoolId)
                ]);

                if (student) {
                    const [announcementsData, events, homeworkData] = await Promise.all([
                        getAnnouncementsForStudent(db, schoolId, studentId),
                        getCalendarEvents(db, schoolId),
                        getHomeworkForClass(db, schoolId, student.className),
                    ]);
                    setStudentData(student);
                    setSchoolDetails(school);
                    setAnnouncements(announcementsData);
                    setCalendarEvents(events);
                    setHomework(homeworkData);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setNotFound(true);
            } finally {
                if (isRefresh) {
                    setIsRefreshing(false);
                } else {
                    setIsLoading(false);
                }
            }
        } else {
            setNotFound(true);
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if(db) {
           fetchAllData();
        }
    }, [studentId, schoolId, db]);

    const generalFeeTotals = useMemo(() => {
        if (!studentData) return { billed: 0, paid: 0, balance: 0 };
        const billed = (studentData.generalFees || []).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
        const paid = (studentData.generalPayments || []).reduce((sum, p) => sum + p.amount, 0);
        return { billed, paid, balance: billed - paid };
    }, [studentData]);

    const feedingFeeTotals = useMemo(() => {
        if (!studentData) return { paid: 0, deducted: 0, balance: 0, arrears: 0 };
        const paid = (studentData.feedingFeePayments || []).reduce((sum, p) => sum + p.amount, 0);
        const attendedDays = (studentData.attendance || []).filter(a => a.attended).length;
        const dailyCost = Number(studentData.dailyFeedingCost) || 0;
        const deducted = attendedDays * dailyCost;
        const balance = paid - deducted;
        return { paid, deducted, balance, arrears: balance < 0 ? Math.abs(balance) : 0 };
    }, [studentData]);
    
    const transportationFeeTotals = useMemo(() => {
        if (!studentData) return { billed: 0, paid: 0, balance: 0 };
        const billed = Number(studentData.transportationCost || 0);
        const paid = (studentData.transportationPayments || []).reduce((sum, p) => sum + p.amount, 0);
        return { billed, paid, balance: billed - paid };
    }, [studentData]);

    // AI Assistant handlers
    const handleGenerateExplanation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentData) return;
        setIsGenerating(true);
        setGeneratedExplanation('');
        try {
            const input: ExplainConceptInput = {
                question: homeworkHelperInput.question,
                className: studentData.className,
            };
            const result = await explainConcept(input);
            setGeneratedExplanation(result.explanation);
        } catch (error) {
            toast({ title: "Error", description: "Could not get explanation.", variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateSummary = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedSummary('');
        try {
            const result = await summarizeTopic(revisionInput);
            setGeneratedSummary(result.summary);
        } catch (error) {
            toast({ title: "Error", description: "Could not generate summary.", variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateQuiz = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setGeneratedQuiz([]);
        setUserAnswers({});
        setShowAnswers(false);
        try {
            const result = await generateQuiz(quizGeneratorInput);
            setGeneratedQuiz(result.questions);
        } catch (error) {
            toast({ title: "Error", description: "Could not generate quiz.", variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const resetAndCloseTool = () => {
        setActiveTool(null);
        setGeneratedExplanation('');
        setGeneratedSummary('');
        setGeneratedQuiz([]);
        setHomeworkHelperInput({ question: '' });
        setRevisionInput({ topic: '' });
        setQuizGeneratorInput({ topic: '' });
        setUserAnswers({});
        setShowAnswers(false);
    };

    const assistantTools = [
        {
            id: 'homeworkHelper',
            icon: <HelpCircle />,
            title: 'AI Homework Helper',
            description: 'Get hints and explanations for tough questions.',
            iconColor: 'bg-red-100 text-red-700',
            cardColor: 'bg-[#f3c5c5]'
        },
        {
            id: 'revisionAssistant',
            icon: <FileText />,
            title: 'Smart Revision Assistant',
            description: 'Summarize key lessons to prepare for exams.',
            iconColor: 'bg-green-100 text-green-700',
            cardColor: 'bg-[#f9e1bf]'
        },
        {
            id: 'quizGenerator',
            icon: <FileQuestion />,
            title: 'AI Quiz Generator',
            description: 'Practice short revision quizzes on any topic.',
            iconColor: 'bg-yellow-100 text-yellow-700',
            cardColor: 'bg-[#bff0db]',
        },
    ];

    if (!db) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    if (isLoading) {
        return (
        <div className="min-h-screen bg-background text-foreground font-body">
            <Header userName="Loading..." schoolName="Loading school..."/>
            <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="flex items-center gap-4 bg-card p-4 rounded-lg shadow-sm">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div>
                        <Skeleton className="h-7 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                </div>
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
                </div>
            </main>
        </div>
        );
    }
    
    if (notFound) {
        return (
        <div className="min-h-screen bg-background text-foreground font-body">
            <Header />
            <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
                <Card className="w-full max-w-md">
                    <CardHeader><CardTitle className="flex items-center justify-center gap-2"><Frown className="w-8 h-8 text-destructive"/>Record Not Found</CardTitle></CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">The School ID or Student ID does not match any of our records.</p>
                        <Button onClick={() => window.location.href = '/'} className="mt-6">Back to Login</Button>
                    </CardContent>
                </Card>
            </main>
        </div>
        );
    }

    if (!studentData) {
        return null;
    }

    const homeworkColors = ['bg-yellow-200', 'bg-green-200', 'bg-blue-200', 'bg-pink-200', 'bg-purple-200'];

    return (
        <div className="min-h-screen bg-background text-foreground font-body">
        <Header 
            userName={studentData.name} 
            userIdentifier={`Student ID: ${studentData.studentId}`}
            profilePicture={studentData.profilePicture}
            schoolName={schoolDetails?.name}
            schoolLogoUrl={schoolDetails?.logoUrl}
        />
        <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
            <StudentProfile 
                name={studentData.name} 
                studentClass={studentData.className} 
                studentId={studentData.studentId}
                profilePicture={studentData.profilePicture}
                onRefresh={() => fetchAllData(true)}
                isRefreshing={isRefreshing}
            />
            
             <Tabs defaultValue="fees" className="w-full mt-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                    <TabsTrigger value="fees" className="data-[state=active]:bg-[#900b02] data-[state=active]:text-white">Fees &amp; Attendance</TabsTrigger>
                    <TabsTrigger value="announcements" className="data-[state=active]:bg-[#900b02] data-[state=active]:text-white">Announcements</TabsTrigger>
                    <TabsTrigger value="homework" className="data-[state=active]:bg-[#900b02] data-[state=active]:text-white">Homework</TabsTrigger>
                    <TabsTrigger value="calendar" className="data-[state=active]:bg-[#900b02] data-[state=active]:text-white">Calendar</TabsTrigger>
                    <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-[#900b02] data-[state=active]:text-white">AI Assistant</TabsTrigger>
                </TabsList>

                <TabsContent value="fees" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="space-y-6 flex flex-col lg:col-span-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GeneralFeesCard 
                                    fees={studentData.generalFees || []} 
                                    payments={studentData.generalPayments || []}
                                />
                                <FeedingFeesCard 
                                    dailyCost={studentData.dailyFeedingCost || 0}
                                    totals={feedingFeeTotals}
                                />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <Card className="shadow-md h-full flex flex-col">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-full">
                                            <Bus className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="font-headline">Transportation</CardTitle>
                                            <CardDescription>Transportation fee details</CardDescription>
                                        </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 flex-grow">
                                        <FeeRow label="Assigned Cost" value={transportationFeeTotals.billed} />
                                        <FeeRow label="Amount Paid" value={transportationFeeTotals.paid} className="text-success" />
                                        <FeeRow label="Balance Left" value={transportationFeeTotals.balance} className={transportationFeeTotals.balance > 0 ? "text-destructive" : "text-success"} />
                                    </CardContent>
                                </Card>
                                <AttendanceCard attendance={studentData.attendance || []} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PaymentHistoryCard 
                                    payments={studentData.generalPayments || []}
                                    title="General Payment History"
                                />
                                <PaymentHistoryCard 
                                    payments={studentData.feedingFeePayments || []}
                                    title="Feeding Fee Payment History"
                                />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <PaymentHistoryCard 
                                    payments={studentData.transportationPayments || []}
                                    title="Transportation Payment History"
                                />
                                <Card className="shadow-md bg-yellow-100 text-black">
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-yellow-200 rounded-full"><Landmark className="w-6 h-6 text-yellow-800" /></div>
                                            <div><CardTitle className="font-headline text-black">School Payment Info</CardTitle><CardDescription className="text-neutral-800/80">How to pay school fees</CardDescription></div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {(!schoolDetails?.bankAccounts || schoolDetails.bankAccounts.length === 0) && !schoolDetails?.momoNumber ? (
                                            <div className="text-center py-8 text-muted-foreground"><Info className="mx-auto h-8 w-8" /><p className="mt-2">No payment information has been provided by the school.</p></div>
                                        ) : (
                                            <div className="space-y-4">
                                                {schoolDetails?.momoNumber && (
                                                    <div className="p-3 border border-yellow-300 rounded-lg bg-yellow-50">
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <Smartphone className="w-5 h-5 text-yellow-800"/>
                                                                <p className="font-semibold text-black">Mobile Money (MoMo)</p>
                                                            </div>
                                                            <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(schoolDetails.momoNumber || ''); toast({title: "MoMo number copied!"})}}>
                                                                <Copy className="w-4 h-4 mr-2"/> Copy
                                                            </Button>
                                                        </div>
                                                        <p className="text-lg font-mono text-center pt-2 text-black">{schoolDetails.momoNumber}</p>
                                                        {schoolDetails.momoName && <p className="text-sm text-neutral-800/80 text-center">Name: {schoolDetails.momoName}</p>}
                                                    </div>
                                                )}
                                                {schoolDetails?.bankAccounts && schoolDetails.bankAccounts.map(account => (
                                                    <div key={account.id} className="p-3 border border-yellow-300 rounded-lg bg-yellow-50">
                                                        <p className="font-semibold text-black">{account.bankName}</p>
                                                        <p className="text-sm text-neutral-600">Account Name: {account.accountName}</p>
                                                        <p className="text-sm text-neutral-600">Account Number: {account.accountNumber}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                        <div className="space-y-6 flex flex-col lg:col-span-1">
                            {/* This column is now mostly empty, we can restructure or remove it */}
                        </div>
                    </div>
                </TabsContent>
                
                <TabsContent value="announcements" className="mt-6">
                    <Card className="shadow-md bg-accent/20 border-accent">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Megaphone className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-primary">School Announcements</CardTitle>
                                    <CardDescription>Important messages from the school</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             {announcements.length > 0 ? (
                                <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                                {announcements.map((item, index) => (
                                        <AccordionItem value={`item-${index}`} key={item.id}>
                                            <AccordionTrigger>
                                                <div className="flex flex-col items-start text-left">
                                                    <span className="font-semibold">{item.subject}</span>
                                                    <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="prose prose-sm max-w-none dark:prose-invert prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
                                                <ReactMarkdown>{item.message}</ReactMarkdown>
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                             ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Megaphone className="w-12 h-12 mx-auto" />
                                    <p className="mt-4">No announcements have been posted yet.</p>
                                </div>
                             )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="homework" className="mt-6">
                    <Card className="shadow-md">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <BookCopy className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-primary">My Homework</CardTitle>
                                    <CardDescription>Assignments for {studentData.className}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                        {homework.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {homework.map((hw, index) => (
                                        <div key={hw.id} className={`relative p-4 rounded-lg shadow-md text-gray-800 transform rotate-[-2deg] hover:rotate-0 hover:scale-105 transition-transform ${homeworkColors[index % homeworkColors.length]}`}>
                                            <Pin className="absolute top-2 right-2 w-5 h-5 text-gray-600/70" />
                                            <h3 className="font-bold text-lg mb-2">{hw.title}</h3>
                                            <p className="text-sm mb-3 h-16 overflow-hidden">{hw.description}</p>
                                            <p className="text-xs font-semibold text-primary">Due by: {new Date(hw.dueDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-16 text-green-700 bg-green-50 rounded-lg">
                                    <PartyPopper className="w-16 h-16 mx-auto" />
                                    <h3 className="mt-4 text-xl font-bold">All Caught Up!</h3>
                                    <p className="mt-1">You have no homework right now. Great job!</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="calendar" className="mt-6">
                    <Card className="shadow-md">
                        <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <CalendarDays className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-primary">School Calendar</CardTitle>
                                    <CardDescription>Upcoming term events and holidays</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                        <div className="max-h-96 overflow-y-auto pr-2">
                            {calendarEvents.length > 0 ? (
                                    <div className="space-y-4">
                                        {calendarEvents.map(event => (
                                            <div key={event.id} className="flex items-start gap-4 p-3 rounded-md bg-background">
                                                <div className="flex flex-col items-center justify-center text-center w-16">
                                                    <span className="text-lg font-bold text-primary">{new Date(event.date + "T00:00:00").getDate()}</span>
                                                    <span className="text-sm text-muted-foreground -mt-1">{new Date(event.date + "T00:00:00").toLocaleDateString(undefined, { month: 'short' })}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className='flex justify-between items-start'>
                                                        <p className="font-semibold">{event.title}</p>
                                                        <Badge variant={
                                                            event.type === 'Holiday' ? 'destructive' :
                                                            event.type === 'Exam' ? 'secondary' : 'default'
                                                        }>{event.type}</Badge>
                                                    </div>
                                                    {event.description && <p className="text-sm text-muted-foreground mt-1">{event.description}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <CalendarIcon className="w-12 h-12 mx-auto" />
                                        <p className="mt-4">The school calendar has not been updated yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="ai-assistant" className="mt-6">
                    <Card className="shadow-md">
                         <CardHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-full">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-primary">AI Student Assistant</CardTitle>
                                    <CardDescription>Your personal AI-powered learning companion.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {assistantTools.map(tool => (
                                    <Card 
                                        key={tool.id} 
                                        className={cn(
                                            "group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col",
                                            tool.cardColor
                                        )}
                                        onClick={() => setActiveTool(tool)}
                                    >
                                        <CardHeader className="flex-row items-start gap-4">
                                            <div className={`p-3 rounded-lg ${tool.iconColor}`}>
                                                {tool.icon}
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-lg font-semibold">{tool.title}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            
            <div className="hidden md:flex flex-col items-center mt-12 gap-4">
                <p className="text-muted-foreground">Need help? Contact the school</p>
                <div className="flex flex-wrap justify-center gap-4">
                    <Button asChild><a href={schoolDetails?.schoolPhone ? `tel:${schoolDetails.schoolPhone}` : '#'}><Phone className="mr-2 h-4 w-4" /> Call Us</a></Button>
                    <Button asChild variant="outline"><a href={schoolDetails?.schoolEmail ? `mailto:${schoolDetails.schoolEmail}` : '#'}><Mail className="mr-2 h-4 w-4" /> Email Us</a></Button>
                    <Button asChild><a href={schoolDetails?.schoolPhone ? `https://wa.me/${schoolDetails.schoolPhone.replace(/\D/g, '')}` : '#'} target="_blank" rel="noopener noreferrer"><MessageCircle className="mr-2 h-4 w-4" /> WhatsApp</a></Button>
                </div>
            </div>
        </main>
        <ContactBar schoolPhone={schoolDetails?.schoolPhone} schoolEmail={schoolDetails?.schoolEmail} />

        {/* AI Assistant Dialog */}
        <Dialog open={!!activeTool} onOpenChange={(isOpen) => { if (!isOpen) resetAndCloseTool() }}>
            <DialogContent className="max-w-2xl">
                {activeTool && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-3 text-2xl">
                                <div className={`p-3 rounded-lg ${activeTool.iconColor}`}>
                                    {activeTool.icon}
                                </div>
                                {activeTool.title}
                            </DialogTitle>
                            <DialogDescription className="pt-2">{activeTool.description}</DialogDescription>
                        </DialogHeader>
                        
                        <div className="py-4 max-h-[60vh] overflow-y-auto px-1">
                            {activeTool.id === 'homeworkHelper' && (
                                <form id="homework-helper-form" onSubmit={handleGenerateExplanation} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="question">Question or Concept</Label>
                                        <Textarea 
                                            id="question"
                                            placeholder="e.g., What is photosynthesis? or How do I solve 2x + 5 = 15?"
                                            value={homeworkHelperInput.question}
                                            onChange={e => setHomeworkHelperInput({ ...homeworkHelperInput, question: e.target.value })}
                                            required
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    {isGenerating && <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                                    {generatedExplanation && <GeneratedContentDisplay content={generatedExplanation} title="AI Generated Explanation" />}
                                </form>
                            )}

                            {activeTool.id === 'revisionAssistant' && (
                                <form id="revision-assistant-form" onSubmit={handleGenerateSummary} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="topic">Topic or Subject</Label>
                                        <Input
                                            id="topic"
                                            placeholder="e.g., The Water Cycle, World War II"
                                            value={revisionInput.topic}
                                            onChange={e => setRevisionInput({ topic: e.target.value })}
                                            required
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    {isGenerating && <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                                    {generatedSummary && <GeneratedContentDisplay content={generatedSummary} title="AI Generated Summary" />}
                                </form>
                            )}

                            {activeTool.id === 'quizGenerator' && (
                                <form id="quiz-generator-form" onSubmit={handleGenerateQuiz} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="quiz-topic">Topic or Subject</Label>
                                        <Input
                                            id="quiz-topic"
                                            placeholder="e.g., The Solar System, Fractions"
                                            value={quizGeneratorInput.topic}
                                            onChange={e => setQuizGeneratorInput({ topic: e.target.value })}
                                            required
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    {isGenerating && <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
                                    
                                    {generatedQuiz.length > 0 && (
                                        <div className="mt-6 space-y-6">
                                            <h4 className="font-semibold text-lg text-primary">Generated Quiz on: {quizGeneratorInput.topic}</h4>
                                            {generatedQuiz.map((q, qIndex) => (
                                                <div key={qIndex} className="p-4 border rounded-lg bg-background/50">
                                                    <p className="font-medium mb-4">{qIndex + 1}. {q.question}</p>
                                                    <div className="space-y-2">
                                                        {q.options.map((option, oIndex) => {
                                                            const isSelected = userAnswers[qIndex] === option;
                                                            const isCorrect = q.answer === option;
                                                            return (
                                                                <Button
                                                                    key={oIndex}
                                                                    type="button"
                                                                    variant={showAnswers ? (isCorrect ? 'default' : (isSelected ? 'destructive' : 'outline')) : (isSelected ? 'secondary' : 'outline')}
                                                                    className={cn("w-full justify-start h-auto py-2 px-3 text-wrap", {
                                                                        'bg-green-100 border-green-400 text-green-800 hover:bg-green-200': showAnswers && isCorrect,
                                                                        'bg-red-100 border-red-400 text-red-800 hover:bg-red-200': showAnswers && !isCorrect && isSelected,
                                                                    })}
                                                                    onClick={() => !showAnswers && setUserAnswers(prev => ({...prev, [qIndex]: option}))}
                                                                >
                                                                    {showAnswers && (isCorrect ? <CheckCircle className="mr-2"/> : (isSelected ? <XCircle className="mr-2"/> : <div className="w-6 h-4 mr-2"/>))}
                                                                    {option}
                                                                </Button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                            <Button type="button" onClick={() => setShowAnswers(true)} disabled={showAnswers || Object.keys(userAnswers).length !== generatedQuiz.length}>Check Answers</Button>
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={resetAndCloseTool} disabled={isGenerating}>Cancel</Button>
                            <Button 
                                type="submit" 
                                form={activeTool.id === 'homeworkHelper' ? 'homework-helper-form' : activeTool.id === 'revisionAssistant' ? 'revision-assistant-form' : 'quiz-generator-form'}
                                disabled={isGenerating}
                            >
                                {isGenerating ? <><Loader2 className="animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen w-full flex items-center justify-center bg-background">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    )
}

    
