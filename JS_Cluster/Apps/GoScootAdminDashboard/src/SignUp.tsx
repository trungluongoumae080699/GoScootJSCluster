import { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const SignUp = () => {
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    // TODO: Implement signup logic
    console.log('Sign up:', { fullname, email, password });
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="logo-section">
          <img src="/app_logo.png" alt="GoScoot Logo" className="app-logo" />
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-form-container">
          <h2 className="auth-title">Sign up</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="fullname">Fullname</label>
              <input
                type="text"
                id="fullname"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">Login</button>
          </form>
          <div className="auth-footer">
            Have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
