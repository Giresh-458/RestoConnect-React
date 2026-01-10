import { useRef, useState } from "react";
import styles from "./RestaurantSubPage.module.css";

export function RestaurantEdit(props) {
  const restaurant = props.restaurant;
  const diagref = useRef(null);
  const [suspensionEndDate, setSuspensionEndDate] = useState(
    restaurant.suspensionEndDate ? new Date(restaurant.suspensionEndDate).toISOString().split('T')[0] : ''
  );
  const [suspensionReason, setSuspensionReason] = useState(restaurant.suspensionReason || '');
  const [submitting, setSubmitting] = useState(false);
  const [suspendError, setSuspendError] = useState('');

  const openDialog = () => {
    setSuspendError('');
    if (diagref.current) {
      diagref.current.showModal();
    }
  };

  const closeDialog = () => {
    if (diagref.current) diagref.current.close();
    setSuspensionEndDate('');
    setSuspensionReason('');
    setSuspendError('');
  };

  const submitSuspend = async () => {
    setSubmitting(true);
    setSuspendError('');
    if (!suspensionEndDate) {
      setSuspendError('Please provide a valid suspension end date.');
      setSubmitting(false);
      return;
    }
    const parsed = new Date(suspensionEndDate);
    if (isNaN(parsed.getTime())) {
      setSuspendError('Please provide a valid suspension end date.');
      setSubmitting(false);
      return;
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (parsed < startOfToday) {
      setSuspendError('Suspension end date must be today or later.');
      setSubmitting(false);
      return;
    }

    const payload = { suspensionEndDate, suspensionReason: suspensionReason || null };
    try {
      const resp = await fetch(`http://localhost:3000/admin/suspend_restaurant/${restaurant._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({ error: 'Server error' }));
        setSuspendError('Error: ' + (err.error || 'Failed to suspend'));
        setSubmitting(false);
        return;
      }

      // update UI
      props.Dispatch({ type: 'edit', payload: { ...restaurant, isSuspended: true, suspensionEndDate: suspensionEndDate, suspensionReason: suspensionReason || null } });
      closeDialog();
    } catch (e) {
      console.error(e);
      setSuspendError('Network or server error while suspending');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm(`Unsuspend restaurant '${restaurant.name}'?`)) return;
    try {
      const resp = await fetch(`http://localhost:3000/admin/unsuspend_restaurant/${restaurant._id}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({ error: 'Server error' }));
        alert('Error: ' + (err.error || 'Failed to unsuspend'));
        return;
      }
      props.Dispatch({ type: 'edit', payload: { ...restaurant, isSuspended: false, suspensionEndDate: null, suspensionReason: null } });
    } catch (e) {
      console.error(e);
      alert('Network or server error while unsuspending');
    }
  };

  if (!restaurant) {
    return <button disabled>No Data</button>;
  }

  return (
    <>
      {!restaurant.isSuspended ? (
        <>
          <button onClick={openDialog} className={styles.updateBtn}>
            Suspend
          </button>

          <dialog ref={diagref} className={styles.editDialog}>
            <div className={styles.dialogHeader}>
              <h2>Suspend {restaurant.name}</h2>
            </div>

            <div className={styles.editForm}>
              <div style={{ marginBottom: 10 }}>
                <label>End date (required)</label>
                <input type="date" value={suspensionEndDate} onChange={e=>setSuspensionEndDate(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} />
                {suspendError && (
                  <div style={{ color: '#b91c1c', marginTop: 8, fontSize: '0.95rem' }}>{suspendError}</div>
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <label>Reason (optional)</label>
                <textarea value={suspensionReason} onChange={e=>setSuspensionReason(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} rows={3} />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={closeDialog} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
                <button onClick={submitSuspend} disabled={submitting} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', borderRadius: 6 }}>{submitting ? 'Suspending...' : 'Suspend'}</button>
              </div>
            </div>
          </dialog>
        </>
      ) : (
        <button onClick={handleUnsuspend} className={styles.updateBtn}>Unsuspend</button>
      )}
    </>
  );
}
