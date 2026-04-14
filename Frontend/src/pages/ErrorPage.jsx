import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ErrorPage.css";

const ErrorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const message =
    location.state?.message || "The page you're looking for doesn't exist.";

  return (
    <main className="error-page" aria-labelledby="error-title">
      <div className="error-card" role="alert">
        <div className="error-illustration" aria-hidden>
          <span className="emoji" role="img" aria-label="compass">🧭</span>
          <span className="code">404</span>
        </div>

        <h1 id="error-title" className="title">Page not found</h1>
        <p className="message">{message}</p>

        <div className="actions">
          <button
            className="btn btn-primary"
            onClick={() => navigate("/")}
          >
            Go to Home
          </button>

          <button
            className="btn btn-ghost"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  );
};

export default ErrorPage;
