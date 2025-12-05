import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Receipt, Package, BookCopy } from 'lucide-react';

interface FeeItem {
  item: string;
  amount: number;
}
interface PaymentItem {
  amount: number;
}
interface GeneralFeesCardProps {
  fees: FeeItem[];
  payments: PaymentItem[];
}

const FeeRow = ({ label, value, className, currency = 'GH¢' }: { label: string, value: number, className?: string, currency?: string }) => (
  <div className="flex justify-between items-center py-2 border-b border-border/50">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={cn("font-semibold text-base", className)}>{currency}{value.toFixed(2)}</span>
  </div>
);

const BreakdownItem = ({ label, value, currency = 'GH¢' }: { label: string, value: number, currency?: string }) => (
  <div className="flex items-center justify-between p-3 rounded-md bg-background">
    <div className="flex items-center gap-3">
      <Package className="w-5 h-5 text-primary" />
      <span className="text-sm">{label}</span>
    </div>
    <span className="text-sm font-medium">{currency}{value.toFixed(2)}</span>
  </div>
);

export default function GeneralFeesCard({ fees, payments }: GeneralFeesCardProps) {
  const totalAssigned = fees.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = payments.reduce((sum, item) => sum + item.amount, 0);
  const balance = totalAssigned - totalPaid;

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <BookCopy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="font-headline">General Fee Details</CardTitle>
            <CardDescription>Breakdown of assigned fees</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 flex-grow">
        <FeeRow label="Total Assigned" value={totalAssigned} />
        <FeeRow label="Amount Paid" value={totalPaid} className="text-success" />
        <FeeRow label="Balance Left" value={balance} className={balance > 0 ? "text-destructive" : "text-success"} />
        
        {fees.length > 0 && (
          <Accordion type="single" collapsible className="w-full pt-2">
            <AccordionItem value="item-1" className="border-none">
              <AccordionTrigger className="text-sm hover:no-underline p-0 text-primary">View Fee Breakdown</AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2 pt-2 border-t">
                  {fees.map((item) => (
                    <BreakdownItem key={item.item} label={item.item} value={item.amount} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
