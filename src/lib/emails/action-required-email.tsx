import React from 'react';

/**
 * @fileOverview Email template for notifying sellers that their application needs updates.
 */

export const ActionRequiredEmail = ({ name, feedback }: { name: string, feedback: string }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6' }}>
    <h1 style={{ color: '#DAA520', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Action Required: SOMA Seller Application</h1>
    
    <p>Hello {name},</p>
    
    <p>Thank you for your application to join SOMA as an authorized brand.</p>
    
    <p>Our concierge team has reviewed your submission. To maintain the high standards of authenticity within our marketplace, we require a small update to your documentation before we can fully activate your store:</p>
    
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f9f9f9', 
      borderRadius: '8px', 
      borderLeft: '4px solid #DAA520',
      margin: '25px 0' 
    }}>
      <strong style={{ display: 'block', marginBottom: '10px', color: '#000' }}>Reason for hold:</strong>
      <p style={{ margin: 0, fontStyle: 'italic', fontSize: '16px' }}>"{feedback}"</p>
    </div>

    <h3 style={{ color: '#000' }}>Next Steps:</h3>
    <p>Please log back into your SOMA Backstage portal to re-upload the requested information. Once received, we will prioritize your final approval.</p>
    
    <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <a 
            href="https://somads.com/backstage" 
            style={{ 
                backgroundColor: '#DAA520', 
                color: '#fff', 
                padding: '14px 28px', 
                textDecoration: 'none', 
                borderRadius: '5px',
                fontWeight: 'bold',
                display: 'inline-block'
            }}
        >
            Access SOMA Backstage
        </a>
    </div>

    <p>We look forward to seeing your collection live on the platform.</p>

    <p style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        Warmly,<br/>
        <strong>The SOMA Concierge Team</strong>
    </p>
  </div>
);
