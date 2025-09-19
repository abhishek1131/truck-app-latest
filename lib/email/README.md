# Email Utility Functions

This folder contains email utility functions that can be called directly from anywhere in your TruXtoK application.

## Files Structure

```
lib/email/
├── index.ts          # Main export file
├── sender.ts         # Main email sender function
├── low-stock.ts      # Low stock email function
├── examples.ts       # Usage examples
├── test-email.ts     # Test functions
└── README.md         # This file
```

## Quick Start

### 1. Send Simple Email

```typescript
import { sendEmail } from '@/lib/email';

const result = await sendEmail({
  to: 'truxtok@mailinator.com',
  subject: 'Test Email',
  html: '<h1>Hello Admin!</h1><p>This is a test email.</p>',
  text: 'Hello Admin! This is a test email.'
});

console.log(result);
```

### 2. Send Low Stock Email

```typescript
import { sendLowStockEmail } from '@/lib/email';

const result = await sendLowStockEmail('truxtok@mailinator.com');
console.log(result);
```

### 3. Send Email with EJS Template

```typescript
import { sendEmail } from '@/lib/email';

const result = await sendEmail({
  to: 'truxtok@mailinator.com',
  subject: 'Low Stock Alert',
  ejsTemplate: 'low-stock-email.ejs',
  templateData: {
    lowStockItems: [...],
    alertDate: new Date(),
    companyName: 'TruXtoK'
  }
});
```

## Main Functions

### `sendEmail(options)`

Main email sender function that handles all email sending.

**Parameters:**
- `to`: string | string[] - Email recipient(s)
- `subject`: string - Email subject
- `ejsTemplate?`: string - EJS template file name (optional)
- `templateData?`: any - Data to pass to EJS template (optional)
- `html?`: string - HTML content (optional)
- `text?`: string - Text content (optional)

**Returns:**
```typescript
{
  success: boolean;
  messageId?: string;
  accepted?: string[];
  rejected?: string[];
  error?: string;
}
```

### `sendLowStockEmail(adminEmail)`

Sends low stock alert email to admin.

**Parameters:**
- `adminEmail`: string - Admin email address (default: "truxtok@mailinator.com")

**Returns:**
```typescript
{
  success: boolean;
  message?: string;
  itemsCount?: number;
  criticalItems?: number;
  messageId?: string;
  error?: string;
}
```

## Testing

### Run All Tests

```typescript
import { runAllEmailTests } from '@/lib/email';

await runAllEmailTests();
```

### Run Individual Tests

```typescript
import { 
  testOnlySimpleEmail,
  testOnlyLowStockEmail,
  testOnlyTemplateEmail 
} from '@/lib/email';

// Test simple email
await testOnlySimpleEmail();

// Test low stock email
await testOnlyLowStockEmail();

// Test template email
await testOnlyTemplateEmail();
```

## Environment Variables Required

Make sure these environment variables are set in your `.env` file:

```env
SMTP_HOST=your-smtp-host
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
FROM_EMAIL=your-email@domain.com
```

## Usage Examples

### Example 1: Send Notification to Admin

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'truxtok@mailinator.com',
  subject: 'System Alert',
  html: '<h1>Alert!</h1><p>Something needs attention.</p>'
});
```

### Example 2: Send to Multiple Recipients

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: ['admin1@truxtok.com', 'admin2@truxtok.com'],
  subject: 'Team Update',
  html: '<h1>Update</h1><p>Important information for the team.</p>'
});
```

### Example 3: Use in API Route

```typescript
// app/api/notify/route.ts
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  const { message } = await request.json();
  
  const result = await sendEmail({
    to: 'truxtok@mailinator.com',
    subject: 'New Notification',
    html: `<p>${message}</p>`
  });
  
  return Response.json(result);
}
```

### Example 4: Use in Server Component

```typescript
// app/dashboard/page.tsx
import { sendLowStockEmail } from '@/lib/email';

export default async function Dashboard() {
  // Send low stock alert when page loads
  const emailResult = await sendLowStockEmail('truxtok@mailinator.com');
  
  return (
    <div>
      <h1>Dashboard</h1>
      {emailResult.success && <p>Low stock alert sent!</p>}
    </div>
  );
}
```

## Error Handling

All functions return a result object with `success` boolean. Always check the success status:

```typescript
const result = await sendEmail({...});

if (result.success) {
  console.log('Email sent successfully!');
  console.log('Message ID:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

## Notes

- All functions are async and return Promises
- Functions can be called from anywhere in your application
- No API routes needed - direct function calls
- EJS templates should be placed in the `templates/` folder
- Email configuration is handled automatically using environment variables
