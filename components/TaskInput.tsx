import React, { useState } from 'react';
import { Plus, BookOpen, Calculator, Languages, Smile, PenTool, X, Coffee } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface TaskInputProps {
  onTasksChange: (tasks: Task[]) => void;
  tasks: Task[];
  onNext?: () => void;
  isInline?: boolean; // New prop to control layout for inline usage
  onClose?: () => void; // Callback to close the input form if needed
}

const DEFAULT_SUBJECTS = [
  { name: 'Math', icon: <Calculator className="w-5 h-5" />, color: 'bg-blue-100 text-blue-600', emoji: '📐' },
  { name: 'English', icon: <Languages className="w-5 h-5" />, color: 'bg-green-100 text-green-600', emoji: '📖' },
  { name: 'Chinese', icon: <BookOpen className="w-5 h-5" />, color: 'bg-red-100 text-red-600', emoji: '📚' },
  { name: 'Rest', icon: <Coffee className="w-5 h-5" />, color: 'bg-emerald-100 text-emerald-600', emoji: '☕' },
];

const TaskInput: React.FC<TaskInputProps> = ({ onTasksChange, tasks, onNext, isInline = false, onClose }) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMinutes, setNewTaskMinutes] = useState<number>(30);
  
  // Custom subject state
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(DEFAULT_SUBJECTS[0]);

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;

    const subjectName = isCustomSubject ? customSubjectName.trim() : selectedPreset.name;
    if (isCustomSubject && !subjectName) return;

    // Determine emoji based on custom or preset
    const emoji = isCustomSubject ? '⚡' : selectedPreset.emoji;
    const isBreak = !isCustomSubject && selectedPreset.name === 'Rest';

    const newTask: Task = {
      id: Date.now().toString(),
      title: title,
      subject: subjectName || 'General',
      estimatedMinutes: newTaskMinutes,
      status: TaskStatus.PENDING,
      isBreak: isBreak,
      emoji: emoji
    };

    onTasksChange([...tasks, newTask]);
    setNewTaskTitle('');
    
    if (isInline && onClose) {
       onClose();
    }
  };

  const removeTask = (id: string) => {
    onTasksChange(tasks.filter(t => t.id !== id));
  };

  // Set suggested time based on subject
  const selectPreset = (sub: typeof DEFAULT_SUBJECTS[0]) => {
    setIsCustomSubject(false);
    setSelectedPreset(sub);
    if (sub.name === 'Rest' && newTaskMinutes > 15) {
      setNewTaskMinutes(15);
    } else if (sub.name !== 'Rest' && (newTaskMinutes < 20 || newTaskMinutes === 15)) {
      setNewTaskMinutes(30);
    }
  };

  const handleMinutesChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      setNewTaskMinutes(0);
      return;
    }
    // Clamp between 1 and 480 (8 hours max)
    setNewTaskMinutes(Math.min(Math.max(num, 0), 480));
  };

  return (
    <div className={`w-full mx-auto animate-fade-in ${isInline ? '' : 'max-w-2xl p-4 space-y-8'}`}>
      
      {!isInline && (
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-700">What's the plan today?</h2>
          <p className="text-slate-500 text-lg">Add your homework and let's get organized!</p>
        </div>
      )}

      {isInline && (
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-xl font-bold text-slate-700">Add New Mission</h3>
           {onClose && (
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
               <X className="w-5 h-5" />
             </button>
           )}
        </div>
      )}

      <div className={`bg-white rounded-3xl p-6 shadow-xl border border-sky-50 ${isInline ? 'shadow-none border-0' : 'shadow-sky-100'}`}>
        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Subject</label>
            <div className="flex gap-2 flex-wrap">
              {DEFAULT_SUBJECTS.map((sub) => (
                <button
                  key={sub.name}
                  onClick={() => selectPreset(sub)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                    !isCustomSubject && selectedPreset.name === sub.name
                      ? `${sub.color} border-current ring-2 ring-offset-1 ring-current`
                      : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {sub.icon}
                  <span className="font-semibold">{sub.name}</span>
                </button>
              ))}
              
              <button
                onClick={() => setIsCustomSubject(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                  isCustomSubject
                    ? 'bg-purple-100 text-purple-600 border-current ring-2 ring-offset-1 ring-current'
                    : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'
                }`}
              >
                <PenTool className="w-5 h-5" />
                <span className="font-semibold">Custom</span>
              </button>
            </div>

            {isCustomSubject && (
              <div className="mt-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Enter subject name (e.g. Science, Art)..."
                  value={customSubjectName}
                  onChange={(e) => setCustomSubjectName(e.target.value)}
                  className="w-full bg-purple-50 border-2 border-purple-100 text-purple-700 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-purple-300 transition-all placeholder:text-purple-300"
                  autoFocus
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Estimated Time (minutes)</label>
             <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
               <input 
                  type="range" 
                  min="5" 
                  max="120" 
                  step="5" 
                  value={newTaskMinutes || 5}
                  onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                  className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
               />
               <div className="flex items-center gap-2">
                 <input
                    type="number"
                    min="1"
                    max="480"
                    value={newTaskMinutes || ''}
                    onChange={(e) => handleMinutesChange(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-20 text-center font-bold text-indigo-600 bg-white py-2 rounded-xl shadow-sm border-2 border-transparent focus:border-indigo-400 focus:outline-none transition-all text-lg"
                 />
                 <span className="font-bold text-slate-400">mins</span>
               </div>
             </div>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            placeholder={!isCustomSubject && selectedPreset.name === 'Rest' ? "e.g., Stretching, Snack break..." : "e.g., Chapter 3 exercises..."}
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
            className="flex-1 bg-slate-50 border-2 border-slate-100 text-slate-700 text-lg rounded-2xl px-5 py-3 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 transition-all placeholder:text-slate-300"
          />
          <button
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || (isCustomSubject && !customSubjectName.trim()) || !newTaskMinutes}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-indigo-200"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      {!isInline && tasks.length > 0 && (
        <div className="space-y-4">
           <h3 className="text-xl font-bold text-slate-600 px-2">Your List ({tasks.length})</h3>
           <div className="grid gap-3">
             {tasks.map((task) => (
               <div key={task.id} className={`group flex items-center justify-between p-4 rounded-2xl shadow-sm border transition-colors ${task.isBreak ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-200' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                  <div className="flex items-center gap-4">
                    <span className={`text-2xl w-12 h-12 flex items-center justify-center rounded-xl ${task.isBreak ? 'bg-white' : 'bg-slate-50'}`}>{task.emoji}</span>
                    <div>
                      <h4 className={`font-bold text-lg ${task.isBreak ? 'text-emerald-800' : 'text-slate-700'}`}>{task.title}</h4>
                      <div className={`flex gap-2 text-sm font-medium ${task.isBreak ? 'text-emerald-600' : 'text-slate-500'}`}>
                        <span className="uppercase tracking-wide">{task.isBreak ? 'Break' : task.subject}</span>
                        <span>•</span>
                        <span>{task.estimatedMinutes} mins</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeTask(task.id)}
                    className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    Remove
                  </button>
               </div>
             ))}
           </div>

           <div className="pt-6 flex justify-center">
             <button
               onClick={onNext}
               className="flex items-center gap-3 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white text-xl font-bold py-4 px-10 rounded-full shadow-xl shadow-emerald-200 transform transition hover:-translate-y-1"
             >
               Create My Schedule! 🚀
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TaskInput;