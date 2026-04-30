import React, { useState, useEffect } from 'react';
import { ChevronLeft, Plus, Trash2, Edit3, Save, StickyNote } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NotesProps {
  onBack: () => void;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export function Notes({ onBack }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('app_notes');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_notes', JSON.stringify(notes));
  }, [notes]);

  const createNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      date: new Date().toLocaleDateString(),
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
    setIsEditing(true);
  };

  const saveNote = () => {
    if (activeNote) {
      setNotes(notes.map(n => n.id === activeNote.id ? activeNote : n));
      setIsEditing(false);
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) {
      setActiveNote(null);
      setIsEditing(false);
    }
  };

  return (
    <motion.div 
      className="flex flex-col h-full bg-yellow-50 text-gray-900"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={(e, info) => {
        if (info.offset.x > 50 || info.velocity.x > 500) {
          if (activeNote && !isEditing) {
            setActiveNote(null);
          } else {
            onBack();
          }
        }
      }}
    >
      <div className="flex items-center justify-between p-4 pt-12 bg-yellow-400 text-yellow-900 shadow-sm z-10">
        <div className="flex items-center">
          <button onClick={() => activeNote && !isEditing ? setActiveNote(null) : onBack()} className="p-2 -ml-2 hover:bg-yellow-500/30 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold ml-2">{activeNote ? (isEditing ? 'Edit Note' : 'View Note') : 'Notes'}</h1>
        </div>
        {!activeNote && (
          <button onClick={createNote} className="p-2 hover:bg-yellow-500/30 rounded-full transition-colors">
            <Plus className="w-6 h-6" />
          </button>
        )}
        {activeNote && isEditing && (
          <button onClick={saveNote} className="p-2 hover:bg-yellow-500/30 rounded-full transition-colors">
            <Save className="w-6 h-6" />
          </button>
        )}
        {activeNote && !isEditing && (
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-yellow-500/30 rounded-full transition-colors">
              <Edit3 className="w-5 h-5" />
            </button>
            <button onClick={() => deleteNote(activeNote.id)} className="p-2 hover:bg-yellow-500/30 rounded-full transition-colors text-red-600">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {!activeNote ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4"
            >
              {notes.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <StickyNote className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>No notes yet. Create one!</p>
                </div>
              ) : (
                notes.map(note => (
                  <motion.div
                    key={note.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveNote(note)}
                    className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200 cursor-pointer"
                  >
                    <h3 className="font-semibold text-lg truncate">{note.title}</h3>
                    <p className="text-gray-500 text-sm mt-1 truncate">{note.content || 'Empty note'}</p>
                    <p className="text-xs text-gray-400 mt-3">{note.date}</p>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => setActiveNote({ ...activeNote, title: e.target.value })}
                disabled={!isEditing}
                className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 mb-4 text-gray-900 placeholder:text-gray-400"
                placeholder="Note Title"
              />
              <textarea
                value={activeNote.content}
                onChange={(e) => setActiveNote({ ...activeNote, content: e.target.value })}
                disabled={!isEditing}
                className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-gray-800 resize-none placeholder:text-gray-400 leading-relaxed"
                placeholder="Start typing your note here..."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
