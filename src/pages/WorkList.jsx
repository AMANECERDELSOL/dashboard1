import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function WorkList({ user, onLogout }) {
    const [works, setWorks] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => {
        fetchWorks()

        const channel = supabase
            .channel('works-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'works' },
                () => fetchWorks()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [filter])

    const fetchWorks = async () => {
        try {
            let query = supabase
                .from('works')
                .select(`
                    *,
                    assigned:assigned_technician_id(id, full_name, nickname),
                    partner:partner_technician_id(id, full_name, nickname)
                `)
                .eq('archived', false)

            if (filter !== 'all') {
                query = query.eq('status', filter)
            }

            const { data, error } = await query
                .order('pinned', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setWorks(data || [])
        } catch (error) {
            console.error('Error fetching works:', error)
            alert('Error al cargar trabajos: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleTakeWork = async (workId) => {
        try {
            const { error } = await supabase
                .from('works')
                .update({
                    status: 'IN_PROGRESS',
                    locked_by: user.userId,
                    assigned_technician_id: user.userId,
                    locked_at: new Date().toISOString(),
                    started_at: new Date().toISOString()
                })
                .eq('id', workId)
                .in('status', ['PENDING', 'HIGH_PRIORITY', 'PAUSED'])

            if (error) throw error
            alert('✅ Trabajo tomado exitosamente')
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handlePinWork = async (workId, currentPinned) => {
        try {
            const { error } = await supabase
                .from('works')
                .update({ pinned: !currentPinned })
                .eq('id', workId)

            if (error) throw error
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handlePauseWork = async (workId) => {
        const reason = prompt('¿Por qué pausas el trabajo?')
        if (!reason) return

        try {
            const { error } = await supabase
                .from('works')
                .update({ status: 'PAUSED', pause_reason: reason })
                .eq('id', workId)
                .eq('locked_by', user.userId)

            if (error) throw error
            alert('✅ Trabajo pausado')
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const handleCompleteWork = async (workId) => {
        if (!confirm('¿Marcar trabajo como finalizado?')) return

        try {
            const { error } = await supabase
                .from('works')
                .update({
                    status: 'COMPLETED',
                    completed_at: new Date().toISOString()
                })
                .eq('id', workId)
                .eq('locked_by', user.userId)

            if (error) throw error
            alert('✅ Trabajo completado')
            fetchWorks()
        } catch (error) {
            alert('❌ Error: ' + error.message)
        }
    }

    const getStatusBadge = (status) => {
        const badges = {
            'PENDING': 'badge-pending',
            'HIGH_PRIORITY': 'badge-high-priority',
            'IN_PROGRESS': 'badge-in-progress',
            'PAUSED': 'badge-pending',
            'COMPLETED': 'badge-completed'
        }
        return `badge ${badges[status] || 'badge-pending'}`
    }

    return (
        <div>
            <div className="navbar">
                <h1>☁️ Sky Web Panel</h1>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/works" className="active">Trabajos</Link>
                    <Link to="/calendar">Calendario</Link>
                    <Link to="/hazards">Peligros</Link>
                    {user?.role === 'ADMIN' && (
                        <>
                            <Link to="/monitor">Monitor</Link>
                            <Link to="/admin">Admin</Link>
                        </>
                    )}
                    <Link to="/chat">Chat</Link>
                    <button onClick={onLogout} className="btn btn-secondary">
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="container">
                <div className="card">
                    <h2>📋 Gestión de Trabajos</h2>
                    <div className="form-group">
                        <label>Filtrar por estado:</label>
                        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                            <option value="all">Todos</option>
                            <option value="PENDING">Pendientes</option>
                            <option value="HIGH_PRIORITY">Prioridad Alta</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="PAUSED">Pausados</option>
                            <option value="COMPLETED">Completados</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#64748b' }}>Cargando trabajos...</p>
                    </div>
                ) : works.length === 0 ? (
                    <div className="card">
                        <p style={{ textAlign: 'center', color: '#64748b' }}>No hay trabajos disponibles</p>
                    </div>
                ) : (
                    works.map(work => (
                        <div key={work.id} className="card" style={{
                            border: work.pinned ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.3)',
                            background: work.pinned ? 'rgba(99, 102, 241, 0.05)' : 'var(--surface-glass)'
                        }}>
                            {/* Técnicos asignados - Arriba del título */}
                            {(work.assigned || work.partner) && (
                                <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    {work.assigned && (
                                        <span style={{
                                            background: '#dbeafe',
                                            color: '#2563eb',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            👤 {work.assigned.nickname || work.assigned.full_name}
                                        </span>
                                    )}
                                    {work.partner && (
                                        <span style={{
                                            background: '#e0e7ff',
                                            color: '#4f46e5',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '1rem',
                                            fontSize: '0.875rem',
                                            fontWeight: '600'
                                        }}>
                                            👥 {work.partner.nickname || work.partner.full_name}
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Título y badges */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <h3 style={{ margin: 0 }}>
                                    {work.pinned && <span style={{ marginRight: '0.5rem' }}>📌</span>}
                                    {work.title}
                                </h3>
                            </div>

                            {/* Badges de estado */}
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                <span className={getStatusBadge(work.status)}>{work.status}</span>
                                {work.priority && <span className="badge badge-high-priority">⚠️ PRIORIDAD</span>}
                                {work.pinned && (
                                    <span className="badge" style={{ background: '#6366f1', color: 'white' }}>
                                        📌 FIJADO
                                    </span>
                                )}
                            </div>

                            {/* Descripción */}
                            <p style={{ color: '#64748b', marginBottom: '1rem' }}>{work.description}</p>

                            {/* Detalles */}
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                                <div>📍 <strong>Dirección:</strong> {work.address}</div>
                                <div>📅 <strong>Fecha:</strong> {new Date(work.work_date).toLocaleDateString('es-MX')}</div>
                                <div>⏰ <strong>Turno:</strong> {work.shift || 'No especificado'}</div>
                                {work.client_name && (
                                    <div>👤 <strong>Cliente:</strong> {work.client_name} - {work.client_phone}</div>
                                )}
                            </div>

                            {/* Acciones */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                {user?.role === 'ADMIN' && (
                                    <button
                                        onClick={() => handlePinWork(work.id, work.pinned)}
                                        className={work.pinned ? 'btn btn-danger' : 'btn btn-secondary'}
                                    >
                                        {work.pinned ? '📌 Desfijar' : '📌 Fijar'}
                                    </button>
                                )}

                                {['PENDING', 'HIGH_PRIORITY', 'PAUSED'].includes(work.status) && (
                                    <button onClick={() => handleTakeWork(work.id)} className="btn btn-primary">
                                        ✋ Tomar Trabajo
                                    </button>
                                )}

                                {work.status === 'IN_PROGRESS' && work.locked_by === user?.userId && (
                                    <>
                                        <button onClick={() => handleCompleteWork(work.id)} className="btn btn-success">
                                            ✅ Finalizar
                                        </button>
                                        <button onClick={() => handlePauseWork(work.id)} className="btn btn-danger">
                                            ⏸️ Pausar
                                        </button>
                                    </>
                                )}

                                {work.latitude && work.longitude && (
                                    <a
                                        href={`https://www.openstreetmap.org/directions?from=&to=${work.latitude},${work.longitude}&engine=fossgis_osrm_car`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-secondary"
                                    >
                                        🗺️ Navegar
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default WorkList
