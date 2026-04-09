import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CalendarProps {
  onBack: () => void;
}

interface Event {
  id: string;
  title: string;
  time: string;
  dateStr: string;
  color: string;
}

export function Calendar({ onBack }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('app_calendar_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');

  useEffect(() => {
    localStorage.setItem('app_calendar_events', JSON.stringify(events));
  }, [events]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (date: number) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), date));
    setShowAddEvent(true);
  };

  const handleAddEvent = () => {
    if (!selectedDate || !newEventTitle) return;

    const dateStr = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    const colors = ['bg-red-50', 'bg-blue-50', 'bg-green-50', 'bg-yellow-50', 'bg-purple-50'];
    const textColors = ['text-red-900', 'text-blue-900', 'text-green-900', 'text-yellow-900', 'text-purple-900'];
    const borderColors = ['border-red-100', 'border-blue-100', 'border-green-100', 'border-yellow-100', 'border-purple-100'];
    const timeColors = ['text-red-700', 'text-blue-700', 'text-green-700', 'text-yellow-700', 'text-purple-700'];
    
    const colorIdx = Math.floor(Math.random() * colors.length);

    const newEvent: Event = {
      id: Date.now().toString(),
      title: newEventTitle,
      time: newEventTime || 'All Day',
      dateStr,
      color: `${colors[colorIdx]} ${borderColors[colorIdx]} ${textColors[colorIdx]} ${timeColors[colorIdx]}`
    };

    setEvents([...events, newEvent]);
    setNewEventTitle('');
    setNewEventTime('');
    setShowAddEvent(false);
  };

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  const getEventsForDate = (date: number) => {
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${date}`;
    return events.filter(e => e.dateStr === dateStr);
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events.filter(e => {
      const [year, month, day] = e.dateStr.split('-').map(Number);
      const eventDate = new Date(year, month, day);
      return eventDate >= today;
    }).sort((a, b) => {
      const [y1, m1, d1] = a.dateStr.split('-').map(Number);
      const [y2, m2, d2] = b.dateStr.split('-').map(Number);
      return new Date(y1, m1, d1).getTime() - new Date(y2, m2, d2).getTime();
    }).slice(0, 5);
  };

  return (
    <div 
      className="flex flex-col h-full bg-white text-gray-900 relative"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x > 50 || info.velocity.x > 500) {
          onBack();
        }
      }}
    >
      <div className="flex items-center p-4 pt-12 bg-red-500 text-white shadow-sm z-10">
        <button onClick={onBack} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold ml-2">Calendar</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-red-600">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex space-x-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-4">
          {days.map(day => (
            <div key={day} className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const date = i + 1;
            const isToday = 
              date === new Date().getDate() && 
              currentDate.getMonth() === new Date().getMonth() && 
              currentDate.getFullYear() === new Date().getFullYear();
            
            const dayEvents = getEventsForDate(date);

            return (
              <motion.div
                key={date}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDayClick(date)}
                className={`aspect-square flex flex-col items-center justify-center rounded-full text-lg cursor-pointer relative
                  ${isToday ? 'bg-red-500 text-white font-bold shadow-md' : 'hover:bg-gray-100'}
                `}
              >
                <span>{date}</span>
                {dayEvents.length > 0 && (
                  <div className="absolute bottom-1 flex gap-0.5">
                    {dayEvents.slice(0, 3).map((_, idx) => (
                      <div key={idx} className={`w-1 h-1 rounded-full ${isToday ? 'bg-white' : 'bg-red-500'}`} />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-12 pb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-red-500" />
            Upcoming Events
          </h3>
          <div className="space-y-4">
            {getUpcomingEvents().length === 0 ? (
              <p className="text-gray-500 italic">No upcoming events.</p>
            ) : (
              getUpcomingEvents().map(event => {
                const [bg, border, text, timeText] = event.color.split(' ');
                return (
                  <div key={event.id} className={`${bg} p-4 rounded-2xl border ${border} relative group`}>
                    <div className={`font-semibold ${text}`}>{event.title}</div>
                    <div className={`text-sm ${timeText} mt-1`}>
                      {new Date(event.dateStr.split('-')[0] as any, event.dateStr.split('-')[1] as any, event.dateStr.split('-')[2] as any).toLocaleDateString()} • {event.time}
                    </div>
                    <button 
                      onClick={() => deleteEvent(event.id)}
                      className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAddEvent && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 z-20"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                Add Event for {selectedDate?.toLocaleDateString()}
              </h3>
              <button onClick={() => setShowAddEvent(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="e.g., Doctor Appointment"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time (Optional)</label>
                <input
                  type="text"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  placeholder="e.g., 10:00 AM"
                />
              </div>
              <button
                onClick={handleAddEvent}
                disabled={!newEventTitle}
                className="w-full bg-red-500 text-white font-semibold rounded-xl py-3 mt-4 disabled:opacity-50 hover:bg-red-600 transition-colors"
              >
                Save Event
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showAddEvent && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAddEvent(false)}
          className="absolute inset-0 bg-black/20 z-10"
        />
      )}
    </div>
  );
}
