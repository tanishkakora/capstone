import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { MapPin, Calendar, Clipboard, User, Truck, ShieldAlert, AlertCircle, ArrowLeft, Check } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ComplaintDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [complaint, setComplaint] = useState<any>(null);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [selectedTruck, setSelectedTruck] = useState<number | ''>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (complaint && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([complaint.latitude, complaint.longitude], 15);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      L.marker([complaint.latitude, complaint.longitude])
        .addTo(mapRef.current)
        .bindPopup(`<strong>Complaint Location</strong><br/>${complaint.location_name}`)
        .openPopup();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [complaint]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/complaints/${id}`);
      setComplaint(response.data);
      setSelectedPriority(response.data.priority);
      setSelectedStatus(response.data.status);
      setSelectedTruck(response.data.assigned_truck_id || '');
      
      if (user?.role === 'officer') {
        const truckResponse = await api.get('/api/trucks');
        setTrucks(truckResponse.data);
      }
    } catch (e: any) {
      console.error('Error fetching complaint details:', e);
      setError('Failed to load complaint details. It may not exist or you might not have access.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.put(`/api/complaints/${id}`, {
        status: selectedStatus,
        assigned_truck_id: selectedTruck === '' ? null : Number(selectedTruck),
        priority: selectedPriority
      });
      setComplaint(response.data);
      setSuccess('Complaint settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      console.error('Failed to update complaint:', e);
      setError(e.response?.data?.detail || 'Failed to apply updates. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center' }}>Loading complaint details...</div>;
  }

  if (error && !complaint) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ background: '#FFEBEE', color: '#C62828', padding: '1rem', borderRadius: 'var(--border-radius)', maxWidth: '500px', margin: '0 auto' }}>
          <AlertCircle style={{ marginBottom: '0.5rem' }} />
          <p>{error}</p>
        </div>
        <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginTop: '1.5rem' }}>
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    );
  }

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

  return (
    <div className="animated" style={{ maxWidth: '1000px', margin: '1rem auto' }}>
      <button onClick={() => navigate(-1)} className="btn btn-outline" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        {/* Left Side: General Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-dark)' }}>{complaint.title}</h2>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {getStatusBadge(complaint.status)}
                  <span className={`badge ${
                    complaint.priority === 'high' ? 'badge-high' : complaint.priority === 'medium' ? 'badge-medium' : 'badge-low'
                  }`}>
                    Priority: {complaint.priority.toUpperCase()} (Score: {complaint.priority_score.toFixed(1)})
                  </span>
                  <span className="badge" style={{ backgroundColor: '#ECEFF1', color: '#455A64' }}>
                    Type: {complaint.waste_type.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <p style={{ fontSize: '1rem', marginBottom: '1.5rem', borderLeft: '3px solid var(--primary)', paddingLeft: '0.75rem', color: '#37474F' }}>
              {complaint.description}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} />
                <span><strong>Reported:</strong> {new Date(complaint.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} />
                <span><strong>Coordinates:</strong> {complaint.latitude.toFixed(4)}, {complaint.longitude.toFixed(4)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clipboard size={16} />
                <span><strong>Complaint ID:</strong> #{complaint.id}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <User size={16} />
                <span><strong>Citizen ID:</strong> #{complaint.citizen_id}</span>
              </div>
            </div>
          </div>

          {/* Photo Showcase */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Uploaded Proof</h3>
            {complaint.image_url ? (
              <img 
                src={`http://127.0.0.1:8000${complaint.image_url}`} 
                alt="Reported Issue" 
                style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}
              />
            ) : (
              <div style={{ padding: '3rem', textAlign: 'center', background: '#ECEFF1', color: 'var(--text-secondary)', borderRadius: 'var(--border-radius)' }}>
                No photo was uploaded with this complaint.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Map & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Map Location */}
          <div className="card" style={{ padding: '0.75rem' }}>
            <h3 style={{ padding: '0.5rem 0.75rem' }}>Location Map</h3>
            <div ref={mapContainerRef} className="map-wrapper" style={{ height: '240px' }}></div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', padding: '0.5rem 0.75rem 0 0.75rem' }}>
              <MapPin size={14} style={{ display: 'inline', marginRight: '0.2rem', verticalAlign: 'text-bottom' }} />
              {complaint.location_name}
            </p>
          </div>

          {/* Officer Dashboard Update Controls */}
          {user?.role === 'officer' && (
            <div className="card" style={{ borderLeft: '4px solid var(--secondary)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>Dispatch Control</h3>
              
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#E8F5E9', color: '#2E7D32', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <Check size={16} />
                  <span>{success}</span>
                </div>
              )}

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFEBEE', color: '#C62828', padding: '0.5rem 0.75rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Update Status</label>
                  <select 
                    className="form-input"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="truck_assigned">Truck Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed (Resolved)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Waste Truck</label>
                  <select 
                    className="form-input"
                    value={selectedTruck}
                    onChange={(e) => setSelectedTruck(e.target.value === '' ? '' : Number(e.target.value))}
                  >
                    <option value="">-- No Truck Assigned --</option>
                    {trucks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.vehicle_number} - {t.driver_name} ({t.status.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Set Priority Override</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['low', 'medium', 'high'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPriority(p)}
                        className={`btn ${selectedPriority === p ? 'btn-primary' : 'btn-outline'}`}
                        style={{
                          flex: 1,
                          fontSize: '0.8rem',
                          padding: '0.4rem',
                          textTransform: 'capitalize',
                          backgroundColor: selectedPriority === p 
                            ? (p === 'high' ? '#C62828' : p === 'medium' ? '#F57F17' : 'var(--primary)')
                            : 'transparent',
                          color: selectedPriority === p ? 'white' : 'var(--text-primary)'
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={updating}
                >
                  <Truck size={18} />
                  {updating ? 'Updating Dispatch...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Citizen Status Details */}
          {user?.role === 'citizen' && (
            <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
              <h3 style={{ marginBottom: '0.5rem' }}>Resolution Timeline</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Your report triggers our multi-agent AI system to allocate trucks.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#2E7D32', color: 'white', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                  }}>1</div>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Report Logged</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AI Classified waste category immediately.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', 
                    backgroundColor: ['under_review', 'truck_assigned', 'in_progress', 'completed'].includes(complaint.status) ? '#2E7D32' : '#B0BEC5', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                  }}>2</div>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>AI Prioritization</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Calculated priority rank based on location factors.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', 
                    backgroundColor: ['truck_assigned', 'in_progress', 'completed'].includes(complaint.status) ? '#2E7D32' : '#B0BEC5', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                  }}>3</div>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Truck Assigned</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {complaint.assigned_truck_id ? 'Garbage truck dispatched to coordinates.' : 'Pending municipal dispatch assignment.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', 
                    backgroundColor: complaint.status === 'completed' ? '#2E7D32' : '#B0BEC5', 
                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                  }}>4</div>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Resolved</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Waste collected and area sanitized.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetails;
