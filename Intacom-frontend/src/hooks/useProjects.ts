import { useContext } from 'react';
import { ProjectContext } from '../contexts/ProjectContext';

export const useProjects = () => {
  return useContext(ProjectContext);
};