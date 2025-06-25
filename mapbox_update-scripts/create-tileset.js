const axios = require('axios');
const fs = require('fs');

async function createTileset() {
    const recipe = JSON.parse(fs.readFileSync('.?mapbox_update-scripts/recipe.json', 'utf8'));
    await axios.post(
      `https://api.mapbox.com/tilesets/v1/cmc0yitcn440i1om6ca9lsu0p?access_token=sk.eyJ1IjoiZmVsaXhoZWxsc3Ryb20iLCJhIjoiY21jMGI0cTRtMDBjbjJxczY1eDg2b3ZzciJ9.5qYhYUlUfAIdCWbGFf32lQ`,
      recipe,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
}

createTileset();