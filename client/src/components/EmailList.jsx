import api from "../services/api.js";

const badgeClass = {
  PENDING: "badge-pending",
  SENT: "badge-sent",
  FAILED: "badge-failed",
};

export default function EmailList({ emails, onChanged, onEdit }) {
  async function handleDelete(id) {
    if (!window.confirm("Delete this scheduled email?")) return;
    try {
      await api.delete(`/email/${id}`);
      onChanged();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete scheduled email");
    }
  }

  if (!emails.length) {
    return (
      <div className="card">
        <p className="card-title">Scheduled Emails</p>
        <div className="empty-state">No scheduled emails yet. Compose one above!</div>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="card-title">Scheduled Emails ({emails.length})</p>
      <div className="email-list">
        {emails.map((email) => (
          <div className="email-item" key={email.id}>
            <div className="email-item-top">
              <span className="email-item-subject">{email.subject}</span>
              <span className={`badge ${badgeClass[email.status]}`}>{email.status}</span>
            </div>
            <div className="email-item-receiver">To: {email.receiver}</div>
            <div className="email-item-preview">{email.message}</div>
            {email.status === "FAILED" && email.errorMessage && (
              <div className="email-item-preview" style={{ color: "#d93025" }}>
                Error: {email.errorMessage}
              </div>
            )}
            <div className="email-item-meta">
              <span className="email-item-time">
                {new Date(email.scheduleTime).toLocaleString()}
              </span>
              <div className="email-item-actions">
                {email.status === "PENDING" && (
                  <button className="btn btn-outline" onClick={() => onEdit(email)}>
                    Edit
                  </button>
                )}
                <button
                  className="btn btn-danger-outline"
                  onClick={() => handleDelete(email.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}