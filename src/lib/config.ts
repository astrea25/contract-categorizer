// Configuration file to centralize access to environment variables

// App Configuration
export const APP_URL = import.meta.env.VITE_APP_URL || "https://contract-management-system-omega.vercel.app";

// Email Configuration
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || "admin@example.com";
export const EMAIL_SENDER_NAME = import.meta.env.VITE_EMAIL_SENDER_NAME || "WWF Admin";
export const EMAIL_SENDER_ADDRESS = import.meta.env.VITE_EMAIL_SENDER_ADDRESS || "wwfcontracts@gmail.com";

// Brevo Configuration
export const BREVO_API_KEY = import.meta.env.VITE_BREVO_API_KEY;
