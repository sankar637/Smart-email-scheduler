import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth.js";

export default function Navbar() {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="navbar-logo">S</div>
        Smart Email Scheduler
      </div>
      <div className="navbar-links">
        <a className="navbar-link active" href="/dashboard">
          Dashboard
        </a>
        <button className="navbar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
