import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  history: Record<string, Task[]>;
  onSelectDate: (date: Date) => void;
  selectedDate: Date;
  onClose: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ history, onSelectDate, selectedDate, onClose }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate));

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelectDate(newDate);
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-14"></div>);
    }

    const todayStr = formatDateKey(new Date());
    const selectedStr = formatDateKey(selectedDate);

    for (let i = 1; i <= daysInMonth; i++) {
      const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
      const dateKey = formatDateKey(dateToCheck);
      const hasData = history[dateKey] && history[dateKey].length > 0;
      const isSelected = dateKey === selectedStr;
      const isToday = dateKey === todayStr;

      let dotColor = "bg-slate-300";
      if (hasData) {
        const tasks = history[dateKey];
        const completed = tasks.filter(t => t.status === 'COMPLETED').length;
        if (completed === tasks.length) dotColor = "bg-emerald-400";
        else if (completed > 0) dotColor = "bg-amber-400";
        else dotColor = "bg-indigo-400";
      }

      days.push(
        <button
          key={i}
          onClick={() => handleDayClick(i)}
          className={`h-14 relative rounded-xl transition-all flex flex-col items-center justify-center border-2 
            ${isSelected 
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105 z-10' 
              : 'bg-white border-slate-50 hover:border-indigo-100 text-slate-700 hover:bg-slate-50'
            }
            ${isToday && !isSelected ? 'border-indigo-200 bg-indigo-50 font-black' : ''}
          `}
        >
          <span className="text-base font-bold">{i}</span>
          {hasData && (
             <span className={`absolute bottom-2.5 w-2 h-2 rounded-full ${dotColor} ${isSelected ? 'ring-2 ring-white' : ''}`}></span>
          )}
        </button>
      );
    }

    return days;
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Time Machine 🕰️</h2>
          <p className="text-slate-400 text-sm font-medium">Browse your homework history</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white hover:bg-slate-50 rounded-xl text-slate-300 transition-all border border-slate-100 shadow-sm">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 overflow-hidden">
        <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
           <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all">
             <ChevronLeft className="w-6 h-6 stroke-[3]" />
           </button>
           <h3 className="text-xl font-black text-slate-700">
             {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
           </h3>
           <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-lg text-slate-500 transition-all">
             <ChevronRight className="w-6 h-6 stroke-[3]" />
           </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-7 gap-4 mb-4 text-center">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-3">
            {renderCalendarDays()}
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> Planned</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Working</div>
          <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Finished</div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;