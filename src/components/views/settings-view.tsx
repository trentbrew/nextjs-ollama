'use client'; // SettingsView likely needs client components

import React from 'react';
import { SettingsForm } from '@/components/settings/settings-form';
// Assuming SettingsForm doesn't need MainLayout, but if it does, wrap it here.

export default function SettingsView() {
  // TODO: Add any necessary layout/providers specific to settings if needed
  return (
    // Replicate structure from src/app/settings/page.tsx
    <div className="p-6 h-full">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <SettingsForm />
    </div>
  );
}
