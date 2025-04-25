'use client';

import { useState, FormEvent } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';

export default function NotesPage() {
  const notes = useQuery(api.notes.list);
  const addNote = useMutation(api.notes.create);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title || !content) return;
    await addNote({ title, content });
    setTitle('');
    setContent('');
  };

  return (
    <div className="p-6 h-full">
      <h1 className="text-2xl font-semibold mb-4">Notes</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          className="w-full border p-2 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full border p-2 rounded"
          placeholder="Content"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded"
        >
          Add Note
        </button>
      </form>
      <ul className="space-y-4">
        {notes?.map((note) => (
          <li key={note.id} className="border rounded p-4">
            <div className="flex justify-between mb-2">
              <span className="font-medium truncate">{note.title}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(note.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="whitespace-pre-wrap">{note.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
