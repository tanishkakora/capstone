import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, LogOut, CheckCircle } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <p>Please log in to view this page.</p>
      </div>
    );
  }

  return (
    <div className="animated" style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-dark)' }}>User Profile</h2>
      
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
          <div style={{
            background: user.role === 'officer' ? 'var(--secondary)' : 'var(--primary)',
            color: 'white',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            fontWeight: 800
          }}>
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{user.fullName}</h3>
          <span className={`badge ${user.role === 'officer' ? 'badge-assigned' : 'badge-low'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
            {user.role === 'officer' ? 'Municipal Officer' : 'Citizen User'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <User style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Full Name</p>
              <p style={{ fontWeight: 500 }}>{user.fullName}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Mail style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Email Address</p>
              <p style={{ fontWeight: 500 }}>{user.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Shield style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Account Permissions</p>
              <p style={{ fontWeight: 500 }}>
                {user.role === 'officer' 
                  ? 'Access to Municipal Dashboard, AI Routing, and Dispatch Actions' 
                  : 'Access to Citizen Reporting, Disposal Chat, and Tracking Bins'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <CheckCircle style={{ color: '#2E7D32' }} />
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Account Status</p>
              <p style={{ fontWeight: 500, color: '#2E7D32' }}>Active & Verified</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ width: '100%', padding: '0.75rem', marginTop: '2.5rem', color: '#C62828', borderColor: '#FFEBEE', background: '#FFEBEE', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default Profile;
