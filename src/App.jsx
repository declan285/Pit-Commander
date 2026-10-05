import { useState, useEffect } from 'react';
import { useTimer } from 'react-timer-hook';
import {
  ShieldAlert,
  Plus,
  Calendar,
  MapPin,
  Bot,
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  X,
  Trophy,
  LayoutDashboard,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';

const getTimerExpiry = (durationSeconds) =>
  new Date(Date.now() + durationSeconds * 1000);

export default function App() {
  // --- STATE MANAGEMENT ---
  const [activeEventId, setActiveEventId] = useState(null);
  const [dashboardView, setDashboardView] = useState('dashboard');
  const [selectedWeightClass, setSelectedWeightClass] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(3);
  const [timerSecondsInput, setTimerSecondsInput] = useState(0);
  const [timerExpiryTimestamp] = useState(
    () => new Date(Date.now() + 3 * 60 * 1000)
  );
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerPaused, setTimerPaused] = useState(false);
  const {
    seconds,
    minutes,
    hours,
    isRunning,
    pause,
    resume,
    restart,
  } = useTimer({ expiryTimestamp: timerExpiryTimestamp, autoStart: false });

  const timerDurationSeconds = timerMinutes * 60 + timerSecondsInput;
  const resetTimer = (durationSeconds = timerDurationSeconds) => {
    restart(getTimerExpiry(durationSeconds), false);
    setTimerStarted(false);
    setTimerPaused(false);
  };
  const startTimer = () => {
    if (timerPaused) {
      resume();
      setTimerPaused(false);
      return;
    }
    if (timerDurationSeconds > 0) {
      restart(getTimerExpiry(timerDurationSeconds), true);
      setTimerStarted(true);
    }
  };

  // Events State (Persisted)
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('pitcommander_events');
    return saved ? JSON.parse(saved) : [];
  });

  // Dynamic Robots State (Persisted)
  const [robots, setRobots] = useState(() => {
    const saved = localStorage.getItem('pitcommander_robots');
    return saved ? JSON.parse(saved) : [];
  });
  // Handler for safety checkbox toggle(persistent)
  const handleToggleStatus = (robotId, field) => {
    setRobots(
      robots.map((robot) => {
        if (robot.id === robotId) {
          return { ...robot, [field]: !robot[field] };
        }
        return robot;
      })
    );
  };
  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('pitcommander_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('pitcommander_robots', JSON.stringify(robots));
  }, [robots]);

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);

  // --- WEIGHT CLASS STATES  ---
  const [isWeightClassModalOpen, setIsWeightClassModalOpen] = useState(false);
  const [newWeightClassName, setNewWeightClassName] = useState('');

  // Form Inputs
  const [newEvent, setNewEvent] = useState({
    name: '',
    location: '',
    date: '',
    status: 'UPCOMING',
    weightClasses: '',
  });

  const [newRobot, setNewRobot] = useState({
    name: '',
    team: '',
    pitTable: '',
    weightClass: '',
  });

  const activeEvent = events.find((e) => e.id === activeEventId);
  const activeRobots = robots.filter((r) => r.eventId === activeEventId);
  const selectedClassRobots = activeRobots.filter(
    (robot) => robot.weightClass === selectedWeightClass
  );

  // Computed Metrics for Active Event
  const onDeckCount = activeRobots.filter((r) => r.status === 'ON_DECK').length;
  const queuedCount = activeRobots.filter((r) => r.status === 'QUEUED').length;
  const safetyPassedCount = activeRobots.filter((r) => r.safetyPassed).length;
  const repairHoldsCount = activeRobots.filter(
    (r) => r.status === 'REPAIRING'
  ).length;

  // --- HANDLERS ---
  const handleCreateEvent = (e) => {
    e.preventDefault();
    if (!newEvent.name.trim()) return;

    const classesArray = newEvent.weightClasses
      ? newEvent.weightClasses
          .split(',')
          .map((wc) => wc.trim())
          .filter(Boolean)
      : ['3lb Beetleweight'];

    const createdEvent = {
      id: `event-${Date.now()}`,
      name: newEvent.name,
      location: newEvent.location || 'Unspecified Location',
      date: newEvent.date || 'TBD',
      status: newEvent.status || 'UPCOMING',
      weightClasses: classesArray,
    };

    if (editingEventId) {
      setEvents((prev) =>
        prev.map((event) =>
          event.id === editingEventId
            ? { ...createdEvent, id: editingEventId }
            : event
        )
      );
    } else {
      setEvents((prev) => [createdEvent, ...prev]);
    }
    setNewEvent({
      name: '',
      location: '',
      date: '',
      status: 'UPCOMING',
      weightClasses: '',
    });
    setEditingEventId(null);
    setIsEventModalOpen(false);
  };

  const handleEditEvent = (event) => {
    setEditingEventId(event.id);
    setNewEvent({
      name: event.name,
      location: event.location,
      date: event.date,
      status: event.status,
      weightClasses: event.weightClasses.join(', '),
    });
    setIsEventModalOpen(true);
  };

  const openRobotModal = (weightClass = '') => {
    setNewRobot({
      name: '',
      team: '',
      pitTable: '',
      weightClass: weightClass || activeEvent?.weightClasses[0] || '',
    });
    setIsRobotModalOpen(true);
  };

  const handleCreateRobot = (e) => {
    e.preventDefault();
    if (!newRobot.name.trim() || !activeEventId) return;

    const createdRobot = {
      id: `bot-${crypto.randomUUID()}`,
      eventId: activeEventId,
      name: newRobot.name,
      team: newRobot.team || 'Independent',
      pitTable: newRobot.pitTable || 'Unassigned',
      weightClass:
        newRobot.weightClass || activeEvent?.weightClasses[0] || 'Beetleweight',
      status: 'QUEUED',
      safetyPassed: false,
    };

    setRobots((prev) => [...prev, createdRobot]);
    setNewRobot({
      name: '',
      team: '',
      pitTable: '',
      weightClass: '',
    });
    setIsRobotModalOpen(false);
  };
  const handleToggleSafety = (robotId) => {
    setRobots((prev) =>
      prev.map((r) =>
        r.id === robotId ? { ...r, safetyPassed: !r.safetyPassed } : r
      )
    );
  };

  const handleDeleteRobot = (robotId) => {
    setRobots((prev) => prev.filter((r) => r.id !== robotId));
  };

  const handleDeleteEvent = (e, eventId) => {
    e.stopPropagation();
    setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
    setRobots((prev) => prev.filter((r) => r.eventId !== eventId));
    if (activeEventId === eventId) setActiveEventId(null);
  };

  // Status Badge UI Renderer
  const getStatusBadge = (status) => {
    switch (status) {
      case 'UPCOMING':
        return (
          <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            UPCOMING
          </span>
        );
      case 'ONGOING':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            ONGOING
          </span>
        );
      case 'PAST':
        return (
          <span className="bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            PAST
          </span>
        );
      case 'ON_DECK':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> On Deck
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-400 border border-blue-500/20">
            <Layers className="w-3 h-3" /> Queued
          </span>
        );
      case 'REPAIRING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Pit Repair
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* SIDEBAR NAVIGATION (Shown when an event is selected) */}
      {activeEventId !== null && (
        <aside
          className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 relative transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* MINIMIZE / EXPAND TOGGLE ARROW */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-5 bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-full border border-slate-800 shadow-md transition-colors z-20"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          <div>
            {/* LOGO & BRANDING */}
            <button
              type="button"
              onClick={() => {
                setDashboardView('dashboard');
                setActiveEventId(null);
              }}
              title="Back to All Events"
              className={`h-16 w-full border-b border-slate-800 flex items-center gap-3 hover:bg-slate-800/40 transition-colors ${
                isCollapsed ? 'justify-center px-2' : 'px-6'
              }`}
            >
              <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/30 shrink-0">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <div className="overflow-hidden whitespace-nowrap">
                  <h1 className="text-base font-bold text-white leading-tight flex items-center gap-1.5">
                    PitCommander{' '}
                    <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      v1.0
                    </span>
                  </h1>
                  <p className="text-[11px] text-slate-400">
                    Combat Robotics Pit Logistics
                  </p>
                </div>
              )}
            </button>

            {/* NAV LINKS */}
            <nav className="p-2 space-y-2">
              <button
                onClick={() => {
                  setDashboardView('dashboard');
                  setActiveEventId(null);
                }}
                title="Back to All Events"
                className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors ${
                  isCollapsed ? 'justify-center px-0' : 'px-3'
                }`}
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 shrink-0" />
                {!isCollapsed && (
                  <span className="truncate">Back to All Events</span>
                )}
              </button>

              <button
                onClick={() => setDashboardView('dashboard')}
                title="Dashboard"
                className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  dashboardView === 'dashboard'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-400 shrink-0" />
                {!isCollapsed && <span>Dashboard</span>}
              </button>

              <button
                onClick={() => setDashboardView('Safety')}
                title="Safety"
                className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  dashboardView === 'Safety'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
              >
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                {!isCollapsed && <span>Safety</span>}
              </button>

              <button
                onClick={() => setDashboardView('Timers')}
                title="Timers"
                className={`w-full flex items-center gap-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  dashboardView === 'Timers'
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
              >
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                {!isCollapsed && <span>Timers</span>}
              </button>
            </nav>
          </div>

          {/* FOOTER */}
          {!isCollapsed && (
            <div className="p-4 border-t border-slate-800/60 text-[11px] text-slate-500 truncate">
              PitCommander Arena System
            </div>
          )}
        </aside>
      )}

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER BAR */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div>
            {activeEventId === null ? (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-600/30">
                  <ShieldAlert className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    PitCommander{' '}
                    <span className="text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                      v1.0
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Events Overview</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">
                  {activeEvent?.name}
                </h2>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />{' '}
                  {activeEvent?.location}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />{' '}
                  {activeEvent?.date}
                </span>
              </div>
            )}
          </div>

          {activeEventId === null ? (
            <button
              onClick={() => {
                setEditingEventId(null);
                setNewEvent({
                  name: '',
                  location: '',
                  date: '',
                  status: 'UPCOMING',
                  weightClasses: '',
                });
                setIsEventModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md hover:shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" /> Register Event
            </button>
          ) : null}
        </header>

        {/* MAIN VIEWPORT */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* VIEW 1: EVENTS OVERVIEW */}
          {activeEventId === null ? (
            <section>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Competition Events
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select an event to open its live arena dashboard.
                  </p>
                </div>
              </div>

              {events.length === 0 ? (
                <div className="border border-dashed border-slate-800 bg-slate-900/40 rounded-2xl p-12 text-center max-w-xl mx-auto my-12">
                  <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 text-indigo-400">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">
                    No Active Events Found
                  </h3>
                  <p className="text-xs text-slate-400 mb-6">
                    Get started by registering your first combat robotics
                    competition event.
                  </p>
                  <button
                    onClick={() => {
                      setEditingEventId(null);
                      setNewEvent({
                        name: '',
                        location: '',
                        date: '',
                        status: 'UPCOMING',
                        weightClasses: '',
                      });
                      setIsEventModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg shadow-indigo-600/20"
                  >
                    <Plus className="w-4 h-4" /> Register Event
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => {
                    const eventBotCount = robots.filter(
                      (r) => r.eventId === event.id
                    ).length;
                    return (
                      <div
                        key={event.id}
                        className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all group relative"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            {event.status ? (
                              getStatusBadge(event.status)
                            ) : (
                              <span className="h-5"></span>
                            )}
                            <button
                              onClick={(e) => handleDeleteEvent(e, event.id)}
                              title="Delete Event"
                              className="text-slate-600 hover:text-rose-400 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors">
                            {event.name}
                          </h3>

                          <div className="space-y-1.5 my-4 text-xs text-slate-400">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              <span>{event.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>{event.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Bot className="w-3.5 h-3.5 text-slate-500" />
                              <span>{eventBotCount} Registered Robots</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {event.weightClasses.map((wc, i) => (
                              <span
                                key={i}
                                className="text-[10px] font-medium bg-slate-800/80 text-slate-300 px-2 py-0.5 rounded"
                              >
                                {wc}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => handleEditEvent(event)}
                            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Event</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDashboardView('dashboard');
                              setActiveEventId(event.id);
                            }}
                            className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <span>Manage Event</span>
                            <span>→</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          ) : (
            /* VIEW 2: ACTIVE EVENT DASHBOARD */
            <>
              {dashboardView === 'Safety' ? (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Safety Spreadsheet
                      </h3>
                      <p className="text-xs text-slate-400">
                        Track safety checks for every registered robot.
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {safetyPassedCount} of {activeRobots.length} cleared
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 shadow-lg">
                    <table className="w-full min-w-190 border-collapse text-left text-xs">
                      <thead>
                        <tr className="bg-slate-800/80 text-[10px] uppercase tracking-wide text-slate-400">
                          <th className="border-b border-r border-slate-700 px-4 py-3 font-semibold">
                            Robot
                          </th>
                          <th className="border-b border-r border-slate-700 px-4 py-3 font-semibold">
                            Team
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Weight Class
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Pit Table
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Safety Check
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Fees Paid
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Check-In
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Weighed-In
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Signed Waiver
                          </th>
                          <th className="border-b border-r border-slate-700 px-2 py-3 font-semibold">
                            Postponed
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeRobots.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-4 py-10 text-center text-slate-500"
                            >
                              No robots registered for this event yet.
                            </td>
                          </tr>
                        ) : (
                          activeRobots.map((robot, index) => (
                            <tr
                              key={robot.id}
                              className={`${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'} hover:bg-indigo-500/5`}
                            >
                              <td className="border-b border-r border-slate-800 px-4 py-3 font-semibold text-white">
                                {robot.name}
                              </td>
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-slate-300">
                                {robot.team}
                              </td>
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-slate-300">
                                {robot.weightClass}
                              </td>
                              {/* Pit Table */}
                              <td className="border-b border-r border-slate-800 px-4 py-3">
                                {robot.pitTable || 'Unassigned'}
                              </td>
                              {/* Safety Check Checkbox */}
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={robot.safetyCheck || false}
                                  onChange={() =>
                                    handleToggleStatus(robot.id, 'safetyCheck')
                                  }
                                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              {/* Fees Paid Checkbox */}
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={robot.feesPaid || false}
                                  onChange={() =>
                                    handleToggleStatus(robot.id, 'feesPaid')
                                  }
                                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              {/* Check-In Checkbox */}
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={robot.checkedIn || false}
                                  onChange={() =>
                                    handleToggleStatus(robot.id, 'checkedIn')
                                  }
                                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={robot.weighedIn || false}
                                  onChange={() =>
                                    handleToggleStatus(robot.id, 'weighedIn')
                                  }
                                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSafety(robot.id)}
                                  className={`inline-flex items-center gap-2 rounded border px-2.5 py-1.5 font-semibold transition-colors ${
                                    robot.safetyPassed
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {robot.safetyPassed ? 'Sighned' : 'Pending'}
                                </button>
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={robot.postponed || false}
                                  onChange={() =>
                                    handleToggleStatus(robot.id, 'postponed')
                                  }
                                  className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : dashboardView === 'Timers' ? (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        Event Timer
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Set a countdown for the active event.
                      </p>
                    </div >
                  </div>
                  <div className="max-w-3xl rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg sm:p-8">
                    <div className="mb-6 flex flex-wrap gap-2">
                      {[
                        { label: '1 min', seconds: 60 },
                        { label: '2 min', seconds: 120 },
                        { label: '5 min', seconds: 300 },
                      ].map((preset) => (
                        <button
                          key={preset.seconds}
                          type="button"
                          onClick={() => {
                            setTimerMinutes(Math.floor(preset.seconds / 60));
                            setTimerSecondsInput(preset.seconds % 60);
                            resetTimer(preset.seconds);
                          }}
                          className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-indigo-500/50 hover:text-white"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div
                      className="mb-8 rounded-lg border border-slate-800 bg-slate-950 px-4 py-8 text-center"
                      aria-live="off"
                      aria-label={`Time remaining: ${hours} hours, ${minutes} minutes, ${seconds} seconds`}
                    >
                      <p className="font-mono text-6xl font-bold tabular-nums text-white sm:text-7xl">
                        {[hours, minutes, seconds]
                          .map((value) => String(value).padStart(2, '0'))
                          .join(':')}
                      </p>
                      <p className="mt-3 text-xs font-medium uppercase text-slate-500">
                        {timerStarted && !isRunning && !timerPaused
                          ? 'Time complete'
                          : timerPaused
                            ? 'Paused'
                            : isRunning
                              ? 'Running'
                              : 'Ready'}
                      </p>
                    </div>

                    <div className="mb-6 grid grid-cols-2 gap-3">
                      <label className="text-xs font-medium text-slate-400">
                        Minutes
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={timerMinutes}
                          disabled={isRunning || timerPaused}
                          onChange={(event) =>
                            setTimerMinutes(
                              Math.min(99, Math.max(0, Number(event.target.value)))
                            )
                          }
                          className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                        />
                      </label>
                      <label className="text-xs font-medium text-slate-400">
                        Seconds
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={timerSecondsInput}
                          disabled={isRunning || timerPaused}
                          onChange={(event) =>
                            setTimerSecondsInput(
                              Math.min(59, Math.max(0, Number(event.target.value)))
                            )
                          }
                          className="mt-1.5 w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={startTimer}
                        disabled={isRunning || timerDurationSeconds === 0}
                        className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Play className="h-4 w-4" />
                        {timerPaused ? 'Resume' : 'Start'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          pause();
                          setTimerPaused(true);
                        }}
                        disabled={!isRunning}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pause className="h-4 w-4" /> Pause
                      </button>
                      <button
                        type="button"
                        onClick={() => resetTimer()}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
                      >
                        <RotateCcw className="h-4 w-4" /> Reset
                      </button>
                    </div>
                  </div>
                </section>
              ) : dashboardView === 'robots' ? (
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <button
                        type="button"
                        onClick={() => setDashboardView('dashboard')}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white mb-3 transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Weight
                        Classes
                      </button>
                      <h3 className="text-xl font-bold text-white">
                        {selectedWeightClass} Robots
                      </h3>
                      <p className="text-xs text-slate-400">
                        {selectedClassRobots.length} Robots Registered
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openRobotModal(selectedWeightClass)}
                      className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium text-xs transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" /> Add Robot
                    </button>
                  </div>

                  {selectedClassRobots.length === 0 ? (
                    <div className="border border-dashed border-slate-800 bg-slate-900/40 rounded-xl p-10 text-center text-slate-500 text-xs">
                      No robots registered in this weight class yet.
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full min-w-160 border-collapse text-left text-xs">
                        <thead className="bg-slate-950 text-slate-400">
                          <tr>
                            <th className="border-b border-r border-slate-800 px-4 py-3 font-semibold">
                              Robot
                            </th>
                            <th className="border-b border-r border-slate-800 px-4 py-3 font-semibold">
                              Pit Table
                            </th>
                            <th className="border-b border-r border-slate-800 px-4 py-3 font-semibold">
                              Waiver Status
                            </th>
                            <th className="border-b border-r border-slate-800 px-4 py-3 font-semibold">
                              Robot Status
                            </th>
                            <th className="border-b border-slate-800 px-4 py-3 text-center font-semibold">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedClassRobots.map((robot, index) => (
                            <tr
                              key={robot.id}
                              className={`${index % 2 === 0 ? 'bg-slate-900' : 'bg-slate-900/60'} hover:bg-indigo-500/5`}
                            >
                              <td className="border-b border-r border-slate-800 px-4 py-3">
                                <p className="font-semibold text-white">
                                  {robot.name}
                                </p>
                                <p className="mt-1 text-slate-500">
                                  {robot.team}
                                </p>
                              </td>
                              <td className="border-b border-r border-slate-800 px-4 py-3 text-slate-300">
                                {robot.pitTable || 'Unassigned'}
                              </td>
                              <td className="border-b border-r border-slate-800 px-4 py-3">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSafety(robot.id)}
                                  className={`inline-flex items-center gap-2 rounded border px-2.5 py-1.5 font-semibold transition-colors ${
                                    robot.safetyPassed
                                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                                  }`}
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  {robot.safetyPassed ? 'Signed' : 'Pending'}
                                </button>
                              </td>
                              <td className="border-b border-r border-slate-800 px-4 py-3">
                                {getStatusBadge(robot.status)}
                              </td>
                              <td className="border-b border-slate-800 px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRobot(robot.id)}
                                  className="rounded p-1 text-slate-500 transition-colors hover:text-rose-400"
                                  title="Delete Robot"
                                  aria-label={`Delete ${robot.name}`}
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              ) : (
                <section>
                  {/* METRICS ROW */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <Clock className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          On Deck
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {onDeckCount} Robots
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Layers className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Active Queue
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {queuedCount} Robots
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Safety Cleared
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {safetyPassedCount} / {activeRobots.length}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                      <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20">
                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-400">
                          Pit Repairs
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {repairHoldsCount} Holds
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* WEIGHT CLASS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeEvent?.weightClasses?.map((weightClass) => {
                      const robotsInClass = activeRobots.filter(
                        (r) => r.weightClass === weightClass
                      );

                      return (
                        <div
                          key={weightClass}
                          className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-5 shadow-lg flex flex-col justify-between transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
                                <Layers className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-white">
                                  {weightClass}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  {robotsInClass.length} Registered Robots
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-500">Weight Class</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWeightClass(weightClass);
                                setDashboardView('robots');
                              }}
                              className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors"
                            >
                              Manage Robots <span aria-hidden="true">→</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </main>
      </div>

      {/* EVENT CREATION / EDIT MODAL */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => {
                setIsEventModalOpen(false);
                setEditingEventId(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              {editingEventId ? 'Edit Event' : 'Register New Event'}
            </h3>
            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  value={newEvent.name}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Robot Ruckus 2026"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, location: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Orlando, FL"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Nov 12-14"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">
                    Status
                  </label>
                  <select
                    value={newEvent.status}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, status: e.target.value })
                    }
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="PAST">PAST</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Weight Classes (comma separated)
                </label>
                <input
                  type="text"
                  value={newEvent.weightClasses}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, weightClasses: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 3lb Beetleweight, 12lb Hobbyweight"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setEditingEventId(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                >
                  {editingEventId ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Register Class Modal */}
      {isWeightClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">
                Register New Class
              </h3>
              <button
                onClick={() => setIsWeightClassModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-medium"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Class Name
                </label>
                <input
                  type="text"
                  value={newWeightClassName}
                  onChange={(e) => setNewWeightClassName(e.target.value)}
                  placeholder="e.g., 3lb Beetleweight, 150lb Heavyweight"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-950/50 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsWeightClassModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Add your save logic here or call your submit handler
                  setIsWeightClassModalOpen(false);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-md shadow-indigo-500/20"
              >
                Save Class
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ROBOT REGISTRATION MODAL */}
      {isRobotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsRobotModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">
              Register Robot
            </h3>
            <form onSubmit={handleCreateRobot} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Robot Name
                </label>
                <input
                  type="text"
                  required
                  value={newRobot.name}
                  onChange={(e) =>
                    setNewRobot({ ...newRobot, name: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Hypershock"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newRobot.team}
                  onChange={(e) =>
                    setNewRobot({ ...newRobot, team: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. Will Bales & Team"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Pit Table
                </label>
                <input
                  type="text"
                  value={newRobot.pitTable}
                  onChange={(e) =>
                    setNewRobot({ ...newRobot, pitTable: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. A1"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">
                  Weight Class
                </label>
                <select
                  value={newRobot.weightClass}
                  onChange={(e) =>
                    setNewRobot({ ...newRobot, weightClass: e.target.value })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  {activeEvent?.weightClasses.map((wc, idx) => (
                    <option key={idx} value={wc}>
                      {wc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRobotModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/20"
                >
                  Register Robot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
