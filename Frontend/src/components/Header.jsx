import React from 'react';
import './../styles/theme.css';
import Button from './ui/Button';

export default function Header() {
  return (
    <header className="rc-header">
      <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div className="rc-logo" style={{color:'white'}}>RestoConnect</div>
        <nav className="rc-navlinks">
          <a href="/">Home</a>
          <a href="/restaurants">Restaurants</a>
          <a href="/offers">Offers</a>
          <a href="/contact">Contact</a>
          <div style={{marginLeft:12}}>
            <Button variant="primary">Order Now</Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
