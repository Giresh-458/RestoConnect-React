import React, { useState, useEffect } from 'react';
import { useToast } from '../components/common/Toast';
import { useConfirm } from '../components/common/ConfirmDialog';
import './StaffManagement.css';

const StaffManagement = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [staffList, setStaffList] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    description: '',
    assignedTo: [],
    priority: 'medium'
  });

  const [addStaffForm, setAddStaffForm] = useState({
    username: '',
    password: '',
    email: ''
  });

  const [announcementForm, setAnnouncementForm] = useState({
    message: '',
    priority: 'normal'
  });

  const [shiftForm, setShiftForm] = useState({
    name: '',
    date: '',
    startTime: '',
    endTime: '',
    assignedStaff: []
  });

  const [selectedStaff, setSelectedStaff] = useState('');
  const [staffTasks, setStaffTasks] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch staff list, support messages, and announcements in parallel
      const [staffResponse, messagesResponse, announcementsResponse] = await Promise.all([
        fetch('http://localhost:3000/api/owner/staffManagement', {
          credentials: 'include'
        }),
        fetch('http://localhost:3000/api/owner/support-messages', {
          credentials: 'include'
        }),
        fetch('http://localhost:3000/api/owner/announcements', {
          credentials: 'include'
        })
      ]);

      if (!staffResponse.ok || !messagesResponse.ok || !announcementsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const staffData = await staffResponse.json();
      const messagesData = await messagesResponse.json();
      const announcementsData = await announcementsResponse.json();

      setStaffList(staffData);
      setSupportMessages(messagesData.supportMessages || []);
      setAnnouncements(announcementsData.announcements || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/owner/add-task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(taskForm),
      });

      if (!response.ok) {
        throw new Error('Failed to add task');
      }

      const result = await response.json();
      toast.success(result.message);

      // Refresh task list if a staff member is selected
      if (selectedStaff) {
        handleStaffSelectionForTasks(selectedStaff);
      }

      // Reset form
      setTaskForm({
        description: '',
        assignedTo: [],
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task: ' + error.message);
    }
  };

  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    if (!addStaffForm.username.trim() || !addStaffForm.password.trim()) {
      toast.warn('Username and password are required.');
      return;
    }
    if (!addStaffForm.email.trim()) {
      toast.warn('Email is required for staff accounts.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/owner/staffManagement/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(addStaffForm),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add staff');
      }

      toast.success('Staff added successfully');
      setAddStaffForm({
        username: '',
        password: '',
        email: ''
      });
      fetchInitialData();
    } catch (error) {
      console.error('Error adding staff:', error);
      toast.error('Failed to add staff: ' + error.message);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    const ok = await confirm({ title: 'Remove Staff', message: 'Are you sure you want to remove this staff member?', variant: 'danger', confirmText: 'Remove' });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:3000/api/owner/staffManagement/api/${staffId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove staff');
      }

      toast.success('Staff removed successfully');
      fetchInitialData();
    } catch (error) {
      console.error('Error removing staff:', error);
      toast.error('Failed to remove staff: ' + error.message);
    }
  };

  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/owner/add-announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(announcementForm),
      });

      if (!response.ok) {
        throw new Error('Failed to add announcement');
      }

      const result = await response.json();
      toast.success(result.message);

      // Reset form
      setAnnouncementForm({
        message: '',
        priority: 'normal'
      });

      // Refresh announcements list
      fetchInitialData();
    } catch (error) {
      console.error('Error adding announcement:', error);
      toast.error('Failed to add announcement: ' + error.message);
    }
  };

  const handleShiftSubmit = async (e) => {
    e.preventDefault();
    if (!shiftForm.assignedStaff || shiftForm.assignedStaff.length === 0) {
      toast.warn('Please select at least one staff member for the shift.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/api/owner/add-shift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(shiftForm),
      });

      if (!response.ok) {
        throw new Error('Failed to add shift');
      }

      const result = await response.json();
      toast.success(result.message);

      // Reset form
      setShiftForm({
        name: '',
        date: '',
        startTime: '',
        endTime: '',
        assignedStaff: []
      });
    } catch (error) {
      console.error('Error adding shift:', error);
      toast.error('Failed to add shift: ' + error.message);
    }
  };

  const handleStaffSelection = (staffUsername, type) => {
    if (type === 'task') {
      setTaskForm(prev => ({
        ...prev,
        assignedTo: prev.assignedTo.includes(staffUsername)
          ? prev.assignedTo.filter(s => s !== staffUsername)
          : [...prev.assignedTo, staffUsername]
      }));
    } else if (type === 'shift') {
      setShiftForm(prev => ({
        ...prev,
        assignedStaff: prev.assignedStaff.includes(staffUsername)
          ? prev.assignedStaff.filter(s => s !== staffUsername)
          : [...prev.assignedStaff, staffUsername]
      }));
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    const ok = await confirm({ title: 'Delete Announcement', message: 'Are you sure you want to delete this announcement?', variant: 'danger', confirmText: 'Delete' });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:3000/api/owner/announcements/${announcementId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      const result = await response.json();
      toast.success(result.message);

      // Refresh announcements list
      fetchInitialData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement: ' + error.message);
    }
  };

  const handleStaffSelectionForTasks = async (staffId) => {
    setSelectedStaff(staffId);
    if (!staffId) {
      setStaffTasks([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/owner/staffManagement/tasks/${staffId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch staff tasks');
      }

      const result = await response.json();
      setStaffTasks(result.tasks || []);
    } catch (error) {
      console.error('Error fetching staff tasks:', error);
      toast.error('Failed to fetch staff tasks: ' + error.message);
    }
  };

  const handleDeleteStaffTask = async (taskId) => {
    const ok = await confirm({ title: 'Delete Task', message: 'Are you sure you want to delete this task?', variant: 'danger', confirmText: 'Delete' });
    if (!ok) return;

    try {
      const response = await fetch(`http://localhost:3000/api/owner/staffManagement/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      const result = await response.json();
      toast.success(result.message);

      // Refresh tasks for selected staff
      if (selectedStaff) {
        handleStaffSelectionForTasks(selectedStaff);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task: ' + error.message);
    }
  };

  if (loading) {
    return <div className="staff-management-loading">Loading staff management...</div>;
  }

  if (error) {
    return (
      <div className="staff-management-error">
        <div className="error">Error: {error}</div>
        <button onClick={fetchInitialData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="staff-management">
      <h1>Staff Management</h1>

      <div className="management-sections">
        {/* Staff List Table */}
        <div className="section staff-list-section">
          <h2>Staff Members</h2>
          {staffList.length === 0 ? (
            <p>No staff members found.</p>
          ) : (
            <div className="staff-table-wrapper">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Status</th>
                    <th>Shifts</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((staff) => (
                    <tr key={staff._id}>
                      <td>{staff.username}</td>
                      <td><span className="staff-status-badge">Active</span></td>
                      <td>{staff.shifts?.length || 0}</td>
                      <td>
                        <button
                          type="button"
                          className="table-action-btn danger"
                          onClick={() => handleDeleteStaff(staff._id)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add Staff Section */}
        <div className="section">
          <h2>Add Staff</h2>
          <form onSubmit={handleAddStaffSubmit} className="management-form">
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={addStaffForm.username}
                onChange={(e) => setAddStaffForm(prev => ({ ...prev, username: e.target.value }))}
                required
                placeholder="e.g., staff.john"
              />
            </div>

            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={addStaffForm.password}
                onChange={(e) => setAddStaffForm(prev => ({ ...prev, password: e.target.value }))}
                required
                placeholder="Create a password"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={addStaffForm.email}
                  onChange={(e) => setAddStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="staff@email.com"
                  required
                />
              </div>
            </div>

            <button type="submit" className="submit-btn">Add Staff</button>
          </form>
        </div>
        {/* Add Task Section */}
        <div className="section">
          <h2>Add Task</h2>
          <form onSubmit={handleTaskSubmit} className="management-form">
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                required
                placeholder="Enter task description"
              />
            </div>

            <div className="form-group">
              <label>Priority:</label>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-group">
              <label>Assign to Staff:</label>
              <div className="staff-checkboxes">
                {staffList.map(staff => (
                  <label key={staff._id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={taskForm.assignedTo.includes(staff.username)}
                      onChange={() => handleStaffSelection(staff.username, 'task')}
                    />
                    {staff.username}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn">Add Task</button>
          </form>
        </div>

        {/* Add Announcement Section */}
        <div className="section">
          <h2>Add Announcement</h2>
          <form onSubmit={handleAnnouncementSubmit} className="management-form">
            <div className="form-group">
              <label>Message:</label>
              <textarea
                value={announcementForm.message}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                required
                placeholder="Enter announcement message"
              />
            </div>

            <div className="form-group">
              <label>Priority:</label>
              <select
                value={announcementForm.priority}
                onChange={(e) => setAnnouncementForm(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <button type="submit" className="submit-btn">Add Announcement</button>
          </form>
        </div>

        {/* View Announcements Section */}
        <div className="section">
          <h2>Current Announcements</h2>
          <div className="announcements-list">
            {announcements.length === 0 ? (
              <p>No announcements yet.</p>
            ) : (
              announcements.map((announcement, index) => (
                <div
                  key={announcement._id || index}
                  className={`announcement-item priority-${announcement.priority}`}
                >
                  <div className="announcement-content">
                    <div className="announcement-header">
                      <span className={`priority-badge priority-${announcement.priority}`}>
                        {announcement.priority}
                      </span>
                      <span className="announcement-date">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="announcement-message">
                      {announcement.message}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteAnnouncement(announcement._id || index)}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Assign Shift Section */}
        <div className="section">
          <h2>Assign Shift</h2>
          <form onSubmit={handleShiftSubmit} className="management-form">
            <div className="form-group">
              <label>Shift Name:</label>
              <input
                type="text"
                value={shiftForm.name}
                onChange={(e) => setShiftForm(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="e.g., Morning Shift"
              />
            </div>

            <div className="form-group">
              <label>Date:</label>
              <input
                type="date"
                value={shiftForm.date}
                onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Time:</label>
                <input
                  type="time"
                  value={shiftForm.startTime}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Time:</label>
                <input
                  type="time"
                  value={shiftForm.endTime}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Assign to Staff:</label>
              <div className="staff-checkboxes">
                {staffList.map(staff => (
                  <label key={staff._id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={shiftForm.assignedStaff.includes(staff.username)}
                      onChange={() => handleStaffSelection(staff.username, 'shift')}
                    />
                    {staff.username}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="submit-btn">Assign Shift</button>
          </form>
        </div>

        {/* View Staff Tasks Section */}
        <div className="section">
          <h2>View Staff Tasks</h2>
          <div className="form-group">
            <label>Select Staff Member:</label>
            <select
              value={selectedStaff}
              onChange={(e) => handleStaffSelectionForTasks(e.target.value)}
            >
              <option value="">Select Staff Member</option>
              {staffList.map(staff => (
                <option key={staff._id} value={staff._id}>
                  {staff.username}
                </option>
              ))}
            </select>
          </div>

          <div className="tasks-list">
            {staffTasks.length === 0 ? (
              <p>{selectedStaff ? 'No tasks assigned to this staff member.' : 'Select a staff member to view their tasks.'}</p>
            ) : (
              staffTasks.map((task, index) => (
                <div key={task._id || index} className="task-item">
                  <div className="task-content">
                    <div className="task-header">
                      <span className={`priority-badge priority-${task.priority}`}>
                        {task.priority}
                      </span>
                      <span className="task-status">
                        Status: {task.status || 'Pending'}
                      </span>
                      <span className="task-date">
                        {new Date(task.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="task-description">
                      {task.description}
                    </div>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={() => handleDeleteStaffTask(task._id || index)}
                  >
                    Delete Task
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Support Messages Section */}
        <div className="section">
          <h2>Support Messages from Staff</h2>
          <div className="support-messages">
            {supportMessages.length === 0 ? (
              <p>No support messages yet.</p>
            ) : (
              supportMessages.map((message, index) => (
                <div key={index} className="support-message">
                  <div className="message-header">
                    <strong>From: {message.from}</strong>
                    <span className="timestamp">
                      {new Date(message.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="message-content">
                    {message.message}
                  </div>
                  <div className="message-status">
                    Status: <span className={`status-${message.status}`}>{message.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffManagement;
