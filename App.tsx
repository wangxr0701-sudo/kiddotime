import React, { useState, useEffect } from 'react';
import { Task, AppState, TaskStatus } from './types';
import TaskInput from './components/TaskInput';
import Schedule from './components/Schedule';
import Timer from './components/Timer';
import CalendarView from './components/CalendarView';
import { generateOptimizedSchedule } from './services/gemini';
import { Sparkles, LayoutDashboard, Calendar as CalendarIcon } from 'lucide-react';

const STORAGE_KEY = 'kiddotime_history';

const App: React.FC = () => {
  // 修改初始状态为 PLANNING，直接进入任务日志
  const [appState, setAppState] = useState<AppState>(AppState.PLANNING);
  
  // State for the currently viewed date and tasks
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Master history state: Map of 'YYYY-MM-DD' -> Task[]
  const [history, setHistory] = useState<Record<string, Task[]>>({});

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Helper to get date string
  const getDateKey = (date: Date) => date.toISOString().split('T')[0];

  // Load history from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsedHistory = JSON.parse(saved);
        setHistory(parsedHistory);
        
        // Try to load today's tasks if they exist
        const todayKey = getDateKey(new Date());
        if (parsedHistory[todayKey]) {
          setTasks(parsedHistory[todayKey]);
          // 状态已经是 PLANNING，所以这里只需要同步任务
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever tasks change or active date changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  // Wrapper to update tasks AND update history record
  const updateTasks = (newTasks: Task[] | ((prev: Task[]) => Task[])) => {
    setTasks((prevTasks) => {
      const updatedTasks = typeof newTasks === 'function' ? newTasks(prevTasks) : newTasks;
      
      // Update history synchronously with the task update
      const dateKey = getDateKey(currentDate);
      setHistory(prevHistory => ({
        ...prevHistory,
        [dateKey]: updatedTasks
      }));
      
      return updatedTasks;
    });
  };

  const handleDateChange = (newDate: Date) => {
    const dateKey = getDateKey(newDate);
    const historyTasks = history[dateKey] || [];
    
    setCurrentDate(newDate);
    setTasks(historyTasks);
    setAppState(AppState.PLANNING);
  };

  const handleCreateSchedule = async () => {
    setIsGenerating(true);
    
    // Map existing tasks to partials for API
    const simpleTasks = tasks.map(({ title, subject, estimatedMinutes, emoji }) => ({ title, subject, estimatedMinutes, emoji }));
    
    const optimized = await generateOptimizedSchedule(simpleTasks);
    
    const newTasks: Task[] = optimized.map((t: any, idx: number) => ({
      id: `task-${Date.now()}-${idx}`,
      title: t.title,
      subject: t.subject,
      estimatedMinutes: t.estimatedMinutes,
      isBreak: t.isBreak || false,
      emoji: t.emoji || '📅',
      status: TaskStatus.PENDING,
    }));

    updateTasks(newTasks);
    setIsGenerating(false);
    setAppState(AppState.PLANNING);
  };

  const handleStartTask = (task: Task) => {
    setActiveTask(task);
    setAppState(AppState.DOING);
  };

  const handleCompleteTask = (task: Task, durationSeconds: number) => {
    updateTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.COMPLETED, actualDurationSeconds: durationSeconds } : t
    ));

    setActiveTask(null);
    setAppState(AppState.PLANNING);
  };

  const handleDeleteTask = (taskId: string) => {
    updateTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const isToday = getDateKey(currentDate) === getDateKey(new Date());

  return (
    <div className="min-h-screen pb-16">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-indigo-100 shadow-lg">
               <Sparkles className="w-6 h-6" />
             </div>
             <h1 className="text-2xl font-black tracking-tight text-slate-800">Kiddo<span className="text-indigo-600">Time</span></h1>
           </div>
           
           <div className="flex items-center gap-2">
             {!isToday && appState !== AppState.CALENDAR && (
                <button
                  onClick={() => handleDateChange(new Date())}
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                >
                  Today
                </button>
             )}

             <button 
                onClick={() => setAppState(AppState.CALENDAR)}
                className={`p-2.5 rounded-xl transition-colors ${appState === AppState.CALENDAR ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                title="Calendar"
             >
               <CalendarIcon className="w-6 h-6" />
             </button>
             
             <button 
                onClick={() => setAppState(AppState.PLANNING)}
                className={`p-2.5 rounded-xl transition-colors ${appState === AppState.PLANNING ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                title="Schedule"
             >
               <LayoutDashboard className="w-6 h-6" />
             </button>
           </div>
        </div>
      </header>

      <main className="pt-8 px-4">
        {!isToday && appState === AppState.PLANNING && (
          <div className="max-w-4xl mx-auto mb-6">
             <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800 shadow-sm">
                <CalendarIcon className="w-5 h-5" />
                <span className="font-bold text-base italic">{currentDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                <button onClick={() => handleDateChange(new Date())} className="ml-auto text-sm font-bold underline hover:no-underline">Back to Today</button>
             </div>
          </div>
        )}

        {isGenerating && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-md z-50 flex flex-col items-center justify-center animate-fade-in">
             <div className="w-20 h-20 border-[6px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-6"></div>
             <h2 className="text-2xl font-bold text-slate-800 animate-pulse">Consulting the Time Wizard...</h2>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {appState === AppState.CALENDAR && (
            <CalendarView 
              history={history}
              selectedDate={currentDate}
              onSelectDate={handleDateChange}
              onClose={() => setAppState(AppState.PLANNING)}
            />
          )}

          {appState === AppState.ONBOARDING && (
            <TaskInput 
              tasks={tasks} 
              onTasksChange={updateTasks} 
              onNext={handleCreateSchedule} 
            />
          )}

          {appState === AppState.PLANNING && (
            <Schedule 
              tasks={tasks} 
              onStartTask={handleStartTask} 
              onDeleteTask={handleDeleteTask}
              onTasksChange={updateTasks}
            />
          )}

          {appState === AppState.DOING && activeTask && (
            <Timer 
              task={activeTask}
              onComplete={handleCompleteTask}
              onBack={() => setAppState(AppState.PLANNING)}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;