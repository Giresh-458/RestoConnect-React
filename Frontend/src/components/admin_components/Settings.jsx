import { useState } from "react";
import styles from "./Settings.module.css"; // Import the CSS Module

export function Settings(props) {
  const [formData, setFormData] = useState({
    username: props.data.username || props.data.fullname,
    email: props.data.email,
  });
  const [profileMsg, setProfileMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);
  const [submittingPwd, setSubmittingPwd] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [modalPassword, setModalPassword] = useState('');
  const [modalError, setModalError] = useState('');
  const [profilePassword, setProfilePassword] = useState('');

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  }

  async function updateProfile(e) {
    e.preventDefault();
    setProfileMsg('');
    setProfileError('');
    setSubmittingProfile(true);
    const { username, email } = formData;
    // Only require/send current password if username or email actually changed
    const originalUsername = props.data?.username || '';
    const originalEmail = props.data?.email || '';
    const changed = username !== originalUsername || email !== originalEmail;
    const currentPassword = changed ? profilePassword : '';
    if (changed && !currentPassword) {
      // Open modal to request current password before submitting
      setSubmittingProfile(false);
      setModalPassword('');
      setModalError('');
      setConfirmModalOpen(true);
      return;
    }

    const body = changed ? { username, email, currentPassword } : { username, email };

    try {
      const res = await fetch('http://localhost:3000/admin/edit_profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setProfileMsg(data.message || 'Profile updated successfully');
        setProfileError('');
      } else {
        setProfileError(data.error || 'Error updating profile');
        setProfileMsg('');
      }
    } catch (err) {
      console.error(err);
      setProfileError('Network error while updating profile');
      setProfileMsg('');
    } finally {
      setSubmittingProfile(false);
    }
  }

  async function confirmModalSubmit() {
    setModalError('');
    if (!modalPassword) {
      setModalError('Please enter your current password');
      return;
    }
    setSubmittingProfile(true);
    const { username, email } = formData;
    try {
      const res = await fetch('http://localhost:3000/admin/edit_profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, currentPassword: modalPassword })
      });
      if (res.ok) {
        setProfileMsg('Profile updated successfully');
        // keep profilePassword in sync so component state reflects the confirmed password
        setProfilePassword(modalPassword);
        setModalPassword('');
        setConfirmModalOpen(false);
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.error || 'Error updating profile');
      }
    } catch (err) {
      console.error(err);
      setModalError('Network error while updating profile');
    } finally {
      setSubmittingProfile(false);
    }
  }

  function changePassword(e) {
    e.preventDefault();
    const form = e.target;
    setPwdMsg('');
    setPwdError('');
    setSubmittingPwd(true);
    const currentPassword = form.elements.pwdCurrentPassword.value;
    const confirmPassword = form.elements.confirmPassword.value;
    const newPassword = form.elements.newPassword.value;

    if (newPassword !== confirmPassword) {
      setPwdError('New passwords do not match');
      form.reset();
      setSubmittingPwd(false);
      return;
    }

    fetch('http://localhost:3000/admin/change_password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    }).then(async (res) => {
      if (res.ok) {
        setPwdMsg('Password changed successfully');
      } else {
        const data = await res.json().catch(() => ({}));
        setPwdError(data.error || 'Error changing password');
      }
    }).catch(err => {
      console.error(err);
      setPwdError('Network error while changing password');
    }).finally(() => { form.reset(); setSubmittingPwd(false); });
  }

  function deleteAccount() {
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    fetch('http://localhost:3000/admin/delete_account', {
      method: 'DELETE',
      credentials: 'include'
    }).then(async (res) => {
      if (res.ok) {
        // redirect to login or home
        window.location.href = '/login';
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Error deleting account');
      }
    }).catch(err => {
      console.error(err);
      alert('Network error while deleting account');
    });
  }

  // --- Updated JSX ---
  const originalUsername = props.data?.username || '';
  const originalEmail = props.data?.email || '';
  const profileChanged = formData.username !== originalUsername || formData.email !== originalEmail;

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
            <label htmlFor="username">Full Name</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
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

          {profileChanged && (
            <div className={styles.formGroup}>
              <label htmlFor="profileCurrentPassword">Confirm Current Password</label>
              <input
                type="password"
                id="profileCurrentPassword"
                name="profileCurrentPassword"
                placeholder="Enter current password to confirm"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>
            {submittingProfile ? 'Saving...' : 'Save Changes'}
          </button>
          {profileMsg && <div style={{ color: 'green', marginTop: 8 }}>{profileMsg}</div>}
          {profileError && <div style={{ color: 'red', marginTop: 8 }}>{profileError}</div>}
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
            <label htmlFor="pwdCurrentPassword">Current Password</label>
            <input
              type="password"
              id="pwdCurrentPassword"
              name="pwdCurrentPassword"
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
            {submittingPwd ? 'Changing...' : 'Change Password'}
          </button>
          {pwdMsg && <div style={{ color: 'green', marginTop: 8 }}>{pwdMsg}</div>}
          {pwdError && <div style={{ color: 'red', marginTop: 8 }}>{pwdError}</div>}
        </form>
      </div>

      {/* Confirmation Modal (asks for current password when needed) */}
      {confirmModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} role="dialog" aria-modal="true">
            <h4>Confirm Profile Changes</h4>
            <p>Please enter your current password to confirm the changes.</p>
            <input
              type="password"
              value={modalPassword}
              onChange={(e) => setModalPassword(e.target.value)}
              placeholder="Current password"
              aria-label="Current password"
            />
            {modalError && <div style={{ color: 'red', marginTop: 8 }}>{modalError}</div>}
            <div style={{ marginTop: 12 }}>
              <button className={styles.btn} onClick={() => setConfirmModalOpen(false)}>Cancel</button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={confirmModalSubmit} style={{ marginLeft: 8 }}>
                {submittingProfile ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

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