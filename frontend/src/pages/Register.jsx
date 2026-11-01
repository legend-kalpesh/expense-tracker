import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Client-side checks (the backend repeats them)
    if (form.name.trim().length < 2) return setError('Name must be at least 2 characters');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address');
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) {
      return setError('Password must be at least 8 characters with a letter and a number');
    }
    if (form.password !== form.confirm) return setError('Passwords do not match');

    setSubmitting(true);
    setError('');
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      showToast('Account created. Welcome!');
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-intro">
        <div className="brand brand-light"><span className="brand-mark">₹</span>Expense Tracker</div>
        <h1>Take control of your spending.</h1>
        <p>Create a free account. Ten starter categories are ready the moment you sign up.</p>
      </div>
      <div className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Create account</h2>
          <p className="muted">It takes less than a minute.</p>
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" className="input" autoComplete="name" value={form.name}
              onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="input" autoComplete="email"
              value={form.email} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" className="input"
              autoComplete="new-password" value={form.password} onChange={handleChange} />
            <small className="muted">At least 8 characters, with a letter and a number.</small>
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" name="confirm" type="password" className="input"
              autoComplete="new-password" value={form.confirm} onChange={handleChange} />
          </div>

          <button className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create account'}
          </button>
          <p className="auth-switch">
            Already registered? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
