import csv
import json
import sys

def csv_to_geojson(csv_file_path, geojson_file_path, lat_col, lon_col):
    features = []
    # Use utf-8-sig to handle BOM automatically
    with open(csv_file_path, 'r', encoding='utf-8-sig') as csvfile:
        try:
            reader = csv.DictReader(csvfile)
            # Trim spaces from header names
            reader.fieldnames = [field.strip() for field in reader.fieldnames]
            
            for row in reader:
                try:
                    # Strip whitespace from keys and values
                    row = {k.strip(): v.strip() for k, v in row.items()}
                    
                    lat_str = row.get(lat_col)
                    lon_str = row.get(lon_col)
                    
                    if lat_str is None or lon_str is None:
                        print(f"Warning: Skipping row because latitude or longitude column is missing: {row}")
                        continue
                        
                    if not lat_str or not lon_str:
                        print(f"Warning: Skipping row because of empty latitude/longitude: {row}")
                        continue

                    lat = float(lat_str)
                    lon = float(lon_str)
                    
                    feature = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [lon, lat]
                        },
                        'properties': {key: value for key, value in row.items()}
                    }
                    features.append(feature)
                except (ValueError, TypeError) as e:
                    print(f"Warning: Skipping row due to data conversion error: {row}. Error: {e}")
                except KeyError as e:
                    print(f"Warning: Skipping row due to missing key: {e}. Row: {row}")

        except Exception as e:
            print(f"Error reading CSV file {csv_file_path}: {e}")
            return


    geojson = {
        'type': 'FeatureCollection',
        'features': features
    }

    with open(geojson_file_path, 'w', encoding='utf-8') as geojsonfile:
        json.dump(geojson, geojsonfile, indent=2)
    
    print(f"Successfully converted {csv_file_path} to {geojson_file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 5:
        print("Usage: python convert_csv_to_geojson.py <csv_file> <geojson_file> <lat_column> <lon_column>")
        sys.exit(1)
    
    csv_path = sys.argv[1]
    geojson_path = sys.argv[2]
    latitude_col = sys.argv[3]
    longitude_col = sys.argv[4]
    
    csv_to_geojson(csv_path, geojson_path, latitude_col, longitude_col) 