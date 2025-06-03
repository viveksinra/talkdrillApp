import { useEffect, useRef } from 'react';

export const useMemoryManagement = () => {
  const memoryCleanupRef = useRef<(() => void)[]>([]);

  const addCleanupTask = (task: () => void) => {
    memoryCleanupRef.current.push(task);
  };

  useEffect(() => {
    return () => {
      // Cleanup all registered tasks
      memoryCleanupRef.current.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn('Error during memory cleanup:', error);
        }
      });
      memoryCleanupRef.current = [];
    };
  }, []);

  return { addCleanupTask };
}; 