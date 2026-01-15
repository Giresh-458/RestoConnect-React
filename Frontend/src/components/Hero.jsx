import React from 'react';
import '../styles/theme.css';
import Card from './ui/Card';
import Button from './ui/Button';

export default function Hero({ image, title = 'Fresh flavours delivered hot', subtitle = 'Premium ingredients, curated menus, and fast delivery — feel hungry yet?' }) {
  return (
    <section className="rc-hero">
      <div className="container">
        <div className="hero-card">
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div style={{display:'flex',gap:12,alignItems:'center'}}>
            <Button variant="primary">Order Now</Button>
            <Button variant="secondary">View Menu</Button>
            <div className="badge-offer">20% OFF</div>
          </div>
        </div>
      </div>

      <div style={{display:'flex',justifyContent:'center'}}>
        <Card style={{width:520}}>
          {image ? (
            <img src={image} alt="food" className="food-image" />
          ) : (
            <div className="food-image" style={{display:'flex',alignItems:'center',justifyContent:'center',color:'#777'}}>Food image</div>
          )}
        </Card>
      </div>
    </section>
  );
}
