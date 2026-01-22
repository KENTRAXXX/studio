import React from 'react';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:9002';
const dashboardUrl = `https://${ROOT_DOMAIN}/dashboard`;

export const WelcomeEmail = ({ storeName }: { storeName: string }) => (
  <div>
    <h1>Welcome to SOMA! Your Store is LIVE!</h1>
    <p>Your payment was successful and your store, "{storeName}", is now ready!</p>
    <p>You can manage your new empire from your dashboard: <a href={dashboardUrl}>Go to Dashboard</a>.</p>
  </div>
);
