import React from 'react';

/**
 * @fileOverview Email template for notifying referrers that their protege has activated.
 */

export const ReferralActivatedEmail = ({ 
  referrerName, 
  protegeName, 
  creditAmount 
}: { 
  referrerName: string, 
  protegeName: string, 
  creditAmount: string 
}) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto', border: '1px solid #eee', borderRadius: '12px', padding: '40px' }}>
    <h1 style={{ color: '#DAA520', borderBottom: '1px solid #eee', paddingBottom: '10px', fontSize: '24px' }}>Congratulations, Partner!</h1>
    
    <p>Hello {referrerName},</p>
    
    <p>Success has resonated within your network. Your protege, <strong>{protegeName}</strong>, has just officially launched their SOMA boutique!</p>
    
    <div style={{ 
      padding: '30px', 
      backgroundColor: '#f9f9f9', 
      borderRadius: '8px', 
      borderLeft: '4px solid #DAA520',
      margin: '25px 0',
      textAlign: 'center'
    }}>
      <p style={{ margin: '0 0 10px 0', textTransform: 'uppercase', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', color: '#666' }}>Referral Credit Added</p>
      <p style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: '#000' }}>{creditAmount}</p>
    </div>

    <p>This credit has been instantly deposited into your <strong>SOMA Wallet</strong> as a reward for expanding the elite ecosystem. Your mentorship is helping build the future of luxury commerce.</p>
    
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
            View My Wallet
        </a>
    </div>

    <p style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px', fontSize: '14px', color: '#999' }}>
        Thank you for your continued leadership in the SOMA network.<br/>
        <strong>SOMA Strategic Assets Group</strong>
    </p>
  </div>
);
