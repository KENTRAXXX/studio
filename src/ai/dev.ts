import { config } from 'dotenv';
config();

import '@/ai/flows/create-client-store.ts';
import '@/ai/flows/initialize-paystack-transaction.ts';
import '@/ai/flows/send-welcome-email.ts';
