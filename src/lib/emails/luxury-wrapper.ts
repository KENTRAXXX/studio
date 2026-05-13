/**
 * Trade Wyse Luxury Email System
 * Centralized branding for all platform communications.
 */

interface EmailTemplateOptions {
  title: string;
  previewText?: string;
  heading: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  footerText?: string;
}

export function getLuxuryEmailHtml({
  title,
  previewText,
  heading,
  body,
  buttonText,
  buttonUrl,
  footerText = "This is a secure communication from Trade Wyse DS. Confidentiality protocols active.",
}: EmailTemplateOptions): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background-color: #000000;
      font-family: 'Inter', -apple-system, sans-serif;
      color: #FFFFFF;
    }
    
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    .email-card {
      background-color: #0A0A0A;
      border: 1px solid rgba(212, 175, 55, 0.3);
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    
    .header {
      padding: 40px 20px;
      text-align: center;
      background: linear-gradient(180deg, #0A0A0A 0%, #000000 100%);
      border-bottom: 1px solid rgba(212, 175, 55, 0.1);
    }
    
    .logo {
      height: 60px;
      margin-bottom: 20px;
    }
    
    .content {
      padding: 40px 30px;
      line-height: 1.6;
    }
    
    .heading {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: #D4AF37;
      margin-bottom: 24px;
      letter-spacing: -0.5px;
      text-align: center;
    }
    
    .body-text {
      font-size: 16px;
      color: #CCCCCC;
      margin-bottom: 30px;
    }
    
    .button-container {
      text-align: center;
      margin: 40px 0;
    }
    
    .button {
      display: inline-block;
      padding: 16px 40px;
      background: linear-gradient(180deg, #D4AF37 0%, #AA8928 100%);
      color: #000000 !important;
      text-decoration: none;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 2px;
      font-size: 12px;
      border-radius: 2px;
      box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
    }
    
    .footer {
      padding: 30px;
      text-align: center;
      font-size: 10px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-top: 1px solid rgba(212, 175, 55, 0.1);
    }
    
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.5), transparent);
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="email-card">
      <div class="header">
        <img src="https://www.tradewysetoday.com/logo.svg" alt="Trade Wyse" class="logo">
        <div class="divider"></div>
      </div>
      
      <div class="content">
        <h1 class="heading">${heading}</h1>
        <div class="body-text">
          ${body}
        </div>
        
        ${buttonText && buttonUrl ? `
          <div class="button-container">
            <a href="${buttonUrl}" class="button">${buttonText}</a>
          </div>
        ` : ''}
      </div>
      
      <div class="footer">
        ${footerText}
        <p style="margin-top: 20px;">&copy; ${new Date().getFullYear()} Trade Wyse DS. ALL RIGHTS RESERVED.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}
