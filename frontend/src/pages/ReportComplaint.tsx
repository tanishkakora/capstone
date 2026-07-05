import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Camera, MapPin, AlertCircle, Save } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ReportComplaint: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number>(12.9716); // Default Bangalore Center
  const [longitude, setLongitude] = useState<number>(77.5946);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    // Initialize map for picking location
    if (mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([latitude, longitude], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(mapRef.current);

      // Create default movable marker
      markerRef.current = L.marker([latitude, longitude], { draggable: true })
        .addTo(mapRef.current)
        .bindPopup('Drag marker to exact waste location')
        .openPopup();

      // Listen to drag event
      markerRef.current.on('dragend', () => {
        const marker = markerRef.current;
        if (marker) {
          const position = marker.getLatLng();
          setLatitude(position.lat);
          setLongitude(position.lng);
        }
      });

      // Listen to map click event
      mapRef.current.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        setLatitude(lat);
        setLongitude(lng);
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size & extension
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setError('Only image files are allowed (.jpg, .jpeg, .png, .webp)');
      return;
    }

    setError('');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/complaints/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setImageUrl(response.data.url);
    } catch (err: any) {
      console.error('File upload error:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName) {
      setError('Please provide a descriptive location address.');
      return;
    }
    
    setError('');
    setSubmitting(true);

    try {
      await api.post('/api/complaints', {
        title,
        description,
        location_name: locationName,
        latitude,
        longitude,
        waste_type: 'mixed', // Backend orchestrator will re-classify
        image_url: imageUrl,
      });

      navigate('/citizen-dashboard');
    } catch (err: any) {
      console.error('Submit complaint error:', err);
      setError(err.response?.data?.detail || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animated" style={{ maxWidth: '900px', margin: '1rem auto' }}>
      <h2 style={{ color: 'var(--primary-dark)', marginBottom: '1.5rem' }}>Report Waste Accumulation</h2>
      
      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#FFEBEE', color: '#C62828', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Form Panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Report Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Overflowing garbage bin outside shop"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Describe the Waste Issue</label>
            <textarea
              className="form-input"
              style={{ minHeight: '120px', resize: 'vertical' }}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context like type of garbage, smell, age, or hazards..."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location Address / landmark</label>
            <input
              type="text"
              className="form-input"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              placeholder="e.g. Opposite Sector 4 Community Library"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Upload Waste Photo</label>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', border: '1px dashed var(--primary)', borderRadius: 'var(--border-radius-sm)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, transition: 'var(--transition)' }}>
                <Camera size={18} />
                <span>Select Photo</span>
                <input type="file" onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />
              </label>
              
              {uploading && <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Uploading image...</span>}
              
              {imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <img 
                    src={`http://127.0.0.1:8000${imageUrl}`} 
                    alt="Uploaded preview" 
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }} 
                  />
                  <span style={{ fontSize: '0.85rem', color: '#2E7D32', fontWeight: 600 }}>Image Ready</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            disabled={submitting || uploading}
          >
            <Save size={18} />
            {submitting ? 'Submitting Report...' : 'Submit Issue to AI Triage'}
          </button>
        </div>

        {/* Right Location Picking Map */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MapPin style={{ color: 'var(--secondary)' }} /> Pinpoint Coordinates
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Click on the map or drag the green marker to set the exact waste location coordinates.
          </p>
          <div ref={mapContainerRef} className="map-wrapper" style={{ flex: 1, minHeight: '320px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <div><strong>Latitude:</strong> {latitude.toFixed(6)}</div>
            <div><strong>Longitude:</strong> {longitude.toFixed(6)}</div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ReportComplaint;
