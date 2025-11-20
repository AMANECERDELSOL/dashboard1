import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import CurrentWork from '../components/CurrentWork'
import Navbar from '../components/Navbar'

function Dashboard({ user, onLogout }) {
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        highPriority: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchStats()

        // Realtime subscription for stats
        const subscription = supabase
            .channel('dashboard-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'works' }, () => {
                fetchStats()
            })
            .subscribe()

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('works')
                .select('status, priority')
                .eq('archived', false)

            if (error) throw error

            const newStats = {
                pending: data.filter(w => w.status === 'PENDING').length,
                completed: data.filter(w => w.status === 'COMPLETED').length,
                highPriority: data.filter(w => w.status === 'HIGH_PRIORITY' || w.priority).length
            }
            setStats(newStats)
        } catch (error) {
            console.error('Error fetching stats:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Navbar user={user} onLogout={onLogout} activePage="dashboard" />

            <div className="container">
                <header style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        Hola, <span style={{ color: '#6366f1' }}>{user.username}</span> 👋
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                        {user.role === 'ADMIN'
                            ? 'Panel de control general y monitoreo de flota.'
                            : 'Aquí tienes tu asignación actual y estado.'}
                    </p>
                </header>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <div className="card animate-fade-in" style={{ borderLeft: '4px solid #fbbf24' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Pendientes</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0f172a' }}>{stats.pending}</div>
                    </div>
                    <div className="card animate-fade-in" style={{ borderLeft: '4px solid #ef4444', animationDelay: '0.1s' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Prioridad Alta</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.highPriority}</div>
                    </div>
                    <div className="card animate-fade-in" style={{ borderLeft: '4px solid #10b981', animationDelay: '0.2s' }}>
                        <div style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' }}>Completados</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>{stats.completed}</div>
                    </div>
                </div>

                {/* Main Content Area */}
                {user.role === 'TECHNICIAN' ? (
                    <div className="animate-slide-up">
                        <h3 style={{ marginBottom: '1.5rem', color: '#334155' }}>Tu Misión Actual</h3>
                        <CurrentWork user={user} onWorkComplete={fetchStats} />
                    </div>
                ) : (
                    <div className="card animate-slide-up">
                        <div style={{ textAlign: 'center', padding: '2rem' }}>
                            <h3>Panel de Administración</h3>
                            <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                                Utiliza el menú de navegación para gestionar trabajos, ver el calendario o monitorear a los técnicos en tiempo real.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                <Link to="/monitor" className="btn btn-primary">
                                    📡 Ir al Monitor en Vivo
                                </Link>
                                <Link to="/calendar" className="btn btn-secondary">
                                    📅 Ver Calendario
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
