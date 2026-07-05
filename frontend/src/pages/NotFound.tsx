import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="animated" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <AlertTriangle size={64} style={{ color: '#E65100', marginBottom: '1.5rem' }} />
      <h1 style={{ fontSize: '3rem', color: 'var(--text-primary)' }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', margin: '1rem 0 2rem 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
        The page you are looking for does not exist or has been moved. Please verify the URL or return to safety.
      </p>
      <Link to="/" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
        Return Home
      </Link>
    </div>
  );
};

export default NotFound;
