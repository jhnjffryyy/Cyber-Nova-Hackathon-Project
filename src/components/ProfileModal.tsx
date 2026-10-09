import React, { useState } from 'react';
import { X, User, Check, GraduationCap } from 'lucide-react';
import { saveStoredStudentProfile } from '../lib/storage';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  programName: string;
  onUpdateProfile: (name: string, program: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  studentName,
  programName,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(studentName);
  const [program, setProgram] = useState(programName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Student';
    const finalProgram = program.trim() || 'College Program';
    saveStoredStudentProfile(finalName, finalProgram);
    onUpdateProfile(finalName, finalProgram);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-gray-200">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-700" />
            <h3 className="text-base font-black text-gray-900">Student Profile</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Your Name</label>
            <input
              type="text"
              required
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">Degree / College Program</label>
            <input
              type="text"
              placeholder="e.g. BS Computer Science, Nursing, Engineering..."
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
