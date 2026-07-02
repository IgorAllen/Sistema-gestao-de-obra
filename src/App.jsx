import React, { useState } from 'react';
import { useSupabase } from './hooks/useSupabase';
import { Home, Users, Plus } from 'lucide-react';
import BottomSheet from './components/BottomSheet';
import ObraDetails from './components/ObraDetails';

export default function App() {
  const { obras, funcionarios, loading, addObra, addFuncionario } = useSupabase();
  const [tab, setTab] = useState('obras');
  const [selectedObra, setSelectedObra] = useState(null);
  
  // States Modal Obra
  const [showAddObra, setShowAddObra] = useState(false);
  const [obraNome, setObraNome] = useState('');
  const [obraCliente, setObraCliente] = useState('');

  // States Modal Funcionário
  const [showAddFunc, setShowAddFunc] = useState(false);
  const [funcNome, setFuncNome] = useState('');
  const [funcDiaria, setFuncDiaria] = useState('');
  const [funcObrasIds, setFuncObrasIds] = useState([]);

  const handleSaveObra = async () => {
    if (!obraNome || !obraCliente) return;
    await addObra(obraNome, obraCliente);
    setObraNome(''); setObraCliente('');
    setShowAddObra(false);
  };

  const handleSaveFunc = async () => {
    if (!funcNome || !funcDiaria) return;
    await addFuncionario(funcNome, parseFloat(funcDiaria), funcObrasIds);
    setFuncNome(''); setFuncDiaria(''); setFuncObrasIds([]);
    setShowAddFunc(false);
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--neon-orange)' }}>Carregando dados do Supabase...</div>;
  }

  if (selectedObra) {
    return <ObraDetails obra={selectedObra} onBack={() => setSelectedObra(null)} />;
  }

  return (
    <div className="page-container">
      {/* HEADER */}
      <header className="app-header">
        <h1 className="header-title">Gestão de Obras</h1>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ marginTop: '1rem' }}>
        {tab === 'obras' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Minhas Obras</h2>
            {obras.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>Nenhuma obra cadastrada.</p>
            ) : (
              obras.map(obra => (
                <div key={obra.id} className="glass-card" onClick={() => setSelectedObra(obra)}>
                  <h3 style={{ color: 'var(--neon-orange)', marginBottom: 4 }}>{obra.nome}</h3>
                  <p className="text-muted">Cliente: {obra.cliente_nome}</p>
                </div>
              ))
            )}
            
            <button className="fab-button" onClick={() => setShowAddObra(true)}>
              <Plus size={28} />
            </button>
          </div>
        )}

        {tab === 'funcionarios' && (
          <div>
            <h2 style={{ marginBottom: '1rem' }}>Equipe Global</h2>
            {funcionarios.length === 0 ? (
              <p className="text-muted" style={{ textAlign: 'center', marginTop: '2rem' }}>Nenhum funcionário cadastrado.</p>
            ) : (
              funcionarios.map(func => (
                <div key={func.id} className="glass-card">
                  <h3 style={{ color: 'var(--neon-blue)', marginBottom: 4 }}>{func.nome}</h3>
                  <p className="text-muted">Diária: R$ {func.diaria.toFixed(2)}</p>
                </div>
              ))
            )}
            <button className="fab-button" onClick={() => setShowAddFunc(true)}>
              <Plus size={28} />
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <button className={`nav-item ${tab === 'obras' ? 'active' : ''}`} onClick={() => setTab('obras')}>
          <Home size={24} />
          <span>Obras</span>
        </button>
        <button className={`nav-item ${tab === 'funcionarios' ? 'active' : ''}`} onClick={() => setTab('funcionarios')}>
          <Users size={24} />
          <span>Equipe</span>
        </button>
      </nav>

      {/* MODAL CADASTRAR OBRA */}
      <BottomSheet isOpen={showAddObra} onClose={() => setShowAddObra(false)} title="Nova Obra">
        <div className="input-group">
          <label className="input-label">Nome da Obra</label>
          <input className="input-field" value={obraNome} onChange={e => setObraNome(e.target.value)} placeholder="Ex: Casa Praia" />
        </div>
        <div className="input-group">
          <label className="input-label">Cliente</label>
          <input className="input-field" value={obraCliente} onChange={e => setObraCliente(e.target.value)} placeholder="Nome do cliente" />
        </div>
        <button className="btn btn-primary" onClick={handleSaveObra}>Salvar Obra</button>
      </BottomSheet>

      {/* MODAL CADASTRAR FUNCIONÁRIO */}
      <BottomSheet isOpen={showAddFunc} onClose={() => setShowAddFunc(false)} title="Novo Funcionário">
        <div className="input-group">
          <label className="input-label">Nome Completo</label>
          <input className="input-field" value={funcNome} onChange={e => setFuncNome(e.target.value)} placeholder="Ex: José Silva" />
        </div>
        <div className="input-group">
          <label className="input-label">Valor da Diária (R$)</label>
          <input className="input-field" type="number" value={funcDiaria} onChange={e => setFuncDiaria(e.target.value)} placeholder="150.00" />
        </div>
        
        {obras.length > 0 && (
          <div className="input-group">
            <label className="input-label">Vincular às Obras:</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {obras.map(o => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <input 
                    type="checkbox" 
                    style={{ accentColor: 'var(--neon-orange)', width: 18, height: 18 }}
                    checked={funcObrasIds.includes(o.id)}
                    onChange={(e) => {
                      if (e.target.checked) setFuncObrasIds([...funcObrasIds, o.id]);
                      else setFuncObrasIds(funcObrasIds.filter(id => id !== o.id));
                    }}
                  />
                  {o.nome}
                </label>
              ))}
            </div>
          </div>
        )}

        <button className="btn btn-primary" onClick={handleSaveFunc} style={{ marginTop: '1rem' }}>Salvar Funcionário</button>
      </BottomSheet>
    </div>
  );
}
