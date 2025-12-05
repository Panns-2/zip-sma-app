
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Wallet, CalendarCheck, Send, ShieldCheck, BarChart3, BrainCircuit } from 'lucide-react';

const features = [
    {
        icon: <Users className="w-8 h-8 text-primary" />,
        title: "Student Management",
        description: "Maintain comprehensive student profiles, including personal details, contact information, and medical notes, all in one secure place."
    },
    {
        icon: <Wallet className="w-8 h-8 text-primary" />,
        title: "Financial Tracking",
        description: "Effortlessly manage fees, feeding programs, and transportation costs, and track all payments and expenditures with detailed summaries."
    },
    {
        icon: <CalendarCheck className="w-8 h-8 text-primary" />,
        title: "Attendance & Homework",
        description: "Enable teachers to take daily attendance and assign homework directly through their dedicated class portal."
    },
    {
        icon: <BrainCircuit className="w-8 h-8 text-primary" />,
        title: "AI Teacher's Assistant",
        description: "Empower teachers with AI for lesson planning, assessment ideas, and report card remarks in the Teacher's Corner."
    },
    {
        icon: <Send className="w-8 h-8 text-primary" />,
        title: "Parent Communication",
        description: "Keep parents informed with school-wide announcements that appear directly on their dashboard, fostering a strong school-home connection."
    },
    {
        icon: <ShieldCheck className="w-8 h-8 text-primary" />,
        title: "Staff & Role Management",
        description: "Manage staff records, assign teachers to classes, set salaries, and control access with a secure and straightforward system."
    },
    {
        icon: <BarChart3 className="w-8 h-8 text-primary" />,
        title: "Insightful Dashboard",
        description: "Get a high-level overview of your school's performance with charts on income, expenses, and student enrollment."
    }
];

export function FeaturesSection() {
    return (
        <div className="w-full max-w-7xl mx-auto mt-16 text-center">
            <h2 className="text-3xl font-bold font-headline text-primary">Powerful Features for Modern Schools</h2>
            <p className="mt-2 text-muted-foreground max-w-3xl mx-auto">
                ZipSMA streamlines every aspect of your school's operations, from student records to parent communication, saving you time and resources.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                {features.map(feature => (
                    <Card key={feature.title} className="text-left bg-card hover:shadow-lg transition-shadow">
                        <CardHeader className="flex flex-row items-start gap-4">
                             <div className="p-3 bg-primary/10 rounded-full">
                                {feature.icon}
                            </div>
                            <CardTitle className="text-lg">{feature.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
      </div>
    );
}
