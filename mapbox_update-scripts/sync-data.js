require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

// --- CONFIGURATION ---
const WEBFLOW_API_KEY = process.env.WEBFLOW_API_KEY;
const MAPBOX_SECRET_TOKEN = process.env.MAPBOX_SECRET_TOKEN;

const WEBFLOW_COLLECTION_ID = '6786e26d4438e40d5e56c085';
const MAPBOX_TILESET_ID = 'felixhellstrom.salty-beaches'; // e.g., username.tileset-name
const GEOJSON_FILE_PATH = './beaches-latest.geojson';
const TILESET_SOURCE_NAME = 'salty-beaches-source';

// --- MAIN FUNCTION ---
async function syncData() {
    if (!WEBFLOW_API_KEY || !MAPBOX_SECRET_TOKEN) {
        console.error('Error: Required API keys (WEBFLOW_API_KEY, MAPBOX_SECRET_TOKEN) are not set in the .env file.');
        return;
    }

    try {
        console.log('1. Fetching data from Webflow...');
        const items = await fetchWebflowData();
        
        console.log('2. Formatting data to GeoJSON...');
        const geojson = formatToGeoJSON(items);
        
        console.log('3. Saving GeoJSON to file...');
        fs.writeFileSync(GEOJSON_FILE_PATH, JSON.stringify(geojson, null, 2));
        console.log(`   Saved to ${GEOJSON_FILE_PATH}`);
        
        console.log('4. Uploading to Mapbox...');
        await uploadToMapbox();
        
        console.log('\n✅ Sync complete!');

    } catch (error) {
        console.error('\n❌ Sync failed:', error.message);
        if (error.response) {
            console.error('   Details:', error.response.data);
        }
    }
}

// --- HELPER FUNCTIONS ---

async function fetchWebflowData() {
    const url = `https://api.webflow.com/v2/collections/${WEBFLOW_COLLECTION_ID}/items`;
    const options = {
        headers: {
            'accept': 'application/json',
            'authorization': `Bearer ${WEBFLOW_API_KEY}`
        }
    };
    const { data } = await axios.get(url, options);
    return data.items;
}

function formatToGeoJSON(items) {
    const features = items.map(item => {
        const { fieldData } = item;
        
        // IMPORTANT: Adjust these keys to match your Webflow collection field slugs
        const lat = fieldData.latitude;
        const lon = fieldData.longitude;
        
        if (typeof lat !== 'number' || typeof lon !== 'number') {
            console.warn(`   - Skipping item "${fieldData.name}" due to missing or invalid coordinates.`);
            return null;
        }

        return {
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [lon, lat]
            },
            properties: {
                // Map all fieldData to properties, excluding lat/lon if desired
                ...fieldData
            }
        };
    }).filter(Boolean); // Filter out any null (skipped) items

    return {
        type: 'FeatureCollection',
        features: features
    };
}

async function uploadToMapbox() {
    const tilesetsCLIPath = '/Users/felixmylovr/Library/Python/3.9/bin/tilesets';

    // Step 1: Upload the GeoJSON to a tileset source
    console.log('   - Uploading source...');
    execSync(
        `export MAPBOX_ACCESS_TOKEN=${MAPBOX_SECRET_TOKEN} && \\
         ${tilesetsCLIPath} upload-source felixhellstrom ${TILESET_SOURCE_NAME} ${GEOJSON_FILE_PATH} --replace`
    );

    // Step 2: Create a recipe to define how the source becomes a tileset
    const recipe = {
        version: 1,
        layers: {
            'salty-beaches': {
                source: `mapbox://tileset-source/felixhellstrom/${TILESET_SOURCE_NAME}`,
                minzoom: 0,
                maxzoom: 14,
                tiles: {
                  // This is the correct way to enable clustering
                  union: [
                    {
                      cluster: true,
                      group_by: ["State"], // Group by state before clustering
                      // Creates a 'count' property for each cluster and keeps the State name
                      aggregate: { 
                        "count": "sum",
                        "State": "arbitrary"
                      }
                    }
                  ]
                },
                // We need to add a 'count' attribute to each individual point
                features: {
                  attributes: {
                    set: { "count": 1 }
                  }
                }
            }
        }
    };
    const recipePath = './recipe.json';
    fs.writeFileSync(recipePath, JSON.stringify(recipe, null, 2));
    console.log('   - Recipe created at recipe.json');

    // Step 3: Check if the tileset already exists and create or update accordingly.
    console.log('   - Checking if tileset exists...');
    const listCommand = `export MAPBOX_ACCESS_TOKEN=${MAPBOX_SECRET_TOKEN} && ${tilesetsCLIPath} list felixhellstrom`;
    const tilesetList = execSync(listCommand).toString();

    if (tilesetList.includes(MAPBOX_TILESET_ID)) {
        // If it exists, update the recipe.
        console.log('   - Tileset exists. Updating recipe...');
        execSync(
            `export MAPBOX_ACCESS_TOKEN=${MAPBOX_SECRET_TOKEN} && \\
             ${tilesetsCLIPath} update-recipe ${MAPBOX_TILESET_ID} ${recipePath}`
        );
    } else {
        // If it doesn't exist, create it.
        console.log('   - Tileset does not exist. Creating...');
        execSync(
            `export MAPBOX_ACCESS_TOKEN=${MAPBOX_SECRET_TOKEN} && \\
             ${tilesetsCLIPath} create ${MAPBOX_TILESET_ID} --recipe ${recipePath} --name "Salty Beaches"`
        );
    }

    // Step 4: Publish the tileset to process the changes.
    console.log('   - Publishing tileset...');
    execSync(
        `export MAPBOX_ACCESS_TOKEN=${MAPBOX_SECRET_TOKEN} && \\
         ${tilesetsCLIPath} publish ${MAPBOX_TILESET_ID}`
    );
}


// --- RUN THE SCRIPT ---
syncData(); 