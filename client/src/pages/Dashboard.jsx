import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import ProfileCard from "../components/ProfileCard.jsx";
import EmailForm from "../components/EmailForm.jsx";
import EmailList from "../components/EmailList.jsx";
import api from "../services/api.js";
import { getStoredUser } from "../services/auth.js";

export default function Dashboard() {
  const [user] = useState(getStoredUser());
  const [gmailStatus, setGmailStatus] = useState({ connected: false, gmailEmail: null });
  const [emails, setEmails] = useState([]);
  const [editingEmail, setEditingEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [banner, setBanner] = useState(null);

  async function loadGmailStatus() {
    const { data } = await api.get("/gmail/status");
    setGmailStatus(data);
  }

  async function loadEmails() {
    const { data } = await api.get("/email");
    setEmails(data);
  }

  useEffect(() => {
    // Reflect the redirect result from Google's OAuth consent screen.
    const params = new URLSearchParams(window.location.search);
    const gmailParam = params.get("gmail");
    if (gmailParam === "connected") {
      setBanner({ type: "success", text: "Gmail connected successfully!" });
    } else if (gmailParam) {
      setBanner({ type: "error", text: "Gmail connection was not completed. Please try again." });
    }
    if (gmailParam) {
      window.history.replaceState({}, "", "/dashboard");
    }

    (async () => {
      try {
        await Promise.all([loadGmailStatus(), loadEmails()]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function handleSaved() {
    setEditingEmail(null);
    loadEmails();
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="page-container">
        {banner && <div className={`alert alert-${banner.type}`}>{banner.text}</div>}

        <div className="dashboard-grid">
          <ProfileCard
            user={user}
            gmailStatus={gmailStatus}
            onGmailStatusChange={setGmailStatus}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <EmailForm
              senderEmail={gmailStatus.gmailEmail}
              gmailConnected={gmailStatus.connected}
              editingEmail={editingEmail}
              onSaved={handleSaved}
              onCancelEdit={() => setEditingEmail(null)}
            />

            {!loading && (
              <EmailList emails={emails} onChanged={loadEmails} onEdit={setEditingEmail} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
