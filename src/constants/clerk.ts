// Clerk Environment Configuration
// Replace 'your_clerk_publishable_key' with your actual Clerk publishable key
// Get your key from: https://dashboard.clerk.com

export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

if (!CLERK_PUBLISHABLE_KEY) {
    console.warn(
        'Warning: EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. ' +
        'Please add it to your .env file or environment variables.'
    );
}
