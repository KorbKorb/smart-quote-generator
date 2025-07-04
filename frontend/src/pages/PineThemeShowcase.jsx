import React from 'react';
import './PineThemeShowcase.css';

const PineThemeShowcase = () => {
  return (
    <div className="theme-showcase">
      <div className="showcase-header">
        <h1>Pine Green Theme Showcase</h1>
        <p>A professional color palette for Smart Quote Generator</p>
      </div>

      {/* Color Palette */}
      <section className="showcase-section">
        <h2>Color Palette</h2>
        <div className="color-grid">
          <div className="color-group">
            <h3>Primary - Pine Green</h3>
            <div className="color-swatches">
              <div className="color-swatch" style={{ backgroundColor: '#F5F9F8' }}>
                <span>Faint</span>
                <code>#F5F9F8</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#E8F0EF' }}>
                <span>Pale</span>
                <code>#E8F0EF</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#2A6D64', color: 'white' }}>
                <span>Light</span>
                <code>#2A6D64</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#1A4D46', color: 'white' }}>
                <span>Primary</span>
                <code>#1A4D46</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#0F2E2A', color: 'white' }}>
                <span>Dark</span>
                <code>#0F2E2A</code>
              </div>
            </div>
          </div>

          <div className="color-group">
            <h3>Accent - Warm</h3>
            <div className="color-swatches">
              <div className="color-swatch" style={{ backgroundColor: '#FAF0ED' }}>
                <span>Pale</span>
                <code>#FAF0ED</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#E8A593' }}>
                <span>Light</span>
                <code>#E8A593</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#D97559', color: 'white' }}>
                <span>Primary</span>
                <code>#D97559</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#C4614D', color: 'white' }}>
                <span>Dark</span>
                <code>#C4614D</code>
              </div>
            </div>
          </div>

          <div className="color-group">
            <h3>Accent - Cool</h3>
            <div className="color-swatches">
              <div className="color-swatch" style={{ backgroundColor: '#EFF6F6' }}>
                <span>Pale</span>
                <code>#EFF6F6</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#9FC4C2' }}>
                <span>Light</span>
                <code>#9FC4C2</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#6FA3A0', color: 'white' }}>
                <span>Primary</span>
                <code>#6FA3A0</code>
              </div>
              <div className="color-swatch" style={{ backgroundColor: '#5A8A87', color: 'white' }}>
                <span>Dark</span>
                <code>#5A8A87</code>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="showcase-section">
        <h2>Buttons</h2>
        <div className="button-grid">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-secondary">Secondary Button</button>
          <button className="btn btn-cta">CTA Button</button>
          <button className="btn btn-ghost">Ghost Button</button>
          <button className="btn btn-primary" disabled>Disabled</button>
        </div>
        <div className="button-grid">
          <button className="btn btn-primary btn-sm">Small</button>
          <button className="btn btn-primary">Medium</button>
          <button className="btn btn-primary btn-lg">Large</button>
        </div>
      </section>

      {/* Form Elements */}
      <section className="showcase-section">
        <h2>Form Elements</h2>
        <div className="form-showcase">
          <div className="form-group">
            <label>Text Input</label>
            <input type="text" className="form-input" placeholder="Enter text..." />
          </div>
          <div className="form-group">
            <label>Select Dropdown</label>
            <select className="form-input">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
          <div className="form-group">
            <label>Textarea</label>
            <textarea className="form-input" rows="3" placeholder="Enter description..."></textarea>
          </div>
          <div className="form-group">
            <label className="checkbox-label">
              <input type="checkbox" className="checkbox-input" />
              <span>I agree to the terms</span>
            </label>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="showcase-section">
        <h2>Cards</h2>
        <div className="card-grid">
          <div className="showcase-card">
            <div className="card-icon pine">📊</div>
            <h3>Pine Card</h3>
            <p>This card uses the primary Pine Green color for its accent.</p>
            <button className="btn btn-primary btn-sm">Learn More</button>
          </div>
          <div className="showcase-card">
            <div className="card-icon warm">🚀</div>
            <h3>Warm Card</h3>
            <p>This card uses the warm accent color for important CTAs.</p>
            <button className="btn btn-cta btn-sm">Get Started</button>
          </div>
          <div className="showcase-card">
            <div className="card-icon cool">💡</div>
            <h3>Cool Card</h3>
            <p>This card uses the cool accent color for secondary actions.</p>
            <button className="btn btn-secondary btn-sm">View Details</button>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className="showcase-section">
        <h2>Badges & Status</h2>
        <div className="badge-grid">
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-error">Error</span>
          <span className="badge badge-info">Info</span>
          <span className="badge badge-gray">Default</span>
        </div>
      </section>

      {/* Alerts */}
      <section className="showcase-section">
        <h2>Alerts</h2>
        <div className="alert-stack">
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <span>Success! Your quote has been saved.</span>
          </div>
          <div className="alert alert-warning">
            <span className="alert-icon">⚠</span>
            <span>Warning: Quote will expire in 3 days.</span>
          </div>
          <div className="alert alert-error">
            <span className="alert-icon">✕</span>
            <span>Error: Failed to process the request.</span>
          </div>
          <div className="alert alert-info">
            <span className="alert-icon">ℹ</span>
            <span>Info: New features are available.</span>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="showcase-section">
        <h2>Typography</h2>
        <div className="typography-showcase">
          <h1>Heading 1 - Inter Sans</h1>
          <h2>Heading 2 - Inter Sans</h2>
          <h3>Heading 3 - Inter Sans</h3>
          <p className="lead">This is a lead paragraph with Crimson Text serif font. It's slightly larger and helps introduce content.</p>
          <p>Regular paragraph text uses Crimson Text for comfortable reading. The Pine Green theme creates a professional, trustworthy appearance perfect for business applications.</p>
          <p><a href="#">This is a link in Pine Green</a> that changes to darker shade on hover.</p>
        </div>
      </section>
    </div>
  );
};

export default PineThemeShowcase;