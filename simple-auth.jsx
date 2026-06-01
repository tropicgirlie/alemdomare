// Simple Authentication System - Working version
// Email/password auth with localStorage persistence.
// Passwords are hashed (PBKDF2 / SHA-256, 100k iterations) so plaintext is
// never stored. Existing plaintext users are silently migrated on next login.

async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSaltHex() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function SimpleAuth({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = React.useState('login'); // login | signup
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const dirA = true; // Simplified for now

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const users = JSON.parse(localStorage.getItem('adm_users') || '{}');
        const user = users[email];

        if (!user) {
          setError('Email ou senha incorretos');
          return;
        }

        let ok = false;
        if (user.passwordHash && user.salt) {
          const hash = await hashPassword(password, user.salt);
          ok = (hash === user.passwordHash);
        } else if (typeof user.password === 'string') {
          // Legacy plaintext user — verify, then migrate to hashed.
          ok = (user.password === password);
          if (ok) {
            const salt = randomSaltHex();
            user.salt = salt;
            user.passwordHash = await hashPassword(password, salt);
            delete user.password;
            users[email] = user;
            localStorage.setItem('adm_users', JSON.stringify(users));
          }
        }

        if (!ok) {
          setError('Email ou senha incorretos');
          return;
        }

        const { password: _p, passwordHash: _h, salt: _s, ...safe } = user;
        onLogin(safe);
        onClose();

      } else {
        const users = JSON.parse(localStorage.getItem('adm_users') || '{}');

        if (users[email]) {
          setError('Email já cadastrado');
          return;
        }

        const salt = randomSaltHex();
        const passwordHash = await hashPassword(password, salt);

        const newUser = {
          id: 'user_' + Date.now(),
          email,
          name,
          salt,
          passwordHash,
          role: 'user',
          createdAt: new Date().toISOString()
        };

        users[email] = newUser;
        localStorage.setItem('adm_users', JSON.stringify(users));

        const { passwordHash: _h, salt: _s, ...safe } = newUser;
        onLogin(safe);
        onClose();
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerLogin = () => {
    const ownerUser = {
      id: 'owner',
      email: 'owner@alemdomar.com',
      name: 'Owner',
      role: 'owner',
      createdAt: new Date().toISOString()
    };

    onLogin(ownerUser);
    onClose();
  };

  if (!isOpen) return null;

  return React.createElement('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20
    }
  }, [
    React.createElement('div', {
      key: 'modal',
      style: {
        background: dirA ? '#fff' : '#1a1a1a',
        borderRadius: 16,
        padding: 32,
        width: '100%',
        maxWidth: 400,
        border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`
      }
    }, [
      // Header
      React.createElement('div', {
        key: 'header',
        style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }
      }, [
        React.createElement('h2', {
          key: 'title',
          style: {
            margin: 0,
            fontSize: 24,
            fontWeight: 600,
            color: dirA ? '#333' : '#fff'
          }
        }, mode === 'login' ? 'Entrar' : 'Criar conta'),
        React.createElement('button', {
          key: 'close',
          onClick: onClose,
          style: {
            background: 'none',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: dirA ? '#666' : '#999'
          }
        }, '×')
      ]),

      // Form
      React.createElement('form', {
        key: 'form',
        onSubmit: handleSubmit,
        style: { display: 'flex', flexDirection: 'column', gap: 16 }
      }, [
        mode === 'signup' && React.createElement('input', {
          key: 'name',
          type: 'text',
          placeholder: 'Nome completo',
          value: name,
          onChange: (e) => setName(e.target.value),
          required: true,
          style: inputStyle(dirA)
        }),

        React.createElement('input', {
          key: 'email',
          type: 'email',
          placeholder: 'E-mail',
          value: email,
          onChange: (e) => setEmail(e.target.value),
          required: true,
          style: inputStyle(dirA)
        }),

        React.createElement('input', {
          key: 'password',
          type: 'password',
          placeholder: 'Senha',
          value: password,
          onChange: (e) => setPassword(e.target.value),
          required: true,
          style: inputStyle(dirA)
        }),

        error && React.createElement('div', {
          key: 'error',
          style: {
            color: '#dc2626',
            fontSize: 14,
            padding: '8px 12px',
            background: 'rgba(220, 38, 38, 0.1)',
            borderRadius: 6,
            border: '1px solid rgba(220, 38, 38, 0.2)'
          }
        }, error),

        React.createElement('button', {
          key: 'submit',
          type: 'submit',
          disabled: isLoading,
          style: {
            ...buttonStyle(dirA),
            opacity: isLoading ? 0.5 : 1,
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }
        }, isLoading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar conta')),

        // Mode switch
        React.createElement('div', {
          key: 'switch',
          style: { textAlign: 'center', fontSize: 14 }
        }, [
          mode === 'login' ? 'Não tem conta? ' : 'Já tem conta? ',
          React.createElement('button', {
            key: 'switch-btn',
            type: 'button',
            onClick: () => setMode(mode === 'login' ? 'signup' : 'login'),
            style: {
              background: 'none',
              border: 'none',
              color: dirA ? '#2a9d8f' : '#4fb9b8',
              cursor: 'pointer',
              textDecoration: 'underline'
            }
          }, mode === 'login' ? 'Criar conta' : 'Entrar')
        ]),

        // Owner bypass
        React.createElement('div', {
          key: 'owner',
          style: { textAlign: 'center', marginTop: 16 }
        }, [
          React.createElement('button', {
            key: 'owner-btn',
            type: 'button',
            onClick: handleOwnerLogin,
            style: {
              background: 'none',
              border: '1px solid #666',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              color: '#666',
              cursor: 'pointer'
            }
          }, '👑 Owner Access')
        ])
      ])
    ])
  ]);
}

function inputStyle(dirA) {
  return {
    padding: '12px 16px',
    border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
    borderRadius: 8,
    fontSize: 16,
    background: dirA ? '#fff' : '#2a2a2a',
    color: dirA ? '#333' : '#fff'
  };
}

function buttonStyle(dirA) {
  return {
    padding: '12px 24px',
    border: 'none',
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    background: dirA ? '#2a9d8f' : '#4fb9b8',
    color: '#fff',
    cursor: 'pointer'
  };
}

window.SimpleAuth = SimpleAuth;
