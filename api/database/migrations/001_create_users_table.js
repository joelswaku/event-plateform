export async function up(pgm) {

    pgm.createTable("users", {
  
      id: {
        type: "uuid",
        primaryKey: true,
        default: pgm.func("gen_random_uuid()"),
      },
  
      email: {
        type: "citext",
        notNull: true,
        unique: true,
      },
  
      password_hash: {
        type: "text",
      },
  
      full_name: {
        type: "varchar(150)",
        notNull: true,
      },
  
      created_at: {
        type: "timestamp",
        default: pgm.func("now()"),
      },
  
    });
  
  }
  
  export async function down(pgm) {
  
    pgm.dropTable("users");
  
  }