import { useState } from "react";
import styles from "./Settings.module.css"; // Import the CSS Module

export function Settings(props) {
  const [formData, setFormData] = useState({
    fullname: props.data.username || props.data.fullname,
    email: props.data.email,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  // --- Your existing functions (unchanged) ---

  function updateProfile(e) {
    e.preventDefault();

    const { fullname, email } = formData;
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/admin/edit_profile", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status === 200) {
        alert("Profile updated successfully!");
      } else {
        alert("Error updating profile.");
      }
    };

    xhr.send(JSON.stringify({ fullname, email }));
  }

  function changePassword(e) {
    e.preventDefault();
    const form = e.target;

    const currentPassword = form.elements.currentPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;
    const newPassword = form.elements.newPassword.value;

    if (newPassword !== confirmPassword) {
      alert("New passwords do not match!");
      form.reset();
      return;
    }

    let xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:3000/admin/change_password", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function () {
      if (xhr.status === 200) {
        alert("Password changed successfully!");
      } else {
        alert("Error changing password.");
      }
    };

    xhr.send(JSON.stringify({ currentPassword, newPassword }));
    form.reset();
  }

  function deleteAccount() {
    if (!window.confirm("Are you sure you want to delete your account?")) return;

    let xhr = new XMLHttpRequest();
    xhr.open("DELETE", "http://localhost:3000/admin/delete_account", true);
    xhr.withCredentials = true;

    xhr.onload = function () {
      if (xhr.status === 200) {
        alert("Account deleted successfully.");
      } else {
        alert("Error deleting account.");
      }
    };

    xhr.send();
  }

  // --- Updated JSX ---

  return (
    <div className={styles.container}>
      <h2>Account Settings</h2>

      {/* General Info */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>General Information</h3>
          <p>Update your name, email, and contact details.</p>
        </div>
        <form onSubmit={updateProfile} className={styles.formBody}>
          <div className={styles.formGroup}>
            <label htmlFor="fullname">Full Name</label>
            <input
              type="text"
              id="fullname"
              name="fullname"
              value={formData.fullname}
              onChange={handleChange}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Save Changes
          </button>
        </form>
      </div>

      {/* Security */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Security & Password</h3>
          <p>Manage your account password and security settings.</p>
        </div>
        <form onSubmit={changePassword} className={styles.formBody}>
          <div className={styles.formGroup}>
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              placeholder="Enter your current password"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            Change Password
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className={styles.dangerZone}>
        <div className={styles.dangerHeader}>
          <h3>Danger Zone</h3>
          <p>Actions in this section are irreversible and affect your account directly.</p>
        </div>
        <button
          type="button"
          onClick={deleteAccount}
          className={`${styles.btn} ${styles.btnDanger}`}
        >
          {/* Using a Unicode emoji for the trash icon. 
              You can replace this with an icon from react-icons if you use it. */}
          <span>&#128465;</span>
          <span>Delete Account</span>
        </button>
      </div>
    </div>
  );
}