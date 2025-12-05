
import { ZipSMALogo } from '@/components/zipsma-logo';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className="flex min-h-screen w-full flex-col items-center bg-slate-100 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-card text-card-foreground shadow-xl my-8">
        <div className="p-8 sm:p-12">
            <div className="flex flex-col items-center text-center mb-8">
                <ZipSMALogo className="w-16 h-16 mb-4" />
                <h1 className="text-3xl font-bold text-primary font-headline">
                    Privacy Policy for ZipSMA
                </h1>
                <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          
          <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert prose-headings:text-primary prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground">
            <p>
              Welcome to ZipSMA ("we," "our," "us"). We are committed to protecting the privacy of the schools, staff, parents, and students who use our application. This Privacy Policy explains what information we collect, how we use it, and your rights in relation to it.
            </p>

            <h2>1. Information We Collect</h2>
            <p>
              Our app is designed for school management. As such, we collect and store the following types of information provided by the school administration:
            </p>
            <ul>
              <li><strong>School Information:</strong> School name, School ID, and administrator account details (email).</li>
              <li><strong>Student Information:</strong> Full name, Student ID, class level, date of birth, gender, profile picture, and medical notes.</li>
              <li><strong>Parent/Guardian Information:</strong> Names, phone numbers, and home address.</li>
              <li><strong>Financial Information:</strong> Records of assigned fees, payments made, and school-wide expenditures and debts.</li>
              <li><strong>Academic &amp; Administrative Data:</strong> Attendance records, staff details (names, IDs), school announcements, calendar events, and homework assignments.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>
              The data collected is used exclusively for the purpose of providing and improving the functionality of the ZipSMA application. This includes:
            </p>
            <ul>
              <li>To operate and maintain the school management service.</li>
              <li>To allow school administrators to manage student records, finances, and staff.</li>
              <li>To allow parents and students to view their academic and financial information.</li>
              <li>To enable communication between the school and parents through announcements.</li>
              <li>To facilitate attendance and homework tracking by teachers.</li>
            </ul>

            <h2>3. Data Storage and Security</h2>
            <p>
              All data is stored securely using Google's Firebase services. We implement and maintain reasonable security measures to protect the data from unauthorized access, alteration, disclosure, or destruction. Access to student and financial data is restricted by security rules to authorized users (school administrators, and the respective parents/students).
            </p>

            <h2>4. Data Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or rent your personal identification information to others. The data you enter into the app is only visible to users who are explicitly granted access by the school administration (e.g., an admin, a teacher for their class, or a parent for their own child). We will not disclose this information to any third party except as required by law.
            </p>
            
            <h2>5. Your Rights</h2>
            <p>
              School administrators have the right to access, update, or delete school and student information through the admin dashboard. Parents and students can view their information via the login portal. For any requests regarding your data, please contact your school's administrator.
            </p>

            <h2>6. Changes to This Privacy Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new privacy policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
            
            <h2>7. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact your school's administration.
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
