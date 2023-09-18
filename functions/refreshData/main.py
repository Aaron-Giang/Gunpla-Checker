import boto3
from bs4 import BeautifulSoup
import requests

dynamodb = boto3.client('dynamodb')

def delete_all_items(table_name):
    response = dynamodb.scan(TableName=table_name)
    items = response.get('Items', [])
    
    for item in items:
        index = item['index']['S']  # Assuming index is stored as a string
        model_name = item['model_name']['S']  # Assuming name is stored as a string
        
        key = {
            'index': {'S': index},
            'model_name': {'S': model_name}
        }
        
        dynamodb.delete_item(TableName=table_name, Key=key)

def batch_upload_items(table_name, items):
    # Split items into batches of 25 (DynamoDB limit)
    batch_size = 25
    for i in range(0, len(items), batch_size):
        batch = items[i:i+batch_size]
        
        # Create a list of PutRequests for the batch
        put_requests = []
        for item in batch:
            put_request = {
                'PutRequest': {
                    'Item': {
                        'index': {'S': str(item['index'])},  # Convert index to string
                        'tag': {'S': item['tag']},
                        'model_name': {'S': item['model_name']},
                        'series': {'S': item['series']},
                        'price': {'S': item['price']},
                        'release_date': {'S': item['release_date']},
                        'notes': {'S': item['notes']},
                        'image_url': {'S': item['image_url']},
                        "tab": {'S': item['tab']}
                    }
                }
            }
            put_requests.append(put_request)
        
        # Use batch_write_item to upload the batch
        response = dynamodb.batch_write_item(
            RequestItems={
                table_name: put_requests
            }
        )
        
        print(response)

def lambda_handler(event, context):
    table_name = 'gunplaData'
    delete_all_items(table_name)
    
    tag_urls = {
        "MG": "https://gundam.fandom.com/wiki/Master_Grade#1995_",
        "HGUC": "https://gundam.fandom.com/wiki/High_Grade_Universal_Century",
        "RG" : "https://gundam.fandom.com/wiki/Real_Grade",
        "RE/100" : "https://gundam.fandom.com/wiki/Reborn-One_Hundred",
        "PG" : "https://gundam.fandom.com/wiki/Perfect_Grade",
        "MSM" : "https://gundam.fandom.com/wiki/Mega_Size_Model",
        "EG" : "https://gundam.fandom.com/wiki/Entry_Grade",
        "HGTB" : "https://gundam.fandom.com/wiki/High_Grade_Gundam_Thunderbolt",
        "HGGTO" : "https://gundam.fandom.com/wiki/High_Grade_Gundam_The_Origin",
        "HGGB" : "https://gundam.fandom.com/wiki/High_Grade_Gunpla_Builders",
        "HGBF" : "https://gundam.fandom.com/wiki/High_Grade_Build_Fighters",
        "HGBC" : "https://gundam.fandom.com/wiki/High_Grade_Build_Custom",
        "HGPG" : "https://gundam.fandom.com/wiki/High_Grade_Petit%27gguy",
        "HGBD" : "https://gundam.fandom.com/wiki/High_Grade_Build_Divers",
        "HGFRS" : "https://gundam.fandom.com/wiki/Figure-rise_Standard",
        "HGBD:R" : "https://gundam.fandom.com/wiki/High_Grade_Build_Divers_Re:RISE",
        "HGIBO" : "https://gundam.fandom.com/wiki/High_Grade_IRON-BLOODED_ORPHANS",
        "HGGBB" : "https://gundam.fandom.com/wiki/High_Grade_Gundam_Breaker_Battlogue",
        "HGGU" : "https://gundam.fandom.com/wiki/1/144_High_Grade_Gundam_Wing_Dual_Story_G-Unit_Series",
        "HGFA" : "https://gundam.fandom.com/wiki/1/144_High_Grade_Fighting_Action_Endless_Waltz_Series",
        "HGSEED" : "https://gundam.fandom.com/wiki/High_Grade_Gundam_SEED",
        "HG00" : "https://gundam.fandom.com/wiki/High_Grade_Gundam_00",
        "HGAGE" : "https://gundam.fandom.com/wiki/High_Grade_Gundam_AGE",
        "HGRG" : "https://gundam.fandom.com/wiki/High_Grade_Reconguista_in_G",
        "HGIBA" : "https://gundam.fandom.com/wiki/High_Grade_IRON-BLOODED_ARMS#Season_1_",
        "HGTWFM" : "https://gundam.fandom.com/wiki/High_Grade_the_Witch_from_Mercury",
        "NGIBO" : "https://gundam.fandom.com/wiki/1/100_IRON-BLOODED_ORPHANS",
        # Add more tags and URLs as needed 
    }
    data_list = []
    unique_index = 1

    for tag, url in tag_urls.items():
        r = requests.get(url)
        soup = BeautifulSoup(r.text, "html.parser")
        
        tab_elements = soup.find_all("li", class_="wds-tabs__tab")
        tab_names = [tab_element.get_text(strip=True) for tab_element in tab_elements]

        tracks = soup.find_all("div", {"class": ["wds-tab__content wds-is-current", "wds-tab__content"]})
        
        for track_index, track in enumerate(tracks, start=1):
            tab_name = tab_names[track_index - 1] if track_index <= len(tab_names) else ""

            table = track.find("table", class_="wikitable")
            rows = table.find_all("tr")
            
            for row in rows[1:]:  # Skipping the header row
                columns = row.find_all("td")
                model_number = columns[0].get_text(strip=True)
                
                model_name_element = columns[1].find("a") or columns[1].find("span", class_="new")
                model_name = model_name_element.get_text(strip=True) if model_name_element else ""
                
                if not model_name:
                    # Skip this row if model_name is missing or empty
                    continue
                
                if len(columns) >= 6:  # Check if there's a series column
                    series_element = columns[2].find("i")
                    series = series_element.find("a").get_text(strip=True) if series_element and series_element.find("a") else ""
                    
                    # Replace the series with tag if it doesn't exist
                    if not series_element:
                        series = tag
                else:
                    series = tag
                
                price = columns[3].get_text(strip=True)
                release_date = columns[4].get_text(strip=True)
                
                # Check if there are enough columns for notes
                if len(columns) >= 6:
                    notes = columns[5].get_text(strip=True)
                else:
                    notes = ""
                
                # Extract image URL
                image_element = columns[0].find("img")
                image_url = image_element["src"] if image_element and "src" in image_element.attrs else ""
                
                # Extract image URL from image link (if available)
                image_link = columns[0].find("a")
                if image_link:
                    image_url = image_link.find("img")["src"]
                
                # Create a dictionary for the row
                row_data = {
                    "index": unique_index,
                    "tag": tag,
                    "model_name": model_name,
                    "series": series,
                    "price": price,
                    "release_date": release_date,
                    "notes": notes,
                    "image_url": image_url,
                    "tab": tab_name  # Store the tab name
                }
                
                data_list.append(row_data)
                
                # Increment the unique index
                unique_index += 1
        

    # Upload items in batches
    batch_upload_items(table_name, data_list)

    return {
        'statusCode': 200,
        'body': 'Data successfully inserted into DynamoDB'
    }