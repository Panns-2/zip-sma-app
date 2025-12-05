import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History } from "lucide-react";

interface PaymentItem {
    id: number;
    date: string;
    amount: number;
    notes: string;
}

interface PaymentHistoryCardProps {
    payments: PaymentItem[];
    title?: string;
}

export default function PaymentHistoryCard({ payments, title = "Payment History" }: PaymentHistoryCardProps) {
    return (
        <Card className="shadow-md h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <History className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline">{title}</CardTitle>
                        <CardDescription>A log of all payments made.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="max-h-80 overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center h-24">
                                        No payments recorded yet.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payments.slice().reverse().map((payment) => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <div className="font-medium">{payment.date}</div>
                                            <div className="text-xs text-muted-foreground">{payment.notes}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-medium">GH¢{payment.amount.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
