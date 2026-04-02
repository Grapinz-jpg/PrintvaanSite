import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#1a1a1a', color: 'white', padding: '2rem 1rem', marginTop: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', maxWidth: '1200px', margin: '0 auto' }}>
        <div>
          <h3>Printvaan</h3>
          <p>© {new Date().getFullYear()} All Rights Reserved</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4>Quick Links</h4>
          <Link to="/about" style={{ color: 'white', textDecoration: 'none' }}>About Us</Link>
          <Link to="/terms" style={{ color: 'white', textDecoration: 'none' }}>Terms & Conditions</Link>
          <Link to="/privacy" style={{ color: 'white', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/returns" style={{ color: 'white', textDecoration: 'none' }}>Return & Warranty</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;