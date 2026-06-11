"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  Save, Upload, Plus, Trash2, Edit2, X, Globe, Loader2, GripVertical
} from "lucide-react";
import { useVendorStore } from "@/store/vendor.store";
import useT from "@/hooks/useT";

const ALL_CATEGORIES = [
  "Catering", "Photography", "Videography", "Music & DJ", "Flowers & Décor",
  "Venue", "Transportation", "Security", "Lighting", "Sound & AV",
  "Hair & Makeup", "Officiant", "Cake & Desserts", "Invitations", "Rentals", "Entertainment",
];

const TABS = ["Basic Info", "Portfolio", "Services", "Contact"];

const GRADIENT_POOL = [
  "linear-gradient(135deg, #6366f1, #a78bfa)",
  "linear-gradient(135deg, #10b981, #34d399)",
  "linear-gradient(135deg, #f59e0b, #fbbf24)",
  "linear-gradient(135deg, #f43f5e, #fb7185)",
  "linear-gradient(135deg, #0ea5e9, #38bdf8)",
  "linear-gradient(135deg, #a78bfa, #c084fc)",
];

export default function ProfileEditorPage() {
  const T = useT();
  const { vendor, updateProfile, fetchMe } = useVendorStore();
  const [activeTab, setActiveTab] = useState("Basic Info");
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(vendor?.category || "");
  const [services, setServices] = useState(Array.isArray(vendor?.services) ? vendor.services : []);
  const [portfolio, setPortfolio] = useState(Array.isArray(vendor?.portfolio) ? vendor.portfolio : []);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingServiceIdx, setEditingServiceIdx] = useState(null);
  const [serviceForm, setServiceForm] = useState({ name: "", description: "", price: "" });

  const inputStyle = {
    width: "100%", padding: "12px 14px",
    background: T.cardBgSolid, border: `1px solid ${T.inputBorder}`,
    borderRadius: "10px", fontSize: "14px", fontWeight: 600, color: T.text,
    outline: "none",
  };

  // Keep services/portfolio in sync if vendor changes
  useEffect(() => {
    if (vendor) {
      if (Array.isArray(vendor.services)) setServices(vendor.services);
      if (Array.isArray(vendor.portfolio)) setPortfolio(vendor.portfolio);
      setSelectedCategory(vendor.category || "");
    }
  }, [vendor]);

  const socialLinks = vendor?.social_links || {};

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: {
      business_name: vendor?.business_name || "",
      tagline: vendor?.tagline || "",
      bio: vendor?.bio || "",
      city: vendor?.city || "",
      country: vendor?.country || "",
      service_area: vendor?.service_area || "",
      email: vendor?.email || "",
      phone: vendor?.phone || "",
      website_url: vendor?.website_url || "",
      instagram: socialLinks.instagram || "",
      facebook: socialLinks.facebook || "",
      linkedin: socialLinks.linkedin || "",
      tiktok: socialLinks.tiktok || "",
    },
  });

  // Reset form when vendor loads
  useEffect(() => {
    if (vendor) {
      const sl = vendor.social_links || {};
      reset({
        business_name: vendor.business_name || "",
        tagline: vendor.tagline || "",
        bio: vendor.bio || "",
        city: vendor.city || "",
        country: vendor.country || "",
        service_area: vendor.service_area || "",
        email: vendor.email || "",
        phone: vendor.phone || "",
        website_url: vendor.website_url || "",
        instagram: sl.instagram || "",
        facebook: sl.facebook || "",
        linkedin: sl.linkedin || "",
        tiktok: sl.tiktok || "",
      });
    }
  }, [vendor?.id]);

  const bioValue = watch("bio", "");

  const onSaveBasic = async (data) => {
    setSaving(true);
    const payload = {
      business_name: data.business_name,
      tagline: data.tagline,
      bio: data.bio,
      category: selectedCategory,
      city: data.city,
      country: data.country,
      service_area: data.service_area,
    };
    const result = await updateProfile(payload);
    setSaving(false);
    if (result.success) {
      toast.success("Profile updated!");
      fetchMe();
    } else {
      toast.error(result.message || "Failed to save");
    }
  };

  const onSaveContact = async (data) => {
    setSaving(true);
    const payload = {
      email: data.email,
      phone: data.phone,
      website_url: data.website_url,
      social_links: {
        instagram: data.instagram || undefined,
        facebook: data.facebook || undefined,
        linkedin: data.linkedin || undefined,
        tiktok: data.tiktok || undefined,
      },
    };
    const result = await updateProfile(payload);
    setSaving(false);
    if (result.success) {
      toast.success("Contact info saved!");
      fetchMe();
    } else {
      toast.error(result.message || "Failed to save");
    }
  };

  const onSaveServices = async () => {
    setSaving(true);
    const result = await updateProfile({ services });
    setSaving(false);
    if (result.success) {
      toast.success("Services saved!");
      fetchMe();
    } else {
      toast.error(result.message || "Failed to save");
    }
  };

  const onSavePortfolio = async () => {
    setSaving(true);
    const result = await updateProfile({ portfolio });
    setSaving(false);
    if (result.success) {
      toast.success("Portfolio saved!");
      fetchMe();
    } else {
      toast.error(result.message || "Failed to save");
    }
  };

  const handleAddService = () => {
    if (!serviceForm.name.trim()) return;
    const newService = { ...serviceForm, price: serviceForm.price ? Number(serviceForm.price) : null, id: editingServiceIdx !== null ? services[editingServiceIdx]?.id : Date.now() };
    if (editingServiceIdx !== null) {
      setServices((prev) => prev.map((s, i) => i === editingServiceIdx ? newService : s));
    } else {
      setServices((prev) => [...prev, newService]);
    }
    setShowServiceModal(false);
    setEditingServiceIdx(null);
    setServiceForm({ name: "", description: "", price: "" });
    toast.success(editingServiceIdx !== null ? "Service updated" : "Service added");
  };

  const handleEditService = (svc, idx) => {
    setEditingServiceIdx(idx);
    setServiceForm({ name: svc.name || "", description: svc.description || "", price: svc.price != null ? String(svc.price) : "" });
    setShowServiceModal(true);
  };

  const removeService = (idx) => {
    setServices((prev) => prev.filter((_, i) => i !== idx));
    toast.success("Service removed");
  };

  const removePortfolioItem = (idx) => {
    setPortfolio((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px", marginBottom: "4px", color: T.text }}>Edit Profile</h1>
          <p style={{ fontSize: "14px", color: T.textMuted, fontWeight: 500 }}>Update your vendor profile and portfolio</p>
        </div>
        {(activeTab === "Basic Info" || activeTab === "Contact") && (
          <button
            onClick={handleSubmit(activeTab === "Contact" ? onSaveContact : onSaveBasic)}
            disabled={saving}
            style={{
              padding: "12px 24px", borderRadius: "11px", fontSize: "14px", fontWeight: 700,
              color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)",
              border: "none", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
            }}
            className="desktop-save-btn"
          >
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "6px", width: "fit-content" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "9px 20px", borderRadius: "9px", fontSize: "14px", fontWeight: 700,
              border: "none", cursor: "pointer",
              background: activeTab === tab ? "linear-gradient(135deg, #6366f1, #a78bfa)" : "transparent",
              color: activeTab === tab ? "#fff" : T.textSub,
              transition: "all 0.2s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Basic Info" && (
        <form onSubmit={handleSubmit(onSaveBasic)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }} className="form-grid-2">
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Business Name</label>
              <input {...register("business_name")} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Tagline</label>
              <input {...register("tagline")} placeholder="Short, memorable description..." style={inputStyle} />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub }}>Bio</label>
              <span style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600 }}>{bioValue.length}/500</span>
            </div>
            <textarea {...register("bio", { maxLength: 500 })} rows={6} placeholder="Tell organizers about your background, style, and experience..." style={{ ...inputStyle, resize: "vertical" }} />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "10px" }}>Category</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {ALL_CATEGORIES.map((cat) => (
                <button type="button" key={cat} onClick={() => setSelectedCategory(cat)} style={{
                  padding: "7px 14px", borderRadius: "100px", fontSize: "13px", fontWeight: 700,
                  border: selectedCategory === cat ? "1px solid rgba(99,102,241,0.5)" : `1px solid ${T.borderSub}`,
                  background: selectedCategory === cat ? "rgba(99,102,241,0.15)" : T.inputBg,
                  color: selectedCategory === cat ? "#a78bfa" : T.textSub, cursor: "pointer",
                }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }} className="form-grid-3">
            {[
              { name: "city", label: "City", placeholder: "Paris" },
              { name: "country", label: "Country", placeholder: "France" },
              { name: "service_area", label: "Service Area", placeholder: "France, UK, International" },
            ].map((f) => (
              <div key={f.name}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>{f.label}</label>
                <input {...register(f.name)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
        </form>
      )}

      {activeTab === "Portfolio" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "20px" }} className="portfolio-edit-grid">
            {portfolio.map((item, idx) => {
              const bg = item.url ? `url(${item.url}) center/cover` : (item.gradient || GRADIENT_POOL[idx % GRADIENT_POOL.length]);
              return (
                <div key={item.id || idx} style={{ height: "160px", borderRadius: "14px", overflow: "hidden", background: bg, position: "relative", border: `1px solid ${T.border}` }}>
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
                  <div style={{ position: "absolute", top: "10px", right: "10px" }}>
                    <button onClick={() => removePortfolioItem(idx)} style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(239,68,68,0.8)", border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div style={{ position: "absolute", bottom: "10px", left: "12px", right: "12px" }}>
                    <input
                      value={item.title || ""}
                      onChange={(e) => setPortfolio((prev) => prev.map((p, i) => i === idx ? { ...p, title: e.target.value } : p))}
                      placeholder="Image title..."
                      style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "6px", padding: "5px 10px", fontSize: "12px", fontWeight: 700, color: "#fff", outline: "none", width: "100%" }}
                    />
                  </div>
                </div>
              );
            })}

            {portfolio.length < 6 && (
              <div
                onClick={() => setPortfolio((prev) => [...prev, { id: Date.now(), title: "", gradient: GRADIENT_POOL[prev.length % GRADIENT_POOL.length] }])}
                style={{ height: "160px", borderRadius: "14px", border: "2px dashed rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.05)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", gap: "8px" }}
              >
                <Upload size={24} color="rgba(99,102,241,0.5)" />
                <span style={{ fontSize: "13px", fontWeight: 700, color: T.textMuted }}>Add Image</span>
              </div>
            )}
          </div>
          <p style={{ fontSize: "12px", color: T.textMuted, fontWeight: 600, marginBottom: "16px" }}>
            {portfolio.length}/6 images
          </p>
          <button onClick={onSavePortfolio} disabled={saving} style={{
            padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
            color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none",
            cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px",
          }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Portfolio"}
          </button>
        </div>
      )}

      {activeTab === "Services" && (
        <div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "20px" }}>
            {services.map((svc, idx) => (
              <div key={svc.id || idx} style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "14px", padding: "18px 20px", display: "flex", gap: "16px", alignItems: "flex-start" }}>
                <GripVertical size={18} color={T.textFaint} style={{ marginTop: "2px", flexShrink: 0, cursor: "grab" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 800, color: T.text }}>{svc.name}</h3>
                    {svc.price != null && <span style={{ fontSize: "18px", fontWeight: 900, color: "#6366f1" }}>${Number(svc.price).toLocaleString()}</span>}
                  </div>
                  <p style={{ fontSize: "13px", color: T.textSub, fontWeight: 500 }}>{svc.description}</p>
                </div>
                <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                  <button onClick={() => handleEditService(svc, idx)} style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "8px", padding: "7px", color: "#6366f1", cursor: "pointer" }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => removeService(idx)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "7px", color: "#ef4444", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {services.length < 5 && (
            <button
              onClick={() => { setEditingServiceIdx(null); setServiceForm({ name: "", description: "", price: "" }); setShowServiceModal(true); }}
              style={{ padding: "11px 20px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, color: "#6366f1", border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.07)", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}
            >
              <Plus size={16} /> Add Service
            </button>
          )}
          <button onClick={onSaveServices} disabled={saving} style={{
            padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 700,
            color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none",
            cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px",
          }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Services"}
          </button>
        </div>
      )}

      {activeTab === "Contact" && (
        <form onSubmit={handleSubmit(onSaveContact)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }} className="form-grid-2">
            {[
              { name: "email", label: "Email", placeholder: "you@studio.com", type: "email" },
              { name: "phone", label: "Phone", placeholder: "+1 234 567 8900", type: "tel" },
              { name: "website_url", label: "Website", placeholder: "https://yourstudio.com", type: "url" },
            ].map((f) => (
              <div key={f.name}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>{f.label}</label>
                <input {...register(f.name)} type={f.type || "text"} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <h3 style={{ fontSize: "15px", fontWeight: 800, marginBottom: "14px", color: T.textSub }}>Social Links</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="form-grid-2">
            {[
              { name: "instagram", label: "Instagram", placeholder: "@yourstudio" },
              { name: "facebook", label: "Facebook", placeholder: "yourstudiopage" },
              { name: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/you" },
              { name: "tiktok", label: "TikTok", placeholder: "@yourstudio" },
            ].map((f) => (
              <div key={f.name}>
                <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>{f.label}</label>
                <input {...register(f.name)} placeholder={f.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving} style={{
            marginTop: "28px", padding: "13px 28px", borderRadius: "11px", fontSize: "14px", fontWeight: 700,
            color: "#fff", background: "linear-gradient(135deg, #6366f1, #a78bfa)", border: "none",
            cursor: saving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "8px",
          }}>
            {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            {saving ? "Saving..." : "Save Contact Info"}
          </button>
        </form>
      )}

      {showServiceModal && (
        <div onClick={(e) => e.target === e.currentTarget && setShowServiceModal(false)} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ background: T.cardBgSolid, border: `1px solid ${T.border}`, borderRadius: "20px", padding: "28px", width: "100%", maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: T.text }}>{editingServiceIdx !== null ? "Edit Service" : "Add Service"}</h3>
              <button onClick={() => setShowServiceModal(false)} style={{ background: "none", border: "none", color: T.textMuted, cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Service Name</label>
                <input value={serviceForm.name} onChange={(e) => setServiceForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full-Day Coverage" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Description</label>
                <textarea value={serviceForm.description} onChange={(e) => setServiceForm((p) => ({ ...p, description: e.target.value }))} placeholder="What's included..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: 700, color: T.textSub, display: "block", marginBottom: "6px" }}>Price (USD)</label>
                <input type="number" value={serviceForm.price} onChange={(e) => setServiceForm((p) => ({ ...p, price: e.target.value }))} placeholder="1200" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "8px" }}>
                <button onClick={() => setShowServiceModal(false)} style={{ padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, border: `1px solid ${T.borderSub}`, background: "none", color: T.textSub, cursor: "pointer" }}>Cancel</button>
                <button onClick={handleAddService} style={{ padding: "12px", borderRadius: "10px", fontSize: "14px", fontWeight: 700, background: "linear-gradient(135deg, #6366f1, #a78bfa)", color: "#fff", border: "none", cursor: "pointer" }}>
                  {editingServiceIdx !== null ? "Update" : "Add Service"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          .form-grid-2, .form-grid-3 { grid-template-columns: 1fr !important; }
          .portfolio-edit-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .desktop-save-btn { display: none !important; }
        }
      `}</style>
    </div>
  );
}
