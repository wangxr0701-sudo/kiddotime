import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Play, Check, Clock, Coffee, Trash2, Plus, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import TaskInput from './TaskInput';

interface ScheduleProps {
  tasks: Task[];
  onStartTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTasksChange: (tasks: Task[]) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ tasks, onStartTask, onDeleteTask, onTasksChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ACTIVE);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  const formatMins = (m: number) => {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const formatExactDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const calculateTaskMinutes = (t: Task) => {
    if (t.status === TaskStatus.COMPLETED) {
      return (t.actualDurationSeconds || (t.estimatedMinutes * 60)) / 60;
    }
    return t.estimatedMinutes;
  };

  const moveTask = (direction: 'up' | 'down', index: number) => {
    const newPending = [...pendingTasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newPending.length) return;

    const temp = newPending[index];
    newPending[index] = newPending[targetIndex];
    newPending[targetIndex] = temp;

    const newFullTasks = [...newPending, ...completedTasks];
    onTasksChange(newFullTasks);
  };

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    const newPending = [...pendingTasks];
    const draggedItem = newPending[draggedItemIndex];
    newPending.splice(draggedItemIndex, 1);
    newPending.splice(index, 0, draggedItem);
    
    setDraggedItemIndex(index);
    const newFullTasks = [...newPending, ...completedTasks];
    onTasksChange(newFullTasks);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const totalMinutes = tasks.reduce((acc, t) => acc + calculateTaskMinutes(t), 0);
  const completedMinutes = completedTasks.reduce((acc, t) => acc + (t.actualDurationSeconds || (t.estimatedMinutes * 60)) / 60, 0);
  const progressPercent = tasks.length > 0 ? (completedMinutes / totalMinutes) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in relative pb-10">
      
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden border-2 border-indigo-50">
            <div className="p-6">
               <TaskInput 
                 tasks={tasks} 
                 onTasksChange={onTasksChange} 
                 isInline={true}
                 onClose={() => setShowAddModal(false)}
               />
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setShowAddModal(false)}></div>
        </div>
      )}

      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2rem] p-8 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="space-y-1.5 text-center sm:text-left">
             <h2 className="text-3xl font-black">Quest Log</h2>
             <p className="text-indigo-100 text-lg font-medium">Crush your goals today! 🌟</p>
           </div>
           <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
             <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Progress</p>
               <p className="text-2xl font-black">{Math.round(progressPercent)}%</p>
             </div>
             <div className="w-14 h-14 rounded-full border-4 border-indigo-300/30 flex items-center justify-center relative bg-white/5">
               <div className="absolute inset-0 rounded-full border-4 border-white transition-all duration-1000 ease-out" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progressPercent}%, 0 ${progressPercent}%)`}}></div>
               <span className="text-xl">🏆</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-700 tracking-tight">Up Next</h3>
            <div className="flex items-center gap-3">
              <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{pendingTasks.length} Missions</span>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-xl shadow-md transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingTasks.map((task, index) => (
              <div 
                key={task.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all cursor-grab active:cursor-grabbing ${
                  draggedItemIndex === index ? 'opacity-40 border-indigo-400 scale-95' : ''
                } ${
                  task.isBreak 
                  ? 'bg-emerald-50 border-emerald-100' 
                  : 'bg-white border-slate-50 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50/30'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                   <div className="text-slate-200 group-hover:text-indigo-300 transition-colors">
                     <GripVertical className="w-5 h-5" />
                   </div>

                   <div className={`w-14 h-14 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl shadow-sm ${task.isBreak ? 'bg-white' : 'bg-slate-50'}`}>
                     {task.emoji}
                   </div>
                   
                   <div className="flex-1 min-w-0">
                     <h4 className={`font-black text-lg truncate ${task.isBreak ? 'text-emerald-800' : 'text-slate-800'}`}>{task.title}</h4>
                     <div className="flex items-center gap-3 text-xs font-bold opacity-80 mt-0.5">
                        {task.isBreak ? (
                          <span className="text-emerald-600 uppercase tracking-widest">Break</span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md"><Clock className="w-3 h-3" /> {formatMins(task.estimatedMinutes)}</span>
                        )}
                        {index === 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest">🎯 Target</span>}
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <button
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                     <button 
                       onClick={(e) => { e.stopPropagation(); onStartTask(task); }}
                       className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-lg transition-all transform hover:scale-105 ${
                          task.isBreak ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-indigo-600 text-white shadow-indigo-100'
                       }`}
                     >
                       <Play className="w-5 h-5 ml-0.5 fill-current stroke-[3]" />
                     </button>
                   </div>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && completedTasks.length > 0 && (
              <div className="text-center p-12 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
                <span className="text-6xl block mb-4 animate-bounce">🎉</span>
                <h3 className="text-2xl font-black text-slate-700">Victory!</h3>
                <p className="text-slate-500 text-base font-medium">All tasks completed!</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:mt-0 mt-4">
           <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-black text-slate-700 tracking-tight">Completed</h3>
            <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">{completedTasks.length} Done</span>
          </div>

          <div className="space-y-3 opacity-80">
            {completedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-base font-medium italic bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                Start your first mission!
              </div>
            ) : (
              completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100 grayscale hover:grayscale-0 transition-all">
                   <div className="opacity-60 text-2xl">{task.emoji}</div>
                   <div className="flex-1">
                     <h4 className="font-black text-base text-slate-600 line-through decoration-slate-300">{task.title}</h4>
                     <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest">
                       Done in {task.actualDurationSeconds ? formatExactDuration(task.actualDurationSeconds) : `${task.estimatedMinutes}m`}
                     </p>
                   </div>
                   <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-500">
                     <Check className="w-4 h-4 stroke-[4]" />
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Schedule;