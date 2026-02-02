import React, { useEffect, useState } from "react";

const TaskTracker = ({ tasks = [], onUpdate }) => {
  
  const [localTasks, setLocalTasks] = useState(tasks);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const normalizeStatus = (status) => {
    if (!status) return "Pending";
    const value = status.toString().toLowerCase();
    if (value === "done") return "Done";
    if (value === "in progress" || value === "in-progress") return "In Progress";
    return "Pending";
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      setUpdatingId(taskId);
      const response = await fetch(
        `http://localhost:3000/staff/tasks/${taskId}`,
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
            (task._id || task.id) === taskId ? { ...task, status: newStatus } : task
          )
        );
        onUpdate?.();
      } else {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert('Failed to update task. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status) => {
    switch (normalizeStatus(status)) {
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
    const value = priority?.toString().toLowerCase();
    switch (value) {
      case "high":
        return "priority-high";
      case "urgent":
        return "priority-urgent";
      case "medium":
        return "priority-medium";
      default:
        return "";
    }
  };

  const pendingTasks = localTasks.filter(
    (task) => normalizeStatus(task.status) !== "Done"
  );
  const doneTasks = localTasks.filter(
    (task) => normalizeStatus(task.status) === "Done"
  );

  return (
    <div className="task-tracker-card">
      <h2>Task Tracker</h2>
      <div className="tasks-list">
        {pendingTasks.length > 0 ? (
          pendingTasks.map((task) => (
            <div
              key={task._id || task.id}
              className={`task-item ${getPriorityClass(task.priority)}`}
            >
              <div className="task-left">
                <span className="task-name">{task.name}</span>
                {task.priority && (
                  <span className={`priority-pill ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                )}
              </div>
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
                <button
                  onClick={() => updateTaskStatus(task._id || task.id, "Done")}
                  className={`task-status status-done ${
                    updatingId === (task._id || task.id) ? "task-updating" : ""
                  }`}
                  disabled={updatingId === (task._id || task.id)}
                >
                  Done
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-data">No tasks assigned</p>
        )}
      </div>

      {doneTasks.length > 0 && (
        <div className="tasks-done">
          <h3>Completed</h3>
          <div className="tasks-list">
            {doneTasks.map((task) => (
              <div key={task._id || task.id} className="task-item task-done">
                <div className="task-left">
                  <span className="task-name task-name-done">{task.name}</span>
                  {task.priority && (
                    <span className={`priority-pill ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>
                <span className="task-status status-done">Done</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskTracker;
