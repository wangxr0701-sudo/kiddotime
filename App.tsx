import React, { useState } from 'react';
import { Task, AppState, TaskStatus } from './types';
import TaskInput from './components/TaskInput';
import Schedule from './components/Schedule';
import Timer from './components/Timer';
import { generateOptimizedSchedule, getMotivationalMessage } from './services/gemini';
import { Sparkles, ArrowRight, LayoutDashboard } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

  const handleCreateSchedule = async () => {
    setIsGenerating(true);
    // Call Gemini to optimize
    // Map existing tasks to partials for API
    const simpleTasks = tasks.map(({ id, title, subject, estimatedMinutes, emoji }) => ({ title, subject, estimatedMinutes, emoji }));
    
    const optimized = await generateOptimizedSchedule(simpleTasks);
    
    // Merge optimized result back with IDs. 
    // New breaks need IDs. Existing tasks need to map back to preserve ID if possible or just regenerate IDs.
    // For simplicity, we regenerate the list from the AI suggestion but keep original IDs where names match to avoid confusion, 
    // or just trust the AI output structure.
    
    const newTasks: Task[] = optimized.map((t: any, idx: number) => ({
      id: `task-${Date.now()}-${idx}`,
      title: t.title,
      subject: t.subject,
      estimatedMinutes: t.estimatedMinutes,
      isBreak: t.isBreak || false,
      emoji: t.emoji || '📅',
      status: TaskStatus.PENDING,
    }));

    setTasks(newTasks);
    setIsGenerating(false);
    setAppState(AppState.PLANNING);
  };

  const handleStartTask = async (task: Task) => {
    // Get motivation before starting
    const msg = await getMotivationalMessage(task.title, false);
    setModalMessage(msg);
    setTimeout(() => {
        setModalMessage(null);
        setActiveTask(task);
        setAppState(AppState.DOING);
    }, 2500);
  };

  const handleCompleteTask = async (task: Task, duration: number) => {
    const msg = await getMotivationalMessage(task.title, true);
    
    setTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.COMPLETED, actualMinutes: duration } : t
    ));

    setModalMessage(msg); // Show celebration
    
    setTimeout(() => {
        setModalMessage(null);
        setActiveTask(null);
        setAppState(AppState.PLANNING);
    }, 3000);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2 rounded-xl">
               <Sparkles className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-black tracking-tight text-slate-800">Kiddo<span className="text-indigo-600">Time</span></h1>
           </div>
           
           {appState !== AppState.ONBOARDING && (
             <button 
                onClick={() => setAppState(AppState.PLANNING)}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors"
                title="View Schedule"
             >
               <LayoutDashboard className="w-6 h-6" />
             </button>
           )}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-8 px-4">
        {/* Loading Overlay */}
        {isGenerating && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in">
             <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-8"></div>
             <h2 className="text-3xl font-bold text-slate-800 animate-pulse">Consulting the Time Wizard...</h2>
             <p className="text-slate-500 mt-2">Mixing potions for the perfect plan</p>
          </div>
        )}

        {/* Motivational Modal / Toast */}
        {modalMessage && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
             <div className="bg-white border-4 border-yellow-300 p-8 rounded-3xl shadow-2xl shadow-yellow-200 transform animate-bounce-slight text-center max-w-sm mx-4">
                <div className="text-6xl mb-4">🌟</div>
                <h3 className="text-2xl font-black text-slate-800">{modalMessage}</h3>
             </div>
          </div>
        )}

        {appState === AppState.ONBOARDING && (
          <TaskInput 
            tasks={tasks} 
            onTasksChange={setTasks} 
            onNext={handleCreateSchedule} 
          />
        )}

        {appState === AppState.PLANNING && (
          <Schedule 
            tasks={tasks} 
            onStartTask={handleStartTask} 
            onDeleteTask={handleDeleteTask}
            onTasksChange={setTasks}
          />
        )}

        {appState === AppState.DOING && activeTask && (
          <Timer 
            task={activeTask}
            onComplete={handleCompleteTask}
            onBack={() => setAppState(AppState.PLANNING)}
          />
        )}
      </main>
    </div>
  );
};

export default App;