import { config } from 'dotenv';
config();

import '@/ai/flows/accessibility-suggestions.ts';
import '@/ai/flows/create-client-store.ts';
import '@/ai/flows/initialize-paystack-transaction.ts';
import '@/ai/flows/send-order-email.ts';
