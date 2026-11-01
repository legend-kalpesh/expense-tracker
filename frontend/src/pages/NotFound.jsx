import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="center-screen">
      <h1 className="big-404">404</h1>
      <p className="muted">This page does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to dashboard</Link>
    </div>
  );
}
