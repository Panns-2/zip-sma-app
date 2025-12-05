
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { AttendanceRecord } from "@/lib/data-store";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface AttendanceCardProps {
    attendance: AttendanceRecord[];
}

export function AttendanceCard({ attendance = [] }: AttendanceCardProps) {

    const last5Weekdays = useMemo(() => {
        const weekdays = [];
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        while (weekdays.length < 5) {
            const dayOfWeek = currentDate.getDay(); // Sunday is 0, Saturday is 6
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                const dateString = currentDate.toISOString().split('T')[0];
                const record = attendance.find(a => a.date === dateString);
                weekdays.push({
                    date: new Date(currentDate),
                    attended: record ? record.attended : false,
                    isRecorded: !!record,
                });
            }
            currentDate.setDate(currentDate.getDate() - 1);
        }
        return weekdays.sort((a, b) => a.date.getTime() - b.date.getTime());
    }, [attendance]);

    return (
        <Card className="shadow-md h-full flex flex-col bg-primary text-primary-foreground">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-foreground/10 rounded-full">
                        <CalendarDays className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                        <CardTitle className="font-headline">Attendance</CardTitle>
                        <CardDescription className="text-primary-foreground/80">Last 5 weekdays attendance log</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow space-y-2">
                {last5Weekdays.map(({ date, attended, isRecorded }) => (
                    <div key={date.toISOString()} className="flex items-center justify-between p-3 rounded-md bg-background/10">
                         <span className="text-sm">
                            {date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                        {isRecorded ? (
                             attended ? (
                                <div className="flex items-center gap-2 text-green-300">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="text-sm font-medium">Present</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-red-300">
                                    <XCircle className="w-5 h-5" />
                                    <span className="text-sm font-medium">Absent</span>
                                </div>
                            )
                        ) : (
                             <span className="text-xs text-primary-foreground/70">No Record</span>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
