import React from 'react';
import type { Obra, Gasto } from '../types';
import { ChevronRight, User, Pencil, Trash2 } from 'lucide-react';

interface ObraCardProps {
  obra: Obra;
  gastos: Gasto[];
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');
}

const ObraCard: React.FC<ObraCardProps> = ({ obra, gastos, onClick, onEdit, onDelete }) => {
  const total = gastos
    .filter(g => g.obra_id === obra.id)
    .reduce((sum, g) => sum + g.value, 0);

  const gastoCount = gastos.filter(g => g.obra_id === obra.id).length;

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="obra-card">
      <div className="obra-card-main" onClick={onClick}>
        {/* Avatar com iniciais */}
        <div className="obra-avatar-sm">
          {getInitials(obra.name)}
        </div>

        {/* Info */}
        <div className="obra-card-info">
          <div className="obra-card-name">{obra.name}</div>
          <div className="obra-card-meta">
            <User size={11} />
            <span>{obra.client_name}</span>
            {gastoCount > 0 && (
              <>
                <span className="obra-meta-sep">·</span>
                <span>{gastoCount} {gastoCount === 1 ? 'lançamento' : 'lançamentos'}</span>
              </>
            )}
          </div>
        </div>

        {/* Total */}
        <div className="obra-card-right">
          <div className="obra-card-label">Total</div>
          <div className="obra-card-total">{formatCurrency(total)}</div>
          <ChevronRight size={16} color="var(--color-text-muted)" />
        </div>
      </div>

      {/* Botões de ação */}
      {(onEdit || onDelete) && (
        <div className="obra-card-actions">
          {onEdit && (
            <button className="obra-action-btn" onClick={e => { e.stopPropagation(); onEdit(); }} title="Editar obra">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button className="obra-action-btn danger" onClick={e => { e.stopPropagation(); onDelete(); }} title="Excluir obra">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ObraCard;
