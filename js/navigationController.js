// =============================================================================
// NAVIGATION CONTROLLER MODULE
// =============================================================================

import { Config } from './config.js';
import { AppState } from './appState.js';
import { ActionController } from './actionController.js';
// We are accessing MapController via the global window object to avoid a circular dependency.
// This is a temporary solution until a more robust dependency injection system is in place.
// import { MapController } from './mapController.js'; 

export const NavigationController = {
  /**
   * Handles the selection of any entity by dispatching to the ActionController.
   * @param {object} options
   * @param {string} options.entityType - 'state', 'region', 'beach'.
   * @param {object} options.feature - The GeoJSON feature object.
   */
  handleEntitySelection({ entityType, feature }) {
    if (!feature || !feature.geometry) {
      console.error('[NavigationController] Invalid feature provided.', feature);
      return;
    }

    // Convert entityType to a capitalized string for the action name (e.g., 'state' -> 'selectState')
    const actionName = `select${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`;

    // The context object passes all necessary data to the ActionController
    const context = { feature, entityType };

    ActionController.execute(actionName, context);
  },
}; 