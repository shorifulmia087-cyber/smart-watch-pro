import { useEffect } from 'react';

export const useAntiScraping = () => {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable text selection via keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+A, Ctrl+C, Ctrl+U, Ctrl+S, F12
      if (
        (e.ctrlKey && ['a', 'c', 'u', 's'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable drag
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    // Add CSS to disable text selection
    const style = document.createElement('style');
    style.id = 'anti-scraping-styles';
    style.textContent = `
      body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; }
      input, textarea, [contenteditable] { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
      const el = document.getElementById('anti-scraping-styles');
      if (el) el.remove();
    };
  }, []);
};
