import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { supabase } from '../lib/supabase'

function Profile({ user, onLogout }) {
    const [userData, setUserData] = useState({
        username: '',
        nickname: '',
        full_name: '',
        email: '',
        role: ''
    })
    const [passwords, setPasswords] = useState({
        current: '',
        new: '',
        confirm: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState({ type: '', text: '' })

    useEffect(() => {
        fetchUserData()
    }, [user.userId])

    const fetchUserData = async () => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('username, nickname, full_name, email, role')
                .eq('id', user.userId)
                .single()

            if (error) throw error
            setUserData(data)
        } catch (error) {
            console.error('Error fetching user data:', error)
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const { data, error } = await supabase.rpc('update_user_profile', {
                p_user_id: user.userId,
                p_username: userData.username,
                p_nickname: userData.nickname || ''
            })

            if (error) throw error

            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                // Actualizar localStorage con nuevo username
                const updatedUser = { ...user, username: userData.username }
                localStorage.setItem('fsm_user', JSON.stringify(updatedUser))
            } else {
                setMessage({ type: 'error', text: data.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        if (passwords.new !== passwords.confirm) {
            setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' })
            setLoading(false)
            return
        }

        if (passwords.new.length < 5) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 5 caracteres' })
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase.rpc('update_user_password', {
                p_user_id: user.userId,
                p_old_password: passwords.current,
                p_new_password: passwords.new
            })

            if (error) throw error

            if (data.success) {
                setMessage({ type: 'success', text: data.message })
                setPasswords({ current: '', new: '', confirm: '' })
            } else {
                setMessage({ type: 'error', text: data.error })
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            <Navbar user={user} onLogout={onLogout} activePage="profile" />

            <div className="container">
                <div className="card">
                    <h2>👤 Mi Perfil</h2>
                    <p style={{ color: '#64748b' }}>
                        Actualiza tu información personal y credenciales
                    </p>
                </div>

                {message.text && (
                    <div className={`card ${message.type === 'success' ? 'animate-fade-in' : ''}`}
                        style={{
                            background: message.type === 'success' ? '#d1fae5' : '#fee2e2',
                            color: message.type === 'success' ? '#059669' : '#dc2626',
                            padding: '1rem',
                            marginBottom: '1rem'
                        }}>
                        {message.text}
                    </div>
                )}

                {/* Sección de Información Personal */}
                <div className="card">
                    <h3>📝 Información Personal</h3>
                    <form onSubmit={handleUpdateProfile}>
                        <div className="form-group">
                            <label>Nombre Completo</label>
                            <input
                                type="text"
                                value={userData.full_name || ''}
                                disabled
                                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                            />
                            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                El nombre completo solo puede ser modificado por un administrador
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Usuario de Login</label>
                            <input
                                type="text"
                                value={userData.username || ''}
                                onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                                required
                                minLength={3}
                            />
                            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                Usa este nombre para iniciar sesión
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Apodo (Opcional)</label>
                            <input
                                type="text"
                                value={userData.nickname || ''}
                                onChange={(e) => setUserData({ ...userData, nickname: e.target.value })}
                                placeholder="Ej: Pepe, Chuy, etc."
                            />
                            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                Este nombre aparecerá en el chat. Si no lo defines, se mostrará tu nombre completo
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Rol</label>
                            <input
                                type="text"
                                value={userData.role === 'ADMIN' ? '🔴 Administrador' : '🔵 Técnico'}
                                disabled
                                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : '💾 Guardar Cambios'}
                        </button>
                    </form>
                </div>

                {/* Sección de Cambio de Contraseña */}
                <div className="card">
                    <h3>🔐 Cambiar Contraseña</h3>
                    <form onSubmit={handleUpdatePassword}>
                        <div className="form-group">
                            <label>Contraseña Actual</label>
                            <input
                                type="password"
                                value={passwords.current}
                                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Nueva Contraseña</label>
                            <input
                                type="password"
                                value={passwords.new}
                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                required
                                minLength={5}
                            />
                            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                                Mínimo 5 caracteres
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Confirmar Nueva Contraseña</label>
                            <input
                                type="password"
                                value={passwords.confirm}
                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                required
                                minLength={5}
                            />
                        </div>

                        <button type="submit" className="btn btn-success" disabled={loading}>
                            {loading ? 'Actualizando...' : '🔒 Cambiar Contraseña'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Profile
