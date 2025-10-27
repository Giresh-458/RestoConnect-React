import { useEffect, useReducer, useRef, useState } from "react";

export default function User() {
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
    }
    return state;
  }

  const [state, Dispatch] = useReducer(reducer, initialState);
  const firstRender = useRef(true);
  const [filter, setFilter] = useState({ username: "", role: "" });

  useEffect(() => {
    const xhr = new XMLHttpRequest();
    xhr.open("get", "http://localhost:3000/admin/users", true);
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
      const xhr = new XMLHttpRequest();
      xhr.open("post", `http://localhost:3000/admin/delete_user/${state.lastpayload}`, true);
      xhr.withCredentials = true;
      xhr.send();
    }
  }, [state.lastaction]);

  function handleChange(e) {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  }

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
            {state.users_list.filter((u) => u.role.toLowerCase() === "admin").length}
          </div>
          <div style={styles.statLabel}>Administrators</div>
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
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="owner">Owner</option>
            <option value="chef">Chef</option>
            <option value="waitstaff">Waitstaff</option>
            <option value="driver">Delivery Driver</option>
          </select>
        </div>
        <button style={styles.addButton}>+ Add New User</button>
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
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.role}</td>
                  <td style={styles.td}>
                    <button
                      style={{ ...styles.actionButton, ...styles.deleteBtn }}
                      onClick={() =>
                        Dispatch({ type: "delete", payload: user._id })
                      }
                    >
                      Delete
                    </button>
                    <button
                      style={{ ...styles.actionButton, ...styles.updateBtn }}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
