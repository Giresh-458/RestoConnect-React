
import { redirect, useNavigate } from 'react-router-dom';
import { isLogin } from '../util/auth';
import './HomePage.css';

export async function loader() {
  try {
    const role = await isLogin();
    if (role != null) {
      return redirect(`/${role}/`);
    }
  } catch (err) {
    // User not authenticated — show the public landing page
  }
  return null;
}

export function HomePage(){
  const navigate = useNavigate();

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="brand">RESTO CONNECT</div>
        <nav className="landing-nav">
          <button onClick={() => navigate('/login')} className="nav-btn primary">
            Login
          </button>
          <button
            onClick={() => navigate('/restaurant-application')}
            className="nav-btn ghost"
          >
            Add your restaurant
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-left">
          <h1>
            Smart restaurant management
            <span className="accent"> made simple.</span>
          </h1>
          <p className="hero-subtitle">
            Customers discover places they love, owners manage their business, staff stay
            on top of orders, and admins keep everything running smoothly.
          </p>

          <div className="hero-actions">
            <button
              className="cta primary"
              onClick={() => navigate('/login')}
            >
              Get started
            </button>
            <button
              className="cta secondary"
              onClick={() => navigate('/restaurant-application')}
            >
              I’m a restaurant owner
            </button>
          </div>

          <div className="role-tags">
            <span>For customers</span>
            <span>For owners</span>
            <span>For staff</span>
            <span>For admins</span>
          </div>
        </section>

        <section className="hero-right">
          <div className="stat-card">
            <h3>Fast ordering</h3>
            <p>Browse menus, place orders, and track status in real time.</p>
          </div>
          <div className="stat-card">
            <h3>Owner dashboards</h3>
            <p>View reservations, manage menus, and track performance.</p>
          </div>
          <div className="stat-card">
            <h3>Staff‑friendly tools</h3>
            <p>See today’s tasks, upcoming shifts, and priority orders.</p>
          </div>
        </section>
      </main>
    </div>
  );
}


