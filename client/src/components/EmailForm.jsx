import { useEffect, useState } from "react";
import api from "../services/api.js";

const emptyForm = {
  receiver: "",
  subject: "",
  message: "",
  scheduleDate: "",
  scheduleTime: "",
};

export default function EmailForm({ senderEmail, gmailConnected, editingEmail, onSaved, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', text }

  const isEditing = Boolean(editingEmail);

  useEffect(() => {
    if (editingEmail) {
      const dt = new Date(editingEmail.scheduleTime);
      const scheduleDate = dt.toISOString().slice(0, 10);
      const scheduleTime = dt.toTimeString().slice(0, 5);
      setForm({
        receiver: editingEmail.receiver,
        subject: editingEmail.subject,
        message: editingEmail.message,
        scheduleDate,
        scheduleTime,
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingEmail]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setAlert(null);

    if (!gmailConnected) {
      setAlert({ type: "error", text: "Please connect Gmail before scheduling" });
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing) {
        await api.put(`/email/${editingEmail.id}`, form);
        setAlert({ type: "success", text: "Scheduled email updated" });
      } else {
        await api.post("/email/schedule", form);
        setAlert({ type: "success", text: "Email scheduled successfully" });
        setForm(emptyForm);
      }
      onSaved();
    } catch (err) {
      setAlert({
        type: "error",
        text: err.response?.data?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card compose-card">
      <div className="compose-header">
        {isEditing ? "Edit Scheduled Email" : "New Message"}
      </div>
      <form className="compose-body" onSubmit={handleSubmit}>
        {alert && (
          <div className={`alert alert-${alert.type === "success" ? "success" : "error"}`}>
            {alert.text}
          </div>
        )}

        <div className="form-row">
          <label>From</label>
          <input type="text" value={senderEmail || "Not connected"} disabled />
        </div>

        <div className="form-row">
          <label>To</label>
          <input
            type="email"
            placeholder="recipient@example.com"
            value={form.receiver}
            onChange={(e) => update("receiver", e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <label>Subject</label>
          <input
            type="text"
            placeholder="Email subject"
            value={form.subject}
            onChange={(e) => update("subject", e.target.value)}
            required
          />
        </div>

        <div className="form-row">
          <label>Message</label>
          <textarea
            placeholder="Write your message..."
            value={form.message}
            onChange={(e) => update("message", e.target.value)}
            required
          />
        </div>

        <div className="form-grid-2">
          <div className="form-row">
            <label>Schedule Date</label>
            <input
              type="date"
              value={form.scheduleDate}
              onChange={(e) => update("scheduleDate", e.target.value)}
              required
            />
          </div>
          <div className="form-row">
            <label>Schedule Time</label>
            <input
              type="time"
              value={form.scheduleTime}
              onChange={(e) => update("scheduleTime", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="compose-footer">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : null}
            {isEditing ? "Save Changes" : "Schedule Email"}
          </button>
          {isEditing && (
            <button type="button" className="btn btn-outline" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
