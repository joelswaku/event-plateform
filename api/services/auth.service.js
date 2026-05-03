import { db } from "../config/db.js";
import { hashToken } from "../utils/hashToken.js";

import bcrypt from "bcryptjs";
import crypto from "crypto";

import {
  generateTokens,
  setAuthCookies,
  clearAuthCookies,
  verifyRefreshToken,
} from "../utils/generateToken.js";





import {
  sendWelcomeEmail,
  sendResetPasswordEmail,
  sendPasswordChangedEmail,
} from "../utils/sendEmail.js";

import { verifyGoogleToken } from "./google.service.js";

/* ------------------------------------------------ */
/* REGISTER USER */
/* ------------------------------------------------ */

export async function registerUser({
  email,
  password,
  full_name,
  ip,
  userAgent,
  deviceName,
  res,
}) {
  const client = await db.connect();
  const normalizedEmail = email.trim().toLowerCase();
  try {
    await client.query("BEGIN");

    /* check existing */

    const existing = await client.query(
      `SELECT id FROM users WHERE email=$1`,
      [normalizedEmail]
    );

    if (existing.rows.length){
      await client.query("ROLLBACK");
     return {
        success: false,
        error: "Email_already_registered",
      };
    }
    //   throw new Error("Email already registered");

    /* hash password */

    const passwordHash = await bcrypt.hash(password, 12);

    /* create user */

    const userResult = await client.query(
      `
      INSERT INTO users
      (email,password_hash,full_name,status,email_verified)
      VALUES ($1,$2,$3,'ACTIVE',false)
      RETURNING *
      `,
      [normalizedEmail, passwordHash, full_name]
    );
   
    

    const user = userResult.rows[0];

    /* create personal organization */

    const slug =
      normalizedEmail.split("@")[0] +
      "-" +
      crypto.randomBytes(4).toString("hex");

    const orgResult = await client.query(
      `
      INSERT INTO organizations
      (name,slug,owner_user_id,is_personal)
      VALUES ($1,$2,$3,true)
      RETURNING *
      `,
      [`${full_name}'s Events`, slug, user.id]
    );

    const organization = orgResult.rows[0];
   

    // create organization_members

    await client.query(
      `
      INSERT INTO organization_members (organization_id,user_id,role,joined_at)
      VALUES ($1,$2,'OWNER',now())
      `,
      [organization.id, user.id]
    );

    await client.query(
    `UPDATE users
     SET default_organization_id=$1
     WHERE id=$2
    `,
    [organization.id, user.id]
    );

    // /* set default organization */

    // await client.query(
    //   `
    //   UPDATE users
    //   SET default_organization_id=$1
    //   WHERE id=$2
    //   `,
    //   [organization.id, user.id]
    // );

    /* generate tokens */

    const tokens = generateTokens({
      userId: user.id,
      organizationId: organization.id,
      role: "OWNER",
    });

    /* store session */

    const refreshHash = hashToken(tokens.refreshToken);

    await client.query(
      `
      INSERT INTO auth_sessions
      (user_id,refresh_token_hash,device_name,user_agent,ip_address,expires_at)
      VALUES ($1,$2,$3,$4,$5, now() + interval '7 days')
      `,
      [user.id, refreshHash, deviceName, userAgent, ip]
    );

    /* audit log */

    await client.query(
      `
      INSERT INTO audit_logs
      (organization_id,actor_user_id,entity_type,entity_id,action,ip_address,user_agent)
      VALUES ($1,$2,'user',$2,'user_created',$3,$4)
      `,
      [organization.id, user.id, ip, userAgent]
    );

    await client.query("COMMIT");

    /* send welcome email */

    await sendWelcomeEmail({
      to: normalizedEmail,
      name: full_name,
    });

    /* set cookies */

    setAuthCookies(res, tokens);

    return {
      user,
      organization,
      ...tokens,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
// export async function registerUser({
//   email,
//   password,
//   full_name,
//   ip,
//   userAgent,
//   deviceName,
//   res,
// }) {

//   const normalizedEmail = email.trim().toLowerCase();

//   const client = await db.connect();

//   try {

//     await client.query("BEGIN");

//     /* check existing */

//     const existing = await client.query(
//       `SELECT id FROM users WHERE email=$1`,
//       [normalizedEmail]
//     );

//     if (existing.rows.length) {
//       await client.query("ROLLBACK");
//       return {
//         success: false,
//         error: "Email_already_registered",
//       };
//     }

//     /* hash password */

//     const passwordHash = await bcrypt.hash(password, 12);

//     /* create user */

//     const userResult = await client.query(
//       `
//       INSERT INTO users
//       (email,password_hash,full_name,status,email_verified)
//       VALUES ($1,$2,$3,'ACTIVE',false)
//       RETURNING *
//       `,
//       [normalizedEmail, passwordHash, full_name]
//     );

//     const user = userResult.rows[0];

//     /* create personal organization */

//     const slug =
//       normalizedEmail.split("@")[0] +
//       "-" +
//       crypto.randomUUID().slice(0,8);

//     const orgResult = await client.query(
//       `
//       INSERT INTO organizations
//       (name,slug,owner_user_id,is_personal)
//       VALUES ($1,$2,$3,true)
//       RETURNING *
//       `,
//       [`${full_name}'s Events`, slug, user.id]
//     );

//     const organization = orgResult.rows[0];

//     /* create organization_members */

//     await client.query(
//       `
//       INSERT INTO organization_members
//       (organization_id,user_id,role,joined_at)
//       VALUES ($1,$2,'OWNER',now())
//       `,
//       [organization.id, user.id]
//     );

//     /* set default organization */

//     await client.query(
//       `
//       UPDATE users
//       SET default_organization_id=$1
//       WHERE id=$2
//       `,
//       [organization.id, user.id]
//     );

//     /* generate tokens */

//     const tokens = generateTokens({
//       userId: user.id,
//       organizationId: organization.id,
//       role: "OWNER",
//     });

//     /* store session */

//     const refreshHash = hashToken(tokens.refreshToken);

//     await client.query(
//       `
//       INSERT INTO auth_sessions
//       (user_id,refresh_token_hash,device_name,user_agent,ip_address,expires_at)
//       VALUES ($1,$2,$3,$4,$5, now() + interval '7 days')
//       `,
//       [user.id, refreshHash, deviceName, userAgent, ip]
//     );

//     /* audit log */

//     await client.query(
//       `
//       INSERT INTO audit_logs
//       (organization_id,actor_user_id,entity_type,entity_id,action,ip_address,user_agent)
//       VALUES ($1,$2,'user',$2,'user_created',$3,$4)
//       `,
//       [organization.id, user.id, ip, userAgent]
//     );

//     await client.query("COMMIT");

//     /* send welcome email */

//     await sendWelcomeEmail({
//       to: normalizedEmail,
//       name: full_name,
//     });

//     /* set cookies */

//     setAuthCookies(res, tokens);

//     return {
//       user,
//       organization,
//       ...tokens,
//     };

//   } catch (error) {

//     await client.query("ROLLBACK");
//     throw error;

//   } finally {
//     client.release();
//   }
// }

/* ------------------------------------------------ */
/* LOGIN USER */
/* ------------------------------------------------ */

export async function loginUser({
  email,
  password,
  ip,
  userAgent,
  deviceName,
  res,
}) {
  const client = await db.connect();
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const result = await client.query(
      `SELECT * FROM users WHERE email=$1`,
      [normalizedEmail]
    );

    const user = result.rows[0];

    if (!user) throw new Error("Invalid credentials");

    if (user.status !== "ACTIVE")
      throw new Error("Account disabled");

    if (!user.password_hash)
      throw new Error("This account uses social login. Please sign in with Google.");

    const valid = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!valid) throw new Error("Invalid credentials");

    const tokens = generateTokens({
      userId: user.id,
      organizationId: user.default_organization_id,
      role: "OWNER",
    });

    /* store session */

    const refreshHash = hashToken(tokens.refreshToken);

    await client.query(
      `
      INSERT INTO auth_sessions
      (user_id,refresh_token_hash,device_name,user_agent,ip_address,expires_at)
      VALUES ($1,$2,$3,$4,$5, now() + interval '7 days')
      `,
      [user.id, refreshHash, deviceName, userAgent, ip]
    );

    /* update login */

    await client.query(
      `
      UPDATE users
      SET last_login_at=now()
      WHERE id=$1
      `,
      [user.id]
    );
    console.log(" update last login" , user.id);
    

    setAuthCookies(res, tokens);

    return {
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  } finally {
    client.release();
  }
}

/* ------------------------------------------------ */
/* GOOGLE LOGIN */
/* ------------------------------------------------ */

// export async function googleLogin({
//   idToken,
//   ip,
//   userAgent,
//   deviceName,
//   res,
// }) {
//   const client = await db.connect();

//   try {
//     const googleUser = await verifyGoogleToken(idToken);

//     let user;

//     const oauth = await client.query(
//       `
//       SELECT * FROM user_oauth_accounts
//       WHERE provider='google'
//       AND provider_user_id=$1
//       `,
//       [googleUser.googleId]
//     );

//     if (oauth.rows.length) {
//       const result = await client.query(
//         `SELECT * FROM users WHERE id=$1`,
//         [oauth.rows[0].user_id]
//       );

//       user = result.rows[0];
//     } else {
//       const userResult = await client.query(
//         `
//         INSERT INTO users
//         (email,full_name,email_verified,status)
//         VALUES ($1,$2,true,'ACTIVE')
//         RETURNING *
//         `,
//         [googleUser.email, googleUser.name]
//       );

//       user = userResult.rows[0];

//       await client.query(
//         `
//         INSERT INTO user_oauth_accounts
//         (user_id,provider,provider_user_id)
//         VALUES ($1,'google',$2)
//         `,
//         [user.id, googleUser.googleId]
//       );
//     }

//     const tokens = generateTokens({
//       userId: user.id,
//       organizationId: user.default_organization_id,
//       role: "OWNER",
//     });

//     const refreshHash = hashToken(tokens.refreshToken);

//     await client.query(
//       `
//       INSERT INTO auth_sessions
//       (user_id,refresh_token_hash,device_name,user_agent,ip_address,expires_at)
//       VALUES ($1,$2,$3,$4,$5, now() + interval '7 days')
//       `,
//       [user.id, refreshHash, deviceName, userAgent, ip]
//     );

//     setAuthCookies(res, tokens);

//     return {
//       user,
//       ...tokens,
//     };
//   } finally {
//     client.release();
//   }
// }
export async function googleLogin({
  idToken,
  ip,
  userAgent,
  deviceName,
  res,
}) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser?.email || !googleUser?.googleId) {
      throw new Error("Invalid Google token");
    }

    let user;

    /* =========================
       1. CHECK OAUTH
    ========================= */
    const oauth = await client.query(
      `
      SELECT * FROM user_oauth_accounts
      WHERE provider='google'
      AND provider_user_id=$1
      `,
      [googleUser.googleId]
    );

    if (oauth.rows.length) {
      const result = await client.query(
        `SELECT * FROM users WHERE id=$1`,
        [oauth.rows[0].user_id]
      );

      user = result.rows[0];

    } else {
      /* =========================
         2. CHECK EMAIL EXIST
      ========================= */
      const existingUser = await client.query(
        `SELECT * FROM users WHERE email=$1`,
        [googleUser.email]
      );

      if (existingUser.rows.length) {
        user = existingUser.rows[0];
      } else {
        /* CREATE USER */
        const userResult = await client.query(
          `
          INSERT INTO users
          (email, full_name, email_verified, status)
          VALUES ($1,$2,true,'ACTIVE')
          RETURNING *
          `,
          [googleUser.email, googleUser.name]
        );

        user = userResult.rows[0];
      }

      /* =========================
         LINK GOOGLE ACCOUNT (SAFE)
      ========================= */
      await client.query(
        `
        INSERT INTO user_oauth_accounts
        (user_id, provider, provider_user_id)
        VALUES ($1,'google',$2)
        ON CONFLICT (provider, provider_user_id) DO NOTHING
        `,
        [user.id, googleUser.googleId]
      );
    }

    /* =========================
       3. ENSURE ORGANIZATION
    ========================= */
    let organizationId = user.default_organization_id;

    if (!organizationId) {
      const orgSlug =
        googleUser.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-") +
        "-" +
        crypto.randomBytes(4).toString("hex");

      const org = await client.query(
        `
        INSERT INTO organizations (name, slug, owner_user_id, is_personal)
        VALUES ($1,$2,$3,true)
        RETURNING *
        `,
        [user.full_name + "'s Events", orgSlug, user.id]
      );

      organizationId = org.rows[0].id;

      await client.query(
        `
        INSERT INTO organization_members (organization_id, user_id, role, joined_at)
        VALUES ($1,$2,'OWNER',now())
        `,
        [organizationId, user.id]
      );

      await client.query(
        `UPDATE users SET default_organization_id=$1 WHERE id=$2`,
        [organizationId, user.id]
      );

      user.default_organization_id = organizationId;
    }

    /* =========================
       4. TOKENS
    ========================= */
    const tokens = generateTokens({
      userId: user.id,
      organizationId,
      role: "OWNER",
    });

    const refreshHash = hashToken(tokens.refreshToken);

    /* =========================
       5. SESSION
    ========================= */
    await client.query(
      `
      INSERT INTO auth_sessions
      (user_id, refresh_token_hash, device_name, user_agent, ip_address, expires_at)
      VALUES ($1,$2,$3,$4,$5, now() + interval '7 days')
      `,
      [user.id, refreshHash, deviceName, userAgent, ip]
    );

    /* =========================
       6. COOKIES
    ========================= */
    setAuthCookies(res, tokens);

    await client.query("COMMIT");

    return {
      data: {
        user,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
/* ------------------------------------------------ */
/* REFRESH TOKEN ROTATION */
/* ------------------------------------------------ */

export async function rotateRefreshToken({
  refreshToken,
  ip,
  userAgent,
  deviceName,
  res,
}) {
  const payload = verifyRefreshToken(refreshToken);

  const tokenHash = hashToken(refreshToken);

  const session = await db.query(
    `
    SELECT *
    FROM auth_sessions
    WHERE refresh_token_hash=$1
    AND revoked_at IS NULL
    AND expires_at > now()
    `,
    [tokenHash]
  );

  if (!session.rows.length)
    throw new Error("Session invalid");

  /* revoke old */

  await db.query(
    `
    UPDATE auth_sessions
    SET revoked_at=now()
    WHERE id=$1
    `,
    [session.rows[0].id]
  );

  const tokens = generateTokens({
    userId: payload.sub,
    organizationId: payload.org,
    role: payload.role,
  });

  const newHash = hashToken(tokens.refreshToken);

  await db.query(
    `
    INSERT INTO auth_sessions
    (user_id,refresh_token_hash,device_name,user_agent,ip_address,expires_at)
    VALUES ($1,$2,$3,$4,$5, now() + interval '7 days')
    `,
    [payload.sub, newHash, deviceName, userAgent, ip]
  );

  setAuthCookies(res, tokens);

  return tokens;
}

/* ------------------------------------------------ */
/* LOGOUT */
/* ------------------------------------------------ */

export async function logoutUser({ refreshToken, res }) {
  if (!refreshToken) {
    clearAuthCookies(res);
    return;
  }

  const hash = hashToken(refreshToken);

  await db.query(
    `
    UPDATE auth_sessions
    SET revoked_at=now()
    WHERE refresh_token_hash=$1
    `,
    [hash]
  );

  clearAuthCookies(res);
}

/* ------------------------------------------------ */
/* VERIFY EMAIL */
/* ------------------------------------------------ */

export async function verifyEmailToken({ token }) {
  const result = await db.query(
    `
    SELECT * FROM email_verification_tokens
    WHERE token=$1
    AND expires_at > now()
    `,
    [token]
  );

  if (!result.rows.length)
    throw new Error("Invalid verification token");

  const row = result.rows[0];

  await db.query(
    `UPDATE users SET email_verified=true WHERE id=$1`,
    [row.user_id]
  );

  await db.query(
    `DELETE FROM email_verification_tokens WHERE id=$1`,
    [row.id]
  );
}

/* ------------------------------------------------ */
/* REQUEST PASSWORD RESET */
/* ------------------------------------------------ */

export async function requestPasswordReset({ email }) {
  const result = await db.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );

  const user = result.rows[0];

  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);

  await db.query(
    `
    INSERT INTO password_reset_tokens
    (user_id,token_hash,expires_at)
    VALUES ($1,$2, now() + interval '1 hour')
    `,
    [user.id, tokenHash]
  );

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendResetPasswordEmail({
    to: email,
    name: user.full_name,
    resetUrl,
  });
}

/* ------------------------------------------------ */
/* RESET PASSWORD */
/* ------------------------------------------------ */

// export async function resetPassword({ token, newPassword }) {

//   const tokenHash = hashToken(token);  
//   const result = await db.query(
//     `
//     SELECT * FROM password_reset_tokens
//     WHERE token_hash=$1
//     AND expires_at > now()
//     AND used = false
//     `,
//     [tokenHash]
//   );

//   if (!result.rows.length)
//     throw new Error("Invalid reset token");

//   const row = result.rows[0];

//   const passwordHash = await bcrypt.hash(newPassword, 12);

//   await db.query(
//     `
//     UPDATE users
//     SET password_hash=$1
//     WHERE id=$2
//     `,
//     [passwordHash, row.user_id]
//   );

//   await db.query(
//     /*`DELETE FROM password_reset_tokens WHERE id=$1`*/
// `DELETE FROM password_reset_tokens
// WHERE expires_at < now()`,
//     [row.id]
//   );

//   await db.query(
//     `
//     UPDATE auth_sessions
//     SET revoked_at=now()
//     WHERE user_id=$1
//     `,
//     [row.user_id]
//   );

//   const userResult = await db.query(
//     `SELECT * FROM users WHERE id=$1`,
//     [row.user_id]
//   );

//   await sendPasswordChangedEmail({
//     to: userResult.rows[0].email,
//     name: userResult.rows[0].full_name,
//   });
// }
// export async function resetPassword({ token, newPassword }) {
//   const client = await db.connect();

//   try {
//     await client.query("BEGIN");

//     const tokenHash = hashToken(token);

//     /* =========================
//        1. VALIDATE TOKEN
//     ========================= */
//     const result = await client.query(
//       `
//       SELECT * FROM password_reset_tokens
//       WHERE token_hash=$1
//       AND expires_at > now()
//       AND used = false
//       FOR UPDATE
//       `,
//       [tokenHash]
//     );

//     if (!result.rows.length) {
//       throw new Error("Invalid or expired reset token");
//     }

//     const row = result.rows[0];

//     /* =========================
//        2. HASH NEW PASSWORD
//     ========================= */
//     const passwordHash = await bcrypt.hash(newPassword, 12);

//     /* =========================
//        3. UPDATE PASSWORD
//     ========================= */
//     await client.query(
//       `
//       UPDATE users
//       SET password_hash=$1
//       WHERE id=$2
//       `,
//       [passwordHash, row.user_id]
//     );

//     /* =========================
//        4. MARK TOKEN AS USED
//     ========================= */
//     await client.query(
//       `
//       UPDATE password_reset_tokens
//       SET used = true
//       WHERE id = $1
//       `,
//       [row.id]
//     );

//     /* =========================
//        5. REVOKE ALL SESSIONS
//     ========================= */
//     await client.query(
//       `
//       UPDATE auth_sessions
//       SET revoked_at = now()
//       WHERE user_id = $1
//       `,
//       [row.user_id]
//     );

//     await client.query("COMMIT");

//     /* =========================
//        6. SEND EMAIL (AFTER COMMIT)
//     ========================= */
//     const userResult = await db.query(
//       `SELECT email, full_name FROM users WHERE id=$1`,
//       [row.user_id]
//     );

//     await sendPasswordChangedEmail({
//       to: userResult.rows[0].email,
//       name: userResult.rows[0].full_name,
//     });

//     return { success: true };

//   } catch (error) {
//     await client.query("ROLLBACK");
//     throw error;
//   } finally {
//     client.release();
//   }
// }
export async function resetPassword({ token, newPassword }) {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const tokenHash = hashToken(token);

    /* =========================
       1. VALIDATE TOKEN
    ========================= */
    const result = await client.query(
      `
      SELECT * FROM password_reset_tokens
      WHERE token_hash=$1
      AND expires_at > now()
      AND used = false
      FOR UPDATE
      `,
      [tokenHash]
    );

    if (!result.rows.length) {
      throw new Error("Invalid or expired reset token");
    }

    const row = result.rows[0];

    /* =========================
       2. GET USER (IMPORTANT)
    ========================= */
    const userResult = await client.query(
      `SELECT password_hash, email, full_name FROM users WHERE id=$1`,
      [row.user_id]
    );

    const user = userResult.rows[0];

    /* =========================
       3. PREVENT PASSWORD REUSE
    ========================= */
    const isSame = await bcrypt.compare(newPassword, user.password_hash);

    if (isSame) {
      throw new Error("Cannot reuse old password");
    }

    /* =========================
       4. HASH NEW PASSWORD
    ========================= */
    const passwordHash = await bcrypt.hash(newPassword, 12);

    /* =========================
       5. UPDATE PASSWORD
    ========================= */
    await client.query(
      `
      UPDATE users
      SET password_hash=$1
      WHERE id=$2
      `,
      [passwordHash, row.user_id]
    );

    /* =========================
       6. MARK TOKEN USED
    ========================= */
    await client.query(
      `
      UPDATE password_reset_tokens
      SET used = true
      WHERE id = $1
      `,
      [row.id]
    );

    /* =========================
       7. REVOKE ALL SESSIONS
    ========================= */
    await client.query(
      `
      UPDATE auth_sessions
      SET revoked_at = now()
      WHERE user_id = $1
      `,
      [row.user_id]
    );

    await client.query("COMMIT");

    /* =========================
       8. SEND EMAIL AFTER COMMIT
    ========================= */
    await sendPasswordChangedEmail({
      to: user.email,
      name: user.full_name,
    });

    return { success: true };

  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
/* ------------------------------------------------ */
/* CURRENT USER */
/* ------------------------------------------------ */

export async function getCurrentUser(userId) {
  const result = await db.query(
    `
    SELECT
    id,
    email,
    full_name,
    avatar_url,
    default_organization_id
    FROM users
    WHERE id=$1
    `,
    [userId]
  );

  return result.rows[0];
}