import React from 'react';

export const PayoutConfirmationEmail = ({ name, amount, confirmationUrl }: { name: string, amount: number, confirmationUrl: string }) => (
  <div>
    <h1>Confirm Your Withdrawal Request</h1>
    <p>Hi {name},</p>
    <p>A withdrawal request for <strong>${amount.toFixed(2)}</strong> was just submitted for your SOMA account.</p>
    <p>To protect your account, please confirm that you initiated this request by clicking the link below. This is a one-time verification for your new payout destination.</p>
    <a href={confirmationUrl}>Confirm Payout Request</a>
    <p>If you did not make this request, please change your password immediately and contact support.</p>
    <p>Thanks,<br/>The SOMA Team</p>
  </div>
);
