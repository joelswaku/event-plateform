"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, MapPin, Star, CheckCircle, SlidersHorizontal, X,
  ChevronLeft, ChevronRight, Camera, Music, Utensils, Flower,
  Building, Car, ShieldCheck, Lightbulb, Speaker, Scissors,
  Mic, Cake, Mail, Armchair, Theater, Video, Filter,
  BadgeCheck, Clock, LocateFixed, ArrowUpDown,
  SearchX, AlertCircle, RefreshCw
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";
import useT from "@/hooks/useT";

/* ─── Meta ───────────────────────────────────────────────────────────────── */

const CATEGORY_META = {
  "Photography":    { icon: Camera,      color: "#818cf8" },
  "Videography":    { icon: Video,       color: "#a78bfa" },
  "Music & DJ":     { icon: Music,       color: "#4ade80" },
  "Catering":       { icon: Utensils,    color: "#fbbf24" },
  "Flowers & Décor":{ icon: Flower,      color: "#f472b6" },
  "Venue":          { icon: Building,    color: "#38bdf8" },
  "Transportation": { icon: Car,         color: "#fb923c" },
  "Security":       { icon: ShieldCheck, color: "#818cf8" },
  "Lighting":       { icon: Lightbulb,   color: "#fbbf24" },
  "Sound & AV":     { icon: Speaker,     color: "#34d399" },
  "Hair & Makeup":  { icon: Scissors,    color: "#f472b6" },
  "Officiant":      { icon: Mic,         color: "#c084fc" },
  "Cake & Desserts":{ icon: Cake,        color: "#fb923c" },
  "Invitations":    { icon: Mail,        color: "#818cf8" },
  "Rentals":        { icon: Armchair,    color: "#38bdf8" },
  "Entertainment":  { icon: Theater,     color: "#f87171" },
};

const ALL_CATEGORIES = Object.keys(CATEGORY_META);

const SORT_OPTIONS = [
  { value: "default",    label: "Relevance"         },
  { value: "rating",     label: "Highest Rated"     },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "newest",     label: "Newest"            },
];

/* ─── Skeleton ───────────────────────────────────────────────────────────── */

function SkeletonCard({ T }) {
  return (
    <div style={{ ...T.glass, overflow:"hidden" }}>
      <div style={{ height:"120px", background: T.cardBg, borderBottom:`1px solid ${T.borderSub}` }} />
      <div style={{ padding:"18px" }}>
        <div style={{ height:"13px", background: T.hoverBg, borderRadius:"6px", width:"55%", marginBottom:"10px", animation:"pulse 1.5s infinite" }} />
        <div style={{ height:"11px", background: T.cardBg, borderRadius:"6px", width:"40%", marginBottom:"18px", animation:"pulse 1.5s infinite" }} />
        <div style={{ height:"11px", background: T.cardBg, borderRadius:"6px", marginBottom:"8px", animation:"pulse 1.5s infinite" }} />
        <div style={{ height:"11px", background: T.cardBg, borderRadius:"6px", width:"70%", marginBottom:"20px", animation:"pulse 1.5s infinite" }} />
        <div style={{ height:"36px", background: T.cardBg, borderRadius:"10px", animation:"pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

/* ─── Star row ───────────────────────────────────────────────────────────── */

function Stars({ rating, size = 11 }) {
  return (
    <span style={{ display:"inline-flex", gap:"1px" }}>
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? "#f59e0b" : "none"}
          color={i <= Math.round(rating) ? "#f59e0b" : "rgba(255,255,255,0.1)"} />
      ))}
    </span>
  );
}

/* ─── Vendor Card ────────────────────────────────────────────────────────── */

