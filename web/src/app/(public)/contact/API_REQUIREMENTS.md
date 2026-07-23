# Contact Form API Requirements

## Endpoint
`POST /api/contact`

## Request Body
```json
{
  "name": "string (required, min 2 chars)",
  "email": "string (required, valid email format)",
  "subject": "string (required, min 5 chars)",
  "message": "string (required, min 20 chars)"
}
```

## Success Response
**Status Code:** 200 OK

```json
{
  "success": true,
  "message": "Contact form submitted successfully"
}
```

## Error Response
**Status Code:** 400 Bad Request

```json
{
  "success": false,
  "message": "Error message describing the issue"
}
```

## Implementation Notes

### Backend Requirements
1. **Validation**: Validate all required fields and format constraints
2. **Email Sending**: Send email notification to support@liteevent.com with:
   - Subject: `New Contact Form Submission: ${subject}`
   - Body: Include name, email, subject, and message
   - Reply-To: Set to the user's email for easy response
3. **Auto-Reply**: Send confirmation email to the user:
   - Subject: "We received your message - LiteEvent Support"
   - Body: Thank them and confirm 24-hour response time
4. **Rate Limiting**: Implement rate limiting to prevent spam (e.g., max 5 submissions per IP per hour)
5. **Database**: Optionally store submissions in database for tracking and analytics

### Email Integration
The backend already uses Resend for transactional emails (see MEMORY.md). Use the same integration for:
- Notification email to support@liteevent.com
- Auto-reply confirmation to the user

### Example Implementation (Node.js/Express)
```javascript
router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    
    // Validate
    if (!name || name.length < 2) {
      return res.status(400).json({ message: 'Name is required (min 2 chars)' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }
    if (!subject || subject.length < 5) {
      return res.status(400).json({ message: 'Subject is required (min 5 chars)' });
    }
    if (!message || message.length < 20) {
      return res.status(400).json({ message: 'Message is required (min 20 chars)' });
    }
    
    // Send notification to support team using Resend
    await resend.emails.send({
      from: 'noreply@liteevent.com',
      to: 'support@liteevent.com',
      replyTo: email,
      subject: `New Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });
    
    // Send auto-reply confirmation to user
    await resend.emails.send({
      from: 'support@liteevent.com',
      to: email,
      subject: 'We received your message - LiteEvent Support',
      html: `
        <h2>Thank you for contacting LiteEvent!</h2>
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <p><em>${subject}</em></p>
        <p>${message}</p>
        <br>
        <p>Best regards,<br>The LiteEvent Team</p>
      `
    });
    
    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});
```

## Testing
Test the contact form with:
- Valid submissions
- Invalid email formats
- Missing required fields
- Very long messages
- Special characters in fields
- Rate limiting (multiple rapid submissions)
