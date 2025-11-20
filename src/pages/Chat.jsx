import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Chat({ user, onLogout }) {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef(null)

    // Pedir permiso para notificaciones
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission()
        }
    }, [])

    useEffect(() => {
        fetchMessages()

        const channel = supabase
            .channel('chat-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    fetchMessages()
                    // Mostrar notificación si no es del usuario actual
                    if (payload.new.user_id !== user.userId) {
                        showNotification('Nuevo mensaje en el chat', {
                            body: 'Hay un mensaje nuevo en el chat del equipo',
                            icon: '/favicon.ico'
                        })
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('chat_messages')
                .select(`
                    *,
                    users (username, full_name, nickname, role)
                `)
                .order('created_at', { ascending: true })
                .limit(100)

            if (error) throw error
            setMessages(data || [])
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const showNotification = (title, options) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, options)
        }
    }

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        try {
            const { error } = await supabase
                .from('chat_messages')
                .insert([{
                    user_id: user.userId,
                    message: newMessage.trim()
                }])

            if (error) throw error
            setNewMessage('')
        } catch (error) {
            console.error('Error sending message:', error)
            alert('Error al enviar mensaje: ' + error.message)
        }
    }

    return (
        <div>
            <div className="navbar">
                <h1>☁️ Sky Web Panel</h1>
                <nav>
                    <Link to="/dashboard">Dashboard</Link>
                    <Link to="/works">Trabajos</Link>
                    <Link to="/calendar">Calendario</Link>
                    <Link to="/hazards">Peligros</Link>
                    <Link to="/chat" className="active">Chat</Link>
                    <button onClick={onLogout} className="btn btn-secondary" style={{ marginLeft: '15px' }}>
                        Cerrar Sesión
                    </button>
                </nav>
            </div>

            <div className="container">
                <div className="card">
                    <h2>💬 Chat General</h2>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                        Comunica incidencias y coordina con el equipo en tiempo real
                    </p>
                </div>

                <div className="card">
                    <div className="chat-container">
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                                    No hay mensajes aún. ¡Sé el primero en escribir!
                                </div>
                            ) : (
                                messages.map((msg) => {
                                    const displayName = msg.users?.nickname
                                        ? `${msg.users.nickname} (${msg.users.full_name})`
                                        : (msg.users?.full_name || msg.users?.username || 'Usuario')
                                    const roleColor = msg.users?.role === 'ADMIN' ? '#dc2626' : '#2563eb'

                                    return (
                                        <div key={msg.id} className="chat-message">
                                            <div style={{ fontWeight: 'bold', fontSize: '0.875rem', color: roleColor }}>
                                                {displayName}
                                            </div>
                                            <div style={{ marginTop: '5px' }}>{msg.message}</div>
                                            <div style={{ fontSize: '11px', color: '#999', marginTop: '5px' }}>
                                                {new Date(msg.created_at).toLocaleTimeString('es-MX')}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="chat-input">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe un mensaje..."
                            />
                            <button type="submit" className="btn btn-primary">
                                Enviar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Chat
