// Cloudflare Workers API for Authentication
// Handles user signup, login, and session management with KV storage

// This would be deployed as a Cloudflare Worker
// For now, we'll create a mock implementation that works with localStorage

class AuthAPI {
  constructor() {
    this.KV_NAMESPACE = 'ADM_AUTH';
    this.users = this.loadUsers();
  }

  loadUsers() {
    try {
      return JSON.parse(localStorage.getItem('adm_users') || '{}');
    } catch {
      return {};
    }
  }

  saveUsers() {
    localStorage.setItem('adm_users', JSON.stringify(this.users));
  }

  // Generate JWT-like token (simplified for demo)
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    };
    return btoa(JSON.stringify(payload));
  }

  verifyToken(token) {
    try {
      const payload = JSON.parse(atob(token));
      if (payload.exp < Date.now()) return null;
      return payload;
    } catch {
      return null;
    }
  }

  // Hash password (simplified)
  hashPassword(password) {
    return btoa(password + 'salt'); // In production, use proper hashing
  }

  // User signup
  async signup(email, password, name) {
    if (this.users[email]) {
      throw new Error('Email já cadastrado');
    }

    const user = {
      id: 'user_' + Date.now(),
      email,
      name,
      password: this.hashPassword(password),
      role: 'user',
      createdAt: new Date().toISOString(),
      usageCount: 0,
      unlimited: false
    };

    this.users[email] = user;
    this.saveUsers();

    const token = this.generateToken(user);
    return { token, user: { ...user, password: undefined } };
  }

  // User login
  async login(email, password) {
    const user = this.users[email];
    if (!user || user.password !== this.hashPassword(password)) {
      throw new Error('Email ou senha incorretos');
    }

    const token = this.generateToken(user);
    return { token, user: { ...user, password: undefined } };
  }

  // Verify token
  async verify(token) {
    const payload = this.verifyToken(token);
    if (!payload) throw new Error('Token inválido');
    
    const user = this.users[payload.email];
    if (!user) throw new Error('Usuário não encontrado');
    
    return { ...user, password: undefined };
  }
}

// Mock API endpoints for development
window.AuthAPI = AuthAPI;

// Mock fetch interceptors for development
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  const authAPI = new AuthAPI();

  window.fetch = async function(url, options = {}) {
    // Handle auth endpoints
    if (url === '/api/auth/signup') {
      const { email, password, name } = JSON.parse(options.body);
      try {
        const result = await authAPI.signup(email, password, name);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url === '/api/auth/login') {
      const { email, password } = JSON.parse(options.body);
      try {
        const result = await authAPI.login(email, password);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url === '/api/auth/verify') {
      const token = options.headers?.Authorization?.replace('Bearer ', '');
      try {
        const user = await authAPI.verify(token);
        return new Response(JSON.stringify(user), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: error.message }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle user history endpoints
    if (url === '/api/user/history') {
      const token = options.headers?.Authorization?.replace('Bearer ', '');
      try {
        const user = await authAPI.verify(token);
        const history = JSON.parse(localStorage.getItem('adm-history') || '[]');
        return new Response(JSON.stringify(history), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (url.startsWith('/api/user/history/') && options.method === 'DELETE') {
      const token = options.headers?.Authorization?.replace('Bearer ', '');
      const itemId = url.split('/').pop();
      
      try {
        const user = await authAPI.verify(token);
        const history = JSON.parse(localStorage.getItem('adm-history') || '[]');
        const updated = history.filter(item => item.id !== itemId);
        localStorage.setItem('adm-history', JSON.stringify(updated));
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // For all other requests, use original fetch
    return originalFetch.apply(this, arguments);
  };
}
