// Improved Tools Navigation - Better UX with progressive disclosure
// Replaces overwhelming grid with categorized, searchable interface

function ToolsNav({ direction, onToolSelect, recentTools = [] }) {
  const [activeCategory, setActiveCategory] = React.useState('career');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showAll, setShowAll] = React.useState(false);
  
  const dirA = direction === 'a';
  
  // Tool categories for better organization
  const categories = {
    career: {
      id: 'career',
      label: 'Carreira',
      icon: '💼',
      color: dirA ? '#2a9d8f' : '#4fb9b8',
      tools: ['career', 'ats_check', 'salary_reality', 'interview_sim']
    },
    diagnosis: {
      id: 'diagnosis',
      label: 'Diagnóstico',
      icon: '🔍',
      color: dirA ? '#e76f51' : '#f4b942',
      tools: ['hiring_reality', 'rejection_decoder']
    },
    cultural: {
      id: 'cultural',
      label: 'Cultura',
      icon: '🌍',
      color: dirA ? '#264653' : '#2a9d8f',
      tools: ['cultural', 'social_scripts']
    },
    communication: {
      id: 'communication',
      label: 'Comunicação',
      icon: '💬',
      color: dirA ? '#f4a261' : '#e9c46a',
      tools: ['say_it_better', 'identity_reframe']
    }
  };

  // Filter tools based on search
  const getFilteredTools = (toolIds) => {
    if (!searchQuery) return toolIds;
    return toolIds.filter(toolId => {
      const tool = window.AdM_TOOLS[toolId];
      return tool.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tool.title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  // Get recently used tools (limit to 3)
  const getRecentTools = () => {
    return recentTools.slice(0, 3);
  };

  const ToolCard = ({ toolId, compact = false }) => {
    const tool = window.AdM_TOOLS[toolId];
    if (!tool) return null;

    const category = Object.values(categories).find(cat => cat.tools.includes(toolId));
    
    return React.createElement('button', {
      key: toolId,
      onClick: () => onToolSelect(toolId),
      className: 'tool-card',
      style: {
        ...toolCardStyle(dirA, compact),
        ...(compact && { minHeight: 'auto', padding: '16px' })
      }
    }, [
      // Category indicator
      React.createElement('div', {
        key: 'category',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 8,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: category?.color || (dirA ? '#666' : '#999')
        }
      }, [
        React.createElement('span', { key: 'icon' }, category?.icon || '📋'),
        React.createElement('span', { key: 'label' }, tool.eyebrow)
      ]),

      // Tool title
      React.createElement('div', {
        key: 'title',
        style: {
          fontFamily: 'var(--serif)',
          fontSize: compact ? 16 : 18,
          fontWeight: 500,
          marginBottom: 4,
          lineHeight: 1.2,
          color: dirA ? '#333' : '#fff'
        }
      }, tool.title),

      // Tool subtitle (if not compact)
      !compact && React.createElement('div', {
        key: 'subtitle',
        style: {
          fontSize: 13,
          lineHeight: 1.4,
          color: dirA ? '#666' : '#999',
          marginBottom: 12
        }
      }, tool.subtitle),

      // Usage indicator
      React.createElement('div', {
        key: 'usage',
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: dirA ? '#999' : '#666'
        }
      }, [
        React.createElement('span', { key: 'time' }, '⚡ 15 seg'),
        React.createElement('span', { key: 'separator' }, '•'),
        React.createElement('span', { key: 'type' }, 'IA')
      ])
    ]);
  };

  return React.createElement('div', {
    className: 'tools-nav',
    style: { padding: '20px 0' }
  }, [
    // Search and filter header
    React.createElement('div', {
      key: 'header',
      style: { marginBottom: 24 }
    }, [
      // Search bar
      React.createElement('div', {
        key: 'search',
        style: {
          position: 'relative',
          marginBottom: 16
        }
      }, [
        React.createElement('input', {
          key: 'search-input',
          type: 'text',
          placeholder: 'Buscar ferramentas...',
          value: searchQuery,
          onChange: (e) => setSearchQuery(e.target.value),
          style: {
            ...searchInputStyle(dirA),
            paddingLeft: '40px'
          }
        }),
        React.createElement('div', {
          key: 'search-icon',
          style: {
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 16,
            color: dirA ? '#999' : '#666'
          }
        }, '🔍')
      ]),

      // Category tabs
      React.createElement('div', {
        key: 'categories',
        style: {
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 16
        }
      }, [
        ...Object.values(categories).map(category => 
          React.createElement('button', {
            key: category.id,
            onClick: () => setActiveCategory(category.id),
            style: {
              ...categoryTabStyle(dirA, activeCategory === category.id),
              borderColor: category.color,
              color: activeCategory === category.id ? '#fff' : category.color,
              background: activeCategory === category.id ? category.color : 'transparent'
            }
          }, [
            React.createElement('span', { key: 'icon' }, category.icon),
            React.createElement('span', { key: 'label', style: { marginLeft: 4 } }, category.label)
          ])
        ),
        
        // Show all toggle
        React.createElement('button', {
          key: 'show-all',
          onClick: () => setShowAll(!showAll),
          style: {
            ...categoryTabStyle(dirA, showAll),
            marginLeft: 'auto',
            borderColor: dirA ? '#e5e5e5' : '#333',
            color: dirA ? '#666' : '#999'
          }
        }, showAll ? 'Menos' : 'Todas')
      ])
    ]),

    // Recent tools section
    getRecentTools().length > 0 && !searchQuery && React.createElement('div', {
      key: 'recent',
      style: { marginBottom: 32 }
    }, [
      React.createElement('h3', {
        key: 'recent-title',
        style: {
          fontSize: 14,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: dirA ? '#666' : '#999',
          marginBottom: 12
        }
      }, 'Usados recentemente'),
      
      React.createElement('div', {
        key: 'recent-tools',
        style: {
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 12
        }
      }, getRecentTools().map(toolId => 
        React.createElement(ToolCard, {
          key: toolId,
          toolId: toolId,
          compact: true
        })
      ))
    ]),

    // Main tools grid
    React.createElement('div', {
      key: 'tools-grid',
      style: {
        display: 'grid',
        gridTemplateColumns: showAll 
          ? 'repeat(auto-fit, minmax(300px, 1fr))'
          : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16
      }
    }, 
    (showAll 
      ? Object.values(categories).flatMap(cat => cat.tools)
      : categories[activeCategory]?.tools || []
    ).map(toolId => 
      React.createElement(ToolCard, {
        key: toolId,
        toolId: toolId
      })
    )),

    // No results
    searchQuery && getFilteredTools(categories[activeCategory]?.tools || []).length === 0 && 
    React.createElement('div', {
      key: 'no-results',
      style: {
        textAlign: 'center',
        padding: '60px 20px',
        color: dirA ? '#999' : '#666'
      }
    }, [
      React.createElement('div', { key: 'icon', style: { fontSize: 48, marginBottom: 16 } }, '🔍'),
      React.createElement('div', { key: 'text', style: { fontSize: 16 } }, 'Nenhuma ferramenta encontrada para'),
      React.createElement('div', { key: 'query', style: { fontSize: 18, fontWeight: 600 } }, `"${searchQuery}"`)
    ])
  ]);
}

// Styles
function toolCardStyle(dirA, compact = false) {
  return {
    textAlign: 'left',
    padding: compact ? '16px' : '20px',
    border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
    borderRadius: 12,
    background: dirA ? '#fff' : 'rgba(255,255,255,0.02)',
    color: 'inherit',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minHeight: compact ? 'auto' : '140px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden'
  };
}

function searchInputStyle(dirA) {
  return {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${dirA ? '#e5e5e5' : '#333'}`,
    borderRadius: 8,
    fontSize: 16,
    background: dirA ? '#fff' : 'rgba(255,255,255,0.05)',
    color: dirA ? '#333' : '#fff',
    outline: 'none'
  };
}

function categoryTabStyle(dirA, isActive) {
  return {
    padding: '8px 16px',
    border: `1px solid ${isActive ? 'transparent' : (dirA ? '#e5e5e5' : '#333')}`,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 500,
    background: isActive ? (dirA ? '#2a9d8f' : '#4fb9b8') : 'transparent',
    color: isActive ? '#fff' : (dirA ? '#666' : '#999'),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center'
  };
}

window.ToolsNav = ToolsNav;
