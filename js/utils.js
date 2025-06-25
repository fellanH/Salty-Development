// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

import { Config } from './config.js';

export const Utils = {
  /**
   * Check if current view is mobile
   * @returns {boolean} True if mobile view
   */
  isMobileView() {
    return window.innerWidth <= Config.MAP.MOBILE_BREAKPOINT;
  },

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Show loading state
   * @param {HTMLElement} element - Element to show loading in
   */
  showLoading(element) {
    element.innerHTML = '<div class="loader" style="display: flex; justify-content: center; padding: 20px;">Loading...</div>';
  },

  /**
   * Show error message
   * @param {HTMLElement} element - Element to show error in
   * @param {string} message - Error message
   */
  showError(element, message) {
    element.innerHTML = `<div class="error" style="padding: 20px; text-align: center; color: #d32f2f;">${message}</div>`;
  }
}; 