function VendorCard({ vendor, T }) {
  const router   = useRouter();
  const meta     = CATEGORY_META[vendor.category] || { color:"#818cf8" };
  const initial  = (vendor.business_name?.[0] || "V").toUpperCase();
  const location = [vendor.city, vendor.country].filter(Boolean).join(", ") || "—";
  const verified = vendor.verification_status === "verified";
  const price    = vendor.base_price;
  const currency = vendor.currency || "USD";
  const rating   = parseFloat(vendor.rating) || 0;

  return (
    <div
      onClick={() => router.push(`/vendor/${vendor.slug}`)}
      style={{ ...T.glass, overflow:"hidden", transition:"all 0.22s", display:"flex", flexDirection:"column", cursor:"pointer" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = T.glassBorder; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 20px 48px rgba(0,0,0,0.4)`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>

      {/* Cover */}
      <div style={{ height:"116px", background:`linear-gradient(160deg, ${T.cardBg} 0%, ${T.pageBg} 100%)`, borderBottom:`1px solid ${T.borderSub}`, position:"relative", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {/* Subtle category color bloom */}
        <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at 70% 30%, ${meta.color}08 0%, transparent 60%)`, pointerEvents:"none" }} />

        {vendor.logo_url ? (
          <img src={vendor.logo_url} alt={vendor.business_name} style={{ width:"52px", height:"52px", borderRadius:"14px", objectFit:"cover", border:`1px solid ${T.border}` }} />
        ) : (
          <div style={{ width:"52px", height:"52px", borderRadius:"14px", background: T.hoverBg, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px", fontWeight:700, color:meta.color, letterSpacing:"-0.02em" }}>
            {initial}
          </div>
        )}

        {/* Verified pill — top right */}
        {verified && (
          <div style={{ position:"absolute", top:"10px", right:"10px", display:"flex", alignItems:"center", gap:"4px", padding:"3px 9px", borderRadius:"100px", border:"1px solid rgba(129,140,248,0.28)", fontSize:"10px", fontWeight:500, color:"#818cf8" }}>
            <BadgeCheck size={9} /> Verified
          </div>
        )}

        {/* Category — top left */}
        <div style={{ position:"absolute", top:"10px", left:"10px", padding:"3px 9px", borderRadius:"100px", border:`1px solid ${meta.color}28`, fontSize:"10px", fontWeight:500, color:meta.color }}>
          {vendor.category}
        </div>
      </div>

      {/* Body */}
      <div style={{ padding:"16px 18px 18px", flex:1, display:"flex", flexDirection:"column" }}>
        <h3 style={{ fontSize:"15px", fontWeight:600, letterSpacing:"-0.015em", marginBottom:"4px", lineHeight:1.3 }}>{vendor.business_name}</h3>

        <div style={{ display:"flex", alignItems:"center", gap:"4px", fontSize:"11px", color: T.textMuted, marginBottom:"10px" }}>
          <MapPin size={9} /> {location}
        </div>

        {vendor.tagline && (
          <p style={{ fontSize:"12px", color: T.textMuted, lineHeight:1.65, fontWeight:400, marginBottom:"12px", flex:1, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
            {vendor.tagline}
          </p>
        )}

        {/* Stars */}
        <div style={{ display:"flex", alignItems:"center", gap:"5px", marginBottom:"14px" }}>
          <Stars rating={rating} size={11} />
          <span style={{ fontSize:"12px", fontWeight:600, color:"#f59e0b" }}>{rating.toFixed(1)}</span>
          <span style={{ fontSize:"11px", color: T.textFaint }}>({vendor.review_count || 0})</span>
        </div>

        {/* Price row */}
        {price != null && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"10px 12px", background: T.cardBg, border:`1px solid ${T.borderSub}`, borderRadius:"10px", marginBottom:"14px" }}>
            <span style={{ fontSize:"10px", color: T.textMuted, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.06em" }}>Starting from</span>
            <span style={{ fontSize:"16px", fontWeight:700, color:"#4ade80", letterSpacing:"-0.02em", textShadow:"0 0 8px rgba(74,222,128,0.18)" }}>
              {currency} {Number(price).toLocaleString()}
            </span>
          </div>
        )}

        {/* Dual action buttons */}
        <div style={{ display:"flex", gap:"8px" }}>
          <Link
            href={`/vendor/${vendor.slug}`}
            onClick={(e) => e.stopPropagation()}
            style={{ flex:1, display:"block", textAlign:"center", padding:"9px 6px", borderRadius:"10px", fontSize:"12px", fontWeight:600, color: T.textSub, background: T.hoverBg, border:`1px solid ${T.border}`, textDecoration:"none", letterSpacing:"-0.01em", transition:"color 0.18s, border-color 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.borderHover; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = T.textSub; e.currentTarget.style.borderColor = T.border; }}>
            View Profile
          </Link>
          <Link
            href={`/vendor/${vendor.slug}/quote`}
            onClick={(e) => e.stopPropagation()}
            style={{ flex:1, display:"block", textAlign:"center", padding:"9px 6px", borderRadius:"10px", fontSize:"12px", fontWeight:600, color:"#fff", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", textDecoration:"none", letterSpacing:"-0.01em", transition:"opacity 0.18s" }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity="0.88"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity="1"; }}>
            Get Quote
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Sidebar content ────────────────────────────────────────────────────── */

function SidebarContent({ T, selectedCategories, toggleCategory, setSelectedCategories, location, setLocation, minRating, setMinRating, minPrice, setMinPrice, maxPrice, setMaxPrice, verifiedOnly, setVerifiedOnly, setPage, hasFilters, clearFilters }) {

  const labelStyle = { fontSize:"10px", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.09em", color: T.textFaint, marginBottom:"12px", display:"block" };
  const inputStyle = { background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius:"10px", color: T.text, outline:"none", fontFamily:"inherit", padding:"9px 12px", fontSize:"13px", fontWeight:400, width:"100%", boxSizing:"border-box" };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"28px" }}>

      {/* Category */}
      <div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"12px" }}>
          <span style={labelStyle}>Category</span>
          {selectedCategories.length > 0 && (
            <button onClick={() => { setSelectedCategories([]); setPage(1); }} style={{ background:"none", border:"none", color:"#818cf8", fontSize:"11px", fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}>Clear</button>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:"2px", maxHeight:"224px", overflowY:"auto", paddingRight:"4px" }} className="cat-scroll">
          {ALL_CATEGORIES.map((cat) => {
            const { icon: Icon, color } = CATEGORY_META[cat];
            const active = selectedCategories.includes(cat);
            return (
              <button key={cat} onClick={() => { toggleCategory(cat); }}
                style={{ display:"flex", alignItems:"center", gap:"9px", padding:"7px 10px", borderRadius:"9px", cursor:"pointer", background:active ? `${color}0d` : "transparent", border:`1px solid ${active ? color+"25" : "transparent"}`, transition:"all 0.15s", fontFamily:"inherit", width:"100%", textAlign:"left" }}>
                <div style={{ width:"26px", height:"26px", borderRadius:"7px", background:active ? `${color}18` : T.hoverBg, border:`1px solid ${active ? color+"28" : T.border}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, transition:"all 0.15s" }}>
                  <Icon size={13} color={active ? color : T.textMuted} strokeWidth={1.5} />
                </div>
                <span style={{ fontSize:"12px", fontWeight:500, color:active ? T.text : T.textSub, flex:1 }}>{cat}</span>
                {active && <CheckCircle size={12} color={color} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location */}
      <div>
        <span style={labelStyle}>Location</span>
        <div style={{ position:"relative" }}>
          <LocateFixed size={13} style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} color={T.textFaint} />
          <input type="text" value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} placeholder="City, country…"
            style={{ ...inputStyle, paddingLeft:"32px" }} />
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <span style={labelStyle}>Minimum Rating</span>
        <div style={{ display:"flex", gap:"6px" }}>
          {[{ val:0, label:"Any" }, { val:3, label:"3+" }, { val:4, label:"4+" }, { val:4.5, label:"4.5+" }, { val:5, label:"5★" }].map(({ val, label }) => (
            <button key={val} onClick={() => { setMinRating(val); setPage(1); }}
              style={{ flex:1, padding:"8px 4px", borderRadius:"8px", fontSize:"11px", fontWeight:500, border:minRating===val ? "1px solid rgba(245,158,11,0.4)" : `1px solid ${T.borderSub}`, background:minRating===val ? "rgba(245,158,11,0.1)" : T.cardBg, color:minRating===val ? "#f59e0b" : T.textMuted, cursor:"pointer", fontFamily:"inherit" }}>
              {val === 0 ? label : <span style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"2px" }}><Star size={9} fill={minRating===val ? "#f59e0b":"none"} color={minRating===val ? "#f59e0b": T.textMuted} /> {label}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <span style={labelStyle}>Budget Range</span>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
          {[{ val:minPrice, set:setMinPrice, ph:"Min" }, { val:maxPrice, set:setMaxPrice, ph:"Max" }].map(({ val, set, ph }) => (
            <div key={ph} style={{ position:"relative" }}>
              <span style={{ position:"absolute", left:"11px", top:"50%", transform:"translateY(-50%)", fontSize:"12px", color: T.textFaint, pointerEvents:"none", fontWeight:500 }}>$</span>
              <input type="number" value={val} onChange={(e) => { set(e.target.value); setPage(1); }} placeholder={ph}
                style={{ ...inputStyle, paddingLeft:"24px", width:"100%", boxSizing:"border-box" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Verified toggle */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:"12px", fontWeight:500, color: T.textSub, marginBottom:"2px" }}>Verified only</div>
          <div style={{ fontSize:"10px", color: T.textFaint }}>Background-checked vendors</div>
        </div>
        <div onClick={() => { setVerifiedOnly(!verifiedOnly); setPage(1); }}
          style={{ width:"38px", height:"21px", borderRadius:"100px", background:verifiedOnly ? "#4f46e5" : T.glassBorder, position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
          <div style={{ position:"absolute", top:"2.5px", left:verifiedOnly ? "18px" : "2.5px", width:"16px", height:"16px", borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.3)" }} />
        </div>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button onClick={clearFilters}
          style={{ padding:"9px", borderRadius:"9px", fontSize:"12px", fontWeight:500, color: T.textSub, border:`1px solid ${T.borderSub}`, background:"none", cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", justifyContent:"center", gap:"6px", transition:"all 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.glassBorder; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.textSub; e.currentTarget.style.borderColor = T.borderSub; }}>
          <X size={13} /> Clear all filters
        </button>
      )}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function MarketplacePage() {
  const T = useT();
  const [search,             setSearch]             = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [location,           setLocation]           = useState("");
  const [minRating,          setMinRating]          = useState(0);
  const [minPrice,           setMinPrice]           = useState("");
  const [maxPrice,           setMaxPrice]           = useState("");
  const [verifiedOnly,       setVerifiedOnly]       = useState(false);
  const [sort,               setSort]               = useState("default");
  const [page,               setPage]               = useState(1);
  const [mobileFilterOpen,   setMobileFilterOpen]   = useState(false);

  const [vendors, setVendors] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim())              params.set("search",    search.trim());
      if (selectedCategories.length === 1) params.set("category", selectedCategories[0]);
      if (location.trim())            params.set("city",      location.trim());
      if (minRating > 0)              params.set("minRating", minRating);
      if (minPrice)                   params.set("minPrice",  minPrice);
      if (maxPrice)                   params.set("maxPrice",  maxPrice);
      if (verifiedOnly)               params.set("verified",  "true");
      if (sort)                       params.set("sort",      sort);
      params.set("page", page);
      params.set("limit", 9);
      const res = await api.get(`/vendors?${params.toString()}`);
      const d = res.data.data;
      setVendors(d.vendors || []);
      setTotal(d.total   || 0);
      setPages(d.pages   || 1);
    } catch {
      setError("Failed to load vendors. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategories, location, minRating, minPrice, maxPrice, verifiedOnly, sort, page]);

  useEffect(() => {
    const t = setTimeout(fetchVendors, 300);
    return () => clearTimeout(t);
  }, [fetchVendors]);

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setLocation("");
    setMinRating(0);
    setMinPrice("");
    setMaxPrice("");
    setVerifiedOnly(false);
    setPage(1);
  };

  const hasFilters = selectedCategories.length > 0 || location || minRating > 0 || minPrice || maxPrice || verifiedOnly;

  const sidebarProps = { T, selectedCategories, toggleCategory, setSelectedCategories, location, setLocation, minRating, setMinRating, minPrice, setMinPrice, maxPrice, setMaxPrice, verifiedOnly, setVerifiedOnly, setPage, hasFilters, clearFilters };

  /* Active filter chips */
  const activeChips = [
    ...selectedCategories.map((c) => ({ label: c, clear: () => toggleCategory(c) })),
    ...(location      ? [{ label: `📍 ${location}`,          clear: () => { setLocation(""); setPage(1); } }] : []),
    ...(minRating > 0 ? [{ label: `${minRating}★+`,          clear: () => { setMinRating(0); setPage(1); } }] : []),
    ...(minPrice      ? [{ label: `Min $${minPrice}`,         clear: () => { setMinPrice(""); setPage(1); } }] : []),
    ...(maxPrice      ? [{ label: `Max $${maxPrice}`,         clear: () => { setMaxPrice(""); setPage(1); } }] : []),
    ...(verifiedOnly  ? [{ label: "✓ Verified only",          clear: () => { setVerifiedOnly(false); setPage(1); } }] : []),
  ];

  return (
    <div style={{ background: T.pageBg, color: T.text, minHeight:"100vh", fontFamily:"'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <Navbar />

      {/* ══ HEADER ════════════════════════════════════════════════════════════ */}
      <div style={{ position:"relative", paddingTop:"108px", paddingBottom:"36px", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"-150px", left:"50%", transform:"translateX(-50%)", width:"600px", height:"600px", borderRadius:"50%", background:"radial-gradient(circle, rgba(79,70,229,0.08) 0%, transparent 65%)", filter:"blur(40px)", pointerEvents:"none" }} />

        <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"0 32px", position:"relative" }}>
          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color: T.textFaint, marginBottom:"20px" }}>
            <Link href="/" style={{ color: T.textMuted, textDecoration:"none" }}>Home</Link>
            <span>/</span>
            <span style={{ color: T.textSub }}>Marketplace</span>
          </div>

          <h1 style={{ fontSize:"clamp(26px, 4vw, 42px)", fontWeight:700, letterSpacing:"-0.03em", marginBottom:"8px", lineHeight:1.1 }}>
            Discover Event{" "}
            <span style={{ background:"linear-gradient(135deg, #818cf8, #c084fc)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              Vendors
            </span>
          </h1>
          <p style={{ fontSize:"14px", color: T.textMuted, fontWeight:400, marginBottom:"24px" }}>
            {loading ? "Loading…" : `${total} verified professionals across 16 categories`}
          </p>

          {/* Search capsule */}
          <div style={{ maxWidth:"700px", padding:"5px", borderRadius:"16px", background: T.cardBg, border:`1px solid ${T.borderSub}`, backdropFilter:"blur(20px)", display:"flex", alignItems:"center", gap:"0", marginBottom:"16px" }} className="search-cap">
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:"9px", padding:"9px 14px", borderRight:`1px solid ${T.borderSub}` }}>
              <Search size={14} color={T.textFaint} style={{ flexShrink:0 }} />
              <input type="text" placeholder="Search vendors, services…" value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color: T.text, fontSize:"13px", fontFamily:"inherit" }} />
              {search && <button onClick={() => { setSearch(""); setPage(1); }} style={{ background:"none", border:"none", color: T.textMuted, cursor:"pointer", padding:0, display:"flex" }}><X size={13} /></button>}
            </div>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:"9px", padding:"9px 14px" }}>
              <LocateFixed size={14} color={T.textFaint} style={{ flexShrink:0 }} />
              <input type="text" placeholder="City or location…" value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                style={{ flex:1, background:"transparent", border:"none", outline:"none", color: T.text, fontSize:"13px", fontFamily:"inherit" }} />
            </div>
            <button style={{ flexShrink:0, margin:"3px", padding:"9px 20px", borderRadius:"12px", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", color:"#fff", fontSize:"13px", fontWeight:600, border:"none", cursor:"pointer", fontFamily:"inherit", letterSpacing:"-0.01em" }}>
              Search
            </button>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div style={{ display:"flex", gap:"6px", flexWrap:"wrap", alignItems:"center" }}>
              <span style={{ fontSize:"11px", color: T.textFaint, fontWeight:500 }}>Active:</span>
              {activeChips.map(({ label, clear }) => (
                <button key={label} onClick={clear}
                  style={{ display:"inline-flex", alignItems:"center", gap:"5px", padding:"4px 10px", borderRadius:"100px", background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.22)", fontSize:"11px", fontWeight:500, color:"#a78bfa", cursor:"pointer", fontFamily:"inherit" }}>
                  {label} <X size={10} />
                </button>
              ))}
              <button onClick={clearFilters}
                style={{ fontSize:"11px", fontWeight:500, color: T.textMuted, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit", textDecoration:"underline" }}>
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════════════ */}
      <div style={{ maxWidth:"1280px", margin:"0 auto", padding:"0 32px 80px", display:"grid", gridTemplateColumns:"260px 1fr", gap:"24px", alignItems:"start" }} className="market-layout">

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside style={{ ...T.glass, padding:"22px", position:"sticky", top:"80px" }} className="desktop-sidebar">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
              <Filter size={14} color="#818cf8" strokeWidth={1.5} />
              <span style={{ fontSize:"14px", fontWeight:600, letterSpacing:"-0.01em" }}>Filters</span>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} style={{ fontSize:"11px", fontWeight:500, color: T.textMuted, background:"none", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                Clear all
              </button>
            )}
          </div>
          <SidebarContent {...sidebarProps} />
        </aside>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <div>
          {/* Toolbar */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px", gap:"12px", flexWrap:"wrap" }}>
            {/* Mobile filter trigger */}
            <button onClick={() => setMobileFilterOpen(true)}
              style={{ display:"none", alignItems:"center", gap:"7px", padding:"9px 16px", borderRadius:"10px", fontSize:"13px", fontWeight:500, border:`1px solid ${T.border}`, background: T.cardBg, color: T.textSub, cursor:"pointer", fontFamily:"inherit" }}
              className="mob-filter-btn">
              <SlidersHorizontal size={14} /> Filters
              {hasFilters && <span style={{ background:"#4f46e5", borderRadius:"100px", width:"16px", height:"16px", display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:"9px", color:"#fff", fontWeight:700 }}>{activeChips.length}</span>}
            </button>

            <span style={{ fontSize:"13px", color: T.textMuted, fontWeight:400 }}>
              {loading ? "Searching…" : <><span style={{ color: T.text, fontWeight:600 }}>{total}</span> vendors found</>}
            </span>

            {/* Sort dropdown */}
            <div style={{ display:"flex", alignItems:"center", gap:"7px" }}>
              <ArrowUpDown size={12} color={T.textFaint} />
              <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}
                style={{ background: T.selectBg, border:`1px solid ${T.border}`, borderRadius:"9px", color: T.textSub, fontSize:"13px", fontWeight:400, padding:"8px 12px", outline:"none", cursor:"pointer", fontFamily:"inherit" }}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Error — subtle inline banner */}
          {error && (
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"12px", padding:"12px 16px", borderRadius:"14px", marginBottom:"20px", background:"rgba(239,68,68,0.04)", border:"1px solid rgba(239,68,68,0.12)", backdropFilter:"blur(12px)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"30px", height:"30px", borderRadius:"9px", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <AlertCircle size={14} color="#f87171" />
                </div>
                <div>
                  <div style={{ fontSize:"13px", fontWeight:500, color: T.textSub, marginBottom:"1px" }}>Failed to load vendors</div>
                  <div style={{ fontSize:"11px", color: T.textMuted, fontWeight:400 }}>Check your connection and try again.</div>
                </div>
              </div>
              <button onClick={fetchVendors}
                style={{ display:"flex", alignItems:"center", gap:"5px", padding:"7px 13px", borderRadius:"9px", background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.15)", color:"#f87171", fontSize:"11px", fontWeight:600, cursor:"pointer", fontFamily:"inherit", flexShrink:0, letterSpacing:"0.01em" }}>
                <RefreshCw size={11} /> Retry
              </button>
            </div>
          )}

          {/* Grid */}
          {loading ? (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"14px" }} className="cards-grid">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} T={T} />)}
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ ...T.glass, position:"relative", overflow:"hidden", minHeight:"480px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"64px 32px", textAlign:"center" }}>
              {/* Ambient glow */}
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"300px", height:"300px", borderRadius:"50%", background:"radial-gradient(circle, rgba(79,70,229,0.07) 0%, transparent 70%)", filter:"blur(40px)", pointerEvents:"none" }} />
              {/* Decorative rings */}
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"260px", height:"260px", borderRadius:"50%", border:`1px solid ${T.borderSub}`, pointerEvents:"none" }} />
              <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"180px", height:"180px", borderRadius:"50%", border:`1px solid ${T.borderSub}`, pointerEvents:"none" }} />

              <div style={{ position:"relative", width:"52px", height:"52px", borderRadius:"16px", background: T.cardBg, border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:"20px" }}>
                <SearchX size={22} color="rgba(129,140,248,0.6)" strokeWidth={1.5} />
              </div>

              <h3 style={{ position:"relative", fontSize:"18px", fontWeight:600, letterSpacing:"-0.02em", marginBottom:"10px" }}>
                No vendors matched your search
              </h3>
              <p style={{ position:"relative", fontSize:"13px", color: T.textMuted, lineHeight:1.75, maxWidth:"340px", marginBottom:"28px", fontWeight:400 }}>
                We couldn&apos;t find any active vendors matching your current filters. Try widening your search criteria or removing a filter.
              </p>

              <div style={{ position:"relative", display:"flex", gap:"10px", flexWrap:"wrap", justifyContent:"center" }}>
                {hasFilters && (
                  <button onClick={clearFilters}
                    style={{ padding:"10px 22px", borderRadius:"10px", fontSize:"13px", fontWeight:600, background:"linear-gradient(135deg, #4f46e5, #7c3aed)", color:"#fff", border:"none", cursor:"pointer", fontFamily:"inherit", letterSpacing:"-0.01em" }}>
                    Reset All Filters
                  </button>
                )}
                <Link href="/" style={{ padding:"10px 22px", borderRadius:"10px", fontSize:"13px", fontWeight:500, background: T.hoverBg, border:`1px solid ${T.border}`, color: T.textSub, textDecoration:"none" }}>
                  Back to Home
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:"14px" }} className="cards-grid">
              {vendors.map((v) => <VendorCard key={v.id} vendor={v} T={T} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && !loading && (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:"6px", marginTop:"40px" }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                style={{ display:"flex", alignItems:"center", gap:"4px", padding:"8px 14px", borderRadius:"9px", fontSize:"13px", fontWeight:500, border:`1px solid ${T.border}`, background: T.cardBg, color:page===1 ? T.textFaint : T.textSub, cursor:page===1 ? "not-allowed":"pointer", fontFamily:"inherit" }}>
                <ChevronLeft size={14} /> Prev
              </button>

              {[...Array(Math.min(pages, 7))].map((_, i) => {
                const n = i + 1;
                return (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ width:"36px", height:"36px", borderRadius:"9px", fontSize:"13px", fontWeight:500, border:page===n ? "1px solid rgba(99,102,241,0.45)" : `1px solid ${T.borderSub}`, background:page===n ? "rgba(99,102,241,0.15)" : T.cardBg, color:page===n ? "#a78bfa" : T.textSub, cursor:"pointer", fontFamily:"inherit" }}>
                    {n}
                  </button>
                );
              })}

              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
                style={{ display:"flex", alignItems:"center", gap:"4px", padding:"8px 14px", borderRadius:"9px", fontSize:"13px", fontWeight:500, border:`1px solid ${T.border}`, background: T.cardBg, color:page===pages ? T.textFaint : T.textSub, cursor:page===pages ? "not-allowed":"pointer", fontFamily:"inherit" }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ══ MOBILE FILTER DRAWER ══════════════════════════════════════════════ */}
      {mobileFilterOpen && (
        <div style={{ position:"fixed", inset:0, zIndex:200 }} onClick={() => setMobileFilterOpen(false)}>
          <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.7)", backdropFilter:"blur(12px)" }} />
          <div style={{ position:"absolute", bottom:0, left:0, right:0, background: T.pageBg, borderRadius:"20px 20px 0 0", padding:"0 0 env(safe-area-inset-bottom)", maxHeight:"85vh", display:"flex", flexDirection:"column" }}
            onClick={(e) => e.stopPropagation()}>
            {/* Handle */}
            <div style={{ display:"flex", justifyContent:"center", padding:"12px 0 0" }}>
              <div style={{ width:"32px", height:"3px", borderRadius:"100px", background: T.glassBorder }} />
            </div>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"16px 24px 12px" }}>
              <span style={{ fontSize:"16px", fontWeight:600, letterSpacing:"-0.01em" }}>Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} style={{ background:"none", border:"none", color: T.textSub, cursor:"pointer", display:"flex" }}>
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div style={{ flex:1, overflowY:"auto", padding:"0 24px 24px" }}>
              <SidebarContent {...sidebarProps} />
            </div>
            {/* Apply */}
            <div style={{ padding:"16px 24px", borderTop:`1px solid ${T.border}` }}>
              <button onClick={() => setMobileFilterOpen(false)}
                style={{ width:"100%", padding:"14px", borderRadius:"12px", fontSize:"14px", fontWeight:600, color:"#fff", background:"linear-gradient(135deg, #4f46e5, #7c3aed)", border:"none", cursor:"pointer", fontFamily:"inherit" }}>
                Show {total} Vendors
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
        input::placeholder { color: rgba(255,255,255,0.18) !important; }
        input:focus, select:focus { outline: none; }
        select option { background: #1a1825; }
        .search-cap:focus-within { border-color: rgba(99,102,241,0.22) !important; }
        .cat-scroll::-webkit-scrollbar { width: 3px; }
        .cat-scroll::-webkit-scrollbar-track { background: transparent; }
        .cat-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 100px; }
        .cat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.16); }
        @media (max-width: 960px) {
          .market-layout { grid-template-columns: 1fr !important; }
          .desktop-sidebar { display: none !important; }
          .mob-filter-btn { display: flex !important; }
          .cards-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .cards-grid { grid-template-columns: 1fr !important; }
          .search-cap { flex-direction: column !important; }
          .search-cap > div:first-child { border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06); }
        }
      `}</style>
    </div>
  );
}
