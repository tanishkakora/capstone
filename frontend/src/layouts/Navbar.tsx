import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, User, Bell, LogOut, MessageSquare, Map, BarChart3, PlusCircle } from 'lucide-react';
import api from '../services/api';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30 seconds for notifications (proactive feature)
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications');
      setNotifications(response.data);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (e) {
      console.error('Failed to mark notification as read', e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand">
          <Trash2 size={28} />
          <span>SmartWaste AI</span>
        </Link>

        <div className="nav-links">
          {user ? (
            <>
              {/* Common Links */}
              {user.role === 'citizen' && (
                <>
                  <Link to="/citizen-dashboard" className={`nav-link ${location.pathname === '/citizen-dashboard' ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/report-complaint" className={`nav-link ${location.pathname === '/report-complaint' ? 'active' : ''}`}>
                    <PlusCircle size={18} /> Report
                  </Link>
                </>
              )}

              {user.role === 'officer' && (
                <>
                  <Link to="/officer-dashboard" className={`nav-link ${location.pathname === '/officer-dashboard' ? 'active' : ''}`}>
                    Dashboard
                  </Link>
                  <Link to="/route-planner" className={`nav-link ${location.pathname === '/route-planner' ? 'active' : ''}`}>
                    <Map size={18} /> Routes
                  </Link>
                  <Link to="/analytics" className={`nav-link ${location.pathname === '/analytics' ? 'active' : ''}`}>
                    <BarChart3 size={18} /> Analytics
                  </Link>
                </>
              )}

              <Link to="/recycling-assistant" className={`nav-link ${location.pathname === '/recycling-assistant' ? 'active' : ''}`}>
                <MessageSquare size={18} /> AI Chat
              </Link>

              {/* Notification Bell */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', position: 'relative', display: 'flex', alignItems: 'center' }}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#C62828',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div style={{
                    position: 'absolute',
                    top: '35px',
                    right: 0,
                    width: '320px',
                    backgroundColor: 'white',
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--border-radius)',
                    border: '1px solid var(--border-color)',
                    zIndex: 1000,
                    maxHeight: '400px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Notifications</span>
                      <button 
                        onClick={fetchNotifications} 
                        style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Refresh
                      </button>
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid var(--border-color)',
                            backgroundColor: notif.is_read ? 'transparent' : '#F9FBF9',
                            cursor: notif.is_read ? 'default' : 'pointer',
                            fontSize: '0.85rem',
                            transition: 'var(--transition)'
                          }}
                        >
                          <div style={{ fontWeight: notif.is_read ? 'normal' : 'bold', color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                            {notif.title}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: '1.3' }}>
                            {notif.message}
                          </div>
                          {!notif.is_read && (
                            <div style={{ color: 'var(--primary)', fontSize: '0.7rem', fontWeight: 'bold', marginTop: '0.25rem', textAlign: 'right' }}>
                              Mark as read
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Profile */}
              <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={18} />
                  <span style={{ fontWeight: 600 }}>{user.fullName}</span>
                </div>
              </Link>

              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                <LogOut size={16} /> Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Sign In</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
