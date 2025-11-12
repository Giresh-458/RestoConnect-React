import React, { useState } from "react";

const TaskTracker = ({ tasks = [], onUpdate }) => {
  const [localTasks, setLocalTasks] = useState(tasks);

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:3000/staff/api/tasks/${taskId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        setLocalTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        );
        onUpdate?.();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "Done":
        return "status-done";
      case "In Progress":
        return "status-in-progress";
      case "Pending":
        return "status-pending";
      default:
        return "";
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "high":
        return "priority-high";
      case "urgent":
        return "priority-urgent";
      default:
        return "";
    }
  };

  return (
    <div className="task-tracker-card">
      <h2>Task Tracker</h2>
      <div className="tasks-list">
        {localTasks.length > 0 ? (
          localTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${getPriorityClass(task.priority)}`}
            >
              <span className="task-name">{task.name}</span>
              <div className="task-controls">
                {task.priority && (
                  <span
                    className={`priority-dot ${getPriorityClass(
                      task.priority
                    )}`}
                  >
                    ●
                  </span>
                )}
                <select
                  value={task.status}
                  onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  className={`task-status ${getStatusClass(task.status)}`}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No tasks assigned</p>
        )}
      </div>
    </div>
  );
};

export default TaskTracker;
