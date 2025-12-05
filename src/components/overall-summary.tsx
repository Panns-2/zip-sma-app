import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedingFeesCardProps {
  dailyCost: number;
  totals: {
    paid: number;
    deducted: number;
    balance: number;
    arrears: number;
  }
}

const FeeRow = ({ label, value, className, currency = 'GH¢' }: { label: string, value: number, className?: string, currency?: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn("font-semibold text-base", className)}>{currency}{value.toFixed(2)}</span>
  </div>
);


export default function FeedingFeesCard({ dailyCost, totals }: FeedingFeesCardProps) {
  const { paid, deducted, balance, arrears } = totals;
  const isOwing = balance < 0;

  return (
    <Card className="shadow-md h-full flex flex-col">
       <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <UtensilsCrossed className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline">Feeding Fee Details</CardTitle>
            <CardDescription>Summary of feeding fee payments</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <FeeRow label="Daily Feeding Cost" value={dailyCost} />
        <FeeRow label="Total Paid" value={paid} className="text-success" />
        <FeeRow label="Total Deducted" value={deducted} />
        <div className="!mt-4 pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-muted-foreground">Balance Left</span>
            <span className={cn("text-xl font-bold", isOwing ? 'text-destructive' : 'text-success')}>GH¢{balance.toFixed(2)}</span>
          </div>
           {isOwing && (
            <div className="flex justify-between items-center text-destructive mt-1">
              <span className="text-sm font-semibold ">Arrears</span>
              <span className="text-base font-bold">GH¢{arrears.toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
