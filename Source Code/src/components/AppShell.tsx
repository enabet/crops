import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type AppShellProps = {
  children: ReactNode;
};

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userName =
    `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() ||
    user?.email ||
    "CARDI User";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
       

          <div>
            <strong>CARDI</strong>
           
          </div>
        </div>

        <nav className="sidebar-navigation" aria-label="Main navigation">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span aria-hidden="true">⌂</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/crops"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span aria-hidden="true">♧</span>
            Crop Knowledge
          </NavLink>

          <NavLink
            to="/farms"
            className={({ isActive }) =>
              isActive ? "sidebar-link active" : "sidebar-link"
            }
          >
            <span aria-hidden="true">⌖</span>
            My Farms
          </NavLink>
		  
		  <NavLink to="/profile" className={({ isActive }) =>
    isActive ? "sidebar-link active" : "sidebar-link"}>  <span aria-hidden="true">◎</span>
  My Profile
</NavLink>
        </nav>

        <div className="sidebar-account">
          <span>Signed in as</span>
          <NavLink to="/profile" className="topbar-profile-link">
 <center> <div className="user-avatar">
    {(user?.first_name?.[0] || user?.email?.[0] || "U").toUpperCase()}
  </div></center>

  <div className="user-details">
    <strong>{userName}</strong>
    
  </div>
</NavLink>
          <small>{user?.role?.replaceAll("_", " ")}</small>
        </div>





      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <div>
            <strong>CARDI: </strong>
             <span>Agricultural Platform</span>
          </div>

          <div className="topbar-user">
           

            <button
              type="button"
              className="logout-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}