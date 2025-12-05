
import { ZipSMALogo } from '@/components/zipsma-logo';
import Link from 'next/link';

export default function BillingPolicyPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-slate-100 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-card text-card-foreground shadow-xl my-8">
        <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center text-center mb-8">
                <ZipSMALogo className="w-16 h-16 mb-4" />
                <h1 className="text-3xl font-bold text-primary font-headline">
                    Billing Policy for ZipSMA
                </h1>
                <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:text-primary prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
            <p>
              Thank you for choosing ZipSMA to manage your school. We believe in transparent and simple pricing. This policy outlines how we charge for our services.
            </p>

            <h2>1. Pricing Model</h2>
            <p>
              ZipSMA operates on a **monthly subscription** basis. The price is calculated based on the number of active (not archived) students in your school's records at the beginning of each billing cycle.
            </p>
            
            <h2>2. Free Trial</h2>
            <p>
              We want you to experience the full power of ZipSMA without any commitment.
            </p>
            <ul>
              <li>Upon registration, your school can use all features of ZipSMA for **10 days completely free of charge**.</li>
              <li>You will only be billed after your 10-day free trial ends.</li>
            </ul>

            <h2>3. Subscription Pricing</h2>
            <p>
                Once your free trial is over, the following rate applies:
            </p>
             <div className="my-6 text-center bg-muted p-6 rounded-lg">
                <p className="text-4xl font-bold text-primary">GH¢ 5.00</p>
                <p className="text-muted-foreground">per active student, per month.</p>
            </div>
            <p>
              For example, if your school has 50 active students, your monthly bill would be 50 students * GH¢ 5.00 = GH¢ 250.00.
            </p>
            
            <h2>4. Billing and Invoicing</h2>
            <ul>
                <li>Your first billing cycle begins on the day your 10-day free trial expires.</li>
                <li>An invoice will be generated at the start of each monthly billing cycle based on your active student count.</li>
                <li>This invoice will be made available to the school administrator.</li>
            </ul>

            <h2>5. Payment Methods</h2>
            <p>
              We accept payments through the following methods:
            </p>
            <ul>
              <li><strong>Mobile Money</strong> (All major networks)</li>
              <li><strong>Bank Transfer</strong></li>
            </ul>
            <p>
              Detailed payment instructions will be provided on each invoice.
            </p>

            <h2>6. Contact Us</h2>
            <p>
              If you have any questions about our billing policy, please do not hesitate to contact our support team.
            </p>
          </div>

           <div className="mt-8 text-center text-sm text-muted-foreground">
              <Link href="/" className="font-semibold text-primary hover:underline">Back to Home</Link>
            </div>
        </div>
      </div>
    </main>
  );
}
