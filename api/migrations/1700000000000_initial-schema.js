/**
 * Initial database schema for LiteEvent
 * Creates all base tables needed for the application
 */

export const up = (pgm) => {
  // Users table
  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    name: { type: 'varchar(255)', notNull: true },
    phone: { type: 'varchar(50)' },
    avatar_url: { type: 'text' },
    email_verified: { type: 'boolean', default: false, notNull: true },
    verification_token: { type: 'uuid' },
    reset_token: { type: 'uuid' },
    reset_token_expires: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
  });

  // Events table
  pgm.createTable('events', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: { type: 'uuid', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    date: { type: 'timestamptz', notNull: true },
    location: { type: 'varchar(255)' },
    image_url: { type: 'text' },
    is_public: { type: 'boolean', default: true, notNull: true },
    max_attendees: { type: 'integer' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
  });

  // Tickets table
  pgm.createTable('tickets', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    event_id: { type: 'uuid', notNull: true, references: 'events(id)', onDelete: 'CASCADE' },
    user_id: { type: 'uuid', references: 'users(id)', onDelete: 'SET NULL' },
    ticket_type: { type: 'varchar(50)', notNull: true },
    price: { type: 'numeric(10,2)', default: 0, notNull: true },
    status: { type: 'varchar(50)', default: 'active', notNull: true },
    qr_code: { type: 'text' },
    checked_in: { type: 'boolean', default: false, notNull: true },
    checked_in_at: { type: 'timestamptz' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
  });

  // Vendors table
  pgm.createTable('vendors', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    business_name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    category: { type: 'varchar(100)', default: 'General' },
    created_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
    updated_at: { type: 'timestamptz', default: pgm.func('NOW()'), notNull: true },
  });

  // Indexes
  pgm.createIndex('users', 'email');
  pgm.createIndex('events', 'user_id');
  pgm.createIndex('events', 'date');
  pgm.createIndex('tickets', 'event_id');
  pgm.createIndex('tickets', 'user_id');
  pgm.createIndex('vendors', 'email');
  pgm.createIndex('vendors', 'category');
};

export const down = (pgm) => {
  pgm.dropTable('tickets');
  pgm.dropTable('events');
  pgm.dropTable('vendors');
  pgm.dropTable('users');
};
