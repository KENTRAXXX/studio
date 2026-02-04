import React from 'react';

/**
 * @fileOverview Email template for notifying partners that their referral rewards have matured.
 */

export const FundsAvailableEmail = ({ 
  name, 
  amount 
}: { 
  name: string, 
  amount: string 
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto', border: '1px solid #eee', borderRadius: '12px', padding: '40px' }}>
    <h1 style={{ color: '#DAA520', borderBottom: '1px solid #eee', paddingBottom: '10px', fontSize: '24px' }}>Executive Settlement: Funds Released</h1>
    
    <p>Hello {name},</p>
    
    <p>We are pleased to inform you that your referral rewards have successfully cleared the platform's maturity period and are now available for withdrawal.</p>
    
    <div style={{ 
      padding: '30px', 
      backgroundColor: '#f9f9f9', 
      borderRadius: '8px', 
      borderLeft: '4px solid #DAA520',
      margin: '25px 0',
      textAlign: 'center'
    }}>
      <p style={{ margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', color: '#666' }}>Amount Released to Wallet</p>
      <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#000' }}>{amount}</p>
    </div>

    <p>These funds have been moved to your active balance. You can request a payout directly to your bank account via the SOMA Wallet dashboard.</p>
    
    <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a 
            href="https://somads.com/dashboard/wallet" 
            style={{ 
                backgroundColor: '#000', 
                color: '#fff', 
                padding: '16px 32px', 
                textDecoration: 'none', 
                borderRadius: '6px',
                fontWeight: 'bold',
                display: 'inline-block'
            }}
        >
            Access My Wallet
        </a>
    </div>

    <p style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '14px', color: '#999' }}>
        Thank you for your continued strategic partnership.<br/>
        <strong>SOMA Strategic Assets Group</strong>
    </p>
  </div>
);
