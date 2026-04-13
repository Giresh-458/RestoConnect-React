import { useEffect, useReducer, useRef, useState } from "react";
import { useToast } from "../common/Toast";
import { useConfirm } from "../common/ConfirmDialog";
import { maskEmail } from "../../util/maskEmail";

export default function User() {
  const toast = useToast();
  const confirmDlg = useConfirm();
  const initialState = {
    users_list: [],
    lastaction: "load",
    lastpayload: "users",
  };

  function reducer(state, action) {
    if (action.type === "load") {
      return { users_list: [...action.payload], lastaction: "load", lastpayload: "users" };
    } else if (action.type === "delete") {
      return {
        users_list: state.users_list.filter((u) => u._id !== action.payload),
        lastaction: "delete",
        lastpayload: action.payload,
      };
    } else if (action.type === "suspend") {
      return {
        users_list: state.users_list.map(u => u._id === action.payload.id ? { ...u, isSuspended: true, suspensionEndDate: action.payload.suspensionEndDate || null, suspensionReason: action.payload.suspensionReason || null } : u),
        lastaction: "suspend",
        lastpayload: action.payload.id,
      };
    }
    return state;
  }

  const [state, Dispatch] = useReducer(reducer, initialState);
  const firstRender = useRef(true);
  const [filter, setFilter] = useState({ username: "", role: "" });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [suspensionEndDate, setSuspensionEndDate] = useState("");
  const [suspensionReason, setSuspensionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [suspendError, setSuspendError] = useState("");

  useEffect(() => {
    const xhr = new XMLHttpRequest();
    xhr.open("get", "/api/admin/users", true);
    xhr.onload = function () {
      if (this.status === 200) {
        const data = JSON.parse(xhr.responseText);
        Dispatch({ type: "load", payload: data });
      }
    };
    xhr.withCredentials = true;
    xhr.send();
  }, []);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    if (state.lastaction === "delete") {
      fetch(`/api/admin/users/${state.lastpayload}`, {
        method: "DELETE",
        credentials: "include",
      }).catch(() => {});
    }
  }, [state.lastaction]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

  const handleDelete = (userId, username) => {
    confirmDlg({ title: "Delete User", message: `Are you sure you want to permanently delete user '${username}'? This action cannot be undone.`, variant: "danger", confirmText: "Delete" }).then(ok => {
      if (ok) Dispatch({ type: "delete", payload: userId });
    });
  };

  const openSuspendModal = (user) => {
    setModalUser(user);
    setSuspensionEndDate(user.suspensionEndDate ? new Date(user.suspensionEndDate).toISOString().split('T')[0] : "");
    setSuspensionReason(user.suspensionReason || "");
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setModalUser(null);
    setSuspensionEndDate("");
    setSuspensionReason("");
  };

  const submitSuspend = async () => {
    if (!modalUser) return;
    setSubmitting(true);
    setSuspendError("");
    // Validate date is present and valid (server requires a valid date)
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

    const payload = {
      suspensionEndDate: suspensionEndDate,
      suspensionReason: suspensionReason || null
    };

    try {
      const resp = await fetch(`/api/admin/users/${modalUser._id}/suspension`, {
        method: 'PATCH',
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
      Dispatch({ type: 'suspend', payload: { id: modalUser._id, suspensionEndDate: payload.suspensionEndDate, suspensionReason: payload.suspensionReason } });
      // success — clear any error and close modal
      setSuspendError("");
      closeModal();
    } catch (e) {
      console.error(e);
      setSuspendError('Network or server error while suspending');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsuspend = async (user) => {
    const ok = await confirmDlg({ title: "Unsuspend User", message: `Unsuspend user '${user.username}'?`, variant: "warning", confirmText: "Unsuspend" });
    if (!ok) return;
    try {
      const resp = await fetch(`/api/admin/users/${user._id}/suspension/clear`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({ error: 'Server error' }));
        toast.error('Error: ' + (err.error || 'Failed to unsuspend'));
        return;
      }
      // Update UI to reflect unsuspension
      Dispatch({ type: 'load', payload: state.users_list.map(u => u._id === user._id ? { ...u, isSuspended: false, suspensionEndDate: null, suspensionReason: null } : u) });
      toast.success('User unsuspended');
    } catch (e) {
      console.error(e);
      toast.error('Network or server error while unsuspending');
    }
  };

  // --- Styles resembling the provided dashboard ---
  const styles = {
    container: {
      fontFamily: "Inter, Arial, sans-serif",
      padding: "30px",
      backgroundColor: "#f9fafb",
      minHeight: "100vh",
    },
    title: {
      fontSize: "1.8rem",
      fontWeight: "600",
      color: "#111827",
      marginBottom: "25px",
    },
    statsContainer: {
      display: "flex",
      gap: "20px",
      marginBottom: "25px",
    },
    statCard: {
      backgroundColor: "white",
      flex: 1,
      padding: "20px",
      borderRadius: "12px",
      textAlign: "center",
      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    },
    statNumber: {
      fontSize: "1.8rem",
      fontWeight: "600",
      color: "#2563eb",
    },
    statLabel: {
      color: "#6b7280",
      fontSize: "0.95rem",
      marginTop: "6px",
    },
    toolbar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "15px",
    },
    searchInput: {
      padding: "8px 12px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      fontSize: "1rem",
      width: "250px",
    },
    select: {
      padding: "8px 12px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      fontSize: "1rem",
    },
    addButton: {
      backgroundColor: "#2563eb",
      color: "white",
      padding: "8px 14px",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontWeight: "500",
    },
    tableContainer: {
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
      overflow: "hidden",
      height: "400px",
      overflowY: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    th: {
      textAlign: "left",
      padding: "12px 20px",
      backgroundColor: "#f3f4f6",
      color: "#374151",
      fontWeight: "600",
      fontSize: "0.95rem",
      borderBottom: "1px solid #e5e7eb",
      position: "sticky",
      top: 0,
    },
    td: {
      padding: "12px 20px",
      borderBottom: "1px solid #e5e7eb",
      color: "#4b5563",
      fontSize: "0.95rem",
    },
    actionButton: {
      border: "none",
      borderRadius: "6px",
      padding: "6px 10px",
      cursor: "pointer",
      fontSize: "0.9rem",
      fontWeight: "500",
    },
    deleteBtn: {
      backgroundColor: "#ef4444",
      color: "white",
      marginRight: "8px",
    },
    updateBtn: {
      backgroundColor: "#3b82f6",
      color: "white",
    },
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Management</h2>

      {/* Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{state.users_list.length}</div>
          <div style={styles.statLabel}>Total Users</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>
            {state.users_list.filter((u) => u.role.toLowerCase() === "owner").length}
          </div>
          <div style={styles.statLabel}>Owners</div>
        </div>
      </div>

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <div>
          <input
            style={styles.searchInput}
            type="text"
            name="username"
            placeholder="Search users..."
            onChange={handleChange}
          />
          <select style={styles.select} name="role" onChange={handleChange}>
            <option value="">All Roles</option>
            <option value="customer">Customer</option>
            <option value="owner">Owner</option>
            <option value="staff">Staff</option>
          </select>
        </div>
      </div>

      {/* User List */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>User Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.users_list
              .filter((user) => {
                const nameFilter = filter.username.toLowerCase();
                const roleFilter = filter.role.toLowerCase();
                return (
                  (nameFilter === "" ||
                    user.username.toLowerCase().includes(nameFilter)) &&
                  (roleFilter === "" ||
                    user.role.toLowerCase() === roleFilter)
                );
              })
              .map((user, i) => (
                <tr key={i}>
                  <td style={styles.td}>{user.username}</td>
                  <td style={styles.td}>{maskEmail(user.email)}</td>
                  <td style={styles.td}>{user.role}</td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.actionButton, ...styles.deleteBtn }}
                      onClick={() => handleDelete(user._id, user.username)}
                    >
                      Delete
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.updateBtn }}
                      onClick={() => user.isSuspended ? handleUnsuspend(user) : openSuspendModal(user)}
                      disabled={submitting}
                      title={user.isSuspended ? 'Click to unsuspend' : 'Suspend user'}
                    >
                      {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      {/* Suspend Modal */}
      {modalOpen && modalUser && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: 420, background: 'white', borderRadius: 8, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Suspend {modalUser.username}</h3>
            <div style={{ marginBottom: 10 }}>
              <label>End date (required)</label>
              <input type="date" value={suspensionEndDate} onChange={e=>{ setSuspensionEndDate(e.target.value); }} style={{ width: '100%', padding: 8, marginTop: 6 }} />
              {suspendError && (
                <div style={{ color: '#b91c1c', marginTop: 8, fontSize: '0.95rem' }}>{suspendError}</div>
              )}
            </div>
            
            <div style={{ marginBottom: 10 }}>
              <label>Reason (optional)</label>
              <textarea value={suspensionReason} onChange={e=>setSuspensionReason(e.target.value)} style={{ width: '100%', padding: 8, marginTop: 6 }} rows={3} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} disabled={submitting} style={{ padding: '8px 12px', borderRadius: 6 }}>Cancel</button>
              <button onClick={submitSuspend} disabled={submitting} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', borderRadius: 6 }}>{submitting ? 'Suspending...' : 'Suspend'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
