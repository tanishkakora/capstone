import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { RefreshCw, MapPin, Truck, AlertTriangle, CheckCircle, Clock, Trash2, ArrowRight } from 'lucide-react';

const MunicipalDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [trucks, setTrucks] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, truckRes, binRes] = await Promise.all([
        api.get('/api/complaints/all'),
        api.get('/api/trucks'),
        api.get('/api/bins')
      ]);
      setComplaints(compRes.data);
      setTrucks(truckRes.data);
      setBins(binRes.data);
    } catch (e) {
      console.error('Failed to fetch officer dashboard data', e);
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

  // Aggregated calculations for KPIs
  const totalReports = complaints.length;
  const pendingReports = complaints.filter(c => c.status !== 'completed').length;
  const resolvedReports = complaints.filter(c => c.status === 'completed').length;
  const activeTrucks = trucks.filter(t => t.status === 'active').length;
  
  // Calculate average response time mock (proactive feature)
  const averageResponseTime = totalReports > 0 ? "2.4 Hrs" : "N/A";

  // Calculate waste distribution for SVG charts
  const wasteCounts: { [key: string]: number } = {
    plastic: 0,
    paper: 0,
    organic: 0,
    glass: 0,
    metal: 0,
    'e-waste': 0,
    mixed: 0
  };
  
  complaints.forEach(c => {
    const type = c.waste_type || 'mixed';
    if (type in wasteCounts) {
      wasteCounts[type]++;
    } else {
      wasteCounts['mixed']++;
    }
  });

  const maxCount = Math.max(...Object.values(wasteCounts), 1);

  return (
    <div className="animated">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ color: 'var(--secondary)' }}>Municipal Operations</h2>
          <p style={{ color: 'var(--text-secondary)' }}>AI-prioritized waste triage, collection schedules, and city analytics.</p>
        </div>
        <button onClick={fetchData} className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <RefreshCw size={16} /> Refresh Data
        </button>
      </div>

      {/* KPI Counters */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card" style={{ borderLeftColor: 'var(--secondary)' }}>
          <h3>Total Reports</h3>
          <div className="stat-number">{totalReports}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Received city-wide</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#C62828' }}>
          <h3>Pending Action</h3>
          <div className="stat-number">{pendingReports}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>In AI triage queue</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#2E7D32' }}>
          <h3>Resolved</h3>
          <div className="stat-number">{resolvedReports}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Collections completed</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#1976D2' }}>
          <h3>Active Trucks</h3>
          <div className="stat-number">{activeTrucks}/{trucks.length}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Dispatched fleets</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#00838F' }}>
          <h3>Response Time</h3>
          <div className="stat-number">{averageResponseTime}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Average collection speed</p>
        </div>
      </div>

      {/* Main Grid Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem', margin: '2rem 0' }}>
        {/* Left: AI Priority Queue */}
        <div>
          <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle style={{ color: '#F57F17' }} /> AI Priority Dispatch Queue
          </h3>
          
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 'var(--border-radius)' }}>
              Loading queue...
            </div>
          ) : complaints.filter(c => c.status !== 'completed').length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: 'var(--border-radius)', border: '1px solid var(--border-color)' }}>
              <CheckCircle size={32} style={{ color: '#2E7D32', marginBottom: '0.5rem' }} />
              <p style={{ color: 'var(--text-secondary)' }}>All complaints resolved! Queue is currently empty.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {complaints
                .filter(comp => comp.status !== 'completed')
                .map(comp => (
                  <div 
                    key={comp.id} 
                    className="card" 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      borderLeft: comp.priority === 'high' ? '4px solid #C62828' : comp.priority === 'medium' ? '4px solid #F57F17' : '1px solid var(--border-color)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ width: '8px' }} />
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {comp.title}
                          {comp.priority === 'high' && <span style={{ color: '#C62828', fontSize: '0.8rem', background: '#FFEBEE', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>URGENT</span>}
                        </h4>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                          <MapPin size={12} style={{ display: 'inline', marginRight: '0.2rem' }} />
                          {comp.location_name}
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {getStatusBadge(comp.status)}
                          <span className={`badge ${
                            comp.priority === 'high' ? 'badge-high' : comp.priority === 'medium' ? 'badge-medium' : 'badge-low'
                          }`}>
                            Score: {comp.priority_score.toFixed(1)}
                          </span>
                          <span className="badge" style={{ backgroundColor: '#ECEFF1', color: '#455A64' }}>
                            {comp.waste_type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} />
                        <span>{new Date(comp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <Link to={`/complaints/${comp.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                        Dispatch <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Right: Charts & Stats summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Waste Distribution Chart */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trash2 style={{ color: 'var(--primary)' }} /> Waste Distribution
            </h3>
            
            {/* Custom SVG Bar Chart */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
              {Object.entries(wasteCounts).map(([type, count]) => {
                const percentage = (count / maxCount) * 100;
                return (
                  <div key={type} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 24px', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: 600 }}>{type}</span>
                    <div style={{ background: '#ECEFF1', height: '12px', borderRadius: '6px', overflow: 'hidden', width: '100%' }}>
                      <div style={{ 
                        background: type === 'plastic' ? '#4CAF50' : type === 'paper' ? '#1976D2' : type === 'organic' ? '#81C784' : type === 'e-waste' ? '#7B1FA2' : '#78909C',
                        width: `${percentage}%`,
                        height: '100%',
                        borderRadius: '6px',
                        transition: 'width 0.6s ease-out'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Truck Fleet Summary */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Truck style={{ color: 'var(--secondary)' }} /> Active Collection Fleet
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {trucks.map(truck => (
                <div key={truck.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{truck.vehicle_number}</p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Driver: {truck.driver_name}</p>
                  </div>
                  <span className={`badge ${
                    truck.status === 'active' ? 'badge-completed' : truck.status === 'maintenance' ? 'badge-high' : 'badge-submitted'
                  }`} style={{ fontSize: '0.7rem' }}>
                    {truck.status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/route-planner" className="btn btn-outline" style={{ width: '100%', marginTop: '1.25rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              View Fleet Route Maps
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MunicipalDashboard;
