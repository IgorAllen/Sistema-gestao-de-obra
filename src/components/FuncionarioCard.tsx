import React, { useState } from 'react';
import type { Funcionario, Obra } from '../types';
import { Pencil, Trash2, User } from 'lucide-react';
import BottomSheet from './BottomSheet';

interface FuncionarioCardProps {
  funcionario: Funcionario;
  weekTotal: number;
  obras: Obra[];
  vinculos: string[]; // array de IDs de obras vinculadas
  onUpdate: (name: string, dailyWage: number, obraIds: string[]) => void;
  onDelete: () => void;
}

const FuncionarioCard: React.FC<FuncionarioCardProps> = ({
  funcionario,
  weekTotal,
  obras,
  vinculos,
  onUpdate,
  onDelete,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditSheet, setShowEditSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState(funcionario.name);
  const [editWage, setEditWage] = useState(String(funcionario.daily_wage));
  const [selectedObras, setSelectedObras] = useState<string[]>(vinculos);

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSaveEdit = () => {
    const wage = parseFloat(editWage.replace(',', '.'));
    if (!editName.trim() || isNaN(wage) || wage <= 0) return;
    onUpdate(editName.trim(), wage, selectedObras);
    setShowEditSheet(false);
  };

  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteConfirm(false);
    setShowMenu(false);
  };

  return (
    <>
      <div
        className="card"
        style={{ cursor: 'default' }}
        onClick={() => setShowMenu(true)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Avatar */}
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <User size={20} color="#0d0f14" />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {funcionario.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
              Diária: {formatCurrency(funcionario.daily_wage)}
            </div>
          </div>

          {/* Total da Semana */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Esta semana
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
              {formatCurrency(weekTotal)}
            </div>
          </div>
        </div>
      </div>

      {/* Menu de Ações */}
      <BottomSheet isOpen={showMenu} onClose={() => setShowMenu(false)} title={funcionario.name}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => { setShowMenu(false); setEditName(funcionario.name); setEditWage(String(funcionario.daily_wage)); setSelectedObras(vinculos); setShowEditSheet(true); }}>
            <Pencil size={16} />
            Editar funcionário
          </button>
          <button className="btn btn-danger" onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}>
            <Trash2 size={16} />
            Excluir funcionário
          </button>
        </div>
      </BottomSheet>

      {/* Sheet de Edição */}
      <BottomSheet isOpen={showEditSheet} onClose={() => setShowEditSheet(false)} title="Editar Funcionário">
        <div className="form-group">
          <label className="form-label">Nome</label>
          <input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome do funcionário" />
        </div>
        <div className="form-group">
          <label className="form-label">Valor da Diária (R$)</label>
          <input className="form-input" type="number" step="0.01" min="0" value={editWage} onChange={e => setEditWage(e.target.value)} placeholder="0,00" />
        </div>
        <div className="form-group">
          <label className="form-label">Vincular a Obras</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 150, overflowY: 'auto', padding: '4px 0' }}>
            {obras.length === 0 ? (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Nenhuma obra cadastrada.</span>
            ) : (
              obras.map(o => (
                <label key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectedObras.includes(o.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedObras(prev => [...prev, o.id]);
                      } else {
                        setSelectedObras(prev => prev.filter(id => id !== o.id));
                      }
                    }}
                  />
                  {o.name}
                </label>
              ))
            )}
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSaveEdit}>Salvar Alterações</button>
      </BottomSheet>

      {/* Confirmação de Exclusão */}
      <BottomSheet isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Excluir Funcionário">
        <p style={{ marginBottom: '1.25rem', color: 'var(--color-text-secondary)' }}>
          Tem certeza que deseja excluir <strong style={{ color: 'var(--color-text-primary)' }}>{funcionario.name}</strong>? Esta ação não pode ser desfeita.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="btn btn-danger" onClick={handleDeleteConfirm}>
            <Trash2 size={16} />
            Sim, excluir
          </button>
          <button className="btn btn-ghost" onClick={() => setShowDeleteConfirm(false)}>Cancelar</button>
        </div>
      </BottomSheet>
    </>
  );
};

export default FuncionarioCard;

