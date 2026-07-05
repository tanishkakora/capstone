import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShieldCheck, MapPin, Truck, BarChart3, MessageSquareCode } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="animated">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-text">
          <h1>SmartWaste AI</h1>
          <p>
            An intelligent, multi-agent waste collection and routing system designed for modern smart cities. 
            Empowering citizens to report overflowing bins and enabling municipalities to prioritize tasks 
            and optimize routes using advanced AI scheduling.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/login" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Get Started
            </Link>
            <Link to="/register" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>
              Register Account
            </Link>
          </div>
        </div>
        <div className="hero-image" style={{ textAlign: 'center' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
            height: '350px',
            borderRadius: 'var(--border-radius)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <Trash2 size={96} style={{ marginBottom: '1rem', opacity: 0.9 }} />
            <h2 style={{ fontWeight: 800, letterSpacing: '1px' }}>INTELLIGENT WASTE MANAGEMENT</h2>
            <p style={{ opacity: 0.8, marginTop: '0.5rem' }}>Optimized. Automated. Responsive.</p>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section style={{ margin: '4rem 0' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.25rem', marginBottom: '3rem', color: 'var(--primary-dark)' }}>
          System Features & Multi-Agent Design
        </h2>
        
        <div className="dashboard-grid">
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#E8F5E9', padding: '0.75rem', borderRadius: '50%', color: 'var(--primary)' }}>
                <Trash2 size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>Citizen Reporting</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Quickly report waste accumulation, upload photos, and automatically geo-locate waste bins. Receive real-time updates when trucks are dispatched.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#E3F2FD', padding: '0.75rem', borderRadius: '50%', color: 'var(--secondary)' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>AI Priority Queue</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Intelligent triage agents calculate overflow priority scores based on proximity to schools, hospitals, local population density, and report ages.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#FFF3E0', padding: '0.75rem', borderRadius: '50%', color: '#E65100' }}>
                <Truck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>Route Optimization</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              Automated Traveling Salesperson (TSP) solvers calculate coordinates to reduce fuel emissions and direct drivers on the most efficient pathways.
            </p>
          </div>

          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#F3E5F5', padding: '0.75rem', borderRadius: '50%', color: '#4A148C' }}>
                <MessageSquareCode size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem' }}>Recycling Assistant</h3>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>
              An AI Chatbot equipped with waste classification skills to answer sorting questions and offer guidelines for plastic, paper, and glass separation.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section style={{ background: '#ECEFF1', padding: '3rem 2rem', borderRadius: 'var(--border-radius)', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Quick Simulation Credentials</h3>
        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
          Use the following pre-seeded test accounts to explore the citizen and officer portals instantly:
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ background: 'white', padding: '1rem 2rem', borderRadius: 'var(--border-radius-sm)', boxShadow: 'var(--shadow)', width: '260px' }}>
            <h4 style={{ color: 'var(--primary)' }}>Citizen Account</h4>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}><strong>Email:</strong> citizen@smartwaste.ai</p>
            <p style={{ fontSize: '0.9rem' }}><strong>Password:</strong> password123</p>
          </div>
          <div style={{ background: 'white', padding: '1rem 2rem', borderRadius: 'var(--border-radius-sm)', boxShadow: 'var(--shadow)', width: '260px' }}>
            <h4 style={{ color: 'var(--secondary)' }}>Municipal Officer</h4>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}><strong>Email:</strong> officer@smartwaste.ai</p>
            <p style={{ fontSize: '0.9rem' }}><strong>Password:</strong> password123</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
