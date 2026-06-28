export interface Obra {
  id: string;
  name: string;
  client_name: string;
  created_at: string;
}

export interface Gasto {
  id: string;
  obra_id: string;
  name: string;
  value: number;
  category: string;
  receipt_url?: string | null;
  created_at: string;
}

export interface Funcionario {
  id: string;
  name: string;
  daily_wage: number;
  created_at: string;
}

export interface FuncionarioObra {
  id: string;
  funcionario_id: string;
  obra_id: string;
  created_at: string;
}

export interface Chamada {
  id: string;
  funcionario_id: string;
  obra_id: string;
  week_start_date: string; // YYYY-MM-DD (Monday)
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  created_at: string;
}
