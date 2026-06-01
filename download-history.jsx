// Download History Page - Centralized user dashboard with analytics
// Replaces simple localStorage history with proper user data management

function DownloadHistory({ direction, onBack, onOpenItem }) {
  const [items, setItems] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all'); // all | career | cultural | diagnosis
  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortBy, setSortBy] = React.useState('date'); // date | tool | usage
  
  const { user } = window.useAuth();
  const dirA = direction === 'a';

  // Load user history from Cloudflare KV
  React.useEffect(() => {
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('adm_auth_token');
      const response = await fetch('/api/user/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const history = await response.json();
        setItems(history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
      // Fallback to localStorage for development
      try {
        const raw = localStorage.getItem('adm-history');
        setItems(raw ? JSON.parse(raw) : []);
      } catch {
        setItems([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort items
  const getFilteredItems = () => {
    let filtered = items;

    // Filter by category
    if (filter !== 'all') {
      filtered = filtered.filter(item => {
        const tool = window.AdM_TOOLS[item.toolId];
        if (!tool) return false;
        
        if (filter === 'career') return ['career', 'ats_check', 'salary_reality', 'interview_sim'].includes(item.toolId);
        if (filter === 'cultural') return ['cultural', 'social_scripts'].includes(item.toolId);
        if (filter === 'diagnosis') return ['hiring_reality', 'rejection_decoder'].includes(item.toolId);
        return true;
      });
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(item => {
        const tool = window.AdM_TOOLS[item.toolId];
        if (!tool) return false;
        
        return tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
               tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
               (item.result?.internationalTitle && item.result.internationalTitle.toLowerCase().includes(searchQuery.toLowerCase()));
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'tool') return (a.toolId || '').localeCompare(b.toolId || '');
      if (sortBy === 'usage') return (b.usageCount || 0) - (a.usageCount || 0);
      return 0;
    });

    return filtered;
  };

  // Export functionality
  const exportData = async () => {
    const dataToExport = getFilteredItems().map(item => ({
      date: item.createdAt,
      tool: window.AdM_TOOLS[item.toolId]?.label || item.toolId,
      input: item.form,
      output: item.result,
      usageCount: item.usageCount || 0
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alemdomar-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Delete item
  const deleteItem = async (itemId) => {
    try {
      const token = localStorage.getItem('adm_auth_token');
      await fetch(`/api/user/history/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setItems(items.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Failed to delete item:', error);
      // Fallback for development
      const next = items.filter(item => item.id !== itemId);
      setItems(next);
      localStorage.setItem('adm-history', JSON.stringify(next));
    }
  };

  const filteredItems = getFilteredItems();
  const stats = {
    total: items.length,
    thisMonth: items.filter(item => {
      const itemDate = new Date(item.createdAt);
      const now = new Date();
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }).length,
    mostUsed: items.reduce((acc, item) => {
      acc[item.toolId] = (acc[item.toolId] || 0) + 1;
      return acc;
    }, {})
  };

  return React.createElement('div', {
    className: 'download-history',
    style: { padding: '20px 0', paddingBottom: 80 }
  }, [
    // Header
    React.createElement('div', {
      key: 'header',
      style: { marginBottom: 32 }
    }, [
      React.createElement('button', {
        key: 'back',
        onClick: onBack,
        style: {
          fontSize: 14,
          color: dirA ? '#666' : '#999',
          marginBottom: 16,
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }
      }, '← Voltar'),
      
      React.createElement('h1', {
        key: 'title',
        style: {
          fontFamily: 'var(--serif)',
          fontSize: 'clamp(36px, 5vw, 56px)',
          fontWeight: 400,
          letterSpacing: '-0.02em',
          margin: '8px 0 16px',
          lineHeight: 1.05,
          color: dirA ? '#333' : '#fff'
        }
      }, 'Seu histórico'),
      
      React.createElement('p', {
        key: 'subtitle',
        style: {
          fontSize: 16,
          color: dirA ? '#666' : '#999',
          marginBottom: 24
        }
      }, `Todos os seus resultados salvos e organizados em um só lugar.`)
    ]),

    // Stats cards
    React.createElement('div', {
      key: 'stats',
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
        marginBottom: 32
      }
    }, [
      React.createElement(StatCard, {
        key: 'total',
        label: 'Total de usos',
        value: stats.total,
        icon: '📊',
        direction
      }),
      React.createElement(StatCard, {
        key: 'month',
        label: 'Este mês',
        value: stats.thisMonth,
        icon: '📅',
        direction
      }),
      React.createElement(StatCard, {
        key: 'tools',
        label: 'Ferramentas',
        value: Object.keys(stats.mostUsed).length,
        icon: '🛠️',
        direction
      })
    ]),

    // Filters and search
    React.createElement('div', {
      key: 'filters',
      style: {
        background: dirA ? '#f8f9fa' : 'rgba(255,255,255,0.02)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 24,
        border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`
      }
    }, [
      // Search
      React.createElement('div', {
        key: 'search-row',
        style: {
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          flexWrap: 'wrap'
        }
      }, [
        React.createElement('input', {
          key: 'search',
          type: 'text',
          placeholder: 'Buscar no histórico...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          style: {
            flex: 1,
            minWidth: 200,
            padding: '10px 14px',
            border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
            borderRadius: 8,
            fontSize: 14,
            background: dirA ? '#fff' : 'rgba(255,255,255,0.05)',
            color: dirA ? '#333' : '#fff'
          }
        }),
        
        React.createElement('button', {
          key: 'export',
          onClick: exportData,
          style: {
            padding: '10px 16px',
            border: `1px solid ${dirA ? '#2a9d8f' : '#4fb9b8'}`,
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 500,
            background: 'transparent',
            color: dirA ? '#2a9d8f' : '#4fb9b8',
            cursor: 'pointer'
          }
        }, '📥 Exportar')
      ]),

      // Filter tabs and sort
      React.createElement('div', {
        key: 'filter-row',
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12
        }
      }, [
        React.createElement('div', {
          key: 'filter-tabs',
          style: { display: 'flex', gap: 8 }
        }, [
          { value: 'all', label: 'Todos' },
          { value: 'career', label: 'Carreira' },
          { value: 'cultural', label: 'Cultura' },
          { value: 'diagnosis', label: 'Diagnóstico' }
        ].map(filterOption => 
          React.createElement('button', {
            key: filterOption.value,
            onClick: () => setFilter(filterOption.value),
            style: {
              padding: '6px 12px',
              border: `1px solid ${filter === filterOption.value ? (dirA ? '#2a9d8f' : '#4fb9b8') : (dirA ? '#e5e5e5' : '#333')}`,
              borderRadius: 16,
              fontSize: 13,
              fontWeight: 500,
              background: filter === filterOption.value ? (dirA ? '#2a9d8f' : '#4fb9b8') : 'transparent',
              color: filter === filterOption.value ? '#fff' : (dirA ? '#666' : '#999'),
              cursor: 'pointer'
            }
          }, filterOption.label)
        )),

        React.createElement('select', {
          key: 'sort',
          value: sortBy,
          onChange: (e) => setSortBy(e.target.value),
          style: {
            padding: '6px 12px',
            border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
            borderRadius: 8,
            fontSize: 13,
            background: dirA ? '#fff' : 'rgba(255,255,255,0.05)',
            color: dirA ? '#333' : '#fff'
          }
        }, [
          React.createElement('option', { key: 'date', value: 'date' }, 'Mais recentes'),
          React.createElement('option', { key: 'tool', value: 'tool' }, 'Por ferramenta'),
          React.createElement('option', { key: 'usage', value: 'usage' }, 'Mais usados')
        ])
      ])
    ]),

    // Loading state
    isLoading && React.createElement('div', {
      key: 'loading',
      style: {
        textAlign: 'center',
        padding: '60px 20px',
        color: dirA ? '#999' : '#666'
      }
    }, [
      React.createElement('div', { key: 'spinner', className: 'spinner', style: { margin: '0 auto 16px' } }),
      React.createElement('div', { key: 'text' }, 'Carregando seu histórico...')
    ]),

    // Items list
    !isLoading && filteredItems.length === 0 && React.createElement('div', {
      key: 'empty',
      style: {
        textAlign: 'center',
        padding: '60px 20px',
        color: dirA ? '#999' : '#666'
      }
    }, [
      React.createElement('div', { key: 'icon', style: { fontSize: 48, marginBottom: 16 } }, '📋'),
      React.createElement('div', { key: 'title', style: { fontSize: 18, fontWeight: 600, marginBottom: 8 } }, 
        searchQuery ? 'Nenhum resultado encontrado' : 'Nenhum histórico ainda'),
      React.createElement('div', { key: 'text', style: { fontSize: 14 } }, 
        searchQuery ? 'Tente outros termos de busca' : 'Suas traduções aparecerão aqui quando você as usar')
    ]),

    // History items
    !isLoading && filteredItems.map(item => 
      React.createElement(HistoryItem, {
        key: item.id,
        item: item,
        direction,
        onOpen: () => onOpenItem(item),
        onDelete: () => deleteItem(item.id)
      })
    )
  ]);
}

// Stat Card Component
function StatCard({ label, value, icon, direction }) {
  const dirA = direction === 'a';
  
  return React.createElement('div', {
    style: {
      background: dirA ? '#fff' : 'rgba(255,255,255,0.02)',
      padding: '20px',
      borderRadius: 12,
      border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
      textAlign: 'center'
    }
  }, [
    React.createElement('div', {
      key: 'icon',
      style: { fontSize: 24, marginBottom: 8 }
    }, icon),
    React.createElement('div', {
      key: 'value',
      style: {
        fontSize: 32,
        fontWeight: 600,
        color: dirA ? '#333' : '#fff',
        marginBottom: 4
      }
    }, value),
    React.createElement('div', {
      key: 'label',
      style: {
        fontSize: 13,
        color: dirA ? '#666' : '#999',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }
    }, label)
  ]);
}

// History Item Component
function HistoryItem({ item, direction, onOpen, onDelete }) {
  const tool = window.AdM_TOOLS[item.toolId];
  const dirA = direction === 'a';
  
  if (!tool) return null;

  return React.createElement('div', {
    style: {
      background: dirA ? '#fff' : 'rgba(255,255,255,0.02)',
      border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
      borderRadius: 12,
      padding: '20px',
      marginBottom: 12,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 16
    }
  }, [
    // Content
    React.createElement('div', {
      key: 'content',
      style: { flex: 1, minWidth: 0 }
    }, [
      React.createElement('div', {
        key: 'header',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8
        }
      }, [
        React.createElement('span', {
          key: 'tool-label',
          style: {
            fontSize: 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: dirA ? '#2a9d8f' : '#4fb9b8',
            background: dirA ? 'rgba(42,157,143,0.1)' : 'rgba(79,185,184,0.1)',
            padding: '4px 8px',
            borderRadius: 4
          }
        }, tool.label),
        React.createElement('span', {
          key: 'date',
          style: {
            fontSize: 12,
            color: dirA ? '#999' : '#666'
          }
        }, new Date(item.createdAt).toLocaleDateString('pt-BR'))
      ]),
      
      React.createElement('div', {
        key: 'title',
        style: {
          fontFamily: 'var(--serif)',
          fontSize: 18,
          fontWeight: 500,
          marginBottom: 4,
          color: dirA ? '#333' : '#fff'
        }
      }, item.result?.internationalTitle || tool.title),
      
      React.createElement('div', {
        key: 'preview',
        style: {
          fontSize: 14,
          color: dirA ? '#666' : '#999',
          lineHeight: 1.4
        }
      }, item.result?.summary || 'Resultado disponível')
    ]),

    // Actions
    React.createElement('div', {
      key: 'actions',
      style: {
        display: 'flex',
        gap: 8,
        alignItems: 'center'
      }
    }, [
      React.createElement('button', {
        key: 'open',
        onClick: onOpen,
        style: {
          padding: '8px 16px',
          border: `1px solid ${dirA ? '#2a9d8f' : '#4fb9b8'}`,
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 500,
          background: 'transparent',
          color: dirA ? '#2a9d8f' : '#4fb9b8',
          cursor: 'pointer'
        }
      }, 'Abrir'),
      
      React.createElement('button', {
        key: 'delete',
        onClick: onDelete,
        style: {
          padding: '8px',
          border: 'none',
          borderRadius: 8,
          fontSize: 14,
          background: 'transparent',
          color: dirA ? '#dc2626' : '#ef4444',
          cursor: 'pointer'
        }
      }, '🗑️')
    ])
  ]);
}

window.DownloadHistory = DownloadHistory;
