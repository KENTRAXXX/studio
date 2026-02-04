import React from 'react';

/**
 * @fileOverview Email template for notifying sellers that their application needs updates.
 */

export const ActionRequiredEmail = ({ feedback }: { feedback: string }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
    <h1 style={{ color: '#DAA520' }}>Action Required: SOMA Seller Application</h1>
    <p>Our verification team has reviewed your application and requires further action from you to proceed.</p>
    
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f9f9f9', 
      borderRadius: '8px', 
      borderLeft: '4px solid #DAA520',
      margin: '25px 0' 
    }}>
      <strong style={{ display: 'block', marginBottom: '10px' }}>Feedback from SOMA Admin:</strong>
      <p style={{ margin: 0, fontStyle: 'italic' }}>"{feedback}"</p>
    </div>

    <p>Please log back into the SOMA Seller Hub to update your details and resubmit your application for review.</p>
    
    <div style={{ marginTop: '30px' }}>
        <a 
            href="https://somads.com/backstage" 
            style={{ 
                backgroundColor: '#DAA520', 
                color: '#fff', 
                padding: '12px 24px', 
                textDecoration: 'none', 
                borderRadius: '5px',
                fontWeight: 'bold'
            }}
        >
            Update Application
        </a>
    </div>

    <p style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
        Best regards,<br/>
        The SOMA Quality Control Team
    </p>
  </div>
);
