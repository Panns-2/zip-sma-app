
# ZipSMA - School Management App

This project was created in Firebase Studio. It is a Next.js application designed to help schools manage student fees, finances, attendance, and communication with parents.

## Getting Started on Your Local Computer

To run this project on your own machine after downloading it, follow these steps.

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- A code editor like [VS Code](https://code.visualstudio.com/)

### 1. Install Dependencies

Open your terminal, navigate to the project's root directory (the folder containing `package.json`), and run:

```bash
npm install
```

This command downloads and installs all the required packages for the project.

### 2. Set Up Environment Variables

The app uses Firebase for its backend and Genkit for AI features. You will need to connect it to your own Firebase project and provide an AI key.

1.  Create a new file named `.env.local` **in the root of the project**. It must be in the same directory as `package.json`.
2.  Copy the contents of the `.env.local.example` file into your new `.env.local` file.
3.  **Firebase Keys**: Follow the instructions in the Firebase Console to get your Firebase project's web app configuration keys and paste them into `.env.local`. **Ensure all variable names start with `NEXT_PUBLIC_`**. Your project ID should be `zipsma-app`.
4.  **Gemini API Key**: Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey) and paste it as the `GEMINI_API_KEY`.
5.  **Super Admin Email**: Set the `NEXT_PUBLIC_SUPER_ADMIN_EMAIL` to the email you will use for the super administrator account.

Your `.env.local` file should look like this, with your actual keys:

```
# Firebase Configuration - Replace with your project's keys
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zipsma-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zipsma-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zipsma-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=12345...
NEXT_PUBLIC_FIREBASE_APP_ID=1:12345...

# Genkit AI Configuration - Get a key from Google AI Studio
GEMINI_API_KEY=your-gemini-api-key-here

# Super Admin Configuration - Set your super admin email
NEXT_PUBLIC_SUPER_ADMIN_EMAIL=super.admin@example.com
```

### 3. Run the Development Server

**IMPORTANT:** After creating or modifying your `.env.local` file, you **must** stop and restart the development server for the changes to apply.

Start the local server:

```bash
npm run dev
```

The application will now be running. You can view it in your web browser at:

[http://localhost:9003](http://localhost:9003)

Any changes you make to the source code will be automatically reflected in the browser.

