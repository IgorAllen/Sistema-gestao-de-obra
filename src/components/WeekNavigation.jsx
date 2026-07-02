import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const WeekNavigation = ({ currentDate, setCurrentDate }) => {
  const handlePrev = () => setCurrentDate(prev => subWeeks(prev, 1));
  const handleNext = () => setCurrentDate(prev => addWeeks(prev, 1));

  // Week starts on Monday (1)
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  // Week ends on Saturday
  const endDate = addWeeks(startDate, 0); // Need to calculate properly: start + 5 days
  endDate.setDate(startDate.getDate() + 5);

  const formatStr = "dd 'de' MMM";
  const startStr = format(startDate, formatStr, { locale: ptBR });
  const endStr = format(endDate, formatStr, { locale: ptBR });

  return (
    <div className="week-nav fade-in">
      <button className="nav-btn" onClick={handlePrev}>
        <ChevronLeft size={20} />
        Anterior
      </button>
      
      <div className="week-display">
        {startStr} – {endStr}
      </div>

      <button className="nav-btn" onClick={handleNext}>
        Próxima
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default WeekNavigation;
