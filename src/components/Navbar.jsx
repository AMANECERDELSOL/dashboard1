import { useState } from 'react'
import { Link } from 'react-router-dom'

function Navbar({ user, onLogout, activePage }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen)
    }

    const closeMobileMenu = () => {
        setMobileMenuOpen(false)
    }

    return (
        <div className="navbar">
            <h1>☁️ Sky Web Panel</h1>

            <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                {mobileMenuOpen ? '✕' : '☰'}
            </button>

            <nav className={mobileMenuOpen ? 'active' : ''}>
                <Link
                    to="/dashboard"
                    className={activePage === 'dashboard' ? 'active' : ''}
                    onClick={closeMobileMenu}
                >
                    Dashboard
                </Link>
                <Link
                    to="/works"
                    className={activePage === 'works' ? 'active' : ''}
                    onClick={closeMobileMenu}
                >
                    Trabajos
                </Link>
                <Link
                    to="/calendar"
                    className={activePage === 'calendar' ? 'active' : ''}
                    onClick={closeMobileMenu}
                >
                    Calendario
                </Link>
                <Link
                    to="/hazards"
                    className={activePage === 'hazards' ? 'active' : ''}
                    onClick={closeMobileMenu}
                >
                    Peligros
                </Link>
                {user?.role === 'ADMIN' && (
                    <>
                        <Link
                            to="/monitor"
                            className={activePage === 'monitor' ? 'active' : ''}
                            onClick={closeMobileMenu}
                        >
                            Monitor
                        </Link>
                        <Link
                            to="/admin"
                            className={activePage === 'admin' ? 'active' : ''}
                            onClick={closeMobileMenu}
                        >
                            Admin
                        </Link>
                    </>
                )}
                <Link
                    to="/chat"
                    className={activePage === 'chat' ? 'active' : ''}
                    onClick={closeMobileMenu}
                >
                    Chat
                </Link>
                <button
                    onClick={() => {
                        closeMobileMenu()
                        onLogout()
                    }}
                    className="btn btn-secondary"
                >
                    Cerrar Sesión
                </button>
            </nav>
        </div>
    )
}

export default Navbar
