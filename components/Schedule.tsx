import React, { useState } from 'react';
import { Task, TaskStatus } from '../types';
import { Play, Check, Clock, Coffee, Trash2, Plus } from 'lucide-react';
import TaskInput from './TaskInput';

interface ScheduleProps {
  tasks: Task[];
  onStartTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTasksChange: (tasks: Task[]) => void;
}

const Schedule: React.FC<ScheduleProps> = ({ tasks, onStartTask, onDeleteTask, onTasksChange }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  
  const pendingTasks = tasks.filter(t => t.status === TaskStatus.PENDING || t.status === TaskStatus.ACTIVE);
  const completedTasks = tasks.filter(t => t.status === TaskStatus.COMPLETED);

  const formatMins = (m: number) => {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  const totalMinutes = tasks.reduce((acc, t) => acc + (t.status === TaskStatus.COMPLETED ? (t.actualMinutes || t.estimatedMinutes) : t.estimatedMinutes), 0);
  const completedMinutes = completedTasks.reduce((acc, t) => acc + (t.actualMinutes || t.estimatedMinutes), 0);
  const progressPercent = tasks.length > 0 ? (completedMinutes / totalMinutes) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 animate-fade-in relative">
      
      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-bounce-slight">
            <div className="p-4">
               <TaskInput 
                 tasks={tasks} 
                 onTasksChange={onTasksChange} 
                 isInline={true}
                 onClose={() => setShowAddModal(false)}
               />
            </div>
          </div>
          {/* Backdrop click to close */}
          <div className="absolute inset-0 -z-10" onClick={() => setShowAddModal(false)}></div>
        </div>
      )}

      {/* Header Stat */}
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl mb-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="space-y-2 text-center md:text-left">
             <h2 className="text-3xl font-bold">Your Quest Log</h2>
             <p className="text-indigo-200">Keep going! You are crushing it.</p>
           </div>
           <div className="flex items-center gap-4 bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
             <div className="text-right">
               <p className="text-xs font-bold uppercase tracking-wider text-indigo-200">Progress</p>
               <p className="text-2xl font-bold">{Math.round(progressPercent)}%</p>
             </div>
             <div className="w-16 h-16 rounded-full border-4 border-indigo-300 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-full border-4 border-white" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${progressPercent}%, 0 ${progressPercent}%)`}}></div>
               <span className="text-xl">🏆</span>
             </div>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-slate-700">Up Next</h3>
            <div className="flex items-center gap-3">
              <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">{pendingTasks.length} Missions</span>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                title="Add New Task"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div className="space-y-4">
            {pendingTasks.map((task, index) => (
              <div 
                key={task.id}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all hover:shadow-lg ${
                  task.isBreak 
                  ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' 
                  : 'bg-white border-slate-100 hover:border-indigo-200'
                }`}
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all z-20"
                  title="Remove task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="p-5 flex items-center gap-5">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${task.isBreak ? 'bg-white' : 'bg-slate-50'}`}>
                     {task.emoji}
                   </div>
                   <div className="flex-1">
                     <h4 className={`font-bold text-lg ${task.isBreak ? 'text-emerald-800' : 'text-slate-800'}`}>{task.title}</h4>
                     <div className="flex items-center gap-3 text-sm font-medium opacity-70">
                        {task.isBreak ? (
                          <span className="flex items-center gap-1 text-emerald-600"><Coffee className="w-4 h-4" /> Break Time</span>
                        ) : (
                          <span className="flex items-center gap-1 text-indigo-600"><Clock className="w-4 h-4" /> {formatMins(task.estimatedMinutes)}</span>
                        )}
                        {index === 0 && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs">NEXT</span>}
                     </div>
                   </div>
                   <button 
                     onClick={() => onStartTask(task)}
                     className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110 active:scale-95 ${
                        task.isBreak ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                     }`}
                   >
                     <Play className="w-6 h-6 ml-1 fill-current" />
                   </button>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && completedTasks.length > 0 && (
              <div className="text-center p-12 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <span className="text-6xl block mb-4">🎉</span>
                <h3 className="text-2xl font-bold text-slate-700">All Done!</h3>
                <p className="text-slate-500">You've completed everything for today.</p>
              </div>
            )}
            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <div className="text-center p-12 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-slate-400">No tasks here yet.</p>
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Add a Mission
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
           <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-slate-700">Completed</h3>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">{completedTasks.length} Done</span>
          </div>

          <div className="space-y-3 opacity-80">
            {completedTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 italic bg-slate-50 rounded-2xl">
                No tasks finished yet. Let's start!
              </div>
            ) : (
              completedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 grayscale hover:grayscale-0 transition-all">
                   <div className="opacity-50 text-2xl">{task.emoji}</div>
                   <div className="flex-1">
                     <h4 className="font-bold text-slate-600 line-through decoration-slate-400">{task.title}</h4>
                     <p className="text-xs text-slate-400">Took {task.actualMinutes} mins</p>
                   </div>
                   <div className="text-emerald-500">
                     <Check className="w-6 h-6" />
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