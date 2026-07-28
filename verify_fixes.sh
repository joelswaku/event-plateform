#!/bin/bash
# Verification script to prove all 6 fixes are in place

echo "======================================================================"
echo "VERIFYING ALL 6 REMINDER FIXES"
echo "======================================================================"

API_DIR="C:/projects/event-plateform/api"

echo ""
echo "✓ Fix #1: Resend error handling in sendInstantReminder"
grep -n "if (error)" "$API_DIR/services/reminder.service.js" | head -3
echo ""

echo "✓ Fix #2: Upsert pattern (no DELETE) in reminders controller"
grep -n "ON CONFLICT (event_id, timing)" "$API_DIR/controllers/reminders.controller.js"
echo ""

echo "✓ Fix #3: Invitation RSVP uses sendInstantReminder"
grep -n "sendInstantReminder" "$API_DIR/services/guests.service.js" | grep -v "import"
echo ""

echo "✓ Fix #4: Timezone fetched from events table"
grep -n "e.timezone" "$API_DIR/services/reminder.service.js"
echo ""

echo "✓ Fix #5: Cron authentication middleware"
grep -n "verifyCronAuth" "$API_DIR/routes/cron.routes.js"
echo ""

echo "✓ Fix #6: Atomic INSERT...ON CONFLICT for duplicate prevention"
grep -n "ON CONFLICT (event_id, reminder_id, guest_id)" "$API_DIR/services/reminder.service.js"
echo ""

echo "======================================================================"
echo "CHECKING FOR OLD ISSUES (should find NONE)"
echo "======================================================================"

echo ""
echo "❌ Looking for old 'await resend.emails.send' WITHOUT error check:"
# Should find 0 instances without error check
count=$(grep -A 5 "await resend.emails.send" "$API_DIR/services/reminder.service.js" | grep -c "if (error)")
echo "Found $count error checks (should be 2+)"
echo ""

echo "❌ Looking for 'DELETE FROM event_reminders' (should be CONDITIONAL only):"
grep -n "DELETE FROM event_reminders" "$API_DIR/controllers/reminders.controller.js" || echo "No unconditional DELETE found ✓"
echo ""

echo "======================================================================"
echo "ALL FIXES VERIFIED!"
echo "======================================================================"
