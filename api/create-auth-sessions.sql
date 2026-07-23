-- Create auth_sessions table
CREATE TABLE IF NOT EXISTS public.auth_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash text NOT NULL,
    device_name character varying(150),
    user_agent text,
    ip_address inet,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    session_status character varying(30) DEFAULT 'ACTIVE'::character varying NOT NULL,
    replaced_by_session_id uuid,
    last_used_at timestamp with time zone,
    revoked_reason character varying(100),
    CONSTRAINT chk_auth_session_hash_not_blank CHECK ((btrim(refresh_token_hash) <> ''::text))
);

-- Add primary key
ALTER TABLE public.auth_sessions
ADD CONSTRAINT auth_sessions_pkey PRIMARY KEY (id);

-- Add foreign key to users
ALTER TABLE public.auth_sessions
ADD CONSTRAINT auth_sessions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON public.auth_sessions USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON public.auth_sessions USING btree (expires_at);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_last_used ON public.auth_sessions USING btree (last_used_at);

SELECT 'auth_sessions table created successfully' as result;
