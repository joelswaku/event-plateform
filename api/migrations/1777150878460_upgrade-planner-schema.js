export async function up(pgm) {
  pgm.sql(`
    -- Rename existing table to match new naming convention
    ALTER TABLE event_planner_projects RENAME TO planner_projects;

    -- Add new columns to planner_projects
    ALTER TABLE planner_projects
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS event_end_date DATE,
      ADD COLUMN IF NOT EXISTS city TEXT,
      ADD COLUMN IF NOT EXISTS country TEXT,
      ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS color VARCHAR(16) DEFAULT '#6366f1',
      ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

    -- Add new columns to planner_tasks
    ALTER TABLE planner_tasks
      ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES planner_tasks(id) ON DELETE CASCADE,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS reminder_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS assignee_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS assignee_email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS assignee_avatar TEXT,
      ADD COLUMN IF NOT EXISTS labels TEXT[] DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

    -- Normalize existing task status to uppercase
    UPDATE planner_tasks SET status = UPPER(status) WHERE status IS NOT NULL;

    -- Add new columns to planner_vendors
    ALTER TABLE planner_vendors
      ADD COLUMN IF NOT EXISTS website_url VARCHAR(512),
      ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS rating INTEGER,
      ADD COLUMN IF NOT EXISTS contract_url TEXT,
      ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]',
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

    -- Add new columns to planner_timeline_items
    ALTER TABLE planner_timeline_items
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS event_date DATE,
      ADD COLUMN IF NOT EXISTS start_time TIME,
      ADD COLUMN IF NOT EXISTS end_time TIME,
      ADD COLUMN IF NOT EXISTS color VARCHAR(16),
      ADD COLUMN IF NOT EXISTS location TEXT,
      ADD COLUMN IF NOT EXISTS assignee_name VARCHAR(150),
      ADD COLUMN IF NOT EXISTS is_milestone BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

    -- Budget items
    CREATE TABLE IF NOT EXISTS planner_budget_items (
      id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id       UUID NOT NULL REFERENCES planner_projects(id) ON DELETE CASCADE,
      title            VARCHAR(255) NOT NULL,
      category         VARCHAR(100),
      vendor_name      VARCHAR(255),
      estimated_cost   NUMERIC(14,2) DEFAULT 0,
      actual_cost      NUMERIC(14,2) DEFAULT 0,
      paid_amount      NUMERIC(14,2) DEFAULT 0,
      currency         VARCHAR(10) DEFAULT 'USD',
      payment_status   VARCHAR(32) DEFAULT 'UNPAID',
      due_date         DATE,
      notes            TEXT,
      receipt_url      TEXT,
      ai_suggested     BOOLEAN DEFAULT FALSE,
      position_order   INTEGER DEFAULT 0,
      created_at       TIMESTAMPTZ DEFAULT NOW(),
      updated_at       TIMESTAMPTZ DEFAULT NOW()
    );

    -- Team members
    CREATE TABLE IF NOT EXISTS planner_team_members (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id   UUID NOT NULL REFERENCES planner_projects(id) ON DELETE CASCADE,
      user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
      name         VARCHAR(150) NOT NULL,
      email        VARCHAR(255) NOT NULL,
      role         VARCHAR(50) DEFAULT 'VIEWER',
      avatar_url   TEXT,
      permissions  JSONB DEFAULT '{}',
      invited_at   TIMESTAMPTZ DEFAULT NOW(),
      accepted_at  TIMESTAMPTZ,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    -- Notes
    CREATE TABLE IF NOT EXISTS planner_notes (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id   UUID NOT NULL REFERENCES planner_projects(id) ON DELETE CASCADE,
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title        VARCHAR(255),
      content      TEXT,
      content_json JSONB,
      tags         TEXT[] DEFAULT '{}',
      is_pinned    BOOLEAN DEFAULT FALSE,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      updated_at   TIMESTAMPTZ DEFAULT NOW()
    );

    -- Files
    CREATE TABLE IF NOT EXISTS planner_files (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id   UUID NOT NULL REFERENCES planner_projects(id) ON DELETE CASCADE,
      user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      folder       VARCHAR(100) DEFAULT 'general',
      file_name    VARCHAR(255) NOT NULL,
      file_url     TEXT NOT NULL,
      file_size    BIGINT,
      mime_type    VARCHAR(100),
      tags         TEXT[] DEFAULT '{}',
      is_public    BOOLEAN DEFAULT FALSE,
      uploaded_at  TIMESTAMPTZ DEFAULT NOW()
    );

    -- Activity log
    CREATE TABLE IF NOT EXISTS planner_activity_log (
      id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id   UUID NOT NULL REFERENCES planner_projects(id) ON DELETE CASCADE,
      user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
      actor_name   VARCHAR(150),
      action       VARCHAR(100) NOT NULL,
      entity_type  VARCHAR(50),
      entity_id    UUID,
      entity_title VARCHAR(255),
      metadata     JSONB DEFAULT '{}',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_planner_projects_org ON planner_projects(organization_id);
    CREATE INDEX IF NOT EXISTS idx_planner_projects_event ON planner_projects(event_id);
    CREATE INDEX IF NOT EXISTS idx_planner_tasks_project ON planner_tasks(project_id, status);
    CREATE INDEX IF NOT EXISTS idx_planner_tasks_parent ON planner_tasks(parent_task_id);
    CREATE INDEX IF NOT EXISTS idx_planner_timeline_project ON planner_timeline_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_planner_budget_project ON planner_budget_items(project_id, category);
    CREATE INDEX IF NOT EXISTS idx_planner_vendors_project ON planner_vendors(project_id, booking_status);
    CREATE INDEX IF NOT EXISTS idx_planner_team_project ON planner_team_members(project_id);
    CREATE INDEX IF NOT EXISTS idx_planner_notes_project ON planner_notes(project_id);
    CREATE INDEX IF NOT EXISTS idx_planner_files_project ON planner_files(project_id, folder);
    CREATE INDEX IF NOT EXISTS idx_planner_activity_project ON planner_activity_log(project_id, created_at DESC);
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE IF EXISTS planner_activity_log;
    DROP TABLE IF EXISTS planner_files;
    DROP TABLE IF EXISTS planner_notes;
    DROP TABLE IF EXISTS planner_team_members;
    DROP TABLE IF EXISTS planner_budget_items;
    ALTER TABLE planner_projects RENAME TO event_planner_projects;
  `);
}
