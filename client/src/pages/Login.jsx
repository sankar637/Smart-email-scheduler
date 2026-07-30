import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginWithGoogle, isLoggedIn } from "../services/auth.js";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  if (isLoggedIn()) {
    navigate("/dashboard");
  }

  async function handleLogin() {
    try {
      setLoading(true);
      setError(null);
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">S</div>
        <h1 className="login-title">Smart Email Scheduler</h1>
        <p className="login-subtitle">
          Schedule Gmail messages to send automatically, exactly when you want them to.
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <button className="google-btn" onClick={handleLogin} disabled={loading}>
          {loading ? (
            <span className="spinner spinner-dark" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.6 0-14.1 4.3-17.7 10.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.5-5.5C29.6 35.4 26.9 36 24 36c-5.3 0-9.8-3.4-11.3-8.1l-6.5 5C9.8 39.6 16.3 44 24 44z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.5 5.5C41.5 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"
              />
            </svg>
          )}
          Sign in with Google
        </button>

        <p className="login-footer">
          Signing in also lets you connect Gmail so scheduled emails can be sent from your
          own account.
        </p>
      </div>
    </div>
  );
}
