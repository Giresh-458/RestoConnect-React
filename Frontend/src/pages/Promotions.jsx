import { useState, useEffect } from "react";
import * as api from "../api/ownerApi";
import s from "./Promotions.module.css";

export default function Promotions() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", discountType: "percentage", discountValue: 10, usageLimit: 50, validUntil: "" });

  const load = async () => {
    try {
      const data = await api.fetchPromoCodes();
      setCodes(data.promoCodes || []);
    } catch { setCodes([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createPromoCode(form);
      setShowForm(false);
      setForm({ code: "", discountType: "percentage", discountValue: 10, usageLimit: 50, validUntil: "" });
      load();
    } catch (err) { alert(err.message || "Failed to create promo code"); }
  };

  const handleToggle = async (id) => {
    try { await api.togglePromoCode(id); load(); }
    catch { alert("Failed to toggle promo code"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this promo code?")) return;
    try { await api.deletePromoCodeApi(id); load(); }
    catch { alert("Failed to delete promo code"); }
  };

  if (loading) return <div className={s.loader}><div className={s.spinner} /><p>Loading promotions…</p></div>;

  const active = codes.filter(c => c.isActive);
  const inactive = codes.filter(c => !c.isActive);

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Promotions & Promo Codes</h1>
          <p className={s.subtitle}>{codes.length} total codes · {active.length} active</p>
        </div>
        <button className={s.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ New Code"}
        </button>
      </div>

      {showForm && (
        <form className={s.form} onSubmit={handleCreate}>
          <h3>Create Promo Code</h3>
          <div className={s.formGrid}>
            <div className={s.formGroup}>
              <label>Code</label>
              <input required placeholder="e.g. WELCOME20" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            </div>
            <div className={s.formGroup}>
              <label>Discount Type</label>
              <select value={form.discountType}
                onChange={e => setForm({ ...form, discountType: e.target.value })}>
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div className={s.formGroup}>
              <label>{form.discountType === "percentage" ? "Discount %" : "Discount ₹"}</label>
              <input type="number" required min={1} max={form.discountType === "percentage" ? 100 : undefined} value={form.discountValue}
                onChange={e => setForm({ ...form, discountValue: +e.target.value })} />
            </div>
            <div className={s.formGroup}>
              <label>Max Uses</label>
              <input type="number" required min={1} value={form.usageLimit}
                onChange={e => setForm({ ...form, usageLimit: +e.target.value })} />
            </div>
            <div className={s.formGroup}>
              <label>Expires At</label>
              <input type="date" required value={form.validUntil}
                onChange={e => setForm({ ...form, validUntil: e.target.value })} />
            </div>
          </div>
          <div className={s.formActions}>
            <button type="submit" className={s.submitBtn}>Create Code</button>
          </div>
        </form>
      )}

      {/* Stats Row */}
      <div className={s.statsRow}>
        <div className={s.stat}>
          <span className={s.statVal}>{codes.length}</span>
          <span className={s.statLabel}>Total Codes</span>
        </div>
        <div className={s.stat}>
          <span className={s.statVal}>{active.length}</span>
          <span className={s.statLabel}>Active</span>
        </div>
        <div className={s.stat}>
          <span className={s.statVal}>{inactive.length}</span>
          <span className={s.statLabel}>Inactive</span>
        </div>
        <div className={s.stat}>
          <span className={s.statVal}>{codes.reduce((n, c) => n + (c.usedCount || 0), 0)}</span>
          <span className={s.statLabel}>Total Redemptions</span>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className={s.empty}>
          <p>No promo codes yet</p>
          <p>Create your first promo code to attract more diners!</p>
        </div>
      ) : (
        <div className={s.codeGrid}>
          {codes.map(c => (
            <div key={c._id} className={`${s.codeCard} ${!c.isActive ? s.inactiveCard : ""}`}>
              <div className={s.cardTop}>
                <span className={s.codeText}>{c.code}</span>
                <span className={`${s.badge} ${c.isActive ? s.badgeActive : s.badgeInactive}`}>
                  {c.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <div className={s.cardBody}>
                <div className={s.discount}>
                  {c.discountType === "fixed" ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF`}
                </div>
                <div className={s.meta}>
                  <span>Used: {c.usedCount || 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</span>
                  {c.validUntil && <span>Expires: {new Date(c.validUntil).toLocaleDateString()}</span>}
                </div>
                {c.usageLimit > 0 && (
                  <div className={s.progressWrap}>
                    <div className={s.progressBar} style={{ width: `${Math.min(100, ((c.usedCount || 0) / c.usageLimit) * 100)}%` }} />
                  </div>
                )}
              </div>
              <div className={s.cardActions}>
                <button className={c.isActive ? s.pauseBtn : s.activateBtn} onClick={() => handleToggle(c._id)}>
                  {c.isActive ? "⏸ Pause" : "▶ Activate"}
                </button>
                <button className={s.deleteBtn} onClick={() => handleDelete(c._id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
