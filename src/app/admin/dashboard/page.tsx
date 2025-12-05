

'use client';

import { useState, useMemo, useEffect, useCallback, forwardRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LogOut, MoreHorizontal, Edit, Trash2, PlusCircle, XCircle, Wallet, FileText, Landmark, Send, UtensilsCrossed, BookCopy, CalendarDays, Upload, Loader2, UserPlus, Search, Users, Receipt, AlertCircle as AlertCircleIcon, Banknote, CheckCheck, ShieldCheck, TrendingDown, Package, FilePlus, HandCoins, Notebook, Phone, Mail, UserCircle, Home, HeartPulse, ShieldAlert, School as SchoolIcon, Eye, EyeOff, DatabaseZap, Bus, DollarSign, Settings, Archive, ArchiveRestore } from 'lucide-react';
import { ZipSMALogo } from '@/components/zipsma-logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { getStudents, addStudent, deleteStudent, updateStudentDetails, updateGeneralFees, addGeneralPayment, deleteGeneralPayment, updateDailyCost, addFeedingPayment, deleteFeedingPayment, setAttendance, Student, FeeItem, PaymentItem, signOutUser, updateStudentId, sendAnnouncement, CalendarEvent, getCalendarEvents, addCalendarEvent, deleteCalendarEvent, StaffId, getStaffIds, addStaffId, deleteStaffId, Expenditure, getExpenditures, addExpenditure, deleteExpenditure, Debt, getDebts, addDebt, deleteDebt, updateTransportationCost, addTransportationPayment, deleteTransportationPayment, getStaffDetails, StaffDetails, updateStaffSalary, School, getSchoolDetails, updateSchoolDetails, archiveStudent, archiveStaff, BankAccount } from '@/lib/data-store';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import FirebaseConfigError from '@/components/firebase-config-error';
import { Badge } from '@/components/ui/badge';
import { useIdleTimeout } from '@/hooks/use-idle-timeout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useFirebase } from '@/firebase/client-provider';


const defaultAddStudentForm = {
    studentId: '',
    name: '',
    className: '',
    dateOfBirth: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    parentName: '',
    parentPhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: ''
};
const defaultEditStudentForm: Omit<Student, 'dateAdded' | 'generalFees' | 'generalPayments' | 'dailyFeedingCost' | 'feedingFeePayments' | 'attendance' | 'transportationCost' | 'transportationPayments' | 'isArchived'> = {
    studentId: '',
    name: '',
    className: '',
    profilePicture: '',
    schoolId: '',
    dateOfBirth: '',
    gender: 'Male',
    parentName: '',
    parentPhone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    medicalNotes: ''
};

const defaultPaymentForm = { amount: '', notes: '', date: new Date().toISOString().split('T')[0] };
const defaultCommunicationForm = { recipient: 'all', subject: '', message: '' };
const defaultCalendarEventForm = { title: '', date: '', type: 'Event' as 'Event' | 'Holiday' | 'Exam', description: '' };
const defaultAddStaffForm = { id: '', name: '', className: '' };
const defaultExpenditureForm = { description: '', category: '', amount: '', date: new Date().toISOString().split('T')[0], type: 'General' as 'General' | 'Feeding' | 'Transportation' };
const defaultDebtForm = { creditor: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] };
const defaultSchoolSettingsForm = { name: '', schoolPhone: '', schoolEmail: '', momoNumber: '', momoName: '', bankAccounts: [] as BankAccount[] };

const generalExpenditureCategories = ["Salaries", "Utilities (Water, Electricity)", "Rent/Mortgage", "Loan Repayment", "Taxes & Levies", "School Supplies (Stationery, etc.)", "Maintenance & Repairs", "Marketing & Advertising", "Technology (Software, Internet)", "Savings to Bank", "Other"];
const feedingExpenditureCategories = ["Food & Catering", "Kitchen Staff Salaries", "Utensils & Equipment", "Other"];
const transportationExpenditureCategories = ["Fuel", "Vehicle Maintenance", "Driver Salaries", "Loan Repayment", "Other"];


// This is a valid child for TooltipTrigger with asChild
const StudentInfoTrigger = forwardRef<HTMLDivElement, { student: Student, onClick: () => void }>(function StudentInfoTrigger({ student, onClick, ...props }, ref) {
    return (
        <div
            ref={ref}
            className="group cursor-pointer"
            onClick={onClick}
            {...props}
        >
            <p className="font-medium text-left transition-transform origin-left group-hover:scale-105">{student.name}</p>
            <p className="text-sm text-muted-foreground transition-transform origin-left group-hover:scale-105">{student.studentId}</p>
        </div>
    );
});


function AdminDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    const { auth, db, storage } = useFirebase();

    const schoolId = searchParams.get('schoolId');

    const [students, setStudents] = useState<Student[]>([]);
    const [archivedStudents, setArchivedStudents] = useState<Student[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
    const [staffIds, setStaffIds] = useState<StaffId[]>([]);
    const [archivedStaff, setArchivedStaff] = useState<StaffId[]>([]);
    const [staffDetails, setStaffDetails] = useState<StaffDetails[]>([]);
    const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [schoolDetails, setSchoolDetails] = useState<School | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAttendanceSubmitting, setIsAttendanceSubmitting] = useState<{[key: string]: boolean}>({});
    const [activeTab, setActiveTab] = useState('dashboard');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

    const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
    const [staffToDelete, setStaffToDelete] = useState<StaffId | null>(null);
    const [studentToArchive, setStudentToArchive] = useState<Student | null>(null);
    const [staffToArchive, setStaffToArchive] = useState<StaffId | null>(null);
    const [paymentToDelete, setPaymentToDelete] = useState<{type: 'general' | 'feeding' | 'transportation', payment: PaymentItem} | null>(null);
    const [eventToDelete, setEventToDelete] = useState<CalendarEvent | null>(null);
    const [expenditureToDelete, setExpenditureToDelete] = useState<Expenditure | null>(null);
    const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

    const [isAddStudentDialogOpen, setIsAddStudentDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [isSalaryDialogOpen, setIsSalaryDialogOpen] = useState(false);
    const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<Student | null>(null);
    const [selectedStudentForView, setSelectedStudentForView] = useState<Student | null>(null);
    const [selectedStaffForSalary, setSelectedStaffForSalary] = useState<StaffId | null>(null);

    const [addStudentForm, setAddStudentForm] = useState(defaultAddStudentForm);
    const [addStaffForm, setAddStaffForm] = useState(defaultAddStaffForm);
    const [editStudentForm, setEditStudentForm] = useState(defaultEditStudentForm);
    const [generalFeeForm, setGeneralFeeForm] = useState<FeeItem[]>([]);
    const [generalPaymentForm, setGeneralPaymentForm] = useState(defaultPaymentForm);
    const [feedingPaymentForm, setFeedingPaymentForm] = useState(defaultPaymentForm);
    const [transportationPaymentForm, setTransportationPaymentForm] = useState(defaultPaymentForm);
    const [dailyCostInput, setDailyCostInput] = useState<number | string>('');
    const [transportationCostInput, setTransportationCostInput] = useState<number | string>('');
    const [communicationForm, setCommunicationForm] = useState(defaultCommunicationForm);
    const [calendarEventForm, setCalendarEventForm] = useState(defaultCalendarEventForm);
    const [expenditureForm, setExpenditureForm] = useState(defaultExpenditureForm);
    const [debtForm, setDebtForm] = useState(defaultDebtForm);
    const [salaryForm, setSalaryForm] = useState<{ amount: number | string }>({ amount: '' });
    const [schoolSettingsForm, setSchoolSettingsForm] = useState(defaultSchoolSettingsForm);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [selectedAttendanceDate, setSelectedAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const selectedAttendanceDateFormatted = useMemo(() => new Date(selectedAttendanceDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }), [selectedAttendanceDate]);

    const handleLogout = async () => {
        await signOutUser(auth);
        router.push('/');
        toast({ title: 'Logged Out', description: 'You have been logged out.' });
    };

    useIdleTimeout({ onIdle: handleLogout, timeout: 1000 * 60 * 15 }); // 15 minutes

    const fetchAdminData = useCallback(async () => {
        if (!db || !schoolId) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [allStudents, allEvents, allStaff, allStaffDetails, allExpenditures, allDebts, schoolData] = await Promise.all([
                getStudents(db, schoolId, true), // Fetch all students (active and archived)
                getCalendarEvents(db, schoolId),
                getStaffIds(db, schoolId, true), // Fetch all staff
                getStaffDetails(db, schoolId),
                getExpenditures(db, schoolId),
                getDebts(db, schoolId),
                getSchoolDetails(db, schoolId)
            ]);

            const activeStudents = allStudents.filter(s => !s.isArchived);
            const archivedStudentsData = allStudents.filter(s => s.isArchived);
            const activeStaff = allStaff.filter(s => !s.isArchived).sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());
            const archivedStaffData = allStaff.filter(s => s.isArchived).sort((a, b) => b.dateAdded.getTime() - a.dateAdded.getTime());;

            setStudents(activeStudents);
            setArchivedStudents(archivedStudentsData);
            setCalendarEvents(allEvents);
            setStaffIds(activeStaff);
            setArchivedStaff(archivedStaffData);
            setStaffDetails(allStaffDetails);
            setExpenditures(allExpenditures);
            setDebts(allDebts);
            setSchoolDetails(schoolData);

            if (schoolData) {
                setSchoolSettingsForm({ 
                    name: schoolData.name || '', 
                    schoolPhone: schoolData.schoolPhone || '',
                    schoolEmail: schoolData.schoolEmail || '',
                    momoNumber: schoolData.momoNumber || '',
                    momoName: schoolData.momoName || '',
                    bankAccounts: schoolData.bankAccounts || [] 
                });
                setLogoPreview(schoolData.logoUrl);
            }

            // This logic runs after data is successfully fetched
            if (activeStudents.length > 0) {
                 const stillExists = activeStudents.some(s => s.studentId === selectedStudentId);
                // If no student is selected or the previously selected one is gone, select the first one.
                if (!selectedStudentId || !stillExists) {
                    setSelectedStudentId(activeStudents[0].studentId);
                }
            } else {
                setSelectedStudentId(null);
            }

        } catch (error: any) {
            console.error("Failed to fetch admin data:", error);
            // Re-throw the error if it contains the index creation link
            if (error.message && error.message.includes('https://console.firebase.google.com/v1/r/project/')) {
                throw error;
            }
            toast({ title: "Data Loading Error", description: "Could not fetch dashboard data. If this persists, required database indexes may be missing.", variant: "destructive", duration: 10000 });
        } finally {
            setIsLoading(false);
        }
    }, [db, schoolId, toast, selectedStudentId]); // dependency on selectedStudentId removed to prevent re-fetching when it changes internally

    useEffect(() => {
        if(db && schoolId) {
            fetchAdminData();
        }
    }, [db, schoolId, fetchAdminData]); // Trigger the fetch on initial mount and when schoolId changes via fetchAdminData dependency.

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return students;
        return students.filter(student =>
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [students, searchQuery]);

    const selectedStudent = useMemo(() => students.find(s => s.studentId === selectedStudentId) || null, [selectedStudentId, students]);

    const studentsByClass = useMemo(() => {
        return students.reduce((acc, student) => {
            const className = student.className?.trim() || 'Unassigned';
            if (!acc[className]) {
                acc[className] = [];
            }
            acc[className].push(student);
            return acc;
        }, {} as Record<string, Student[]>);
    }, [students]);

    const uniqueClassNames = useMemo(() => {
        const classNames = new Set(students.map(s => s.className).filter(Boolean));
        return Array.from(classNames).sort();
    }, [students]);


    useEffect(() => {
        if (selectedStudent) {
            setGeneralFeeForm(selectedStudent.generalFees || []);
            setDailyCostInput(selectedStudent.dailyFeedingCost);
            setTransportationCostInput(selectedStudent.transportationCost || '');
        } else {
            setGeneralFeeForm([]);
            setDailyCostInput('');
            setTransportationCostInput('');
        }
    }, [selectedStudent]);

    const handleSelectStudentForFeeds = (studentId: string) => {
        setSelectedStudentId(studentId);
        setActiveTab('fees');
    }

    const handleArchiveStudent = (student: Student) => setStudentToArchive(student);
    const confirmArchiveStudent = async () => {
        if (studentToArchive) {
            setIsSubmitting(true);
            try {
                await archiveStudent(db, auth, studentToArchive.studentId, true);
                await fetchAdminData();
                toast({ title: "Student Archived", description: `${studentToArchive.name} has been moved to the archive.`, variant: 'destructive'});
            } catch (error) {
                toast({ title: "Error", description: "Failed to archive student.", variant: 'destructive'});
            } finally {
                setStudentToArchive(null);
                setIsSubmitting(false);
            }
        }
    };
    
    const handleRestoreStudent = async (studentId: string) => {
        setIsSubmitting(true);
        try {
            await archiveStudent(db, auth, studentId, false);
            await fetchAdminData();
            toast({ title: "Student Restored", description: `The student has been restored to the active list.`});
        } catch (error) {
            toast({ title: "Error", description: "Failed to restore student.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStudent = (student: Student) => setStudentToDelete(student);
    const confirmDeleteStudent = async () => {
        if (studentToDelete) {
            setIsSubmitting(true);
            try {
                await deleteStudent(db, storage, auth, studentToDelete.studentId);
                await fetchAdminData();
                toast({ title: "Student Deleted Permanently", description: `${studentToDelete.name} has been removed.`, variant: 'destructive'});
            } catch (error) {
                toast({ title: "Error", description: "Failed to delete student.", variant: 'destructive'});
            } finally {
                setStudentToDelete(null);
                setIsSubmitting(false);
            }
        }
    }
    
    const handleArchiveStaff = (staff: StaffId) => setStaffToArchive(staff);
    const confirmArchiveStaff = async () => {
        if (staffToArchive) {
            setIsSubmitting(true);
            try {
                await archiveStaff(db, auth, staffToArchive.id, true);
                await fetchAdminData();
                toast({ title: "Staff Archived", description: `${staffToArchive.name} has been moved to the archive.`, variant: 'destructive'});
            } catch (error) {
                toast({ title: "Error", description: "Failed to archive staff.", variant: 'destructive'});
            } finally {
                setStaffToArchive(null);
                setIsSubmitting(false);
            }
        }
    };

    const handleRestoreStaff = async (staffId: string) => {
        setIsSubmitting(true);
        try {
            await archiveStaff(db, auth, staffId, false);
            await fetchAdminData();
            toast({ title: "Staff Restored", description: `Staff ID ${staffId} has been restored.`});
        } catch (error) {
            toast({ title: "Error", description: "Failed to restore staff.", variant: 'destructive'});
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteStaff = (staff: StaffId) => setStaffToDelete(staff);
    const confirmDeleteStaff = async () => {
        if (staffToDelete) {
            setIsSubmitting(true);
            try {
                await deleteStaffId(db, auth, staffToDelete.id);
                await fetchAdminData();
                toast({ title: "Staff Deleted Permanently", description: `Staff ID ${staffToDelete.id} has been revoked.`, variant: 'destructive'});
            } catch(error) {
                toast({ title: "Error", description: "Could not delete Staff ID.", variant: 'destructive' });
            } finally {
                setStaffToDelete(null);
                setIsSubmitting(false);
            }
        }
    }


    const handleDeletePayment = (payment: PaymentItem, type: 'general' | 'feeding' | 'transportation') => setPaymentToDelete({payment, type});
    const confirmDeletePayment = async () => {
        if (paymentToDelete && selectedStudentId) {
            setIsSubmitting(true);
            try {
                if (paymentToDelete.type === 'general') {
                    await deleteGeneralPayment(db, auth, selectedStudentId, paymentToDelete.payment.id);
                } else if (paymentToDelete.type === 'feeding') {
                    await deleteFeedingPayment(db, auth, selectedStudentId, paymentToDelete.payment.id);
                } else if (paymentToDelete.type === 'transportation') {
                    await deleteTransportationPayment(db, auth, selectedStudentId, paymentToDelete.payment.id);
                }
                await fetchAdminData();
                toast({ title: "Payment Deleted", description: `The payment record has been removed.`, variant: 'destructive'});
            } catch(error) {
                 toast({ title: "Error", description: "Failed to delete payment.", variant: 'destructive'});
            } finally {
                setPaymentToDelete(null);
                setIsSubmitting(false);
            }
        }
    }
    
    const handleDeleteExpenditure = (expenditure: Expenditure) => setExpenditureToDelete(expenditure);
    const confirmDeleteExpenditure = async () => {
        if (expenditureToDelete) {
            setIsSubmitting(true);
            try {
                await deleteExpenditure(db, auth, expenditureToDelete.id);
                toast({ title: "Expenditure Deleted", description: `The expenditure record has been removed.`, variant: 'destructive'});
                await fetchAdminData();
            } catch (error) {
                toast({ title: "Error", description: "Could not delete expenditure.", variant: 'destructive' });
            } finally {
                setExpenditureToDelete(null);
                setIsSubmitting(false);
            }
        }
    }

    const handleDeleteDebt = (debt: Debt) => setDebtToDelete(debt);
    const confirmDeleteDebt = async () => {
        if (debtToDelete) {
            setIsSubmitting(true);
            try {
                await deleteDebt(db, auth, debtToDelete.id);
                toast({ title: "Debt Deleted", description: `The debt record has been removed.`, variant: 'destructive'});
                await fetchAdminData();
            } catch (error) {
                toast({ title: "Error", description: "Could not delete debt.", variant: 'destructive' });
            } finally {
                setDebtToDelete(null);
                setIsSubmitting(false);
            }
        }
    }

    const handleOpenEditDialog = (student: Student) => {
        setSelectedStudentForEdit(student);
        const studentToEdit = {
            studentId: student.studentId,
            name: student.name || '',
            className: student.className || '',
            profilePicture: student.profilePicture || '',
            schoolId: student.schoolId || '',
            dateOfBirth: student.dateOfBirth || '',
            gender: student.gender || 'Male',
            parentName: student.parentName || '',
            parentPhone: student.parentPhone || '',
            address: student.address || '',
            emergencyContactName: student.emergencyContactName || '',
            emergencyContactPhone: student.emergencyContactPhone || '',
            medicalNotes: student.medicalNotes || ''
        }
        setEditStudentForm(studentToEdit as any);
        setPhotoPreview(student.profilePicture);
        setPhotoFile(null);
        setIsEditDialogOpen(true);
    };

    const handleOpenViewDialog = (student: Student) => {
        setSelectedStudentForView(student);
        setIsViewDialogOpen(true);
    };
    
    const handleOpenSalaryDialog = (staff: StaffId) => {
        const details = staffDetails.find(d => d.id === staff.id);
        setSelectedStaffForSalary(staff);
        setSalaryForm({ amount: details?.salary || '' });
        setIsSalaryDialogOpen(true);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };
    
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForEdit) return;

        setIsSubmitting(true);
        try {
            const { studentId, profilePicture, ...detailsToUpdate } = editStudentForm;
            const upperCaseStudentId = studentId.trim().toUpperCase();
            const studentIdChanged = selectedStudentForEdit.studentId !== upperCaseStudentId;

            if (studentIdChanged) {
                 await updateStudentId(db, auth, selectedStudentForEdit.studentId, upperCaseStudentId);
            }
            
            await updateStudentDetails(db, storage, auth, upperCaseStudentId, detailsToUpdate, photoFile);

            await fetchAdminData();
            if (studentIdChanged) {
                setSelectedStudentId(upperCaseStudentId);
            }
            toast({ title: "Success", description: "Student information updated." });
            setIsEditDialogOpen(false);
            setSelectedStudentForEdit(null);
            setPhotoPreview(null);
            setPhotoFile(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not update student details.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            const studentData = {
                ...addStudentForm,
                schoolId: schoolId.toUpperCase(),
                studentId: addStudentForm.studentId.trim().toUpperCase()
            };
            await addStudent(db, auth, schoolId, studentData as any);
            await fetchAdminData();
            toast({ title: "Success", description: `${addStudentForm.name} has been added.` });
            setAddStudentForm(defaultAddStudentForm);
            setIsAddStudentDialogOpen(false);
            setActiveTab('students');
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            if (!addStaffForm.name) {
                toast({ title: "Error", description: "Staff Name is required.", variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }
            const staffId = addStaffForm.id.trim() || undefined;
            const className = addStaffForm.className === 'none' ? undefined : addStaffForm.className;

            await addStaffId(db, auth, schoolId, addStaffForm.name, staffId, className);
            await fetchAdminData();
            toast({ title: "Success", description: `Staff ${addStaffForm.name} has been added.` });
            setAddStaffForm(defaultAddStaffForm);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleSalarySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStaffForSalary || !schoolId) return;
        setIsSubmitting(true);
        try {
            await updateStaffSalary(db, auth, schoolId, selectedStaffForSalary.id, Number(salaryForm.amount));
            await fetchAdminData();
            toast({ title: "Success", description: `Salary updated for ${selectedStaffForSalary.name}.` });
            setIsSalaryDialogOpen(false);
            setSelectedStaffForSalary(null);
        } catch (error: any) {
             toast({ title: "Error", description: error.message || "Could not update salary.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSaveSchoolSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            const { name, schoolPhone, schoolEmail, momoNumber, momoName, bankAccounts } = schoolSettingsForm;
            await updateSchoolDetails(db, storage, auth, schoolId, { name, schoolPhone, schoolEmail, momoNumber, momoName, bankAccounts }, logoFile);
            await fetchAdminData();
            toast({ title: "Success", description: "School settings have been updated." });
            setLogoFile(null);
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Could not update school settings.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleGeneralFeeChange = (index: number, field: 'item' | 'amount', value: string) => {
        const newFees = [...generalFeeForm];
        const amount = field === 'amount' ? Number(value) : newFees[index].amount;
        const item = field === 'item' ? value : newFees[index].item;
        newFees[index] = { ...newFees[index], id: newFees[index]?.id || Date.now(), item, amount };
        setGeneralFeeForm(newFees);
    };
    const addGeneralFeeItem = () => setGeneralFeeForm(prev => [...prev, { id: Date.now(), item: '', amount: 0 }]);
    const removeGeneralFeeItem = (index: number) => setGeneralFeeForm(generalFeeForm.filter((_, i) => i !== index));
    const handleSaveGeneralFees = async () => {
        if (!selectedStudentId) return;
        setIsSubmitting(true);
        const validFees = generalFeeForm
            .filter(f => f.item.trim() !== '' && !isNaN(f.amount))
            .map(f => ({...f, amount: Number(f.amount)}));

        try {
            await updateGeneralFees(db, auth, selectedStudentId, validFees);
            await fetchAdminData();
            toast({ title: "Success", description: "General fee structure updated." });
        } catch (error) {
             toast({ title: "Error", description: "Could not save fees.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddGeneralPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !generalPaymentForm.amount || isNaN(Number(generalPaymentForm.amount))) return;
        setIsSubmitting(true);
        const newPayment = {
            amount: Number(generalPaymentForm.amount),
            date: generalPaymentForm.date,
            notes: generalPaymentForm.notes
        };
        try {
            await addGeneralPayment(db, auth, selectedStudentId, newPayment);
            await fetchAdminData();
            toast({ title: "Success", description: "General payment recorded." });
            setGeneralPaymentForm(defaultPaymentForm);
        } catch (error) {
             toast({ title: "Error", description: "Could not add payment.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateDailyCost = async () => {
        if (!selectedStudentId || isNaN(Number(dailyCostInput))) return;
        setIsSubmitting(true);
        try {
            await updateDailyCost(db, auth, selectedStudentId, Number(dailyCostInput));
            await fetchAdminData();
            toast({ title: "Success", description: "Daily feeding cost updated." });
        } catch (error) {
             toast({ title: "Error", description: "Could not update cost.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddFeedingPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !feedingPaymentForm.amount || isNaN(Number(feedingPaymentForm.amount))) return;
        setIsSubmitting(true);
        const newPayment = {
            amount: Number(feedingPaymentForm.amount),
            date: feedingPaymentForm.date,
            notes: feedingPaymentForm.notes
        };
        try {
            await addFeedingPayment(db, auth, selectedStudentId, newPayment);
            await fetchAdminData();
            toast({ title: "Success", description: "Feeding fee payment recorded." });
            setFeedingPaymentForm(defaultPaymentForm);
        } catch (error) {
             toast({ title: "Error", description: "Could not add payment.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateTransportationCost = async () => {
        if (!selectedStudentId || isNaN(Number(transportationCostInput))) return;
        setIsSubmitting(true);
        try {
            await updateTransportationCost(db, auth, selectedStudentId, Number(transportationCostInput));
            await fetchAdminData();
            toast({ title: "Success", description: "Transportation cost updated." });
        } catch (error) {
             toast({ title: "Error", description: "Could not update cost.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddTransportationPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedStudentId || !transportationPaymentForm.amount || isNaN(Number(transportationPaymentForm.amount))) return;
        setIsSubmitting(true);
        const newPayment = {
            amount: Number(transportationPaymentForm.amount),
            date: transportationPaymentForm.date,
            notes: transportationPaymentForm.notes
        };
        try {
            await addTransportationPayment(db, auth, selectedStudentId, newPayment);
            await fetchAdminData();
            toast({ title: "Success", description: "Transportation payment recorded." });
            setTransportationPaymentForm(defaultPaymentForm);
        } catch (error) {
             toast({ title: "Error", description: "Could not add payment.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleAttendance = async (studentId: string, isChecked: boolean) => {
        setIsAttendanceSubmitting(prev => ({...prev, [studentId]: true}));
        try {
            await setAttendance(db, auth, studentId, selectedAttendanceDate, isChecked);
            setStudents(prevStudents => prevStudents.map(s => {
                if (s.studentId === studentId) {
                    const attendance = s.attendance || [];
                    const recordIndex = attendance.findIndex(a => a.date === selectedAttendanceDate);
                    if (recordIndex > -1) {
                        attendance[recordIndex].attended = isChecked;
                    } else {
                        attendance.push({ id: Date.now(), date: selectedAttendanceDate, attended: isChecked });
                    }
                    return { ...s, attendance };
                }
                return s;
            }));
        } catch (error) {
            toast({ title: "Error", description: "Could not update attendance.", variant: "destructive" });
        } finally {
             setIsAttendanceSubmitting(prev => ({...prev, [studentId]: false}));
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            await sendAnnouncement(db, auth, schoolId, communicationForm);
            toast({ title: "Success", description: "Announcement sent successfully."});
            setCommunicationForm(defaultCommunicationForm);
        } catch (error) {
            console.log(error);
            toast({ title: "Error", description: "Could not send announcement.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddCalendarEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        try {
            await addCalendarEvent(db, auth, schoolId, calendarEventForm);
            toast({ title: "Success", description: "Calendar event added." });
            setCalendarEventForm(defaultCalendarEventForm);
            await fetchAdminData();
        } catch (error) {
            toast({ title: "Error", description: "Could not add calendar event.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteEvent = (event: CalendarEvent) => setEventToDelete(event);
    const confirmDeleteEvent = async () => {
        if (eventToDelete) {
            setIsSubmitting(true);
            try {
                await deleteCalendarEvent(db, auth, eventToDelete.id);
                toast({ title: "Event Deleted", description: `The event "${eventToDelete.title}" has been removed.`, variant: 'destructive'});
                await fetchAdminData();
            } catch (error) {
                toast({ title: "Error", description: "Could not delete event.", variant: 'destructive' });
            } finally {
                setEventToDelete(null);
                setIsSubmitting(false);
            }
        }
    }
    
    const handleAddExpenditure = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        const newExpenditure = {
            description: expenditureForm.description,
            category: expenditureForm.category,
            amount: Number(expenditureForm.amount),
            date: expenditureForm.date,
            type: expenditureForm.type
        };
        try {
            await addExpenditure(db, auth, schoolId, newExpenditure);
            toast({ title: "Success", description: "Expenditure recorded." });
            setExpenditureForm(defaultExpenditureForm);
            await fetchAdminData();
        } catch (error) {
            toast({ title: "Error", description: "Could not add expenditure.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddDebt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!schoolId) return;
        setIsSubmitting(true);
        const newDebt = {
            ...debtForm,
            amount: Number(debtForm.amount)
        };
        try {
            await addDebt(db, auth, schoolId, newDebt);
            toast({ title: "Success", description: "Debt recorded." });
            setDebtForm(defaultDebtForm);
            await fetchAdminData();
        } catch (error) {
            toast({ title: "Error", description: "Could not add debt.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleBankAccountChange = (index: number, field: keyof Omit<BankAccount, 'id'>, value: string) => {
        const updatedAccounts = [...schoolSettingsForm.bankAccounts];
        updatedAccounts[index] = { ...updatedAccounts[index], [field]: value };
        setSchoolSettingsForm(prev => ({ ...prev, bankAccounts: updatedAccounts }));
    };

    const addBankAccount = () => {
        setSchoolSettingsForm(prev => ({
            ...prev,
            bankAccounts: [...prev.bankAccounts, { id: Date.now(), bankName: '', accountName: '', accountNumber: '' }]
        }));
    };

    const removeBankAccount = (index: number) => {
        setSchoolSettingsForm(prev => ({
            ...prev,
            bankAccounts: prev.bankAccounts.filter((_, i) => i !== index)
        }));
    };


    const generalFeeTotals = useMemo(() => {
        if (!selectedStudent) return { billed: 0, paid: 0, balance: 0 };
        const billed = (selectedStudent.generalFees || []).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
        const paid = (selectedStudent.generalPayments || []).reduce((sum, p) => sum + p.amount, 0);
        return { billed, paid, balance: billed - paid };
    }, [selectedStudent]);

    const feedingFeeTotals = useMemo(() => {
        if (!selectedStudent) return { paid: 0, deducted: 0, balance: 0, arrears: 0 };
        const paid = (selectedStudent.feedingFeePayments || []).reduce((sum, p) => sum + p.amount, 0);
        const attendedDays = (selectedStudent.attendance || []).filter(a => a.attended).length;
        const dailyCost = Number(selectedStudent.dailyFeedingCost) || 0;
        const deducted = attendedDays * dailyCost;
        const balance = paid - deducted;
        return { paid, deducted, balance, arrears: balance < 0 ? Math.abs(balance) : 0 };
    }, [selectedStudent]);

    const transportationFeeTotals = useMemo(() => {
        if (!selectedStudent) return { billed: 0, paid: 0, balance: 0 };
        const billed = Number(selectedStudent.transportationCost || 0);
        const paid = (selectedStudent.transportationPayments || []).reduce((sum, p) => sum + p.amount, 0);
        return { billed, paid, balance: billed - paid };
    }, [selectedStudent]);

    const overallTotals = useMemo(() => {
        const result = students.reduce((acc, student) => {
            const generalBilled = (student.generalFees || []).reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
            const generalPaid = (student.generalPayments || []).reduce((sum, p) => sum + p.amount, 0);
            acc.general.billed += generalBilled;
            acc.general.paid += generalPaid;

            const feedingPaid = (student.feedingFeePayments || []).reduce((sum, p) => sum + p.amount, 0);
            const attendedDays = (student.attendance || []).filter(a => a.attended).length;
            const dailyCost = Number(student.dailyFeedingCost || 0);
            const feedingDeducted = attendedDays * dailyCost;
            const feedingBalance = feedingPaid - feedingDeducted;
            
            acc.feeding.paid += feedingPaid;
            acc.feeding.deducted += feedingDeducted;
            
            if (feedingBalance < 0) {
                acc.feeding.arrears += Math.abs(feedingBalance);
            }
            
            const transportationBilled = Number(student.transportationCost || 0);
            const transportationPaid = (student.transportationPayments || []).reduce((sum, p) => sum + p.amount, 0);
            acc.transportation.billed += transportationBilled;
            acc.transportation.paid += transportationPaid;

            return acc;
        }, {
            general: { billed: 0, paid: 0 },
            feeding: { paid: 0, deducted: 0, arrears: 0 },
            transportation: { billed: 0, paid: 0 }
        });

        const totalExpenditure = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
        const totalIncome = result.general.paid + result.feeding.paid + result.transportation.paid;
        const totalDebt = debts.reduce((sum, debt) => sum + debt.amount, 0);

        return {
            ...result,
            totalIncome,
            totalExpenditure,
            netSavings: totalIncome - totalExpenditure,
            totalDebt,
        }

    }, [students, expenditures, debts]);
    
    const chartData = useMemo(() => {
        const incomeVsExpenditure = [
            { name: 'Total Income', value: overallTotals.totalIncome, fill: 'hsl(var(--success))' },
            { name: 'Total Expenditure', value: overallTotals.totalExpenditure, fill: 'hsl(var(--destructive))' },
        ];

        const arrearsByClass = Object.entries(studentsByClass)
            .map(([className, classStudents]) => {
                const totalArrears = classStudents.reduce((sum, student) => {
                    const generalBilled = (student.generalFees || []).reduce((s, f) => s + Number(f.amount || 0), 0);
                    const generalPaid = (student.generalPayments || []).reduce((s, p) => s + p.amount, 0);
                    const generalBalance = generalBilled - generalPaid;

                    const feedingPaid = (student.feedingFeePayments || []).reduce((s, p) => s + p.amount, 0);
                    const attendedDays = (student.attendance || []).filter(a => a.attended).length;
                    const dailyCost = Number(student.dailyFeedingCost) || 0;
                    const feedingDeducted = attendedDays * dailyCost;
                    const feedingBalance = feedingPaid - feedingDeducted;
                    
                    const transportationBilled = Number(student.transportationCost || 0);
                    const transportationPaid = (student.transportationPayments || []).reduce((sum, p) => sum + p.amount, 0);
                    const transportationBalance = transportationBilled - transportationPaid;

                    const studentArrears = (generalBalance > 0 ? generalBalance : 0) + (feedingBalance < 0 ? Math.abs(feedingBalance) : 0) + (transportationBalance > 0 ? transportationBalance : 0);
                    return sum + studentArrears;
                }, 0);
                return { name: className, arrears: totalArrears };
            })
            .filter(c => c.arrears > 0)
            .sort((a,b) => b.arrears - a.arrears);

        return { incomeVsExpenditure, arrearsByClass };
    }, [overallTotals, studentsByClass]);

    const expenditureTotals = useMemo(() => {
        return expenditures.reduce((acc, exp) => {
            acc[exp.type] = (acc[exp.type] || 0) + exp.amount;
            return acc;
        }, {} as Record<'General' | 'Feeding' | 'Transportation', number>);
    }, [expenditures]);

    const incomeTotals = useMemo(() => {
        return {
            General: overallTotals.general.paid,
            Feeding: overallTotals.feeding.paid,
            Transportation: overallTotals.transportation.paid,
        }
    }, [overallTotals]);

    if (!db) {
      return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }
    
    if (!schoolId) {
        return (
             <main className="container mx-auto p-4 md:p-8">
                <Card className="w-full max-w-md mx-auto mt-10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <AlertCircleIcon className="w-6 h-6 text-destructive" /> Invalid Access
                        </CardTitle>
                        <CardDescription>
                            No School ID was provided. Please log in again.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => router.push('/')} className="w-full">
                            Back to Login
                        </Button>
                    </CardContent>
                </Card>
             </main>
        )
    }

    return (
        <TooltipProvider>
        <div className="min-h-screen bg-background text-foreground">
            <header className="bg-card shadow-sm sticky top-0 z-40 border-b">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {schoolDetails?.logoUrl ? (
                            <Avatar className="h-12 w-12">
                                <AvatarImage src={schoolDetails.logoUrl} alt={schoolDetails.name} />
                                <AvatarFallback>{schoolDetails.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        ) : (
                            <ZipSMALogo />
                        )}
                        <div className="flex flex-col">
                            <h1 className="text-xl font-bold text-primary font-headline">{schoolDetails?.name || 'Admin Dashboard'}</h1>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <SchoolIcon className="w-4 h-4"/>
                                <span>{schoolId}</span>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="outline"><LogOut className="mr-2 h-4 w-4" />Logout</Button>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-10 h-auto">
                        <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                        <TabsTrigger value="students">Students</TabsTrigger>
                        <TabsTrigger value="fees">Fees Management</TabsTrigger>
                        <TabsTrigger value="attendance">Attendance</TabsTrigger>
                        <TabsTrigger value="finances">Finances</TabsTrigger>
                        <TabsTrigger value="staff">Manage Staff</TabsTrigger>
                        <TabsTrigger value="calendar">School Calendar</TabsTrigger>
                        <TabsTrigger value="communication">Announcements</TabsTrigger>
                        <TabsTrigger value="archive">Archive</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="dashboard" className="mt-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>School Overview</CardTitle>
                                <CardDescription>A high-level view of school finances and enrollment.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                ) : (
                                    <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{students.length}</div>
                                                <p className="text-xs text-muted-foreground">Currently enrolled</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                                                <Banknote className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-success">GH¢{overallTotals.totalIncome.toFixed(2)}</div>
                                                <p className="text-xs text-muted-foreground">From all fee collections</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Total Expenditure</CardTitle>
                                                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold text-destructive">GH¢{overallTotals.totalExpenditure.toFixed(2)}</div>
                                                <p className="text-xs text-muted-foreground">Total recorded expenses</p>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">Net Savings / Loss</CardTitle>
                                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className={`text-2xl font-bold ${overallTotals.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>GH¢{overallTotals.netSavings.toFixed(2)}</div>
                                                <p className="text-xs text-muted-foreground">Income minus Expenditures</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                        <Card>
                                            <CardHeader><CardTitle>Income vs. Expenditure</CardTitle></CardHeader>
                                            <CardContent>
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={chartData.incomeVsExpenditure} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <ChartTooltip />
                                                        <Bar dataKey="value" name="Amount" />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                        </Card>
                                        <Card>
                                            <CardHeader><CardTitle>Fee Arrears by Class</CardTitle></CardHeader>
                                            <CardContent>
                                            {chartData.arrearsByClass.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={chartData.arrearsByClass} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                        <CartesianGrid strokeDasharray="3 3" />
                                                        <XAxis dataKey="name" />
                                                        <YAxis />
                                                        <ChartTooltip />
                                                        <Bar dataKey="arrears" name="Arrears" fill='hsl(var(--destructive))' />
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                                    <CheckCheck className="w-8 h-8 mr-2" />
                                                    <p>No outstanding fee arrears. Well done!</p>
                                                </div>
                                            )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students" className="mt-6">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Student List</CardTitle>
                                    <CardDescription>A list of all active students currently enrolled.</CardDescription>
                                </div>
                                <Button onClick={() => setIsAddStudentDialogOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Student
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[60px]">Photo</TableHead>
                                                <TableHead>Student</TableHead>
                                                <TableHead>Class Level</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-10 w-10 rounded-full" /></TableCell>
                                                    <TableCell><div className="space-y-2"><Skeleton className="h-4 w-[250px]" /><Skeleton className="h-4 w-[200px]" /></div></TableCell>
                                                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                                    <TableCell className="text-right"><Skeleton className="h-8 w-8" /></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : students.length === 0 ? (
                                    <div className="text-center py-12 px-4">
                                        <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-medium">No Active Students Found</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first student.</p>
                                        <Button className="mt-6" onClick={() => setIsAddStudentDialogOpen(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4" /> Add Student
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="search"
                                                placeholder="Search by name or student ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-8 w-full"
                                            />
                                        </div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-[60px]">Photo</TableHead>
                                                    <TableHead>Student</TableHead>
                                                    <TableHead>Class Level</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredStudents.map((student) => (
                                                    <TableRow key={student.studentId}>
                                                        <TableCell>
                                                            <Avatar>
                                                                <AvatarImage src={student.profilePicture} alt={student.name} data-ai-hint="person portrait" />
                                                                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <StudentInfoTrigger student={student} onClick={() => handleOpenViewDialog(student)} />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Click to view student information</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TableCell>
                                                        <TableCell>{student.className}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleOpenViewDialog(student)}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleOpenEditDialog(student)}><Edit className="mr-2 h-4 w-4" /> Edit Details</DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleSelectStudentForFeeds(student.studentId)}><Wallet className="mr-2 h-4 w-4"/> Manage All Fees</DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleArchiveStudent(student)}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {filteredStudents.length === 0 && (
                                            <div className="text-center py-12 px-4">
                                                <p className="text-muted-foreground">No students match your search.</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="fees" className="mt-6">
                        <Card>
                             <CardHeader>
                                <CardTitle>Fees Management</CardTitle>
                                <CardDescription>Manage General, Feeding, and Transportation fees for a selected student.</CardDescription>
                                <div className="pt-4"><Label>Select Student</Label><Select value={selectedStudentId || ''} onValueChange={setSelectedStudentId}><SelectTrigger><SelectValue placeholder="Select a student" /></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</SelectItem>)}</SelectContent></Select></div>
                            </CardHeader>
                            <CardContent>
                                 {!selectedStudent ? <div className="text-center py-12 text-muted-foreground">Please select a student to manage their fees.</div> : (
                                    <div className="space-y-8">
                                        {/* General Fees Section */}
                                        <Card className="border-border/60">
                                             <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><BookCopy className="w-5 h-5 text-primary"/> General Fees & Payments</CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <Card><CardHeader><CardTitle className='flex items-center gap-2'><FileText className="w-5 h-5"/> Fee Structure</CardTitle></CardHeader>
                                                        <CardContent className="space-y-2">
                                                            {generalFeeForm.map((fee, index) => (
                                                                <div key={fee.id} className="flex items-center gap-2">
                                                                    <Input placeholder="Fee Item (e.g. Books)" value={fee.item} onChange={(e) => handleGeneralFeeChange(index, 'item', e.target.value)} disabled={isSubmitting} />
                                                                    <Input type="number" placeholder="Amount" value={fee.amount} onChange={(e) => handleGeneralFeeChange(index, 'amount', e.target.value)} className="w-32" disabled={isSubmitting} />
                                                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeGeneralFeeItem(index)} className="text-destructive" disabled={isSubmitting}><XCircle className="w-5 h-5" /></Button>
                                                                </div>
                                                            ))}
                                                            <Button type="button" variant="outline" size="sm" onClick={addGeneralFeeItem} className="mt-2" disabled={isSubmitting}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
                                                        </CardContent>
                                                        <DialogFooter className="px-6 pb-4"><Button onClick={handleSaveGeneralFees} disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save General Fees'}</Button></DialogFooter>
                                                    </Card>
                                                    <Card><CardHeader><CardTitle className='flex items-center gap-2'><Landmark className="w-5 h-5"/> Record General Payment</CardTitle></CardHeader>
                                                        <form onSubmit={handleAddGeneralPayment}>
                                                            <CardContent className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><Label htmlFor="gpay-amount">Amount</Label><Input id="gpay-amount" type="number" placeholder="0.00" value={generalPaymentForm.amount} onChange={e => setGeneralPaymentForm({...generalPaymentForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                                                    <div><Label htmlFor="gpay-date">Date</Label><Input id="gpay-date" type="date" value={generalPaymentForm.date} onChange={e => setGeneralPaymentForm({...generalPaymentForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                                                </div>
                                                                <div><Label htmlFor="gpay-notes">Notes</Label><Input id="gpay-notes" placeholder="e.g. For books" value={generalPaymentForm.notes} onChange={e => setGeneralPaymentForm({...generalPaymentForm, notes: e.target.value})} disabled={isSubmitting}/></div>
                                                            </CardContent>
                                                            <DialogFooter className="px-6 pb-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Recording...</> : 'Add Payment'}</Button></DialogFooter>
                                                        </form>
                                                    </Card>
                                                </div>
                                                <div className="space-y-6">
                                                    <Card className="bg-muted/30"><CardHeader><CardTitle className='flex items-center gap-2'><Wallet className="w-5 h-5"/> Financial Summary</CardTitle></CardHeader>
                                                        <CardContent className="space-y-3">
                                                            <div className="flex justify-between text-lg"><span className="text-muted-foreground">Total Billed:</span> <span className="font-semibold">GH¢{generalFeeTotals.billed.toFixed(2)}</span></div>
                                                            <div className="flex justify-between text-lg"><span className="text-muted-foreground">Total Paid:</span> <span className="font-semibold text-success">GH¢{generalFeeTotals.paid.toFixed(2)}</span></div>
                                                            <div className="flex justify-between text-xl font-bold border-t pt-3 mt-2"><span className="text-muted-foreground">Balance:</span> <span className={generalFeeTotals.balance > 0 ? "text-destructive" : "text-success"}>GH¢{generalFeeTotals.balance.toFixed(2)}</span></div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card><CardHeader><CardTitle>General Payment History</CardTitle></CardHeader>
                                                        <CardContent className='p-0'>
                                                            <div className="max-h-60 overflow-y-auto divide-y divide-border">
                                                                {[...(selectedStudent.generalPayments || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0 ? (
                                                                    <p className="text-center text-muted-foreground p-8">No payments yet.</p>
                                                                ) : (
                                                                    [...(selectedStudent.generalPayments || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                                                        <div key={p.id} className="p-4 grid grid-cols-[1fr_auto] items-start gap-x-4">
                                                                            <div>
                                                                                <p className="font-medium text-base">GH¢{p.amount.toFixed(2)}</p>
                                                                                <p className="text-sm text-muted-foreground">{p.date}</p>
                                                                                {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                                                                            </div>
                                                                            <div className="self-center">
                                                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeletePayment(p, 'general')}>
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Feeding Fees Section */}
                                        <Card className="border-border/60">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><UtensilsCrossed className="w-5 h-5 text-primary"/> Feeding Fees & Payments</CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><UtensilsCrossed className="w-5 h-5"/> Feeding Fee Summary</CardTitle></CardHeader>
                                                        <CardContent className="space-y-2">
                                                            <div className="flex items-end gap-2"><Label htmlFor='daily-cost' className="whitespace-nowrap">Daily Cost (GH¢)</Label><Input id='daily-cost' type="number" value={dailyCostInput} onChange={e => setDailyCostInput(e.target.value)} disabled={isSubmitting}/><Button onClick={handleUpdateDailyCost} disabled={isSubmitting}>{isSubmitting ? '...' : 'Set'}</Button></div>
                                                            <div className="flex justify-between text-md pt-2"><span className="text-muted-foreground">Total Paid:</span> <span className="font-semibold text-success">GH¢{feedingFeeTotals.paid.toFixed(2)}</span></div>
                                                            <div className="flex justify-between text-md"><span className="text-muted-foreground">Total Deducted:</span> <span className="font-semibold">GH¢{feedingFeeTotals.deducted.toFixed(2)}</span></div>
                                                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-1"><span className="text-muted-foreground">Balance:</span> <span className={feedingFeeTotals.balance >= 0 ? "text-success" : "text-destructive"}>GH¢{feedingFeeTotals.balance.toFixed(2)}</span></div>
                                                            {feedingFeeTotals.arrears > 0 && <div className="flex justify-between text-lg font-bold text-destructive bg-destructive/10 p-2 rounded-md mt-2"><span className="text-destructive">Arrears:</span> <span>GH¢{feedingFeeTotals.arrears.toFixed(2)}</span></div>}
                                                        </CardContent>
                                                    </Card>
                                                    <Card><CardHeader><CardTitle className='flex items-center gap-2'><Landmark className="w-5 h-5"/> Record Feeding Payment</CardTitle></CardHeader>
                                                        <form onSubmit={handleAddFeedingPayment}>
                                                            <CardContent className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><Label htmlFor="ffpay-amount">Amount</Label><Input id="ffpay-amount" type="number" placeholder="0.00" value={feedingPaymentForm.amount} onChange={e => setFeedingPaymentForm({...feedingPaymentForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                                                    <div><Label htmlFor="ffpay-date">Date</Label><Input id="ffpay-date" type="date" value={feedingPaymentForm.date} onChange={e => setFeedingPaymentForm({...feedingPaymentForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                                                </div>
                                                                <div><Label htmlFor="ffpay-notes">Notes</Label><Input id="ffpay-notes" placeholder="e.g. For this week" value={feedingPaymentForm.notes} onChange={e => setFeedingPaymentForm({...feedingPaymentForm, notes: e.target.value})} disabled={isSubmitting}/></div>
                                                            </CardContent>
                                                            <DialogFooter className="px-6 pb-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Recording...</> : 'Add Feeding Payment'}</Button></DialogFooter>
                                                        </form>
                                                    </Card>
                                                </div>

                                                <div className="space-y-6">
                                                    <Card><CardHeader><CardTitle>Feeding Payment History</CardTitle></CardHeader>
                                                        <CardContent className="p-0">
                                                            <div className="max-h-96 overflow-y-auto divide-y divide-border">
                                                                {[...(selectedStudent.feedingFeePayments || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0 ? (
                                                                    <p className="text-center text-muted-foreground p-8">No payments yet.</p>
                                                                ) : (
                                                                    [...(selectedStudent.feedingFeePayments || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                                                        <div key={p.id} className="p-4 grid grid-cols-[1fr_auto] items-start gap-x-4">
                                                                            <div>
                                                                                <p className="font-medium text-base">GH¢{p.amount.toFixed(2)}</p>
                                                                                <p className="text-sm text-muted-foreground">{p.date}</p>
                                                                                {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                                                                            </div>
                                                                            <div className="self-center">
                                                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeletePayment(p, 'feeding')}>
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Transportation Fees Section */}
                                        <Card className="border-border/60">
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2"><Bus className="w-5 h-5 text-primary"/> Transportation Fees & Payments</CardTitle>
                                            </CardHeader>
                                            <CardContent className="grid md:grid-cols-2 gap-8">
                                                <div className="space-y-6">
                                                    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bus className="w-5 h-5"/> Transportation Fee Summary</CardTitle></CardHeader>
                                                        <CardContent className="space-y-2">
                                                            <div className="flex items-end gap-2"><Label htmlFor='trans-cost' className="whitespace-nowrap">Transportation Cost (GH¢)</Label><Input id='trans-cost' type="number" value={transportationCostInput} onChange={e => setTransportationCostInput(e.target.value)} disabled={isSubmitting}/><Button onClick={handleUpdateTransportationCost} disabled={isSubmitting}>{isSubmitting ? '...' : 'Set'}</Button></div>
                                                            <div className="flex justify-between text-md pt-2"><span className="text-muted-foreground">Total Billed:</span> <span className="font-semibold">GH¢{transportationFeeTotals.billed.toFixed(2)}</span></div>
                                                            <div className="flex justify-between text-md"><span className="text-muted-foreground">Total Paid:</span> <span className="font-semibold text-success">GH¢{transportationFeeTotals.paid.toFixed(2)}</span></div>
                                                            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-1"><span className="text-muted-foreground">Balance:</span> <span className={transportationFeeTotals.balance > 0 ? "text-destructive" : "text-success"}>GH¢{transportationFeeTotals.balance.toFixed(2)}</span></div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card><CardHeader><CardTitle className='flex items-center gap-2'><Landmark className="w-5 h-5"/> Record Transportation Payment</CardTitle></CardHeader>
                                                        <form onSubmit={handleAddTransportationPayment}>
                                                            <CardContent className="space-y-4">
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div><Label htmlFor="tpay-amount">Amount</Label><Input id="tpay-amount" type="number" placeholder="0.00" value={transportationPaymentForm.amount} onChange={e => setTransportationPaymentForm({...transportationPaymentForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                                                    <div><Label htmlFor="tpay-date">Date</Label><Input id="tpay-date" type="date" value={transportationPaymentForm.date} onChange={e => setTransportationPaymentForm({...transportationPaymentForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                                                </div>
                                                                <div><Label htmlFor="tpay-notes">Notes</Label><Input id="tpay-notes" placeholder="e.g. For this month" value={transportationPaymentForm.notes} onChange={e => setTransportationPaymentForm({...transportationPaymentForm, notes: e.target.value})} disabled={isSubmitting}/></div>
                                                            </CardContent>
                                                            <DialogFooter className="px-6 pb-4"><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Recording...</> : 'Add Transportation Payment'}</Button></DialogFooter>
                                                        </form>
                                                    </Card>
                                                </div>

                                                <div className="space-y-6">
                                                    <Card><CardHeader><CardTitle>Transportation Payment History</CardTitle></CardHeader>
                                                        <CardContent className="p-0">
                                                            <div className="max-h-96 overflow-y-auto divide-y divide-border">
                                                                {[...(selectedStudent.transportationPayments || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).length === 0 ? (
                                                                    <p className="text-center text-muted-foreground p-8">No payments yet.</p>
                                                                ) : (
                                                                    [...(selectedStudent.transportationPayments || [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(p => (
                                                                        <div key={p.id} className="p-4 grid grid-cols-[1fr_auto] items-start gap-x-4">
                                                                            <div>
                                                                                <p className="font-medium text-base">GH¢{p.amount.toFixed(2)}</p>
                                                                                <p className="text-sm text-muted-foreground">{p.date}</p>
                                                                                {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                                                                            </div>
                                                                            <div className="self-center">
                                                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeletePayment(p, 'transportation')}>
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                 )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="attendance" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Attendance</CardTitle>
                                <CardDescription>Mark student attendance for {selectedAttendanceDateFormatted}.</CardDescription>
                                <div className="pt-4 max-w-sm">
                                    <Label htmlFor="attendance-date">Change Date</Label>
                                    <Input
                                        id="attendance-date"
                                        type="date"
                                        value={selectedAttendanceDate}
                                        onChange={(e) => setSelectedAttendanceDate(e.target.value)}
                                    />
                                </div>
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-4">
                                        <Skeleton className="h-8 w-1/4" />
                                        <Skeleton className="h-24 w-full" />
                                        <Skeleton className="h-8 w-1/4" />
                                        <Skeleton className="h-24 w-full" />
                                    </div>
                                ) : Object.keys(studentsByClass).length === 0 ? (
                                     <div className="text-center py-12 px-4">
                                        <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <h3 className="mt-4 text-lg font-medium">No Students Found</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">There are no students in the system.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {Object.keys(studentsByClass).sort().map(className => (
                                            <div key={className}>
                                                <h2 className="text-xl font-semibold mb-4 border-b pb-2">{className}</h2>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Student Name</TableHead>
                                                            <TableHead>Student ID</TableHead>
                                                            <TableHead className="text-center w-[120px]">Present</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {studentsByClass[className].map(student => {
                                                            const attendanceRecord = student.attendance?.find(a => a.date === selectedAttendanceDate);
                                                            const isAttended = !!attendanceRecord?.attended;
                                                            const studentIsSubmitting = isAttendanceSubmitting[student.studentId];
                                                            return (
                                                                <TableRow key={student.studentId}>
                                                                    <TableCell className="font-medium">{student.name}</TableCell>
                                                                    <TableCell>{student.studentId}</TableCell>
                                                                    <TableCell className="text-center">
                                                                        {studentIsSubmitting ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> :
                                                                        <Checkbox
                                                                            id={`att-${student.studentId}`}
                                                                            checked={isAttended}
                                                                            onCheckedChange={(checked) => handleToggleAttendance(student.studentId, !!checked)}
                                                                            className="h-5 w-5"
                                                                        />}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="finances" className="mt-6">
                         <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Wallet className="w-6 h-6"/> Financial Management</CardTitle>
                                <CardDescription>Track school income, expenditures, and liabilities.</CardDescription>
                            </CardHeader>
                             <CardContent>
                                <Tabs defaultValue="summary" className="w-full">
                                    <TabsList className="grid w-full grid-cols-4">
                                        <TabsTrigger value="summary">Summary</TabsTrigger>
                                        <TabsTrigger value="general">General</TabsTrigger>
                                        <TabsTrigger value="feeding">Feeding</TabsTrigger>
                                        <TabsTrigger value="transportation">Transportation</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="summary" className="mt-6">
                                        <Card className="bg-muted/30">
                                            <CardHeader><CardTitle className="text-xl">Overall Financial Summary</CardTitle></CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                                                    <div><p className="text-sm text-muted-foreground">Total Income</p><p className="text-2xl font-bold text-success">GH¢{overallTotals.totalIncome.toFixed(2)}</p></div>
                                                    <div><p className="text-sm text-muted-foreground">Total Expenditure</p><p className="text-2xl font-bold text-destructive">GH¢{overallTotals.totalExpenditure.toFixed(2)}</p></div>
                                                    <div><p className="text-sm text-muted-foreground">Net Savings / Loss</p><p className={`text-2xl font-bold ${overallTotals.netSavings >= 0 ? 'text-success' : 'text-destructive'}`}>GH¢{overallTotals.netSavings.toFixed(2)}</p></div>
                                                    <div><p className="text-sm text-muted-foreground">Total Debt</p><p className="text-2xl font-bold">GH¢{overallTotals.totalDebt.toFixed(2)}</p></div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        <Card className="mt-6">
                                            <CardHeader><CardTitle>Manage Debts & Liabilities</CardTitle></CardHeader>
                                            <CardContent className="grid md:grid-cols-2 gap-8">
                                                 <Card>
                                                    <CardHeader><CardTitle className="flex items-center gap-2"><HandCoins className="w-5 h-5"/> Record a Debt</CardTitle></CardHeader>
                                                    <form onSubmit={handleAddDebt}>
                                                        <CardContent className="space-y-4">
                                                            <div className="space-y-2"><Label htmlFor="debt-creditor">Creditor</Label><Input id="debt-creditor" placeholder="e.g. ABC Bank" value={debtForm.creditor} onChange={e => setDebtForm({...debtForm, creditor: e.target.value})} required disabled={isSubmitting}/></div>
                                                            <div className="space-y-2"><Label htmlFor="debt-desc">Description</Label><Input id="debt-desc" placeholder="e.g. Loan for school bus" value={debtForm.description} onChange={e => setDebtForm({...debtForm, description: e.target.value})} required disabled={isSubmitting}/></div>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div className="space-y-2"><Label htmlFor="debt-amount">Amount (GH¢)</Label><Input id="debt-amount" type="number" placeholder="0.00" value={debtForm.amount} onChange={e => setDebtForm({...debtForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                                                <div className="space-y-2"><Label htmlFor="debt-date">Date Incurred</Label><Input id="debt-date" type="date" value={debtForm.date} onChange={e => setDebtForm({...debtForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                                            </div>
                                                        </CardContent>
                                                        <DialogFooter className="px-6 pb-6"><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Debt Record'}</Button></DialogFooter>
                                                    </form>
                                                </Card>
                                                 <Card>
                                                    <CardHeader><CardTitle>Debt History</CardTitle></CardHeader>
                                                    <CardContent>
                                                        {isLoading ? <Skeleton className="h-40 w-full" /> : 
                                                        debts.length === 0 ? <p className="text-center text-muted-foreground py-8">No debts recorded.</p> : (
                                                            <Table><TableHeader><TableRow><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                                                <TableBody>
                                                                    {debts.map(debt => (
                                                                        <TableRow key={debt.id}>
                                                                            <TableCell><div className="font-medium">{debt.creditor}</div><div className="text-xs text-muted-foreground">{debt.description} &bull; {new Date(debt.date).toLocaleDateString()}</div></TableCell>
                                                                            <TableCell className="text-right font-mono">GH¢{debt.amount.toFixed(2)}</TableCell>
                                                                            <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteDebt(debt)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                    <TabsContent value="general" className="mt-6">
                                        <ExpenditureSection 
                                            title="General Expenditures"
                                            description="Track spending related to general school operations like salaries, utilities, and supplies."
                                            expenditureType="General"
                                            income={incomeTotals.General}
                                            totalExpenditure={expenditureTotals.General || 0}
                                            expenditures={expenditures.filter(e => e.type === 'General')}
                                            categories={generalExpenditureCategories}
                                            onAddExpenditure={handleAddExpenditure}
                                            onDeleteExpenditure={handleDeleteExpenditure}
                                            formState={{ expenditureForm, setExpenditureForm }}
                                            isSubmitting={isSubmitting}
                                        />
                                    </TabsContent>
                                    <TabsContent value="feeding" className="mt-6">
                                         <ExpenditureSection 
                                            title="Feeding Program Expenditures"
                                            description="Track all spending related to the school's feeding program."
                                            expenditureType="Feeding"
                                            income={incomeTotals.Feeding}
                                            totalExpenditure={expenditureTotals.Feeding || 0}
                                            expenditures={expenditures.filter(e => e.type === 'Feeding')}
                                            categories={feedingExpenditureCategories}
                                            onAddExpenditure={handleAddExpenditure}
                                            onDeleteExpenditure={handleDeleteExpenditure}
                                            formState={{ expenditureForm, setExpenditureForm }}
                                            isSubmitting={isSubmitting}
                                        />
                                    </TabsContent>
                                    <TabsContent value="transportation" className="mt-6">
                                        <ExpenditureSection 
                                            title="Transportation Expenditures"
                                            description="Track all spending related to school transportation, like fuel and maintenance."
                                            expenditureType="Transportation"
                                            income={incomeTotals.Transportation}
                                            totalExpenditure={expenditureTotals.Transportation || 0}
                                            expenditures={expenditures.filter(e => e.type === 'Transportation')}
                                            categories={transportationExpenditureCategories}
                                            onAddExpenditure={handleAddExpenditure}
                                            onDeleteExpenditure={handleDeleteExpenditure}
                                            formState={{ expenditureForm, setExpenditureForm }}
                                            isSubmitting={isSubmitting}
                                        />
                                    </TabsContent>
                                </Tabs>
                             </CardContent>
                        </Card>
                    </TabsContent>

                     <TabsContent value="staff" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><ShieldCheck className="w-6 h-6"/> Staff Management</CardTitle>
                                <CardDescription>Add/remove staff, manage roles, and set salaries.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Add New Staff Member</CardTitle></CardHeader>
                                        <form onSubmit={handleAddStaff}>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="add-staff-name">Staff Name</Label>
                                                    <Input 
                                                        id="add-staff-name" 
                                                        placeholder="e.g. John Doe" 
                                                        value={addStaffForm.name} 
                                                        onChange={e => setAddStaffForm({ ...addStaffForm, name: e.target.value })} 
                                                        required
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="add-staff-id">Staff ID (for login, optional)</Label>
                                                    <Input 
                                                        id="add-staff-id" 
                                                        placeholder="e.g. STAFF002" 
                                                        value={addStaffForm.id} 
                                                        onChange={e => setAddStaffForm({ ...addStaffForm, id: e.target.value.toUpperCase() })} 
                                                        disabled={isSubmitting}
                                                    />
                                                     <p className="text-xs text-muted-foreground">Leave blank to auto-generate an ID for non-login staff.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="add-staff-class">Assign Class (for Teachers)</Label>
                                                    <Select 
                                                        value={addStaffForm.className || 'none'} 
                                                        onValueChange={(value) => setAddStaffForm({ ...addStaffForm, className: value })}
                                                        disabled={isSubmitting}
                                                    >
                                                        <SelectTrigger id="add-staff-class">
                                                            <SelectValue placeholder="Select a class if applicable" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            {uniqueClassNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </CardContent>
                                            <DialogFooter className='px-6 pb-4'>
                                                 <Button type="submit" disabled={isSubmitting} className='w-full'>
                                                    {isSubmitting ? <Loader2 className="animate-spin" /> : 'Add Staff Member'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Card>
                                </div>
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Active Staff</CardTitle></CardHeader>
                                        <CardContent>
                                            {isLoading ? <Skeleton className="h-24 w-full" /> : 
                                            staffIds.length === 0 ? (
                                                <p className="text-center text-muted-foreground py-8">No staff have been added yet.</p>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Staff Member</TableHead>
                                                            <TableHead>Role/Class</TableHead>
                                                            <TableHead>Salary (GH¢)</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {staffIds.map((staff, index) => {
                                                            const details = staffDetails.find(d => d.id === staff.id);
                                                            return (
                                                                <TableRow key={`${staff.id}-${index}`}>
                                                                    <TableCell>
                                                                        <p className="font-medium">{staff.name}</p>
                                                                        <p className="text-sm text-muted-foreground font-mono">{staff.id}</p>
                                                                    </TableCell>
                                                                    <TableCell>{staff.className || 'N/A'}</TableCell>
                                                                    <TableCell>{details?.salary ? details.salary.toFixed(2) : 'Not Set'}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <DropdownMenu>
                                                                            <DropdownMenuTrigger asChild>
                                                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                </Button>
                                                                            </DropdownMenuTrigger>
                                                                            <DropdownMenuContent align="end">
                                                                                <DropdownMenuItem onClick={() => handleOpenSalaryDialog(staff)}><DollarSign className="mr-2 h-4 w-4" /> Set Salary</DropdownMenuItem>
                                                                                <DropdownMenuSeparator />
                                                                                <DropdownMenuItem className="text-destructive" onClick={() => handleArchiveStaff(staff)}><Archive className="mr-2 h-4 w-4" /> Archive</DropdownMenuItem>
                                                                            </DropdownMenuContent>
                                                                        </DropdownMenu>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><CalendarDays className="w-6 h-6"/> School Calendar</CardTitle>
                                <CardDescription>Manage important dates for the school term.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Add New Event</CardTitle></CardHeader>
                                        <form onSubmit={handleAddCalendarEvent}>
                                            <CardContent className="space-y-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="event-title">Event Title</Label>
                                                    <Input id="event-title" placeholder="e.g. Mid-term Break" value={calendarEventForm.title} onChange={e => setCalendarEventForm({...calendarEventForm, title: e.target.value})} required disabled={isSubmitting} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="event-date">Date</Label>
                                                        <Input id="event-date" type="date" value={calendarEventForm.date} onChange={e => setCalendarEventForm({...calendarEventForm, date: e.target.value})} required disabled={isSubmitting} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="event-type">Event Type</Label>
                                                        <Select value={calendarEventForm.type} onValueChange={(value: 'Event' | 'Holiday' | 'Exam') => setCalendarEventForm({...calendarEventForm, type: value})} required disabled={isSubmitting}>
                                                            <SelectTrigger id="event-type"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Event">Event</SelectItem>
                                                                <SelectItem value="Holiday">Holiday</SelectItem>
                                                                <SelectItem value="Exam">Exam</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="event-description">Description (Optional)</Label>
                                                    <Textarea id="event-description" placeholder="Additional details about the event..." value={calendarEventForm.description} onChange={e => setCalendarEventForm({...calendarEventForm, description: e.target.value})} disabled={isSubmitting}/>
                                                </div>
                                            </CardContent>
                                            <DialogFooter className="px-6 pb-6">
                                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                                    {isSubmitting ? <><Loader2 className="animate-spin" /> Adding Event...</> : <><PlusCircle className="mr-2 h-4 w-4" /> Add Event to Calendar</>}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </Card>
                                </div>
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader><CardTitle>Upcoming Events</CardTitle></CardHeader>
                                        <CardContent>
                                            <div className="divide-y divide-border">
                                                {calendarEvents.length === 0 ? (
                                                    <p className="text-center text-muted-foreground py-8">No calendar events found.</p>
                                                ) : (
                                                    calendarEvents.map(event => (
                                                         <div key={event.id} className="p-4 grid grid-cols-[1fr_auto_auto] items-center gap-x-4">
                                                            <div>
                                                                <p className="font-medium">{event.title}</p>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {new Date(event.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                            <Badge variant={
                                                                event.type === 'Holiday' ? 'destructive' :
                                                                event.type === 'Exam' ? 'secondary' : 'default'
                                                            }>{event.type}</Badge>
                                                            <div className="self-center">
                                                                <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleDeleteEvent(event)} disabled={isSubmitting}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="communication" className="mt-6">
                        <Card className="max-w-3xl mx-auto">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Send className="w-6 h-6"/> Communication Center</CardTitle>
                                <CardDescription>Send announcements to parents. They will appear on the parent's dashboard.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSendMessage}>
                                <CardContent className="space-y-4">
                                     <div className="space-y-2">
                                        <Label htmlFor="recipient">Recipient</Label>
                                        <Select name="recipient" value={communicationForm.recipient} onValueChange={(value) => setCommunicationForm({...communicationForm, recipient: value})} required disabled={isSubmitting}>
                                            <SelectTrigger id="recipient">
                                                <SelectValue placeholder="Select a recipient" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Parents</SelectItem>
                                                {students.map(student => (
                                                    <SelectItem key={student.studentId} value={student.studentId}>
                                                        Parent of {student.name} ({student.studentId})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject</Label>
                                        <Input id="subject" placeholder="e.g. Upcoming School Event" value={communicationForm.subject} onChange={e => setCommunicationForm({...communicationForm, subject: e.target.value})} required disabled={isSubmitting}/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="message">Message</Label>
                                        <Textarea id="message" placeholder="Type your announcement here..." rows={5} value={communicationForm.message} onChange={e => setCommunicationForm({...communicationForm, message: e.target.value})} required disabled={isSubmitting}/>
                                    </div>
                                </CardContent>
                                <DialogFooter className="px-6 pb-6">
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="animate-spin" /> Sending...</> : <><Send className="mr-2 h-4 w-4" /> Send Announcement</>}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Card>
                    </TabsContent>
                    
                     <TabsContent value="archive" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Archive className="w-6 h-6"/> Archive</CardTitle>
                                <CardDescription>View archived students and staff. You can restore them or delete them permanently.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="archived-students" className="w-full">
                                     <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="archived-students">Archived Students</TabsTrigger>
                                        <TabsTrigger value="archived-staff">Archived Staff</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="archived-students" className="mt-6">
                                        <Card>
                                            <CardHeader><CardTitle>Archived Student List</CardTitle></CardHeader>
                                            <CardContent>
                                                {isLoading ? <Skeleton className="h-40 w-full" /> : 
                                                archivedStudents.length === 0 ? <p className="text-center text-muted-foreground py-8">No students have been archived.</p> : (
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {archivedStudents.map(student => (
                                                                <TableRow key={student.studentId}>
                                                                    <TableCell>
                                                                        <div className="font-medium">{student.name}</div>
                                                                        <div className="text-xs text-muted-foreground">{student.studentId}</div>
                                                                    </TableCell>
                                                                    <TableCell>{student.className}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleRestoreStudent(student.studentId)} disabled={isSubmitting}><ArchiveRestore className="mr-2 h-4 w-4"/> Restore</Button>
                                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteStudent(student)} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                     <TabsContent value="archived-staff" className="mt-6">
                                        <Card>
                                            <CardHeader><CardTitle>Archived Staff List</CardTitle></CardHeader>
                                            <CardContent>
                                                {isLoading ? <Skeleton className="h-40 w-full" /> :
                                                archivedStaff.length === 0 ? <p className="text-center text-muted-foreground py-8">No staff have been archived.</p> : (
                                                    <Table>
                                                        <TableHeader><TableRow><TableHead>Staff Member</TableHead><TableHead>Assigned Class</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                                        <TableBody>
                                                            {archivedStaff.map(staff => (
                                                                <TableRow key={staff.id}>
                                                                    <TableCell>
                                                                        <p className="font-medium">{staff.name}</p>
                                                                        <p className="text-sm text-muted-foreground font-mono">{staff.id}</p>
                                                                    </TableCell>
                                                                    <TableCell>{staff.className}</TableCell>
                                                                    <TableCell className="text-right">
                                                                        <Button variant="outline" size="sm" className="mr-2" onClick={() => handleRestoreStaff(staff.id)} disabled={isSubmitting}><ArchiveRestore className="mr-2 h-4 w-4"/> Restore</Button>
                                                                        <Button variant="destructive" size="sm" onClick={() => handleDeleteStaff(staff)} disabled={isSubmitting}><Trash2 className="mr-2 h-4 w-4"/> Delete</Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="settings" className="mt-6">
                        <Card className="max-w-4xl mx-auto">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Settings className="w-6 h-6"/> School Information</CardTitle>
                                <CardDescription>Manage your school's public details and payment information.</CardDescription>
                            </CardHeader>
                            <form onSubmit={handleSaveSchoolSettings}>
                                <CardContent className="space-y-8">
                                    <div className="space-y-4">
                                        <Label>School Logo</Label>
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-20 w-20">
                                                <AvatarImage src={logoPreview || undefined} alt="School Logo" />
                                                <AvatarFallback><SchoolIcon /></AvatarFallback>
                                            </Avatar>
                                            <Label htmlFor="edit-logo" className="cursor-pointer flex items-center gap-2 border p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                                                <Upload className="h-4 w-4" />
                                                <span>Change Logo</span>
                                            </Label>
                                            <Input id="edit-logo" type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="schoolName">School Name</Label>
                                            <Input id="schoolName" value={schoolSettingsForm.name} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, name: e.target.value })} disabled={isSubmitting} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="schoolPhone">School Phone Number</Label>
                                            <Input id="schoolPhone" type="tel" placeholder="e.g. 0302123456" value={schoolSettingsForm.schoolPhone} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, schoolPhone: e.target.value })} disabled={isSubmitting} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="schoolEmail">School Email</Label>
                                        <Input id="schoolEmail" type="email" placeholder="e.g. info@yourschool.com" value={schoolSettingsForm.schoolEmail} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, schoolEmail: e.target.value })} disabled={isSubmitting} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-2">
                                            <Label htmlFor="momoName">Mobile Money (MoMo) Name</Label>
                                            <Input id="momoName" placeholder="e.g. John Doe" value={schoolSettingsForm.momoName} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, momoName: e.target.value })} disabled={isSubmitting} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="momoNumber">Mobile Money (MoMo) Number</Label>
                                            <Input id="momoNumber" type="tel" placeholder="e.g. 0244123456" value={schoolSettingsForm.momoNumber} onChange={e => setSchoolSettingsForm({ ...schoolSettingsForm, momoNumber: e.target.value })} disabled={isSubmitting} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Bank Account Details</Label>
                                        <div className="space-y-4">
                                            {schoolSettingsForm.bankAccounts.map((account, index) => (
                                                <div key={account.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-4 p-4 border rounded-md relative">
                                                    <div className="space-y-2"><Label htmlFor={`bankName-${index}`}>Bank Name</Label><Input id={`bankName-${index}`} value={account.bankName} onChange={(e) => handleBankAccountChange(index, 'bankName', e.target.value)} placeholder="e.g. GCB Bank" disabled={isSubmitting}/></div>
                                                    <div className="space-y-2"><Label htmlFor={`accountName-${index}`}>Account Name</Label><Input id={`accountName-${index}`} value={account.accountName} onChange={(e) => handleBankAccountChange(index, 'accountName', e.target.value)} placeholder="e.g. ZipSMA School" disabled={isSubmitting}/></div>
                                                    <div className="space-y-2"><Label htmlFor={`accountNumber-${index}`}>Account Number</Label><Input id={`accountNumber-${index}`} value={account.accountNumber} onChange={(e) => handleBankAccountChange(index, 'accountNumber', e.target.value)} placeholder="e.g. 1234567890123" disabled={isSubmitting}/></div>
                                                    <Button type="button" variant="ghost" size="icon" className="text-destructive self-end mb-1" onClick={() => removeBankAccount(index)} disabled={isSubmitting}><Trash2 /></Button>
                                                </div>
                                            ))}
                                        </div>
                                        <Button type="button" variant="outline" size="sm" onClick={addBankAccount} className="mt-2" disabled={isSubmitting}><PlusCircle className="mr-2"/> Add Bank Account</Button>
                                    </div>
                                </CardContent>
                                <DialogFooter className="px-6 pb-6">
                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? <><Loader2 className="animate-spin" /> Saving Settings...</> : 'Save School Information'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Card>
                    </TabsContent>


                </Tabs>
            </main>

            <Dialog open={isAddStudentDialogOpen} onOpenChange={setIsAddStudentDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Add New Student</DialogTitle>
                        <DialogDescription>Enter the details for the new student.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddStudent}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                            {/* Column 1 */}
                            <div className="space-y-4">
                                <div className="space-y-2"><Label htmlFor="add-studentId">Student ID</Label><Input id="add-studentId" value={addStudentForm.studentId} onChange={(e) => setAddStudentForm({...addStudentForm, studentId: e.target.value.toUpperCase()})} placeholder="e.g. FAM-J01" required disabled={isSubmitting} /></div>
                                <div className="space-y-2"><Label htmlFor="add-name">Student's Full Name</Label><Input id="add-name" value={addStudentForm.name} onChange={(e) => setAddStudentForm({...addStudentForm, name: e.target.value})} placeholder="e.g. John Doe" required disabled={isSubmitting} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-className">Class Level</Label>
                                    <Input
                                        id="add-className"
                                        list="class-names-list-add"
                                        placeholder="Select or type a class"
                                        value={addStudentForm.className}
                                        onChange={e => setAddStudentForm({ ...addStudentForm, className: e.target.value })}
                                        required
                                        disabled={isSubmitting}
                                    />
                                    <datalist id="class-names-list-add">
                                        {uniqueClassNames.map(name => <option key={name} value={name} />)}
                                    </datalist>
                                    <p className="text-xs text-muted-foreground">You can select an existing class or type a new one.</p>
                                </div>
                                <div className="space-y-2"><Label htmlFor="add-dob">Date of Birth</Label><Input id="add-dob" type="date" value={addStudentForm.dateOfBirth} onChange={(e) => setAddStudentForm({...addStudentForm, dateOfBirth: e.target.value})} required disabled={isSubmitting} /></div>
                                <div className="space-y-2">
                                    <Label htmlFor="add-gender">Gender</Label>
                                    <Select value={addStudentForm.gender} onValueChange={(value: 'Male' | 'Female' | 'Other') => setAddStudentForm({...addStudentForm, gender: value})} required disabled={isSubmitting}>
                                        <SelectTrigger id="add-gender"><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label htmlFor="add-address">Home Address</Label><Textarea id="add-address" value={addStudentForm.address} onChange={(e) => setAddStudentForm({...addStudentForm, address: e.target.value})} placeholder="e.g. 123 School Lane, Accra" required disabled={isSubmitting}/></div>
                            </div>

                             {/* Column 2 */}
                             <div className="space-y-4">
                                <div className="space-y-2"><Label htmlFor="add-parentName">Parent/Guardian Name</Label><Input id="add-parentName" value={addStudentForm.parentName} onChange={(e) => setAddStudentForm({...addStudentForm, parentName: e.target.value})} placeholder="e.g. Jane Doe" required disabled={isSubmitting} /></div>
                                <div className="space-y-2"><Label htmlFor="add-parentPhone">Parent/Guardian Phone</Label><Input id="add-parentPhone" type="tel" value={addStudentForm.parentPhone} onChange={(e) => setAddStudentForm({...addStudentForm, parentPhone: e.target.value})} placeholder="e.g. 0244123456" required disabled={isSubmitting} /></div>
                                <div className="space-y-2"><Label htmlFor="add-emergencyName">Emergency Contact Name</Label><Input id="add-emergencyName" value={addStudentForm.emergencyContactName} onChange={(e) => setAddStudentForm({...addStudentForm, emergencyContactName: e.target.value})} placeholder="e.g. Mary Smith" required disabled={isSubmitting} /></div>
                                <div className="space-y-2"><Label htmlFor="add-emergencyPhone">Emergency Contact Phone</Label><Input id="add-emergencyPhone" type="tel" value={addStudentForm.emergencyContactPhone} onChange={(e) => setAddStudentForm({...addStudentForm, emergencyContactPhone: e.target.value})} placeholder="e.g. 0200123456" required disabled={isSubmitting} /></div>
                                <div className="space-y-2"><Label htmlFor="add-medical">Medical Notes (Allergies, etc.)</Label><Textarea id="add-medical" value={addStudentForm.medicalNotes} onChange={(e) => setAddStudentForm({...addStudentForm, medicalNotes: e.target.value})} placeholder="e.g. Allergic to peanuts" disabled={isSubmitting}/></div>
                             </div>
                        </div>
                        <DialogFooter className="pt-6">
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Student'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader><DialogTitle>Edit Student Details</DialogTitle></DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                             <div className="space-y-4 md:col-span-2">
                                <Label>Profile Picture</Label>
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={photoPreview || undefined} alt="Student avatar" data-ai-hint="person portrait" />
                                        <AvatarFallback>{editStudentForm.name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <Label htmlFor="edit-photo" className="cursor-pointer flex items-center gap-2 border p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors">
                                        <Upload className="h-4 w-4" />
                                        <span>Change Photo</span>
                                    </Label>
                                    <Input id="edit-photo" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </div>
                            </div>

                            <div className="space-y-2"><Label htmlFor="edit-studentId">Student ID</Label><Input id="edit-studentId" value={editStudentForm.studentId} onChange={(e) => setEditStudentForm({...editStudentForm, studentId: e.target.value.toUpperCase()})} required disabled={isSubmitting} /></div>
                            <div className="space-y-2"><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={editStudentForm.name} onChange={(e) => setEditStudentForm({...editStudentForm, name: e.target.value})} required disabled={isSubmitting} /></div>
                             <div className="space-y-2">
                                <Label htmlFor="edit-class">Class Level</Label>
                                <Input
                                    id="edit-class"
                                    list="class-names-list-edit"
                                    placeholder="Select or type a class"
                                    value={editStudentForm.className}
                                    onChange={e => setEditStudentForm({ ...editStudentForm, className: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                                <datalist id="class-names-list-edit">
                                    {uniqueClassNames.map(name => <option key={name} value={name} />)}
                                </datalist>
                            </div>

                            <div className="space-y-2"><Label htmlFor="edit-dob">Date of Birth</Label><Input id="edit-dob" type="date" value={editStudentForm.dateOfBirth} onChange={(e) => setEditStudentForm({...editStudentForm, dateOfBirth: e.target.value})} required disabled={isSubmitting} /></div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-gender">Gender</Label>
                                <Select value={editStudentForm.gender} onValueChange={(value: 'Male' | 'Female' | 'Other') => setEditStudentForm({...editStudentForm, gender: value})} required disabled={isSubmitting}>
                                    <SelectTrigger id="edit-gender"><SelectValue/></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Male">Male</SelectItem>
                                        <SelectItem value="Female">Female</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                             <div className="space-y-2 md:col-span-2"><Label htmlFor="edit-address">Home Address</Label><Textarea id="edit-address" value={editStudentForm.address} onChange={(e) => setEditStudentForm({...editStudentForm, address: e.target.value})} required disabled={isSubmitting}/></div>

                             <div className="space-y-2"><Label htmlFor="edit-parentName">Parent/Guardian Name</Label><Input id="edit-parentName" value={editStudentForm.parentName} onChange={(e) => setEditStudentForm({...editStudentForm, parentName: e.target.value})} required disabled={isSubmitting} /></div>
                             <div className="space-y-2"><Label htmlFor="edit-parentPhone">Parent/Guardian Phone</Label><Input id="edit-parentPhone" type="tel" value={editStudentForm.parentPhone} onChange={(e) => setEditStudentForm({...editStudentForm, parentPhone: e.target.value})} required disabled={isSubmitting} /></div>
                             <div className="space-y-2"><Label htmlFor="edit-emergencyName">Emergency Contact Name</Label><Input id="edit-emergencyName" value={editStudentForm.emergencyContactName} onChange={(e) => setEditStudentForm({...editStudentForm, emergencyContactName: e.target.value})} required disabled={isSubmitting} /></div>
                             <div className="space-y-2"><Label htmlFor="edit-emergencyPhone">Emergency Contact Phone</Label><Input id="edit-emergencyPhone" type="tel" value={editStudentForm.emergencyContactPhone} onChange={(e) => setEditStudentForm({...editStudentForm, emergencyContactPhone: e.target.value})} required disabled={isSubmitting} /></div>

                             <div className="space-y-2 md:col-span-2"><Label htmlFor="edit-medical">Medical Notes</Label><Textarea id="edit-medical" value={editStudentForm.medicalNotes} onChange={(e) => setEditStudentForm({...editStudentForm, medicalNotes: e.target.value})} disabled={isSubmitting}/></div>
                        </div>
                        <DialogFooter className="pt-6"><DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose><Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button></DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Student Details</DialogTitle>
                        <DialogDescription>
                            Viewing the complete profile for {selectedStudentForView?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStudentForView && (
                        <div className="py-4 space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <Avatar className="w-24 h-24 text-lg">
                                    <AvatarImage src={selectedStudentForView.profilePicture} alt={selectedStudentForView.name} data-ai-hint="person portrait" />
                                    <AvatarFallback>{selectedStudentForView.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 text-center sm:text-left">
                                    <h2 className="text-2xl font-bold">{selectedStudentForView.name}</h2>
                                    <p className="text-muted-foreground">{selectedStudentForView.className} • ID: {selectedStudentForView.studentId}</p>
                                    <p className="text-sm text-muted-foreground">Born on {selectedStudentForView.dateOfBirth ? new Date(selectedStudentForView.dateOfBirth + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg border-b pb-2">Contact Information</h3>
                                    <DetailItem icon={UserCircle} label="Parent/Guardian" value={selectedStudentForView.parentName} />
                                    <DetailItem icon={Phone} label="Parent Phone" value={selectedStudentForView.parentPhone} />
                                    <DetailItem icon={Mail} label="Parent Email" value="Not Available" />
                                    <DetailItem icon={Home} label="Home Address" value={selectedStudentForView.address} />
                                </div>
                                <div className="space-y-4">
                                     <h3 className="font-semibold text-lg border-b pb-2">Emergency &amp; Medical</h3>
                                    <DetailItem icon={ShieldAlert} label="Emergency Contact" value={`${selectedStudentForView.emergencyContactName} (${selectedStudentForView.emergencyContactPhone})`} />
                                    <DetailItem icon={HeartPulse} label="Medical Notes" value={selectedStudentForView.medicalNotes || "None"} />
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button type="button" variant="outline">Close</Button></DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

             <Dialog open={isSalaryDialogOpen} onOpenChange={setIsSalaryDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Salary for {selectedStaffForSalary?.name}</DialogTitle>
                        <DialogDescription>Enter the monthly salary amount for this staff member.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSalarySubmit}>
                        <div className="py-4">
                            <Label htmlFor="salary-amount" className="sr-only">Salary Amount</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">GH¢</span>
                                <Input 
                                    id="salary-amount"
                                    type="number" 
                                    placeholder="0.00" 
                                    className="pl-10"
                                    value={salaryForm.amount}
                                    onChange={(e) => setSalaryForm({ amount: e.target.value })}
                                    required
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Saving...</> : 'Save Salary'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            
            <AlertDialog open={!!studentToArchive} onOpenChange={(isOpen) => !isOpen && setStudentToArchive(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Archive Student?</AlertDialogTitle><AlertDialogDescription>This will move the student to the archive. You can restore them later.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmArchiveStudent} disabled={isSubmitting}>Archive</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!studentToDelete} onOpenChange={(isOpen) => !isOpen && setStudentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Permanently Delete?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone and will permanently delete the student's record.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Permanently</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!staffToArchive} onOpenChange={(isOpen) => !isOpen && setStaffToArchive(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Archive Staff?</AlertDialogTitle><AlertDialogDescription>This will move <span className="font-semibold">{staffToArchive?.name}</span> to the archive and prevent them from logging in. You can restore them later.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmArchiveStaff} disabled={isSubmitting}>Archive</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={!!staffToDelete} onOpenChange={(isOpen) => !isOpen && setStaffToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Permanently Delete?</AlertDialogTitle><AlertDialogDescription>This will permanently delete <span className="font-semibold">{staffToDelete?.name}</span> and all associated data. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteStaff} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Permanently</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!paymentToDelete} onOpenChange={(isOpen) => !isOpen && setPaymentToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this payment record.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeletePayment} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Payment</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
             <AlertDialog open={!!expenditureToDelete} onOpenChange={(isOpen) => !isOpen && setExpenditureToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the expenditure record for "{expenditureToDelete?.description}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteExpenditure} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Expenditure</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!debtToDelete} onOpenChange={(isOpen) => !isOpen && setDebtToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the debt record for "{debtToDelete?.creditor}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteDebt} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Debt</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

             <AlertDialog open={!!eventToDelete} onOpenChange={(isOpen) => !isOpen && setEventToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the calendar event "{eventToDelete?.title}".</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteEvent} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>Delete Event</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </TooltipProvider>
    );
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
    <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    </div>
);

interface ExpenditureSectionProps {
    title: string;
    description: string;
    expenditureType: 'General' | 'Feeding' | 'Transportation';
    income: number;
    totalExpenditure: number;
    expenditures: Expenditure[];
    categories: string[];
    onAddExpenditure: (e: React.FormEvent) => Promise<void>;
    onDeleteExpenditure: (exp: Expenditure) => void;
    formState: {
        expenditureForm: typeof defaultExpenditureForm;
        setExpenditureForm: React.Dispatch<React.SetStateAction<typeof defaultExpenditureForm>>;
    };
    isSubmitting: boolean;
}

const ExpenditureSection: React.FC<ExpenditureSectionProps> = ({
    title,
    description,
    expenditureType,
    income,
    totalExpenditure,
    expenditures,
    categories,
    onAddExpenditure,
    onDeleteExpenditure,
    formState,
    isSubmitting,
}) => {
    const { expenditureForm, setExpenditureForm } = formState;
    const net = income - totalExpenditure;

    const handleFormSubmit = (e: React.FormEvent) => {
        // Prevent default form submission which reloads the page
        e.preventDefault();
        
        // Update the form state with the correct type right before submission
        setExpenditureForm(prev => ({...prev, type: expenditureType}));

        // We need a slight delay to ensure the state is updated before calling the main handler
        setTimeout(() => {
            onAddExpenditure(e);
        }, 0);
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Card className="bg-muted/30">
                    <CardHeader><CardTitle className="text-lg">Financial Snapshot</CardTitle></CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-3 gap-4 text-center">
                            <div><p className="text-sm text-muted-foreground">Total Income</p><p className="text-xl font-bold text-success">GH¢{income.toFixed(2)}</p></div>
                            <div><p className="text-sm text-muted-foreground">Total Expenditure</p><p className="text-xl font-bold text-destructive">GH¢{totalExpenditure.toFixed(2)}</p></div>
                            <div><p className="text-sm text-muted-foreground">Net</p><p className={`text-xl font-bold ${net >= 0 ? 'text-success' : 'text-destructive'}`}>GH¢{net.toFixed(2)}</p></div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Record New Expenditure</CardTitle></CardHeader>
                        <form onSubmit={handleFormSubmit}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2"><Label>Description</Label><Input placeholder="e.g. Purchase of new textbooks" value={expenditureForm.description} onChange={e => setExpenditureForm({...expenditureForm, description: e.target.value})} required disabled={isSubmitting}/></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2"><Label>Amount (GH¢)</Label><Input type="number" placeholder="0.00" value={expenditureForm.amount} onChange={e => setExpenditureForm({...expenditureForm, amount: e.target.value})} required disabled={isSubmitting}/></div>
                                    <div className="space-y-2"><Label>Date</Label><Input type="date" value={expenditureForm.date} onChange={e => setExpenditureForm({...expenditureForm, date: e.target.value})} required disabled={isSubmitting}/></div>
                                </div>
                                <div className="space-y-2"><Label>Category</Label>
                                    <Select value={expenditureForm.category} onValueChange={(value) => setExpenditureForm({...expenditureForm, category: value})} required disabled={isSubmitting}>
                                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                                        <SelectContent>{categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <DialogFooter className="px-6 pb-6"><Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? <><Loader2 className="animate-spin" /> Recording...</> : 'Record Expenditure'}</Button></DialogFooter>
                        </form>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Expenditure History</CardTitle></CardHeader>
                        <CardContent>
                            {expenditures.length === 0 ? <p className="text-center text-muted-foreground py-8">No expenditures recorded.</p> : (
                                <Table>
                                    <TableHeader><TableRow><TableHead>Details</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {expenditures.map(exp => (
                                            <TableRow key={exp.id}>
                                                <TableCell><div className="font-medium">{exp.description}</div><div className="text-xs text-muted-foreground">{exp.category} &bull; {new Date(exp.date).toLocaleDateString()}</div></TableCell>
                                                <TableCell className="text-right font-mono">GH¢{exp.amount.toFixed(2)}</TableCell>
                                                <TableCell className="text-right"><Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => onDeleteExpenditure(exp)} disabled={isSubmitting}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>}>
            <AdminDashboard />
        </Suspense>
    )
}

    