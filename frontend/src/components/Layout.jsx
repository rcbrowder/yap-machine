import { Link, Outlet, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout() {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="container">
          <div className="nav-container">
            <div className="logo-nav">
              <Link to="/" className="logo-link">
                <span className="logo-text">
                  AI Journal
                </span>
              </Link>
              <nav className="desktop-nav">
                <Link 
                  to="/" 
                  className={isActive('/') ? 'nav-link active' : 'nav-link'}
                >
                  Journal Entries
                </Link>
                <Link 
                  to="/chat" 
                  className={isActive('/chat') ? 'nav-link active' : 'nav-link'}
                >
                  AI Chat
                </Link>
              </nav>
            </div>
            
            {/* Mobile menu button */}
            <div className="mobile-nav">
              <Link 
                to="/" 
                className={isActive('/') ? 'mobile-link active' : 'mobile-link'}
              >
                Journal
              </Link>
              <Link 
                to="/chat" 
                className={isActive('/chat') ? 'mobile-link active' : 'mobile-link'}
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            AI Journal - A private space to reflect and connect with your thoughts
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout; 