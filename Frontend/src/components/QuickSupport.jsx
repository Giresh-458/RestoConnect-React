import React, { useState } from "react";

const QuickSupport = ({ onUpdate }) => {
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
        "http://localhost:3000/staff/api/support-message",
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
        alert("Message sent to manager!");
        setMessage("");
        onUpdate?.();
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
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
    </div>
  );
};

export default QuickSupport;
