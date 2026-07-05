import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart3, TrendingUp, AlertTriangle, ShieldCheck, MapPin, Loader } from 'lucide-react';

const Analytics: React.FC = () => {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [bins, setBins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, binRes] = await Promise.all([
        api.get('/api/complaints/all'),
        api.get('/api/bins')
      ]);
      setComplaints(compRes.data);
      setBins(binRes.data);
    } catch (e) {
      console.error('Failed to load analytics data', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0' }}>
        <Loader className="animated" style={{ animation: 'spin 2s linear infinite' }} size={40} />
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Aggregating city-wide waste records...</p>
      </div>
    );
  }

  // Calculations for Hotspots & Trends
  const total = complaints.length;
  const resolved = complaints.filter(c => c.status === 'completed').length;
  const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(0) : '0';

  // Hotspots calculation: count complaints per location_name
  const locationCounts: { [key: string]: number } = {};
  complaints.forEach(c => {
    const loc = c.location_name;
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  const hotspots = Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Waste type counts
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

  const maxWasteCount = Math.max(...Object.values(wasteCounts), 1);

  // Predictive Overflow (Proactive Agent Feature)
  // Bins that have higher fill levels are projected to overflow based on capacity and mock accumulation rates
  const predictedOverflows = bins
    .map(bin => {
      // Accumulation rate: e.g. 5% fill level per hour for general waste, 3% for recycling
      const accumulationRate = bin.bin_type === 'general' ? 4.5 : bin.bin_type === 'recycling' ? 2.5 : 1.2;
      const hoursToOverflow = (100 - bin.current_fill_level) / accumulationRate;
      return {
        ...bin,
        hoursToOverflow,
        severity: bin.current_fill_level > 85 ? 'immediate' : bin.current_fill_level > 60 ? 'warning' : 'stable'
      };
    })
    .sort((a, b) => a.hoursToOverflow - b.hoursToOverflow);

  return (
    <div className="animated">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ color: 'var(--secondary)' }}>City Analytics & Predictions</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Detailed statistical reviews, hotspot matrices, and predictive bin overflow forecasts.</p>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card" style={{ borderLeftColor: 'var(--secondary)' }}>
          <h3>Total Reports</h3>
          <div className="stat-number">{total}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>All registered alerts</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--primary)' }}>
          <h3>Resolution Rate</h3>
          <div className="stat-number">{resolutionRate}%</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Completed collections</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#F57F17' }}>
          <h3>Hotspots Located</h3>
          <div className="stat-number">{Object.keys(locationCounts).length}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Unique waste zones</p>
        </div>
        <div className="stat-card" style={{ borderLeftColor: '#C62828' }}>
          <h3>Overflow Warnings</h3>
          <div className="stat-number">{bins.filter(b => b.current_fill_level > 80).length}</div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Bins above 80% capacity</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '2rem', margin: '2rem 0' }}>
        {/* Left Side: Waste Chart & Hotspots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Chart Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 style={{ color: 'var(--secondary)' }} /> Waste Category Breakdown
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {Object.entries(wasteCounts).map(([type, count]) => {
                const percentage = (count / maxWasteCount) * 100;
                return (
                  <div key={type} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 30px', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.9rem', textTransform: 'capitalize', fontWeight: 600 }}>{type}</span>
                    <div style={{ backgroundColor: '#ECEFF1', height: '16px', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{
                        backgroundColor: type === 'plastic' ? '#4CAF50' : type === 'paper' ? '#1976D2' : type === 'organic' ? '#81C784' : type === 'e-waste' ? '#7B1FA2' : '#78909C',
                        width: `${percentage}%`,
                        height: '100%',
                        borderRadius: '8px'
                      }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold', textAlign: 'right' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hotspots Card */}
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <TrendingUp style={{ color: '#F57F17' }} /> Top Complaint Hotspots
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {hotspots.map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={16} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{h.location}</span>
                  </div>
                  <span className="badge badge-high" style={{ fontSize: '0.75rem' }}>{h.count} Reports</span>
                </div>
              ))}
              {hotspots.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No reports logged yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Predictive Overflow Forecast */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle style={{ color: '#C62828' }} /> Predictive Bin Overflow Forecast
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            AI calculation of estimated hours remaining before municipal bins exceed storage limits based on historical accumulation rates.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
            {predictedOverflows.map(bin => {
              const remainingHrs = bin.hoursToOverflow.toFixed(1);
              return (
                <div 
                  key={bin.id}
                  style={{
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--border-radius)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: bin.severity === 'immediate' ? '#FFEBEE' : bin.severity === 'warning' ? '#FFF8E1' : 'transparent',
                    borderLeft: bin.severity === 'immediate' ? '4px solid #C62828' : bin.severity === 'warning' ? '4px solid #F57F17' : '1px solid var(--border-color)'
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{bin.location_name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Type: <strong>{bin.bin_type.toUpperCase()}</strong> | Current Fill: <strong>{bin.current_fill_level}%</strong>
                    </p>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {bin.severity === 'immediate' ? (
                      <span style={{ color: '#C62828', fontSize: '0.8rem', fontWeight: 800, display: 'block' }}>OVERFLOW RISK</span>
                    ) : bin.severity === 'warning' ? (
                      <span style={{ color: '#F57F17', fontSize: '0.8rem', fontWeight: 800, display: 'block' }}>WARNING</span>
                    ) : (
                      <span style={{ color: '#2E7D32', fontSize: '0.8rem', fontWeight: 800, display: 'block' }}>STABLE</span>
                    )}
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                      ~ {remainingHrs} Hrs Left
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
