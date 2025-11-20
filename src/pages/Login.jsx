import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Login({ onLogin }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { data, error: loginError } = await supabase.rpc('login_with_username', {
                p_username: username,
                p_password: password
            })

            if (loginError) {
                throw loginError
            }

            if (!data || !data.success) {
                setError(data?.error || 'Credenciales inválidas')
                setLoading(false)
                return
            }

            const userData = {
                userId: data.user_id,
                username: data.username,
                role: data.role,
                fullName: data.full_name
            }

            onLogin(data.session_token, userData)
        } catch (err) {
            console.error('Login error:', err)
            setError(err.message || 'Error de conexión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>☁️ Sky Web Panel</h2>
                    <p className="text-muted">Ingresa tus credenciales para continuar</p>
                </div>

                {error && (
                    <div style={{
                        background: '#fee2e2',
                        color: '#dc2626',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        fontSize: '0.875rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Usuario</label>
                        <input
                            type="text"
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
                        Crear Cuenta
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login


