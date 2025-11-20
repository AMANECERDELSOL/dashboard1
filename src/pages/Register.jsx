import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Register() {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        email: '',
        role: 'TECHNICIAN'
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Validaciones
        if (formData.password !== formData.confirmPassword) {
            setError('Las contraseñas no coinciden')
            setLoading(false)
            return
        }

        if (formData.password.length < 5) {
            setError('La contraseña debe tener al menos 5 caracteres')
            setLoading(false)
            return
        }

        if (formData.username.length < 3) {
            setError('El nombre de usuario debe tener al menos 3 caracteres')
            setLoading(false)
            return
        }

        try {
            const { data, error: registerError } = await supabase.rpc('register_user', {
                p_username: formData.username,
                p_password: formData.password,
                p_full_name: formData.fullName,
                p_email: formData.email,
                p_role: formData.role
            })

            if (registerError) {
                throw registerError
            }

            if (!data.success) {
                setError(data.error)
                setLoading(false)
                return
            }

            // Registro exitoso
            alert('✅ Cuenta creada exitosamente! Ahora puedes iniciar sesión.')
            navigate('/login')
        } catch (err) {
            console.error('Register error:', err)
            setError(err.message || 'Error al crear la cuenta')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>☁️ Sky Web Panel</h2>
                    <p className="text-muted">Crea tu cuenta para comenzar</p>
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
                        <label>Nombre Completo</label>
                        <input
                            type="text"
                            name="fullName"
                            placeholder="Ej: Juan Pérez"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Correo Electrónico</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Nombre de Usuario</label>
                        <input
                            type="text"
                            name="username"
                            placeholder="usuario123"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            minLength={3}
                        />
                        <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                            Mínimo 3 caracteres
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={5}
                        />
                        <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
                            Mínimo 5 caracteres
                        </small>
                    </div>

                    <div className="form-group">
                        <label>Confirmar Contraseña</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipo de Cuenta</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            <option value="TECHNICIAN">🔵 Técnico</option>
                            <option value="ADMIN">🔴 Administrador</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                        {loading ? 'Creando cuenta...' : '🚀 Crear Cuenta'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', color: '#64748b' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}>
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Register
