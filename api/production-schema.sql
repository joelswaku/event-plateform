CREATE TABLE public.activities (
CREATE TABLE public.ai_chatbot_sessions (
CREATE TABLE public.ai_generation_logs (
CREATE TABLE public.api_keys (
CREATE TABLE public.audit_logs (
CREATE TABLE public.auth_sessions (
CREATE TABLE public.billing_invoices (
CREATE TABLE public.broadcast_notifications (
CREATE TABLE public.checkin_devices (
CREATE TABLE public.conversation_participants (
CREATE TABLE public.conversations (
CREATE TABLE public.discount_codes (
CREATE TABLE public.email_verification_tokens (
CREATE TABLE public.event_activity_logs (
CREATE TABLE public.event_dashboard_widgets (
CREATE TABLE public.event_donation_config (
CREATE TABLE public.event_donations (
CREATE TABLE public.event_invitations (
CREATE TABLE public.event_media (
CREATE TABLE public.event_members (
CREATE TABLE public.event_page_sections (
CREATE TABLE public.event_pages (
CREATE TABLE public.event_schedule_items (
CREATE TABLE public.event_settings (
CREATE TABLE public.event_speakers (
CREATE TABLE public.event_tag_map (
CREATE TABLE public.event_tags (
CREATE TABLE public.event_types (
CREATE TABLE public.event_volunteers (
CREATE TABLE public.events (
CREATE TABLE public.feature_flags (
CREATE TABLE public.gift_registry_items (
CREATE TABLE public.guest_attendance (
CREATE TABLE public.guest_groups (
CREATE TABLE public.guest_invitations (
CREATE TABLE public.guest_qr_passes (
CREATE TABLE public.guest_rsvps (
CREATE TABLE public.guests (
CREATE TABLE public.issued_tickets (
CREATE TABLE public.legal_pages (
CREATE TABLE public.memorial_messages (
CREATE TABLE public.messages (
CREATE TABLE public.moderation_reports (
CREATE TABLE public.notification_templates (
CREATE TABLE public.notifications (
CREATE TABLE public.organization_members (
CREATE TABLE public.organization_subscriptions (
CREATE TABLE public.organizations (
CREATE TABLE public.organizer_saved_vendors (
CREATE TABLE public.organizers (
CREATE TABLE public.outbound_messages (
CREATE TABLE public.page_themes (
CREATE TABLE public.password_reset_tokens (
CREATE TABLE public.payments (
CREATE TABLE public.pgmigrations (
CREATE SEQUENCE public.pgmigrations_id_seq
CREATE TABLE public.planner_activity_log (
CREATE TABLE public.planner_budget_items (
CREATE TABLE public.planner_files (
CREATE TABLE public.planner_notes (
CREATE TABLE public.planner_projects (
CREATE TABLE public.planner_tasks (
CREATE TABLE public.planner_team_members (
CREATE TABLE public.planner_timeline_items (
CREATE TABLE public.planner_vendors (
CREATE TABLE public.push_tokens (
CREATE TABLE public.qr_checkins (
CREATE TABLE public.reminders (
CREATE TABLE public.seating_assignments (
CREATE TABLE public.seating_tables (
CREATE TABLE public.subscription_plans (
CREATE SEQUENCE public.ticket_number_seq
CREATE TABLE public.ticket_order_items (
CREATE TABLE public.ticket_orders (
CREATE TABLE public.ticket_scans (
CREATE TABLE public.ticket_types (
CREATE TABLE public.uploads (
CREATE TABLE public.user_notifications (
CREATE TABLE public.user_oauth_accounts (
CREATE TABLE public.user_terms_acceptance (
CREATE TABLE public.users (
CREATE TABLE public.vendor_bookings (
CREATE TABLE public.vendor_categories (
CREATE TABLE public.vendor_inquiries (
CREATE TABLE public.vendor_reviews (
CREATE TABLE public.vendor_services (
CREATE TABLE public.vendors (
CREATE TABLE public.webhook_events (
CREATE INDEX ai_chatbot_sessions_event_id_idx ON public.ai_chatbot_sessions USING btree (event_id);
CREATE INDEX ai_chatbot_sessions_session_token_idx ON public.ai_chatbot_sessions USING btree (session_token);
CREATE INDEX ai_generation_logs_event_id_idx ON public.ai_generation_logs USING btree (event_id);
CREATE INDEX ai_generation_logs_feature_idx ON public.ai_generation_logs USING btree (feature);
CREATE INDEX ai_generation_logs_organization_id_idx ON public.ai_generation_logs USING btree (organization_id);
CREATE INDEX ai_generation_logs_user_id_idx ON public.ai_generation_logs USING btree (user_id);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at DESC);
CREATE INDEX event_planner_projects_event_id_idx ON public.planner_projects USING btree (event_id);
CREATE INDEX event_planner_projects_organization_id_idx ON public.planner_projects USING btree (organization_id);
CREATE INDEX idx_activities_actor_id ON public.activities USING btree (actor_user_id);
CREATE INDEX idx_activities_created_at ON public.activities USING btree (created_at);
CREATE INDEX idx_activities_event_id ON public.activities USING btree (event_id);
CREATE INDEX idx_activities_org_id ON public.activities USING btree (organization_id);
CREATE INDEX idx_api_keys_org_id ON public.api_keys USING btree (organization_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX idx_audit_logs_actor_user_id ON public.audit_logs USING btree (actor_user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs USING btree (entity_type);
CREATE INDEX idx_audit_logs_org_id ON public.audit_logs USING btree (organization_id);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs USING btree (resource_id);
CREATE INDEX idx_auth_sessions_expires_at ON public.auth_sessions USING btree (expires_at);
CREATE INDEX idx_auth_sessions_last_used ON public.auth_sessions USING btree (last_used_at);
CREATE INDEX idx_auth_sessions_revoked_at ON public.auth_sessions USING btree (revoked_at);
CREATE INDEX idx_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);
CREATE INDEX idx_billing_invoices_org_id ON public.billing_invoices USING btree (organization_id);
CREATE INDEX idx_checkin_devices_event_id ON public.checkin_devices USING btree (event_id);
CREATE INDEX idx_conv_event ON public.conversations USING btree (event_id) WHERE (event_id IS NOT NULL);
CREATE INDEX idx_discount_codes_code ON public.discount_codes USING btree (code);
CREATE INDEX idx_discount_codes_event_id ON public.discount_codes USING btree (event_id);
CREATE INDEX idx_email_verification_tokens_expires_at ON public.email_verification_tokens USING btree (expires_at);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);
CREATE INDEX idx_event_donations_event_id ON public.event_donations USING btree (event_id);
CREATE INDEX idx_event_donations_status ON public.event_donations USING btree (payment_status);
CREATE INDEX idx_event_media_event_id ON public.event_media USING btree (event_id);
CREATE INDEX idx_event_members_event_id ON public.event_members USING btree (event_id);
CREATE INDEX idx_event_members_user_id ON public.event_members USING btree (user_id);
CREATE INDEX idx_event_page_sections_event_id ON public.event_page_sections USING btree (event_id);
CREATE INDEX idx_event_pages_preview_token ON public.event_pages USING btree (preview_token);
CREATE INDEX idx_event_schedule_items_event_id ON public.event_schedule_items USING btree (event_id);
CREATE INDEX idx_event_speakers_event_id ON public.event_speakers USING btree (event_id);
CREATE INDEX idx_event_volunteers_event_id ON public.event_volunteers USING btree (event_id);
CREATE INDEX idx_events_created_by ON public.events USING btree (created_by);
CREATE INDEX idx_events_deleted_at ON public.events USING btree (deleted_at);
CREATE INDEX idx_events_org_id ON public.events USING btree (organization_id);
CREATE INDEX idx_events_starts_at ON public.events USING btree (starts_at);
CREATE INDEX idx_events_status ON public.events USING btree (status);
CREATE INDEX idx_events_type ON public.events USING btree (event_type);
CREATE INDEX idx_gift_registry_items_event_id ON public.gift_registry_items USING btree (event_id);
CREATE INDEX idx_guest_attendance_event_id ON public.guest_attendance USING btree (event_id);
CREATE INDEX idx_guest_attendance_status ON public.guest_attendance USING btree (attendance_status);
CREATE INDEX idx_guest_groups_event_id ON public.guest_groups USING btree (event_id);
CREATE INDEX idx_guest_invitations_event_id ON public.guest_invitations USING btree (event_id);
CREATE INDEX idx_guest_invitations_guest_id ON public.guest_invitations USING btree (guest_id);
CREATE INDEX idx_guest_invitations_status ON public.guest_invitations USING btree (invitation_status);
CREATE INDEX idx_guest_qr_passes_event_id ON public.guest_qr_passes USING btree (event_id);
CREATE INDEX idx_guest_qr_passes_guest_id ON public.guest_qr_passes USING btree (guest_id);
CREATE INDEX idx_guest_rsvps_event_id ON public.guest_rsvps USING btree (event_id);
CREATE INDEX idx_guest_rsvps_status ON public.guest_rsvps USING btree (rsvp_status);
CREATE INDEX idx_guests_deleted_at ON public.guests USING btree (deleted_at);
CREATE INDEX idx_guests_email ON public.guests USING btree (email);
CREATE INDEX idx_guests_event_id ON public.guests USING btree (event_id);
CREATE INDEX idx_guests_group_id ON public.guests USING btree (group_id);
CREATE INDEX idx_issued_tickets_event_id ON public.issued_tickets USING btree (event_id);
CREATE INDEX idx_memorial_messages_event_id ON public.memorial_messages USING btree (event_id);
CREATE INDEX idx_msg_conv_created ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX idx_org_members_org_id ON public.organization_members USING btree (organization_id);
CREATE INDEX idx_org_members_user_id ON public.organization_members USING btree (user_id);
CREATE INDEX idx_org_subscriptions_org_id ON public.organization_subscriptions USING btree (organization_id);
CREATE INDEX idx_org_subscriptions_status ON public.organization_subscriptions USING btree (status);
CREATE INDEX idx_organizers_active ON public.organizers USING btree (is_active);
CREATE INDEX idx_organizers_email ON public.organizers USING btree (email);
CREATE INDEX idx_outbound_messages_event_id ON public.outbound_messages USING btree (event_id);
CREATE INDEX idx_outbound_messages_guest_id ON public.outbound_messages USING btree (guest_id);
CREATE INDEX idx_outbound_messages_status ON public.outbound_messages USING btree (status);
CREATE INDEX idx_part_conv ON public.conversation_participants USING btree (conversation_id);
CREATE INDEX idx_part_user ON public.conversation_participants USING btree (user_id) WHERE (deleted_at IS NULL);
CREATE INDEX idx_password_reset_token_lookup ON public.password_reset_tokens USING btree (token_hash) WHERE (used = false);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens USING btree (expires_at);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens USING btree (user_id);
CREATE INDEX idx_payments_event_id ON public.payments USING btree (event_id);
CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);
CREATE INDEX idx_payments_status ON public.payments USING btree (payment_status);
CREATE INDEX idx_planner_activity_project ON public.planner_activity_log USING btree (project_id, created_at DESC);
CREATE INDEX idx_planner_budget_project ON public.planner_budget_items USING btree (project_id, category);
CREATE INDEX idx_planner_files_project ON public.planner_files USING btree (project_id, folder);
CREATE INDEX idx_planner_notes_project ON public.planner_notes USING btree (project_id);
CREATE INDEX idx_planner_projects_event ON public.planner_projects USING btree (event_id);
CREATE INDEX idx_planner_projects_org ON public.planner_projects USING btree (organization_id);
CREATE INDEX idx_planner_tasks_parent ON public.planner_tasks USING btree (parent_task_id);
CREATE INDEX idx_planner_tasks_project ON public.planner_tasks USING btree (project_id, status);
CREATE INDEX idx_planner_team_project ON public.planner_team_members USING btree (project_id);
CREATE INDEX idx_planner_timeline_project ON public.planner_timeline_items USING btree (project_id);
CREATE INDEX idx_planner_vendors_project ON public.planner_vendors USING btree (project_id, booking_status);
CREATE INDEX idx_qr_checkins_event_id ON public.qr_checkins USING btree (event_id);
CREATE INDEX idx_qr_checkins_guest_id ON public.qr_checkins USING btree (guest_id);
CREATE INDEX idx_reminders_event_id ON public.reminders USING btree (event_id);
CREATE INDEX idx_reminders_send_at ON public.reminders USING btree (send_at);
CREATE INDEX idx_saved_vendors_org ON public.organizer_saved_vendors USING btree (organizer_id);
CREATE INDEX idx_seating_assignments_event_id ON public.seating_assignments USING btree (event_id);
CREATE INDEX idx_seating_assignments_table_id ON public.seating_assignments USING btree (seating_table_id);
CREATE INDEX idx_seating_tables_event_id ON public.seating_tables USING btree (event_id);
CREATE INDEX idx_ticket_order_items_order_id ON public.ticket_order_items USING btree (order_id);
CREATE INDEX idx_ticket_orders_event_id ON public.ticket_orders USING btree (event_id);
CREATE INDEX idx_ticket_orders_payment_status ON public.ticket_orders USING btree (payment_status);
CREATE INDEX idx_ticket_scans_event_id ON public.ticket_scans USING btree (event_id);
CREATE INDEX idx_ticket_types_event_id ON public.ticket_types USING btree (event_id);
CREATE INDEX idx_uploads_event_id ON public.uploads USING btree (event_id);
CREATE INDEX idx_uploads_org_id ON public.uploads USING btree (organization_id);
CREATE INDEX idx_uploads_uploaded_by ON public.uploads USING btree (uploaded_by);
CREATE INDEX idx_user_notifications_read_at ON public.user_notifications USING btree (read_at);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);
