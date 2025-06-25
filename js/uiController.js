// =============================================================================
// UI CONTROLLER MODULE
// =============================================================================

import { Config } from './config.js';
import { Utils } from './utils.js';
import { MockAPI } from './mockAPI.js';
import { AppState } from './appState.js';
import { MapController } from './mapController.js';
import { NavigationController } from './navigationController.js';
import { ActionController } from './actionController.js';

export const UIController = {
  // Cache DOM elements
  elements: {},

  /**
   * Initialize UI controller and cache DOM elements
   */
  init() {
    console.log('[UIController] init');
    this.cacheElements();
    this.setupEventListeners();
    this.setupSidebarObserver();
    this.updateResponsiveLayout();
    
    // Setup resize handler
    window.addEventListener('resize', Utils.debounce(() => {
      console.log('[UIController] window resize');
      this.updateResponsiveLayout();
    }, 250));
  },

  /**
   * Cache frequently used DOM elements
   */
  cacheElements() {
    console.log('[UIController] cacheElements');
    Object.entries(Config.SELECTORS).forEach(([key, selector]) => {
      const element = document.querySelector(selector);
      if (element) {
        this.elements[key] = element;
        console.log(`[UIController] Cached element: ${key} (${selector})`);
      } else {
        console.warn(`[UIController] Element not found: ${selector}`);
      }
    });
  },

  /**
   * Setup event listeners for UI interactions
   */
  setupEventListeners() {
    console.log('[UIController] setupEventListeners');
    
    // Use a generic handler for all elements with a data-action attribute
    document.body.addEventListener('click', (e) => {
        const target = e.target.closest('[data-action]');
        if (!target) return;

        e.preventDefault();
        const actionName = target.dataset.action;
        if (actionName) {
            console.log(`[UIController] Action triggered: ${actionName}`);
            ActionController.execute(actionName);
        }
    });

    // You will now need to add `data-action` attributes to your HTML elements, for example:
    // <button data-action="navigateHome">Home</button>
    // <button data-action="backToList" class="modal_back-button">Back</button>
    // <button data-action="closeDetailAndReset" class="modal_close-button">Close</button>
  },

  /**
   * Observes sidebar elements for style changes (e.g., from Webflow interactions)
   * and keeps the application state in sync.
   */
  setupSidebarObserver() {
    const observer = new MutationObserver(this.handleSidebarMutation.bind(this));
    const config = { attributes: true, attributeFilter: ['style'] };

    const sidebarsToObserve = [
      this.elements.SIDEBAR_HOME,
      this.elements.SIDEBAR_BEACH_LIST,
      this.elements.SIDEBAR_BEACH
    ];

    sidebarsToObserve.forEach(sidebar => {
      if (sidebar) {
        observer.observe(sidebar, config);
      }
    });
  },

  /**
   * Handles mutations to the sidebar elements.
   */
  handleSidebarMutation() {
    let newSidebar = null;

    // Determine which sidebar is currently displayed
    if (this.elements.SIDEBAR_BEACH && this.elements.SIDEBAR_BEACH.style.display === 'block') {
      newSidebar = 'detail';
    } else if (this.elements.SIDEBAR_BEACH_LIST && this.elements.SIDEBAR_BEACH_LIST.style.display === 'block') {
      newSidebar = 'list';
    } else if (this.elements.SIDEBAR_HOME && this.elements.SIDEBAR_HOME.style.display === 'block') {
      newSidebar = 'home';
    }

    // If the visible sidebar has changed, update the app state
    if (newSidebar && newSidebar !== AppState.ui.currentSidebar) {
      console.log(`[UIController] Sidebar state synced by observer to: ${newSidebar}`);
      AppState.updateUI({ currentSidebar: newSidebar });

      // If the list view becomes active, refresh its content to match the map
      if (newSidebar === 'list') {
        MapController.updateSidebarListFromMap();
      }
    }
  },

  /**
   * Update layout based on screen size
   */
  updateResponsiveLayout() {
    console.log('[UIController] updateResponsiveLayout');
    const isMobile = Utils.isMobileView();
    AppState.updateUI({ isMobile });

    if (isMobile) {
      this.showSidebar('home');
      this.hideMap();
    } else {
      this.showSidebar('home');
      this.showMap();
    }
  },

  /**
   * Show specific sidebar panel
   * @param {string} type - 'home', 'list', or 'detail'
   */
  showSidebar(type) {
    console.log(`[UIController] showSidebar: ${type}`);
    AppState.updateUI({ currentSidebar: type });

    // Hide all sidebar panels
    if (this.elements.SIDEBAR_HOME) this.elements.SIDEBAR_HOME.style.display = 'none';
    if (this.elements.SIDEBAR_BEACH_LIST) this.elements.SIDEBAR_BEACH_LIST.style.display = 'none';
    if (this.elements.SIDEBAR_BEACH) this.elements.SIDEBAR_BEACH.style.display = 'none';

    // Show requested panel
    switch (type) {
      case 'home':
        if (this.elements.SIDEBAR_HOME) this.elements.SIDEBAR_HOME.style.display = 'block';
        break;
      case 'list':
        if (this.elements.SIDEBAR_BEACH_LIST) this.elements.SIDEBAR_BEACH_LIST.style.display = 'block';
        break;
      case 'detail':
        if (this.elements.SIDEBAR_BEACH) this.elements.SIDEBAR_BEACH.style.display = 'block';
        break;
    }

    // Show sidebar wrapper
    if (this.elements.SIDEBAR_WRAPPER) {
      this.elements.SIDEBAR_WRAPPER.style.display = 'block';
    }

    // Handle map visibility on mobile
    if (Utils.isMobileView()) {
      this.hideMap();
    } else {
      this.showMap();
    }
  },

  /**
   * Show map
   */
  showMap() {
    console.log('[UIController] showMap');
    if (this.elements.SIDEBAR_MAP) {
      this.elements.SIDEBAR_MAP.style.display = 'block';
    }
  },

  /**
   * Hide map
   */
  hideMap() {
    console.log('[UIController] hideMap');
    if (this.elements.SIDEBAR_MAP) {
      this.elements.SIDEBAR_MAP.style.display = 'none';
    }
  },

  /**
   * Toggle fullscreen mode
   */
  toggleFullscreen() {
    console.log('[UIController] toggleFullscreen');
    if (Utils.isMobileView()) {
      // On mobile, toggle between map and sidebar
      if (this.elements.SIDEBAR_MAP && this.elements.SIDEBAR_MAP.style.display === 'none') {
        this.hideMap();
        this.showSidebar(AppState.ui.currentSidebar);
      } else {
        this.showMap();
        if (this.elements.SIDEBAR_WRAPPER) {
          this.elements.SIDEBAR_WRAPPER.style.display = 'none';
        }
      }
    } else {
      // On desktop, toggle sidebar visibility
      if (this.elements.SIDEBAR_WRAPPER) {
        const isVisible = this.elements.SIDEBAR_WRAPPER.style.display !== 'none';
        this.elements.SIDEBAR_WRAPPER.style.display = isVisible ? 'none' : 'block';
      }
      this.showMap();
    }
  },

  /**
   * Render a list of features (beaches, regions, states) in the sidebar
   * @param {Array} features - An array of GeoJSON features
   * @param {string} type - The type of feature ('beach', 'region', 'state')
   */
  renderFeatureList(features = [], type = 'beach') {
    console.log(`[UIController] renderFeatureList for type: ${type}`, features);
    const listContainer = this.elements.BEACH_LIST_CONTAINER;

    if (!listContainer) {
        console.error('Beach list container not found. Check config selector: BEACH_LIST_CONTAINER');
        return;
    }

    listContainer.innerHTML = '';

    if (features.length === 0) {
      listContainer.innerHTML = 
        '<p style="padding: 20px; text-align: center;">No items in view. Pan or zoom the map to find some.</p>';
      return;
    }
    
    // Sort features before rendering
    const getSortName = (props) => props.Name || props.State || props['Location Cluster'] || '';
    features.sort((a, b) => getSortName(a.properties).localeCompare(getSortName(b.properties)));

    features.forEach(feature => {
      // Deduplicate beaches before rendering
      if (type === 'beach') {
          const beachId = feature.properties['Item ID'];
          const seenIds = new Set();
          if (beachId && !seenIds.has(beachId)) {
              seenIds.add(beachId);
              const listItem = this.createListItem(feature, type);
              listContainer.appendChild(listItem);
          }
      } else {
           const listItem = this.createListItem(feature, type);
           listContainer.appendChild(listItem);
      }
    });
  },

  /**
   * Create a list item by cloning and populating a dedicated template.
   * @param {Object} feature - GeoJSON feature
   * @param {string} type - The type of feature ('beach', 'region', 'state')
   * @returns {HTMLElement} List item element
   */
  createListItem(feature, type) {
    const config = Config.LIST_ITEM_TEMPLATES[type];
    if (!config) {
        console.error(`No template configuration found for type: ${type}`);
        return document.createElement('div'); // Return empty element on error
    }

    const template = document.querySelector(config.templateId);
    if (!template) {
        console.error(`Template element not found for ID: ${config.templateId}`);
        return document.createElement('div'); // Return empty element on error
    }

    const clone = template.content.cloneNode(true);
    const listItem = clone.firstElementChild;
    const properties = feature.properties;

    // Apply data mapping from the config
    for (const selector in config.dataMapping) {
        const el = listItem.querySelector(selector);
        const mapping = config.dataMapping[selector];
        
        if (el) {
            switch (mapping.type) {
                case 'text':
                    el.textContent = mapping.source(properties) || '';
                    break;
                case 'image':
                    el.src = mapping.source(properties);
                    el.alt = properties.Name || 'List item image';
                    break;
                case 'style':
                    Object.assign(el.style, mapping.style);
                    break;
            }
        } else {
             console.warn(`[UIController] Element for selector "${selector}" not found in template "${config.templateId}"`);
        }
    }

    // Attach the unified event listener
    listItem.addEventListener('click', (e) => {
      e.preventDefault();
      NavigationController.handleEntitySelection({ entityType: type, feature });
    });

    return listItem;
  },

  /**
   * Update detail sidebar with current selection
   */
  async updateDetailSidebar() {
    console.log('[UIController] updateDetailSidebar', AppState.currentSelection);
    const { id, type, feature } = AppState.currentSelection;

    if (!id || !feature || !this.elements.SIDEBAR_BEACH) {
      this.showSidebar('list'); // or 'home'
      return;
    }

    // Show the detail sidebar
    this.showSidebar('detail');
    
    // Temporarily use feature properties for details
    const details = feature.properties;
    
    // Show loading state for weather-dependent parts
    // You can implement a more granular loading state later
    
    try {
      const weatherData = await this.fetchWeatherData(id);
      console.log('[UIController] updateDetailSidebar fetched', { details, weatherData });
      this.renderDetailContent(details, weatherData);

    } catch (error) {
      console.error('[UIController] Error updating detail sidebar:', error);
      // Optionally show an error message for the weather part
      this.renderDetailContent(details, null); // Render without weather
    }
  },

  /**
   * Fetch weather data with caching
   * @param {string} locationId - Location ID
   * @returns {Promise} Weather data
   */
  async fetchWeatherData(locationId) {
    console.log('[UIController] fetchWeatherData', locationId);
    // Check cache first
    if (AppState.cache.weatherData.has(locationId)) {
      console.log('[UIController] fetchWeatherData cache hit', locationId);
      return AppState.cache.weatherData.get(locationId);
    }

    // Fetch from API (mock)
    const data = await MockAPI.fetchWeather(locationId);
    console.log('[UIController] fetchWeatherData fetched', data);
    // Cache with expiration (5 minutes)
    AppState.cache.weatherData.set(locationId, data);
    setTimeout(() => {
      AppState.cache.weatherData.delete(locationId);
    }, 5 * 60 * 1000);

    return data;
  },

  /**
   * Render detail sidebar content
   * @param {Object} details - Detail data
   * @param {Object} weather - Weather data
   */
  renderDetailContent(details, weather) {
    console.log('[UIController] renderDetailContent', { details, weather });

    const el = this.elements;

    const getProperty = (obj, keys, defaultVal = '') => {
        for (const key of keys) {
            if (obj[key] !== undefined && obj[key] !== null) {
                return obj[key];
            }
        }
        return defaultVal;
    };

    const safeSetText = (element, text, defaultText = 'N/A') => {
        if (element) {
            element.textContent = text || defaultText;
        }
    };
    
    const safeSetAmenity = (element, text) => {
        if(element && element.children[1]) {
            element.children[1].textContent = text || 'N/A';
        }
    };

    // --- Populate Basic Info ---
    if (el.BEACH_DETAIL_IMAGE) el.BEACH_DETAIL_IMAGE.src = getProperty(details, ['Main Image', 'image', 'imageUrl'], 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=300');
    safeSetText(el.BEACH_DETAIL_TITLE, getProperty(details, ['Name', 'name']), 'Beach Name');
    
    // Address
    const googleMapsLink = getProperty(details, ['Google Maps Link', 'google_maps_link']);
    const formattedAddress = getProperty(details, ['Formatted Address', 'Formatted Adress', 'address']);

    if (el.BEACH_DETAIL_ADDRESS_LINK) el.BEACH_DETAIL_ADDRESS_LINK.href = googleMapsLink || '#';
    safeSetText(el.BEACH_DETAIL_ADDRESS_TEXT, formattedAddress, 'Address not available');
    
    // Website
    const website = getProperty(details, ['Beach website', 'website']);
    if (el.BEACH_DETAIL_WEBSITE_LINK) {
        el.BEACH_DETAIL_WEBSITE_LINK.href = website || '#';
        if (el.BEACH_DETAIL_WEBSITE_LINK.parentElement) {
            el.BEACH_DETAIL_WEBSITE_LINK.parentElement.style.display = website ? 'flex' : 'none';
        }
    }
    safeSetText(el.BEACH_DETAIL_WEBSITE_TEXT, website, '');
    
    // --- Populate Amenities (Land) ---
    safeSetAmenity(el.BEACH_DETAIL_RESTROOMS, details.Restrooms);
    safeSetAmenity(el.BEACH_DETAIL_SHOWERS, details.Showers);
    safeSetAmenity(el.BEACH_DETAIL_PETS, details.Pets);
    safeSetAmenity(el.BEACH_DETAIL_PARKING, details['Parking lot nearby']);
    safeSetAmenity(el.BEACH_DETAIL_CAMPING, details.Camping);

    // --- Populate Weather Data ---
    if (weather) {
        if(el.WEATHER_AIR_TEMP && el.WEATHER_AIR_TEMP.children[1] && el.WEATHER_AIR_TEMP.children[1].children[0]) el.WEATHER_AIR_TEMP.children[1].children[0].textContent = Math.round(weather.temperature);
        if(el.WEATHER_FEELS_LIKE && el.WEATHER_FEELS_LIKE.children[1]) el.WEATHER_FEELS_LIKE.children[1].textContent = `${Math.round(weather.feels_like)}°F`;
        if(el.WEATHER_HUMIDITY && el.WEATHER_HUMIDITY.children[1]) el.WEATHER_HUMIDITY.children[1].textContent = `${weather.humidity}%`;
        if(el.WEATHER_WIND && el.WEATHER_WIND.children[1]) el.WEATHER_WIND.children[1].textContent = `${weather.windSpeed} mph`;
        if(el.WEATHER_WIND_DIRECTION && el.WEATHER_WIND_DIRECTION.children[1]) el.WEATHER_WIND_DIRECTION.children[1].textContent = `${weather.windDirection}°`;
        if(el.WEATHER_AQI && el.WEATHER_AQI.children[1]) el.WEATHER_AQI.children[1].textContent = weather.aqi;
        if(el.WEATHER_RAINFALL && el.WEATHER_RAINFALL.children[1]) el.WEATHER_RAINFALL.children[1].textContent = `${weather.rainfall} in`;
        if(el.WEATHER_PRESSURE && el.WEATHER_PRESSURE.children[1]) el.WEATHER_PRESSURE.children[1].textContent = `${weather.pressure} inHg`;
        if(el.WEATHER_PM25 && el.WEATHER_PM25.children[1]) el.WEATHER_PM25.children[1].textContent = `${weather.pm25} µg/m³`;
        if(el.WEATHER_PM10 && el.WEATHER_PM10.children[1]) el.WEATHER_PM10.children[1].textContent = `${weather.pm10} µg/m³`;
        if(el.WEATHER_WATER_TEMP && el.WEATHER_WATER_TEMP.children[1]) el.WEATHER_WATER_TEMP.children[1].textContent = `${Math.round(weather.water_temp)}°F`;
        if(el.WEATHER_WAVE_HEIGHT && el.WEATHER_WAVE_HEIGHT.children[1]) el.WEATHER_WAVE_HEIGHT.children[1].textContent = `${weather.wave_height} ft`;
        if(el.WEATHER_OCEAN_CURRENT && el.WEATHER_OCEAN_CURRENT.children[1]) el.WEATHER_OCEAN_CURRENT.children[1].textContent = weather.ocean_current || 'N/A';
        if(el.WEATHER_UV_INDEX && el.WEATHER_UV_INDEX.children[1] && el.WEATHER_UV_INDEX.children[1].children[0]) el.WEATHER_UV_INDEX.children[1].children[0].textContent = weather.uv_index;
        if(el.WEATHER_CLOUD_COVER && el.WEATHER_CLOUD_COVER.children[1]) el.WEATHER_CLOUD_COVER.children[1].textContent = `${weather.cloud_cover}%`;
        if(el.WEATHER_SUNSET && el.WEATHER_SUNSET.children[1]) el.WEATHER_SUNSET.children[1].textContent = new Date(weather.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        // Hide or show 'data not available' for weather fields
        console.warn("No weather data available to render.");
    }
  },

  /**
   * Hide detail sidebar
   */
  hideDetailSidebar() {
    console.log('[UIController] hideDetailSidebar');
    if (this.elements.DETAIL_SIDEBAR) {
      this.elements.DETAIL_SIDEBAR.classList.add('hidden');
    }
  }
}; 