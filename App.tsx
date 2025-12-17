import React, { useState, useEffect } from 'react';
import { Task, AppState, TaskStatus } from './types';
import TaskInput from './components/TaskInput';
import Schedule from './components/Schedule';
import Timer from './components/Timer';
import CalendarView from './components/CalendarView';
import { generateOptimizedSchedule, getMotivationalMessage } from './services/gemini';
import { Sparkles, LayoutDashboard, Calendar as CalendarIcon, ChevronLeft } from 'lucide-react';

const STORAGE_KEY = 'kiddotime_history';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.ONBOARDING);
  
  // State for the currently viewed date and tasks
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Master history state: Map of 'YYYY-MM-DD' -> Task[]
  const [history, setHistory] = useState<Record<string, Task[]>>({});

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalMessage, setModalMessage] = useState<string | null>(null);

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
          setAppState(AppState.PLANNING);
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history whenever tasks change or active date changes
  // We actually update the `history` state object immediately when `tasks` changes
  // This effect ensures persistence to disk
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
    
    // If we have tasks, go to planning, otherwise allow onboarding or empty state
    // For simplicity, if switching dates, we show the schedule view (which handles empty state)
    // unless it's a new day with absolutely no data, where we might want onboarding,
    // but users might want to add tasks via the "Add" button in Schedule view.
    // Let's stick to PLANNING view for consistency when browsing.
    setAppState(AppState.PLANNING);
  };

  const handleCreateSchedule = async () => {
    setIsGenerating(true);
    
    // Map existing tasks to partials for API
    const simpleTasks = tasks.map(({ id, title, subject, estimatedMinutes, emoji }) => ({ title, subject, estimatedMinutes, emoji }));
    
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

  const handleStartTask = async (task: Task) => {
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
    
    updateTasks(prev => prev.map(t => 
      t.id === task.id ? { ...t, status: TaskStatus.COMPLETED, actualMinutes: duration } : t
    ));

    setModalMessage(msg); 
    
    setTimeout(() => {
        setModalMessage(null);
        setActiveTask(null);
        setAppState(AppState.PLANNING);
    }, 3000);
  };

  const handleDeleteTask = (taskId: string) => {
    updateTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const isToday = getDateKey(currentDate) === getDateKey(new Date());

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
           
           <div className="flex items-center gap-2">
             {!isToday && appState !== AppState.CALENDAR && (
                <button
                  onClick={() => handleDateChange(new Date())}
                  className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors"
                >
                  Back to Today
                </button>
             )}

             {appState !== AppState.ONBOARDING && (
               <>
                 <button 
                    onClick={() => setAppState(AppState.CALENDAR)}
                    className={`p-2 rounded-xl transition-colors ${appState === AppState.CALENDAR ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                    title="Calendar"
                 >
                   <CalendarIcon className="w-6 h-6" />
                 </button>
                 
                 <button 
                    onClick={() => setAppState(AppState.PLANNING)}
                    className={`p-2 rounded-xl transition-colors ${appState === AppState.PLANNING ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-50 text-slate-400 hover:text-indigo-600'}`}
                    title="View Schedule"
                 >
                   <LayoutDashboard className="w-6 h-6" />
                 </button>
               </>
             )}
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-8 px-4">
        
        {/* Date Banner (if not today) */}
        {!isToday && appState === AppState.PLANNING && (
          <div className="max-w-4xl mx-auto mb-6">
             <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 p-4 rounded-2xl text-amber-800">
                <CalendarIcon className="w-5 h-5" />
                <span className="font-bold">Viewing history for: {currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                <button onClick={() => handleDateChange(new Date())} className="ml-auto text-sm font-bold underline hover:no-underline">Go to Today</button>
             </div>
          </div>
        )}

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
      </main>
    </div>
  );
};

export default App;