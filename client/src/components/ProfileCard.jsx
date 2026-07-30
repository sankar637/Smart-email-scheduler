import { useState } from "react";
import api from "../services/api.js";

export default function ProfileCard({ user, gmailStatus, onGmailStatusChange }) {
  const [connecting, setConnecting] = useState(false);

  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleConnectGmail() {
    try {
      setConnecting(true);
      const { data } = await api.get("/gmail/connect");
      window.location.href = data.url; // redirect to Google consent screen
    } catch (err) {
      setConnecting(false);
      alert(err.response?.data?.message || "Failed to start Gmail connection");
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Gmail from this account?")) return;
    try {
      await api.post("/gmail/disconnect");
      onGmailStatusChange({ connected: false, gmailEmail: null });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to disconnect Gmail");
    }
  }

  return (
    <div className="card">
      <div className="profile-avatar">{initials}</div>
      <p className="profile-name">{user?.name}</p>
      <p className="profile-email">{user?.email}</p>

      <div className="gmail-status">
        <span
          className={`status-dot ${gmailStatus.connected ? "connected" : "disconnected"}`}
        />
        {gmailStatus.connected ? (
          <span>
            Connected as <strong>{gmailStatus.gmailEmail}</strong>
          </span>
        ) : (
          <span>Not Connected</span>
        )}
      </div>

      {gmailStatus.connected ? (
        <button className="btn btn-danger-outline btn-block" onClick={handleDisconnect}>
          Disconnect Gmail
        </button>
      ) : (
        <button
          className="btn btn-primary btn-block"
          onClick={handleConnectGmail}
          disabled={connecting}
        >
          {connecting ? <span className="spinner" /> : null}
          Connect Gmail
        </button>
      )}
    </div>
  );
}
