# Contract Categorizer

A web application for managing and sharing contracts with role-based access control.

## Features

- Contract management with status tracking
- Role-based sharing (viewer/editor)
- Email notifications for shared contracts
- User authentication and authorization
- Real-time updates

## Prerequisites

1. Node.js 18 or later
2. Firebase CLI (`npm install -g firebase-tools`)
3. Google Cloud CLI (for functions deployment)
4. A Gmail account (for sending email notifications)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd contract-categorizer

# Install project dependencies
npm install

# Install functions dependencies
cd functions
npm install
cd ..
```

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable these services:
   - Authentication (with Email/Password)
   - Firestore Database
   - Cloud Functions
   - Cloud Storage (optional, for document uploads)

3. Initialize Firebase in your project:
```bash
firebase login
firebase init
```
Select:
- Firestore
- Functions (with TypeScript)
- Emulators (optional)

### 3. Environment Configuration

1. Create `functions/.env` file from template:
```bash
cp functions/.env.template functions/.env
```

2. Configure the environment variables in `functions/.env`:
```
# Gmail SMTP Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password # Generate from Google Account settings
APP_URL=http://localhost:5173 # Your frontend URL
```

3. Set up Firebase config:
```bash
firebase functions:config:set email.user="your-gmail@gmail.com" email.pass="your-app-password" app.url="http://localhost:5173"
```

### 4. Deploy Firebase Resources

1. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

2. Deploy Functions:
```bash
firebase deploy --only functions
```
Note: For first-time 2nd gen function deployments, you may need to wait 5-10 minutes after the first attempt and try deploying again as the permissions propagate.

### 5. Start the Development Server

```bash
npm run dev
```

The application should now be running at http://localhost:5173

## Project Structure

- `/src` - Frontend React/TypeScript code
  - `/components` - Reusable UI components
  - `/lib` - Utility functions and Firebase setup
  - `/pages` - Application routes/pages
- `/functions` - Firebase Cloud Functions
  - `/src` - TypeScript source code for functions
  - `.env` - Environment variables for functions

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `firebase deploy` - Deploy to Firebase
- `firebase emulators:start` - Start Firebase emulators