"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Eye, EyeOff, Save, Loader2, Zap, AlertTriangle, Shield } from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import useT from "@/hooks/useT";

const PLAN_CONFIG = {
  free: { label: "Free", color: "#64748b", bg: "rgba(100,116,139,0.12)" },
  pro: { label: "Pro", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  business: { label: "Business", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
};

function SettingSection({ title, desc, children, T }) {
  return (
    <div style={{
      background: T.cardBgSolid, border: `1px solid ${T.border}`,
      borderRadius: "18px", overflow: "hidden", marginBottom: "20px",
    }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.borderSub}` }}>
        <h2 style={{ fontSize: "16px", fontWeight: 800, marginBottom: "3px", color: T.text }}>{title}</h2>
        {desc && <p style={{ fontSize: "13px", color: T.textMuted, fontWeight: 500 }}>{desc}</p>}
      </div>
      <div style={{ padding: "24px" }}>
        {children}
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: "44px", height: "24px", borderRadius: "100px",
        background: checked ? "#6366f1" : "rgba(255,255,255,0.12)",
        position: "relative", cursor: "pointer", transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute", top: "4px",
        left: checked ? "22px" : "4px",
        width: "16px", height: "16px", borderRadius: "50%",
        background: "#fff", transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
      }} />
    </div>
  );
}

export default function SettingsPage() {
  const T = useT();
  const router = useRouter();
  const { vendor, logout } = useVendorStore();
  const currentPlan = vendor?.plan || "free";
  const planConfig = PLAN_CONFIG[currentPlan];

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: T.cardBgSolid, border: `1px solid ${T.inputBorder}`,
    borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: T.text,
    outline: "none",
  };

  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  const [notifications, setNotifications] = useState({
    newInquiry: true,
    newReview: true,
    bookingUpdate: true,
    systemUpdates: false,
    weeklyReport: true,
    marketingEmails: false,
  });

  const { register: registerAccount, handleSubmit: handleAccountSubmit } = useForm({
    defaultValues: {
      fullName: vendor?.fullName || vendor?.name || "Claire Beaumont",
      email: vendor?.email || "claire@lumierephoto.fr",
    },
  });

  const { register: registerPassword, handleSubmit: handlePasswordSubmit, reset: resetPassword, watch } = useForm();
  const newPassword = watch("newPassword", "");

  const onSaveAccount = async (data) => {
    setSavingAccount(true);
    await new Promise((r) => setTimeout(r, 800));
    setSavingAccount(false);
    toast.success("Account settings saved!");
  };

  const onChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSavingPassword(true);
    await new Promise((r) => setTimeout(r, 800));
    setSavingPassword(false);
    resetPassword();
    toast.success("Password updated successfully!");
  };

  const handleDeactivate = () => {
    toast.success("Account deactivated. You'll receive a confirmation email.");
  };

  const handleDelete = () => {
    if (deleteText !== "DELETE") return;
    logout();
    router.push("/");
    toast.success("Account deletion requested");
  };

  return (
    <div>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "4px", color: T.text }}>Settings</h1>
        <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>Manage your account and preferences</p>
      </div>

      {/* Account */}
      <SettingSection title="Account Information" desc="Update your personal details" T={T}>
        <form onSubmit={handleAccountSubmit(onSaveAccount)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }} className="settings-grid">
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Full Name</label>
              <input {...registerAccount("fullName")} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Email Address</label>
              <input {...registerAccount("email")} type="email" style={inputStyle} />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingAccount}
            style={{
              padding: "11px 22px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
              color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none",
              cursor: savingAccount ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "7px",
            }}
          >
            {savingAccount ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
            {savingAccount ? "Saving..." : "Save Account"}
          </button>
        </form>
      </SettingSection>

      {/* Password */}
      <SettingSection title="Change Password" desc="Use a strong password with letters, numbers, and symbols" T={T}>
        <form onSubmit={handlePasswordSubmit(onChangePassword)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "20px" }} className="settings-grid-3">
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Current Password</label>
              <div style={{ position: "relative" }}>
                <input
                  {...registerPassword("currentPassword", { required: true })}
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  {...registerPassword("newPassword", { required: true, minLength: 8 })}
                  type={showNewPass ? "text" : "password"}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                />
                <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}>
                  {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Confirm New</label>
              <input
                {...registerPassword("confirmPassword", { required: true, validate: (v) => v === newPassword || "Passwords don't match" })}
                type="password"
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingPassword}
            style={{
              padding: "11px 22px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
              color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none",
              cursor: savingPassword ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "7px",
            }}
          >
            {savingPassword ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Shield size={15} />}
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notification Preferences" desc="Choose what you want to be notified about" T={T}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            { key: "newInquiry", label: "New Inquiry", desc: "When an organizer sends you an inquiry" },
            { key: "newReview", label: "New Review", desc: "When a client leaves a review on your profile" },
            { key: "bookingUpdate", label: "Booking Updates", desc: "Status changes on your bookings" },
            { key: "systemUpdates", label: "Platform Updates", desc: "New features and important platform news" },
            { key: "weeklyReport", label: "Weekly Performance Report", desc: "Summary of your profile views and inquiries" },
            { key: "marketingEmails", label: "Marketing Emails", desc: "Tips, resources and promotional offers" },
          ].map((notif, idx, arr) => (
            <div
              key={notif.key}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "16px 0",
                borderBottom: idx < arr.length - 1 ? `1px solid ${T.borderSub}` : "none",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, marginBottom: "2px", color: T.text }}>{notif.label}</div>
                <div style={{ fontSize: "12px", color: T.textMuted, fontWeight: 500 }}>{notif.desc}</div>
              </div>
              <ToggleSwitch
                checked={notifications[notif.key]}
                onChange={(val) => setNotifications((prev) => ({ ...prev, [notif.key]: val }))}
              />
            </div>
          ))}
        </div>
        <button
          onClick={() => toast.success("Notification preferences saved!")}
          style={{
            marginTop: "16px", padding: "11px 22px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
            color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", gap: "7px",
          }}
        >
          <Save size={15} /> Save Preferences
        </button>
      </SettingSection>

      {/* Pricing plan */}
      <SettingSection title="Subscription Plan" desc="Manage your current plan" T={T}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "12px",
              background: planConfig.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={22} color={planConfig.color} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <span style={{ fontSize: "18px", fontWeight: 900, color: T.text }}>{planConfig.label} Plan</span>
                <span style={{
                  padding: "3px 10px", borderRadius: "100px", fontSize: "11px", fontWeight: 700,
                  background: planConfig.bg, color: planConfig.color,
                  border: `1px solid ${planConfig.color}30`,
                }}>
                  Current Plan
                </span>
              </div>
              <p style={{ fontSize: "13px", color: T.textSub, fontWeight: 500 }}>
                {currentPlan === "free"
                  ? "Upgrade to Pro for priority ranking, analytics, AI tools, and Verified badge"
                  : currentPlan === "pro"
                  ? "Upgrade to Business for featured placement, custom domain, and team management"
                  : "You're on our most powerful plan"}
              </p>
            </div>
          </div>
          {currentPlan !== "business" && (
            <button style={{
              padding: "12px 24px", borderRadius: "11px", fontSize: "14px", fontWeight: 700,
              color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none", cursor: "pointer",
              boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
            }}>
              Upgrade Plan
            </button>
          )}
        </div>

        {/* Plan features comparison */}
        <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }} className="plan-grid">
          {[
            { name: "Free", price: "$0/mo", color: "#64748b", features: ["Basic listing", "5 portfolio images", "Receive inquiries"] },
            { name: "Pro", price: "$29/mo", color: "#6366f1", features: ["Priority ranking", "Unlimited portfolio", "Analytics + AI", "Verified badge"] },
            { name: "Business", price: "$79/mo", color: "#a78bfa", features: ["Featured placement", "Custom domain", "Team management", "API access"] },
          ].map((p) => (
            <div key={p.name} style={{
              padding: "16px", borderRadius: "12px",
              background: currentPlan === p.name.toLowerCase() ? `${p.color}12` : T.cardBg,
              border: currentPlan === p.name.toLowerCase() ? `1px solid ${p.color}35` : `1px solid ${T.borderSub}`,
            }}>
              <div style={{ fontSize: "14px", fontWeight: 800, color: p.color, marginBottom: "2px" }}>{p.name}</div>
              <div style={{ fontSize: "16px", fontWeight: 900, marginBottom: "10px", color: T.text }}>{p.price}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                {p.features.map((f) => (
                  <div key={f} style={{ fontSize: "12px", fontWeight: 600, color: T.textSub, display: "flex", alignItems: "center", gap: "5px" }}>
                    <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SettingSection>

      {/* Danger zone */}
      <div style={{
        background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.2)",
        borderRadius: "18px", overflow: "hidden",
      }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(239,68,68,0.15)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={17} color="#ef4444" />
            <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#ef4444" }}>Danger Zone</h2>
          </div>
          <p style={{ fontSize: "13px", color: T.textMuted, fontWeight: 500, marginTop: "4px" }}>
            Irreversible actions — proceed with caution
          </p>
        </div>
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Deactivate */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px", color: T.text }}>Deactivate Account</h3>
              <p style={{ fontSize: "13px", color: T.textSub, fontWeight: 500, maxWidth: "400px" }}>
                Temporarily hide your profile from the marketplace. You can reactivate anytime.
              </p>
            </div>
            <button
              onClick={handleDeactivate}
              style={{
                padding: "10px 20px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)",
                color: "#f59e0b", cursor: "pointer", flexShrink: 0,
              }}
            >
              Deactivate
            </button>
          </div>

          <div style={{ borderTop: "1px solid rgba(239,68,68,0.12)", paddingTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
              <div>
                <h3 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px", color: "#ef4444" }}>Delete Account</h3>
                <p style={{ fontSize: "13px", color: T.textSub, fontWeight: 500, maxWidth: "400px" }}>
                  Permanently delete your vendor account, profile, and all data. This cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: "10px 20px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                  color: "#ef4444", cursor: "pointer", flexShrink: 0,
                }}
              >
                Delete Account
              </button>
            </div>

            {confirmDelete && (
              <div style={{
                marginTop: "16px", padding: "20px",
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "12px",
              }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: T.textSub, marginBottom: "12px" }}>
                  Type <strong style={{ color: "#ef4444" }}>DELETE</strong> to confirm account deletion:
                </p>
                <input
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="Type DELETE"
                  style={{ ...inputStyle, marginBottom: "12px", borderColor: "rgba(239,68,68,0.3)" }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => { setConfirmDelete(false); setDeleteText(""); }}
                    style={{
                      padding: "10px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                      border: `1px solid ${T.borderSub}`, background: "none", color: T.textSub, cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteText !== "DELETE"}
                    style={{
                      padding: "10px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 700,
                      background: deleteText === "DELETE" ? "#ef4444" : "rgba(239,68,68,0.1)",
                      color: deleteText === "DELETE" ? "#fff" : "rgba(239,68,68,0.4)",
                      border: "none", cursor: deleteText === "DELETE" ? "pointer" : "not-allowed",
                    }}
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .settings-grid, .settings-grid-3, .plan-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
