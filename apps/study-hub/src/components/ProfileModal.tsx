import React, { useState } from 'react';
import { saveStoredStudentProfile } from '../lib/storage';
import { Button, Field, Input, Modal } from './ui';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Student';
    const finalProgram = program.trim() || 'College Program';
    saveStoredStudentProfile(finalName, finalProgram);
    onUpdateProfile(finalName, finalProgram);
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Edit profile"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="profile-form">
            Save
          </Button>
        </>
      }
    >
      <form id="profile-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name" htmlFor="profile-name">
          <Input
            id="profile-name"
            required
            autoFocus
            data-autofocus
            placeholder="e.g. Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Program" htmlFor="profile-program">
          <Input
            id="profile-program"
            placeholder="e.g. BS Computer Science"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
          />
        </Field>
      </form>
    </Modal>
  );
};
