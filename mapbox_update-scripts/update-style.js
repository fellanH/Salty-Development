require('dotenv').config();
const axios = require('axios');

// --- CONFIGURATION ---
const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_SECRET_TOKEN;
const MAPBOX_USERNAME = 'felixhellstrom';
const STYLE_ID = 'cmbzckn7401e701s5fbtf27ez';
const TARGET_TILESET_URL = `mapbox://${MAPBOX_USERNAME}.salty-beaches`;

// --- MAIN FUNCTION ---
async function updateStyle() {
    if (!MAPBOX_SECRET_TOKEN) {
        console.error('Error: MAPBOX_SECRET_TOKEN is not set in the .env file.');
        return;
    }

    const API_BASE_URL = `https://api.mapbox.com/styles/v1/${MAPBOX_USERNAME}/${STYLE_ID}`;
    const params = { access_token: MAPBOX_SECRET_TOKEN };

    try {
        console.log('1. Fetching current map style...');
        const { data: currentStyle } = await axios.get(API_BASE_URL, { params });
        console.log(`   - Fetched style "${currentStyle.name}"`);

        console.log('2. Finding or creating the correct source...');
        let sourceId = null;
        const desiredSourceId = 'salty-beaches'; // The desired name for our source

        // First, check if a source already exists for our tileset URL
        for (const [id, source] of Object.entries(currentStyle.sources)) {
            if (source.url === TARGET_TILESET_URL) {
                sourceId = id;
                break;
            }
        }

        if (sourceId) {
            console.log(`   - Found source "${sourceId}" for your tileset.`);
        } else {
            // If no source exists for that URL, we'll add it.
            sourceId = desiredSourceId;
            currentStyle.sources[sourceId] = {
                type: 'vector',
                url: TARGET_TILESET_URL
            };
            console.log(`   - Source not found. Added new source: "${sourceId}".`);
        }

        // --- Modify the style layers ---
        console.log('3. Modifying style layers...');

        // Layer definitions using the dynamically found sourceId
        const CLUSTER_LAYER = {
            "id": "salty-beaches-clusters",
            "type": "circle",
            "source-layer": "salty-beaches",
            "filter": ["has", "point_count"],
            "paint": {
                "circle-color": ["step", ["get", "point_count"], "#51bbd6", 100, "#f1f075", 750, "#f28cb1"],
                "circle-radius": ["step", ["get", "point_count"], 20, 100, 30, 750, 40]
            }
        };

        const COUNT_LAYER = {
            "id": "salty-beaches-cluster-count",
            "type": "symbol",
            "source-layer": "salty-beaches",
            "filter": ["has", "point_count"],
            "layout": {
                "text-field": "{point_count_abbreviated}",
                "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                "text-size": 12
            }
        };

        const UNCLUSTERED_LAYER = {
            "id": "salty-beaches-unclustered",
            "type": "symbol",
            "source-layer": "salty-beaches",
            "filter": ["!", ["has", "point_count"]],
            "layout": {
                "icon-image": "beach-icon-24",
                "icon-size": 1,
                "icon-allow-overlap": true
            }
        };
        
        // Aggressively remove any layers that use the target source or are named similarly.
        // This ensures a clean slate and prevents duplicate layers.
        console.log(`   - Removing any existing layers associated with source "${sourceId}"...`);
        const originalLayerCount = currentStyle.layers.length;
        currentStyle.layers = currentStyle.layers.filter(layer => layer.source !== sourceId);
        const removedCount = originalLayerCount - currentStyle.layers.length;
        console.log(`   - Removed ${removedCount} old layer(s).`);

        // Add the new, correctly-sourced layers
        currentStyle.layers.push(
            { ...CLUSTER_LAYER, source: sourceId },
            { ...COUNT_LAYER, source: sourceId },
            { ...UNCLUSTERED_LAYER, source: sourceId }
        );
        console.log('   - Added 3 new layers referencing the existing source.');

        // --- Update the style on Mapbox ---
        console.log('4. Uploading modified style...');
        await axios.patch(API_BASE_URL, currentStyle, { params });
        
        console.log('\n✅ Style update complete!');
        console.log(`   View your updated style at: https://studio.mapbox.com/styles/${MAPBOX_USERNAME}/${STYLE_ID}/edit/`);

    } catch (error) {
        console.error('\n❌ Style update failed:');
        if (error.response) {
            console.error(`   - Status: ${error.response.status} ${error.response.statusText}`);
            console.error('   - Details:', error.response.data.message || error.response.data);
        } else {
            console.error('   - Error:', error.message);
        }
    }
}

// --- RUN THE SCRIPT ---
updateStyle(); 