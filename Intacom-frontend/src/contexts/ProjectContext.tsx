import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Project } from '../types/project';

interface ProjectContextType {
  projects: Project[];
  createProject: (name: string, description: string) => Promise<void>;
  shareProject: (projectId: string, users: string[]) => Promise<void>;
  addAnnouncement: (projectId: string, content: string, media?: string) => Promise<void>;
  addTask: (projectId: string, title: string, assignee: string, dueDate: string,