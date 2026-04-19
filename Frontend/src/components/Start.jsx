import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import './Start.css';

const Start = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${apiUrl}/verify`, { withCredentials: true })
      .then(result => {
        if (result.data.Status) {
          if (result.data.role === "admin" || result.data.role=="data_operator") {
            navigate('/dashboard');
          } else {
            navigate('/employeedetail/' + result.data.id);
          }
        }
      })
      .catch(err => console.log(err));
  }, [navigate]);

  const handleEmployeeLogin = () => navigate('/employeelogin');
  const handleAdminLogin = () => navigate('/adminlogin');
  const handleOperatorLogin = () => navigate('/operatorlogin');

  return (
    <div className="start-page">
      <header className="start-header">
        <h1>Welcome to OrganizeMe</h1>
        <p>A smart way to manage employees, projects, and productivity all in one place.</p>
      </header>

      <section className="login-section">
        <div className="login-card">
          <h2>Login As</h2>
          <p className="login-subtitle">Please choose your role to continue.</p>
          <div className="login-buttons">
            <button className="btn employee-btn" onClick={handleEmployeeLogin}>Employee</button>
            <button className="btn admin-btn" onClick={handleAdminLogin}>Admin</button>
            <button className="btn employee-btn" onClick={handleOperatorLogin}>Data Operator</button>
          </div>
          <p className="signup-text">
            New here? <a href="/signup-admin">Create an account</a> or contact your admin for access.
          </p>
        </div>
      </section>

      <footer className="start-footer">
        <p>&copy; 2025 OrganizeMe. All rights reserved.</p>
        <p>Contact: support@organizeme.com | Phone: +91 9789617978</p>
      </footer>
    </div>
  );
};

export default Start;
