
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ZipSMALogo } from "./zipsma-logo";
import { AlertCircle } from "lucide-react";

export default function FirebaseConfigError() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-2xl text-center">
                 <div className="flex flex-col items-center text-center mb-6">
                    <ZipSMALogo className="w-16 h-16 mb-4" />
                    <h1 className="text-3xl font-bold text-primary font-headline">
                        ZipSMA Setup
                    </h1>
                </div>
                <Card className="text-left">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <AlertCircle className="w-6 h-6 text-destructive" /> Configuration Error
                        </CardTitle>
                        <CardDescription>
                            Your Firebase environment variables are not correctly configured.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p>
                           This application requires a connection to a Firebase project, but it cannot find the necessary configuration keys. Please follow these steps:
                        </p>
                        <ol className="list-decimal list-inside space-y-2 bg-muted p-4 rounded-md">
                            <li>
                                Ensure you have a file named <code className="bg-secondary px-1 py-0.5 rounded">.env.local</code> in the <strong>root directory</strong> of your project (the same folder as `package.json`).
                            </li>
                            <li>
                                Make sure all variable names in that file start with the prefix <code className="bg-secondary px-1 py-0.5 rounded">NEXT_PUBLIC_</code>. For example: `NEXT_PUBLIC_FIREBASE_API_KEY=...`.
                            </li>
                            <li>
                                 <strong>IMPORTANT:</strong> After creating or modifying the `.env.local` file, you <strong>must restart the Next.js development server</strong> for the changes to take effect.
                            </li>
                        </ol>
                        <p>
                           For a detailed example, please refer to the <code className="bg-secondary px-1 py-0.5 rounded">README.md</code> file.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
