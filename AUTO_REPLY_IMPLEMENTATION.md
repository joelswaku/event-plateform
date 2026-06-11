# Auto-Reply Feature Implementation Guide

## Overview
When users send their first message to support, they automatically receive a welcome message. Super admins can customize this message from the dashboard.

## Database Schema

### Table: `support_settings`
```sql
CREATE TABLE support_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auto_reply_enabled BOOLEAN DEFAULT true,
  auto_reply_message TEXT DEFAULT 'Thank you for contacting support! A team member will respond to your message shortly.',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default settings
INSERT INTO support_settings (auto_reply_enabled, auto_reply_message) 
VALUES (true, 'Thank you for contacting support! A team member will respond to your message shortly.')
ON CONFLICT DO NOTHING;
```

## API Endpoints

### 1. Get Support Settings
```
GET /chat/support-settings
Authorization: Bearer <super_admin_token>

Response:
{
  "success": true,
  "data": {
    "auto_reply_enabled": true,
    "auto_reply_message": "Thank you for contacting support! A team member will respond to your message shortly."
  }
}
```

### 2. Update Support Settings
```
PUT /chat/support-settings
Authorization: Bearer <super_admin_token>

Body:
{
  "auto_reply_enabled": true,
  "auto_reply_message": "Custom welcome message here"
}

Response:
{
  "success": true,
  "message": "Settings updated successfully"
}
```

## Auto-Reply Logic

### When to Send Auto-Reply
The auto-reply should be sent when:
1. User sends a message to a support conversation
2. It's the first message from the user in that conversation
3. `auto_reply_enabled` is `true` in settings

### Implementation in `/chat/conversations/:id/messages` (POST)

```javascript
// After user message is saved
async function sendMessageHandler(req, res) {
  const { conversationId } = req.params;
  const { body } = req.body;
  const userId = req.user.id;

  // 1. Save the user's message
  const userMessage = await saveMessage(conversationId, userId, body);

  // 2. Check if this is a support conversation
  const conversation = await getConversation(conversationId);
  
  if (conversation.type === 'support') {
    // 3. Check if this is the first user message
    const userMessageCount = await countUserMessages(conversationId, userId);
    
    if (userMessageCount === 1) {
      // 4. Get support settings
      const settings = await getSupportSettings();
      
      if (settings.auto_reply_enabled) {
        // 5. Create automatic reply as system message
        const autoReply = await saveMessage(
          conversationId,
          'system', // Use 'system' as sender_id
          settings.auto_reply_message,
          {
            kind: 'auto_reply',
            sender_name: 'Support Team',
            sender_avatar: null
          }
        );
        
        // 6. The auto-reply will be fetched when client polls for new messages
      }
    }
  }

  res.json({ success: true, data: userMessage });
}
```

### Message Structure for Auto-Reply
```json
{
  "id": "uuid",
  "conversation_id": "uuid",
  "sender_id": "system",
  "sender_name": "Support Team",
  "sender_avatar": null,
  "body": "Thank you for contacting support! A team member will respond to your message shortly.",
  "kind": "auto_reply",
  "attachment_url": null,
  "attachment_type": null,
  "created_at": "2026-06-08T10:30:00Z",
  "edited_at": null,
  "deleted": false
}
```

## Frontend Behavior

1. User opens support chat
2. User types and sends first message
3. Frontend sends POST to `/chat/conversations/:id/messages`
4. Backend saves user message
5. Backend checks if it's first message + auto-reply enabled
6. Backend creates system auto-reply message
7. Frontend waits 500ms, then fetches messages
8. Auto-reply appears in chat

## Testing

### Test Cases
1. **First message triggers auto-reply**
   - Send first message to support
   - Verify auto-reply appears within 1 second

2. **Subsequent messages don't trigger auto-reply**
   - Send second message
   - Verify no duplicate auto-reply

3. **Auto-reply respects enabled setting**
   - Disable auto-reply in settings
   - Send first message
   - Verify no auto-reply appears

4. **Custom message appears correctly**
   - Change auto-reply message to "Hello, we're here to help!"
   - Send first message
   - Verify custom message appears

### Manual Test Flow
1. Login as regular user
2. Go to Support page
3. Click "Live Chat"
4. Send message: "I need help"
5. Verify you receive auto-reply within 1 second
6. Login as super admin
7. Go to Support Settings
8. Change message to "Custom welcome!"
9. Logout and repeat steps 1-5
10. Verify custom message appears

## UI Locations

### Super Admin Dashboard
- **Route**: `/super-admin`
- **Card**: "Support Settings" in Quick Actions grid
- **Icon**: message-circle (green)

### Support Settings Page
- **Route**: `/super-admin/support-settings`
- **Features**:
  - Enable/Disable toggle
  - Message editor (500 char limit)
  - Live preview
  - Reset to default button
  - Save button

## Notes
- Auto-reply is sent only once per conversation
- System messages use sender_id: 'system'
- Frontend polls for new messages 500ms after sending
- Message appears in chat as a regular message bubble
- Super admins see it in their inbox too
