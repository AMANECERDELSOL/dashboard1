mport { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function AdminPanel({ user, onLogout }) {
    const [technicians, setTechnicians] = useState([])
    const [loading, setLoading] = useState(true)
    const [cleanupRunning, setCleanupRunning] = useState(false)

    useEffect(() => {
        fetchTechnicians()
    }, [])

    const fetchTechnicians = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('role', 'TECHNICIAN')
                .order('full_name', { ascending: true })

            if (error) throw error
            setTechnicians(data || [])
        } catch (error) {
            console.error('Error fetching technicians:', error)
            alert('Error al cargar técnicos')
        } finally {
            setLoading(false)
        }
    }

    const toggleTechnicianStatus = async (techId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_active: !currentStatus })
                .eq('id', techId)

            if (error) throw error

            setTechnicians(technicians.map(tech =>
                tech.id === techId ? { ...tech, is_active: !currentStatus } : tech
            ))

            alert(`✅ Técnico ${!currentStatus ? 'activado' : 'desactivado'} correctamente`)
        } catch (error) {
            console.error('Error updating status:', error)
            alert('❌ Error al actualizar estado: ' + error.message)
        }
    }

    const runCleanup = async () => {
        if (!confirm('⚠️ LIMPIEZA DE BASE DE DATOS\n\nEsto BORRARÁ permanentemente:\n- Mensajes de chat > 7 días\n- Trabajos completados de días anteriores\n\n¿Continuar?')) {
            return
        }

        setCleanupRunning(true)

        try {
            const { error } = await supabase.rpc('run_cleanup_tasks')

            if (error) throw error

            alert('✅ Limpieza completada exitosamente')
        } catch (error) {
            console.error('Error running cleanup:', error)
            alert('❌ Error: ' + error.message)
        } finally {
            setCleanupRunning(false)
        }
    }

    return (
        <div>
            <Navbar user={user} onLogout={onLogout} activePage="admin" />

            <div className="container">
                <div className="card">
                    <h2>👥 Panel de Administración</h2>
                </div>

                {/* Cleanup Section */}
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>🧹 Limpieza de Base de Datos</h3>
                            <p style={{ color: '#64748b', margin: 0, fontSize: '0.875rem' }}>
                                Borra datos antiguos para ahorrar espacio
                            </p>
                        </div>
                        <button
                            onClick={runCleanup}
                            className="btn btn-danger"
                            disabled={cleanupRunning}
                            style={{ minWidth: '180px' }}
                        >
                            {cleanupRunning ? '🔄 Limpiando...' : '🧹 Limpiar Ahora'}
                        </button>
                    </div>

                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#991b1b'
                    }}>
                        <strong>⚠️ Atención:</strong> Esta acción borra permanentemente:
                        <ul style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                            <li>Mensajes de chat mayores a 7 días</li>
                            <li>Trabajos completados de fechas pasadas</li>
                        </ul>
                    </div>
                </div>

                {/* Technicians Section */}
                {loading ? (
                    <div className="loading">Cargando técnicos...</div>
                ) : (
                    <div className="card">
                        <h3>Gestión de Técnicos</h3>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Usuario</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {technicians.map(tech => (
                                        <tr key={tech.id}>
                                            <td>
                                                <div style={{ fontWeight: 'bold' }}>{tech.full_name}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{tech.email}</div>
                                            </td>
                                            <td>@{tech.username}</td>
                                            <td>
                                                <span className={`badge ${tech.is_active ? 'badge-completed' : 'badge-danger'}`}>
                                                    {tech.is_active ? 'ACTIVO' : 'INACTIVO'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => toggleTechnicianStatus(tech.id, tech.is_active)}
                                                    className={`btn ${tech.is_active ? 'btn-danger' : 'btn-success'}`}
                                                    style={{ padding: '6px 12px', fontSize: '13px' }}
                                                >
                                                    {tech.is_active ? '🚫 Desactivar' : '✅ Activar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {technicians.length === 0 && (
                            <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                                No se encontraron técnicos registrados.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default AdminPanel
