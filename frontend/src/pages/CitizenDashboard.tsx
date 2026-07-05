import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PlusCircle, Info, RefreshCw, MapPin } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CitizenDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Initialize map once container and data are available
    if (!loading && bins.length > 0 && mapContainerRef.current && !mapRef.current) {
      // Center map around the average of bins or default to Bangalore center
      const defaultCenter: [number, number] = [12.9716, 77.5946];
      
      mapRef.current = L.map(mapContainerRef.current).setView(defaultCenter, 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Add bin markers
      bins.forEach(bin => {
        const icon = L.divIcon({
          className: 'custom-bin-icon',
          html: `<div style="background-color: ${
            bin.bin_type === 'recycling' ? '#1976D2' : bin.bin_type === 'e-waste' ? '#7B1FA2' : '#2E7D32'
          }; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
          iconSize: [12, 12]
        });

        if (mapRef.current) {
          L.marker([bin.latitude, bin.longitude], { icon })
            .addTo(mapRef.current)
            .bindPopup(`
              <strong>${bin.location_name}</strong><br/>
              Type: ${bin.bin_type.toUpperCase()}<br/>
              Fill Level: ${bin.current_fill_level}%
            `);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading, bins]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, binRes] = await Promise.all([
        api.get('/api/complaints/my'),
        api.get('/api/bins')
      ]);
      setComplaints(compRes.data);
      setBins(binRes.data);
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted': return <span className="badge badge-submitted">Submitted</span>;
      case 'under_review': return <span className="badge badge-review">Under Review</span>;
      case 'truck_assigned': return <span className="badge badge-assigned">Truck Assigned</span>;
      case 'in_progress': return <span className="badge badge-progress">In Progress</span>;
      case 'completed': return <span className="badge badge-completed">Completed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const totalSubmitted = complaints.length;
  const activeComplaints = complaints.filter(c => c.status !== 'completed').length;
  const resolvedComplaints = complaints.filter(c => c.status === 'completed').length;

  return (
    <div className="animated">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary-dark)' }}>Citizen Hub</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Report waste accumulation issues and track resolutions in real-time.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchData} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <Link to="/report-complaint" className="btn btn-primary">
            <PlusCircle size={18} /> Report New Issue
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderLeftColor: 'var(--secondary)' }}>
          <h3>Total Reports</h3>
          <div className="stat-number">{totalSubmitted}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Lifetime submissions</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#F57F17' }}>
          <h3>Active Issues</h3>
          <div className="stat-number">{activeComplaints}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Currently under action</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#2E7D32' }}>
          <h3>Resolved Issues</h3>
          <div className="stat-number">{resolvedComplaints}</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Waste collected successfully</p>
        </div>
      </div>

      {/* Main Grid: Reports list + Nearby Bins map */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', margin: '2rem 0' }}>
        {/* Left: Complaints List */}
        <div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            My Reports History
          </h3>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow)' }}>
              Loading your reports...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 'var(--border-radius)', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You have not reported any issues yet.</p>
              <Link to="/report-complaint" className="btn btn-primary">Report Your First Waste Issue</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {complaints.map(comp => (
                <div key={comp.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    {comp.image_url ? (
                      <img 
                        src={`http://127.0.0.1:8000${comp.image_url}`} 
                        alt="Reported Waste" 
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }} 
                      />
                    ) : (
                      <div style={{ width: '80px', height: '80px', backgroundColor: '#ECEFF1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--border-radius-sm)', color: 'var(--text-secondary)' }}>
                        No Image
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{comp.title}</h4>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        <MapPin size={14} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'text-bottom' }} />
                        {comp.location_name}
                      </p>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        {getStatusBadge(comp.status)}
                        <span className={`badge ${
                          comp.priority === 'high' ? 'badge-high' : comp.priority === 'medium' ? 'badge-medium' : 'badge-low'
                        }`}>
                          AI Priority: {comp.priority}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/complaints/${comp.id}`} className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                    View Details
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Map of Nearby Bins */}
        <div>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Nearby Waste Bins
          </h3>
          <div className="card" style={{ padding: '0.75rem' }}>
            <div ref={mapContainerRef} className="map-wrapper" style={{ height: '350px' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-around', padding: '0.75rem 0 0 0', fontSize: '0.8rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#2E7D32', borderRadius: '50%' }}></span>
                <span>General Waste</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#1976D2', borderRadius: '50%' }}></span>
                <span>Recycling Bin</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ display: 'inline-block', width: '10px', height: '10px', backgroundColor: '#7B1FA2', borderRadius: '50%' }}></span>
                <span>E-Waste Bin</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;
