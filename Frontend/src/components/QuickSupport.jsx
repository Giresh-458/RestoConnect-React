import React, { useState } from "react";

const QuickSupport = ({ messages = [], onUpdate }) => {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    setSending(true);
    try {
      const response = await fetch(
        "http://localhost:3000/staff/support-message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ message: message.trim() }),
        }
      );

      if (response.ok) {
        alert("Message sent to manager successfully!");
        setMessage("");
        onUpdate?.();
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert(error.message || "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="quick-support-card">
      <h2>Quick Support</h2>
      <p>Need help or want to contact the manager?</p>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        className="support-textarea"
        rows="4"
        disabled={sending}
      />

      <button
        onClick={handleSendMessage}
        className="send-button"
        disabled={sending || !message.trim()}
      >
        {sending ? "Sending..." : "Send Message"}
      </button>

      <div className="support-messages">
        <h3>Sent Messages</h3>
        {messages.length === 0 ? (
          <p className="no-data">No support messages sent yet.</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="support-message-item">
              <div className="support-message-header">
                <span className="support-message-time">
                  {msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
                </span>
                <span className={`support-message-status status-${(msg.status || "pending").toLowerCase()}`}>
                  {msg.status || "pending"}
                </span>
              </div>
              <p className="support-message-text">{msg.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QuickSupport;
