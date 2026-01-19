import React from 'react';

export const WelcomeEmail = ({ storeName }: { storeName: string }) => (
  <div>
    <h1>Welcome to SOMA! Your Store is LIVE!</h1>
    <p>Your payment was successful and your store, "{storeName}", is now ready!</p>
    <p>You can manage your new empire from your dashboard: <a href="/dashboard">Go to Dashboard</a>.</p>
  </div>
);
