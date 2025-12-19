import React, { useState, useEffect } from 'react';
import { Play, Pause, CheckCircle, RotateCcw } from 'lucide-react';
import { Task } from '../types';

interface TimerProps {
  task: Task;
  onComplete: (task: Task, durationSeconds: number) => void;
  onBack: () => void;
}

const Timer: React.FC<TimerProps> = ({ task, onComplete, onBack }) => {
  const [timeLeft, setTimeLeft] = useState(task.estimatedMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [totalTimeSpent, setTotalTimeSpent] = useState(0);

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    const sign = seconds < 0 ? '-' : '';
    return `${sign}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isOvertime = timeLeft < 0;
  const progress = isOvertime 
    ? 100 
    : ((task.estimatedMinutes * 60 - timeLeft) / (task.estimatedMinutes * 60)) * 100;

  useEffect(() => {
    let interval: any = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
        setTotalTimeSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleToggle = () => setIsActive(!isActive);

  const handleFinish = () => {
    setIsActive(false);
    onComplete(task, totalTimeSpent);
  };

  const isBreak = task.isBreak;
  let bgGradient = isBreak ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-indigo-500 to-purple-600';
  let textColor = isBreak ? 'text-emerald-600' : 'text-indigo-600';
  let strokeColor = isBreak ? '#34d399' : '#6366f1';

  if (isOvertime) {
    bgGradient = 'bg-gradient-to-br from-red-500 to-rose-600';
    textColor = 'text-red-600';
    strokeColor = '#ef4444';
  }

  // Adjusted SVG Configuration
  const size = 300;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto p-4 animate-fade-in pb-10">
      <div className={`w-full ${bgGradient} rounded-[2rem] p-8 text-white shadow-xl mb-10 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-xl"></div>
        <div className="relative z-10 text-center space-y-4">
          <div className="text-6xl mb-2 inline-block animate-bounce-slight">{task.emoji}</div>
          <h2 className="text-3xl font-black leading-tight">{task.title}</h2>
          <p className="text-white/80 font-black text-xs uppercase tracking-widest">
            {isOvertime ? 'Overtime!' : task.subject}
          </p>
        </div>
      </div>

      <div className="relative mb-10 w-64 h-64 sm:w-72 sm:h-72">
        <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox={`0 0 ${size} ${size}`}>
          <circle cx={center} cy={center} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-slate-100" />
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            strokeLinecap="round"
            className="transition-all duration-500 ease-linear"
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center pointer-events-none">
          <span className={`text-5xl sm:text-6xl font-black ${textColor} tabular-nums tracking-tighter`}>
            {formatTime(timeLeft)}
          </span>
          <span className="text-slate-400 font-bold mt-2 text-sm uppercase tracking-widest">
            {isOvertime ? 'Finish now!' : isActive ? 'Focusing...' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button
          onClick={handleToggle}
          className={`w-20 h-20 flex items-center justify-center rounded-3xl shadow-xl transition-all transform active:scale-95 ${
            isActive ? 'bg-amber-100 text-amber-600' : 'bg-indigo-600 text-white'
          }`}
        >
          {isActive ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
        </button>
        
        <button
          onClick={handleFinish}
          className="w-20 h-20 flex items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-xl transition-all transform active:scale-95"
        >
          <CheckCircle className="w-8 h-8 stroke-[3]" />
        </button>

        {!isActive && timeLeft !== task.estimatedMinutes * 60 && !isOvertime && (
           <button 
             onClick={() => { setTimeLeft(task.estimatedMinutes * 60); setTotalTimeSpent(0); }}
             className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 text-slate-400 hover:bg-slate-200 transition-colors"
           >
             <RotateCcw className="w-5 h-5 stroke-[3]" />
           </button>
        )}
      </div>
      
      <button onClick={onBack} className="mt-8 text-slate-400 hover:text-slate-600 text-[10px] font-black uppercase tracking-widest transition-colors">
        Cancel Session
      </button>
    </div>
  );
};

export default Timer;