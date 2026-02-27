import { useState, useEffect } from "react";
import * as api from "../api/ownerApi";
import s from "./OwnerSettings.module.css";
import { useToast } from "../components/common/Toast";

export default function OwnerSettings() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [time] = useState(new Date());
  const [form, setForm] = useState({
    name: "", location: "", cuisine: "", phone: "", email: "",
    openingTime: "09:00", closingTime: "23:00", isOpen: true,
    taxRate: 5, serviceCharge: 0, description: ""
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.fetchSettings();
        if (data) {
          setForm(prev => ({
            ...prev,
            name: data.name || "",
            location: data.location || "",
            cuisine: Array.isArray(data.cuisine) ? data.cuisine.join(", ") : (data.cuisine || ""),
            isOpen: data.isOpen !== undefined ? data.isOpen : true,
            openingTime: data.operatingHours?.open || "09:00",
            closingTime: data.operatingHours?.close || "23:00",
            city: data.city || "",
          }));
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        name: form.name,
        isOpen: form.isOpen,
        operatingHours: { open: form.openingTime, close: form.closingTime },
        location: form.location,
        city: form.city || "",
        cuisine: form.cuisine
          ? form.cuisine.split(",").map(c => c.trim()).filter(Boolean)
          : [],
        description: form.description,
        phone: form.phone,
        email: form.email,
        taxRate: form.taxRate,
        serviceCharge: form.serviceCharge,
      };
      await api.updateSettings(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { toast.error("Failed to save settings"); }
    setSaving(false);
  };

  if (loading) return <div className={s.loader}><div className={s.spinner} /><p>Loading settings…</p></div>;

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <div className={s.heroLeft}>
          <h1 className={s.heroTitle}>⚙️ Settings</h1>
          {form.name && <p className={s.heroRestName}>{form.name}</p>}
          <p className={s.heroDate}>
            {time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            <span className={s.heroTime}>{time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
          </p>
        </div>
        <div className={s.heroRight}>
          <div className={`${s.statusPill} ${form.isOpen ? s.statusOpen : s.statusClosed}`}>
            <span className={s.statusDot} />
            <span>{form.isOpen ? "OPEN" : "CLOSED"}</span>
            <span className={s.statusHours}>{form.openingTime} - {form.closingTime}</span>
          </div>
          {saved && <span className={s.savedBadge}>✓ Saved</span>}
        </div>
      </header>

      <form className={s.form} onSubmit={handleSave}>
        {/* Basic Info */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>🏪 Basic Information</h2>
          <div className={s.grid}>
            <div className={s.field}>
              <label>Restaurant Name</label>
              <input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Your restaurant name" />
            </div>
            <div className={s.field}>
              <label>Cuisine Type</label>
              <input value={form.cuisine} onChange={e => update("cuisine", e.target.value)} placeholder="e.g. Italian, Indian, Chinese" />
            </div>
            <div className={s.field}>
              <label>Location / Address</label>
              <input value={form.location} onChange={e => update("location", e.target.value)} placeholder="Full address" />
            </div>
            <div className={s.field}>
              <label>Phone Number</label>
              <input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+91 9876543210" />
            </div>
            <div className={s.field}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="contact@restaurant.com" />
            </div>
            <div className={`${s.field} ${s.fullWidth}`}>
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={e => update("description", e.target.value)} placeholder="A brief description of your restaurant…" />
            </div>
          </div>
        </section>

        {/* Operating Hours */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>🕐 Operating Hours</h2>
          <div className={s.grid}>
            <div className={s.field}>
              <label>Opening Time</label>
              <input type="time" value={form.openingTime} onChange={e => update("openingTime", e.target.value)} />
            </div>
            <div className={s.field}>
              <label>Closing Time</label>
              <input type="time" value={form.closingTime} onChange={e => update("closingTime", e.target.value)} />
            </div>
            <div className={s.field}>
              <label>Status</label>
              <div className={s.toggleWrap}>
                <button type="button"
                  className={`${s.toggleBtn} ${form.isOpen ? s.toggleOpen : s.toggleClosed}`}
                  onClick={() => update("isOpen", !form.isOpen)}>
                  {form.isOpen ? "🟢 Open for Dining" : "🔴 Closed"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Billing */}
        <section className={s.section}>
          <h2 className={s.sectionTitle}>💰 Billing & Charges</h2>
          <div className={s.grid}>
            <div className={s.field}>
              <label>Tax Rate (GST %)</label>
              <input type="number" min={0} max={50} step={0.5} value={form.taxRate}
                onChange={e => update("taxRate", +e.target.value)} />
            </div>
            <div className={s.field}>
              <label>Service Charge (%)</label>
              <input type="number" min={0} max={30} step={0.5} value={form.serviceCharge}
                onChange={e => update("serviceCharge", +e.target.value)} />
            </div>
          </div>
        </section>

        <div className={s.footer}>
          <button type="submit" className={s.saveBtn} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
