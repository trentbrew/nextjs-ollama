'use client';

import SettingsView from '@/components/views/settings-view';
import { MainLayout } from '@/components/main-layout';

export default function SettingsPage() {
  return (
    <MainLayout sidebarContext="settings">
      <SettingsView />
    </MainLayout>
  );
}
