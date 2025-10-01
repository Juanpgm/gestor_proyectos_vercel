"use client";

import React, { useState, createContext, useContext } from 'react';
import { CSS_UTILS, CATEGORIES } from '@/lib/design-system';

// Custom Tabs Components with Context to avoid setState during render
const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
} | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

export const Tabs = ({ children, defaultValue, className = "" }: {
  children: React.ReactNode;
  defaultValue: string;
  className?: string;
}) => {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <section className={`w-full ${className}`} data-active-tab={activeTab}>
        {children}
      </section>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
}) => (
  <nav className={`flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg mb-4 ${className}`}>
    {children}
  </nav>
);

export const TabsTrigger = ({ children, value, className = "" }: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;
  
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive 
          ? `${CATEGORIES.projects.className.button}` 
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ children, value, className = "" }: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => {
  const { activeTab } = useTabsContext();
  if (activeTab !== value) return null;
  return <article className={className}>{children}</article>;
};