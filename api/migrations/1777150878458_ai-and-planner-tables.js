export async function up(pgm) {
  pgm.sql(`
    -- Table 1: ai_generation_logs
    CREATE TABLE ai_generation_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id TEXT,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      event_id UUID REFERENCES events(id) ON DELETE SET NULL,
      feature TEXT NOT NULL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      input_snapshot TEXT,
      output_snapshot TEXT,
      latency_ms INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Table 2: ai_chatbot_sessions
    CREATE TABLE ai_chatbot_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      session_token TEXT NOT NULL UNIQUE,
      visitor_id TEXT,
      messages JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Table 3: event_planner_projects
    CREATE TABLE event_planner_projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id TEXT NOT NULL,
      event_id UUID REFERENCES events(id) ON DELETE SET NULL,
      title TEXT NOT NULL,
      event_type TEXT,
      event_date DATE,
      guest_count INTEGER,
      total_budget NUMERIC(12,2),
      currency TEXT DEFAULT 'USD',
      venue TEXT,
      style_notes TEXT,
      ai_brief TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Table 4: planner_tasks
    CREATE TABLE planner_tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES event_planner_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT,
      due_date DATE,
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      assignee TEXT,
      estimated_cost NUMERIC(12,2),
      actual_cost NUMERIC(12,2),
      ai_generated BOOLEAN DEFAULT FALSE,
      position_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Table 5: planner_vendors
    CREATE TABLE planner_vendors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES event_planner_projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      quoted_price NUMERIC(12,2),
      confirmed_price NUMERIC(12,2),
      booking_status TEXT DEFAULT 'researching',
      notes TEXT,
      ai_suggested BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Table 6: planner_timeline_items
    CREATE TABLE planner_timeline_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID NOT NULL REFERENCES event_planner_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      item_time TIME,
      duration_minutes INTEGER DEFAULT 30,
      category TEXT,
      position_order INTEGER DEFAULT 0,
      ai_generated BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX ON ai_generation_logs(organization_id);
    CREATE INDEX ON ai_generation_logs(user_id);
    CREATE INDEX ON ai_generation_logs(event_id);
    CREATE INDEX ON ai_generation_logs(feature);
    CREATE INDEX ON ai_chatbot_sessions(event_id);
    CREATE INDEX ON ai_chatbot_sessions(session_token);
    CREATE INDEX ON event_planner_projects(organization_id);
    CREATE INDEX ON event_planner_projects(event_id);
    CREATE INDEX ON planner_tasks(project_id);
    CREATE INDEX ON planner_tasks(status);
    CREATE INDEX ON planner_vendors(project_id);
    CREATE INDEX ON planner_timeline_items(project_id);
    CREATE INDEX ON planner_timeline_items(position_order);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS planner_timeline_items;
    DROP TABLE IF EXISTS planner_vendors;
    DROP TABLE IF EXISTS planner_tasks;
    DROP TABLE IF EXISTS event_planner_projects;
    DROP TABLE IF EXISTS ai_chatbot_sessions;
    DROP TABLE IF EXISTS ai_generation_logs;
  `);
}
