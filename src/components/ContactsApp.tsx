import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, ChevronLeft, Phone, Mail, MessageSquare, Video, Edit, Trash2, User } from 'lucide-react';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  color: string;
}

interface ContactsAppProps {
  onBack: () => void;
}

const COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
];

export default function ContactsApp({ onBack }: ContactsAppProps) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'list' | 'detail' | 'edit' | 'add'>('list');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Contact>>({});

  useEffect(() => {
    const saved = localStorage.getItem('ios_contacts');
    if (saved) {
      try {
        setContacts(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse contacts', e);
      }
    } else {
      // Add some dummy contacts if empty
      const initialContacts: Contact[] = [
        { id: '1', firstName: 'John', lastName: 'Appleseed', phone: '(555) 123-4567', email: 'john@apple.com', notes: '', color: 'bg-blue-500' },
        { id: '2', firstName: 'Jane', lastName: 'Doe', phone: '(555) 987-6543', email: 'jane@example.com', notes: '', color: 'bg-pink-500' },
      ];
      setContacts(initialContacts);
      localStorage.setItem('ios_contacts', JSON.stringify(initialContacts));
    }
  }, []);

  const saveContacts = (newContacts: Contact[]) => {
    setContacts(newContacts);
    localStorage.setItem('ios_contacts', JSON.stringify(newContacts));
  };

  const filteredContacts = contacts
    .filter(c => 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
    )
    .sort((a, b) => a.firstName.localeCompare(b.firstName));

  // Group by first letter
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const letter = contact.firstName.charAt(0).toUpperCase() || '#';
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const handleSaveContact = () => {
    if (!formData.firstName && !formData.lastName) return;

    if (view === 'add') {
      const newContact: Contact = {
        id: Date.now().toString(),
        firstName: formData.firstName || '',
        lastName: formData.lastName || '',
        phone: formData.phone || '',
        email: formData.email || '',
        notes: formData.notes || '',
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
      saveContacts([...contacts, newContact]);
      setSelectedContact(newContact);
      setView('detail');
    } else if (view === 'edit' && selectedContact) {
      const updatedContact = { ...selectedContact, ...formData } as Contact;
      saveContacts(contacts.map(c => c.id === selectedContact.id ? updatedContact : c));
      setSelectedContact(updatedContact);
      setView('detail');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this contact?')) {
      saveContacts(contacts.filter(c => c.id !== id));
      setView('list');
      setSelectedContact(null);
    }
  };

  const renderList = () => (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-black text-white"
    >
      <div className="pt-12 pb-4 px-4 flex justify-between items-center">
        <button onClick={onBack} className="text-blue-500 flex items-center text-lg">
          <ChevronLeft className="w-6 h-6" /> Lists
        </button>
        <button 
          onClick={() => {
            setFormData({ firstName: '', lastName: '', phone: '', email: '', notes: '' });
            setView('add');
          }} 
          className="text-blue-500"
        >
          <Plus className="w-7 h-7" />
        </button>
      </div>
      
      <div className="px-4 pb-2">
        <h1 className="text-3xl font-bold mb-4">Contacts</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 text-white rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {Object.keys(groupedContacts).sort().map(letter => (
          <div key={letter} className="mb-4">
            <div className="text-gray-400 font-bold text-sm mb-2 px-2">{letter}</div>
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              {groupedContacts[letter].map((contact, index) => (
                <div key={contact.id}>
                  <button 
                    onClick={() => {
                      setSelectedContact(contact);
                      setView('detail');
                    }}
                    className="w-full text-left px-4 py-3 flex items-center active:bg-gray-800 transition-colors"
                  >
                    <span className="font-semibold">{contact.firstName}</span>
                    <span className="ml-1">{contact.lastName}</span>
                  </button>
                  {index < groupedContacts[letter].length - 1 && (
                    <div className="h-[1px] bg-gray-800 ml-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No Contacts
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderDetail = () => {
    if (!selectedContact) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="flex flex-col h-full bg-[#f2f2f7] dark:bg-black text-black dark:text-white"
      >
        <div className="pt-12 pb-4 px-4 flex justify-between items-center">
          <button onClick={() => setView('list')} className="text-blue-500 flex items-center text-lg">
            <ChevronLeft className="w-6 h-6" /> Contacts
          </button>
          <button 
            onClick={() => {
              setFormData(selectedContact);
              setView('edit');
            }} 
            className="text-blue-500 font-medium text-lg"
          >
            Edit
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-8">
          <div className="flex flex-col items-center pt-6 pb-8">
            <div className={`w-24 h-24 rounded-full ${selectedContact.color} flex items-center justify-center text-white text-4xl font-medium mb-4 shadow-sm`}>
              {selectedContact.firstName.charAt(0)}{selectedContact.lastName.charAt(0)}
            </div>
            <h2 className="text-2xl font-medium">
              {selectedContact.firstName} {selectedContact.lastName}
            </h2>
          </div>

          <div className="px-4 flex justify-between gap-2 mb-6">
            <button className="flex-1 bg-white dark:bg-gray-900 rounded-xl py-3 flex flex-col items-center gap-1 text-blue-500 shadow-sm">
              <MessageSquare className="w-5 h-5" />
              <span className="text-xs font-medium">message</span>
            </button>
            <button className="flex-1 bg-white dark:bg-gray-900 rounded-xl py-3 flex flex-col items-center gap-1 text-blue-500 shadow-sm">
              <Phone className="w-5 h-5" />
              <span className="text-xs font-medium">call</span>
            </button>
            <button className="flex-1 bg-white dark:bg-gray-900 rounded-xl py-3 flex flex-col items-center gap-1 text-blue-500 shadow-sm">
              <Video className="w-5 h-5" />
              <span className="text-xs font-medium">video</span>
            </button>
            <button className="flex-1 bg-white dark:bg-gray-900 rounded-xl py-3 flex flex-col items-center gap-1 text-blue-500 shadow-sm">
              <Mail className="w-5 h-5" />
              <span className="text-xs font-medium">mail</span>
            </button>
          </div>

          <div className="px-4 space-y-4">
            {selectedContact.phone && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">mobile</div>
                <div className="text-blue-500 text-lg">{selectedContact.phone}</div>
              </div>
            )}
            
            {selectedContact.email && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">email</div>
                <div className="text-blue-500 text-lg">{selectedContact.email}</div>
              </div>
            )}

            {selectedContact.notes && (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">notes</div>
                <div className="text-lg">{selectedContact.notes}</div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm mt-8">
              <button className="w-full text-left p-4 text-blue-500 border-b border-gray-100 dark:border-gray-800">
                Share Contact
              </button>
              <button className="w-full text-left p-4 text-blue-500 border-b border-gray-100 dark:border-gray-800">
                Add to Favorites
              </button>
              <button className="w-full text-left p-4 text-red-500">
                Block this Caller
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderForm = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-full bg-[#f2f2f7] dark:bg-black text-black dark:text-white"
    >
      <div className="pt-12 pb-4 px-4 flex justify-between items-center bg-[#f2f2f7] dark:bg-black z-10">
        <button 
          onClick={() => setView(view === 'edit' ? 'detail' : 'list')} 
          className="text-blue-500 text-lg"
        >
          Cancel
        </button>
        <div className="font-semibold text-lg">
          {view === 'add' ? 'New Contact' : 'Edit Contact'}
        </div>
        <button 
          onClick={handleSaveContact} 
          disabled={!formData.firstName && !formData.lastName}
          className="text-blue-500 font-semibold text-lg disabled:opacity-50"
        >
          Done
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col items-center pt-6 pb-8">
          <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 mb-2">
            <User className="w-12 h-12" />
          </div>
          <button className="text-blue-500 text-sm">Add Photo</button>
        </div>

        <div className="bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
          <input 
            type="text" 
            placeholder="First name" 
            value={formData.firstName || ''}
            onChange={e => setFormData({...formData, firstName: e.target.value})}
            className="w-full p-4 bg-transparent border-b border-gray-200 dark:border-gray-800 focus:outline-none"
          />
          <input 
            type="text" 
            placeholder="Last name" 
            value={formData.lastName || ''}
            onChange={e => setFormData({...formData, lastName: e.target.value})}
            className="w-full p-4 bg-transparent focus:outline-none"
          />
        </div>

        <div className="mt-8 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
          <div className="flex items-center border-b border-gray-200 dark:border-gray-800">
            <div className="w-24 pl-4 text-blue-500">mobile</div>
            <input 
              type="tel" 
              placeholder="Phone" 
              value={formData.phone || ''}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="flex-1 p-4 bg-transparent focus:outline-none"
            />
          </div>
          <div className="flex items-center">
            <div className="w-24 pl-4 text-blue-500">email</div>
            <input 
              type="email" 
              placeholder="Email" 
              value={formData.email || ''}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="flex-1 p-4 bg-transparent focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-8 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
          <textarea 
            placeholder="Notes" 
            value={formData.notes || ''}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            className="w-full p-4 bg-transparent focus:outline-none min-h-[100px] resize-none"
          />
        </div>

        {view === 'edit' && selectedContact && (
          <div className="mt-8 bg-white dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
            <button 
              onClick={() => handleDelete(selectedContact.id)}
              className="w-full p-4 text-left text-red-500 font-medium"
            >
              Delete Contact
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="h-full w-full bg-black overflow-hidden relative">
      <AnimatePresence mode="wait">
        {view === 'list' && <motion.div key="list" className="h-full">{renderList()}</motion.div>}
        {view === 'detail' && <motion.div key="detail" className="h-full">{renderDetail()}</motion.div>}
        {(view === 'add' || view === 'edit') && <motion.div key="form" className="h-full">{renderForm()}</motion.div>}
      </AnimatePresence>
    </div>
  );
}
