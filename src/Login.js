import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { signUp, signIn } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password');
      setLoading(false);
      return;
    }

    if (isSignUp) {
      // Sign up
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const result = await signUp(email, password);
      if (result.success) {
        setSuccessMessage('Account created! Please check your email to confirm.');
        setEmail('');
        setPassword('');
        setTimeout(() => {
          setIsSignUp(false);
        }, 3000);
      } else {
        setError(result.error);
      }
    } else {
      // Sign in
      const result = await signIn(email, password);
      if (result.success) {
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          navigate('/quote-builder');
        }, 1000);
      } else {
        setError(result.error);
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Project Pulse</h1>
        <h2>{isSignUp ? 'Create Account' : 'Contractor Login'}</h2>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? 'Min 6 characters' : 'Enter password'}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Login'}
          </button>
        </form>

        <div className="toggle-auth">
          {isSignUp ? (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError('');
                  setSuccessMessage('');
                }}
              >
                Create One
              </button>
            </>
          )}
        </div>

        <div className="login-info">
          <p>🔒 Secure contractor login</p>
          <p>Your projects are private and only visible to you</p>
        </div>
      </div>
    </div>
  );
}

export default Login;