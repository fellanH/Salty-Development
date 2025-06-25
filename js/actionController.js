// =============================================================================
// ACTION CONTROLLER MODULE
// =============================================================================

import { Config } from './config.js';
import { AppState } from './appState.js';
import { Utils } from './utils.js';
// We use window.MapController and window.UIController to avoid circular dependencies
// These should be set on the window object in your main app entry point.

export const ActionController = {
  /**
   * Executes a named action sequence from the configuration.
   * @param {string} actionName - The key from Config.EVENT_ACTIONS (e.g., 'selectBeach').
   * @param {object} context - An object containing relevant data, like the clicked 'feature'.
   */
  execute(actionName, context = {}) {
    const actionConfig = Config.EVENT_ACTIONS[actionName];

    if (!actionConfig || !actionConfig.actions) {
      console.warn(`[ActionController] No action configured for '${actionName}'.`);
      return;
    }

    console.log(`[ActionController] Executing action: '${actionName}'`, context);

    actionConfig.actions.forEach(action => {
      this.runAction(action, context);
    });
  },

  /**
   * Runs a single action from a sequence.
   * @param {object} action - The action object from the config.
   * @param {object} context - The context for this execution.
   */
  runAction(action, context) {
    const { feature } = context;

    switch (action.type) {
      case 'FLY_TO':
        if (feature && feature.geometry) {
          window.MapController.flyTo(feature.geometry.coordinates, action.zoomLevel, action.speed);
        }
        break;

        case 'selectState':
        if (feature && feature.geometry) {
          window.MapController.flyTo(feature.geometry.coordinates, action.zoomLevel, action.speed);
        }
        break;

      case 'FLY_TO_DEFAULT_POSITION':
        const position = Utils.isMobileView() ? Config.MAP.MOBILE_START_POSITION : Config.MAP.DESKTOP_START_POSITION;
        const zoom = Config.MAP.DEFAULT_ZOOM;
        window.MapController.flyTo(position, zoom);
        break;

      case 'UPDATE_APP_STATE':
        if (feature) {
          const entityType = context.entityType; // Assumes entityType is passed in context
          const entityId = feature.properties['Item ID'] || feature.properties.id || feature.properties.NAME;
          AppState.setSelection(entityType, entityId, feature);
        }
        break;

      case 'SHOW_SIDEBAR':
        window.UIController.showSidebar(action.sidebar);
        break;

      case 'SHOW_POPUP':
        if (feature) {
          setTimeout(() => window.MapController.showPopup(feature), action.delay || 0);
        }
        break;
        
      case 'TOGGLE_FULLSCREEN':
          window.UIController.toggleFullscreen();
          break;

      default:
        console.warn(`[ActionController] Unknown action type: '${action.type}'`);
    }
  }
}; 