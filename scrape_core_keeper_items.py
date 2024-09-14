from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import json

def scrape_core_keeper_items():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    
    # Use 'chromedriver' directly without specifying the path
    driver = webdriver.Chrome(options=chrome_options)

    url = "https://core-keeper.fandom.com/wiki/Object_IDs"
    driver.get(url)

    # Wait for the table to load
    wait = WebDriverWait(driver, 10)
    table = wait.until(EC.presence_of_element_located((By.CLASS_NAME, "fandom-table")))

    # Parse the page content with BeautifulSoup
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    # Find the table
    table = soup.find('table', class_='fandom-table sortable jquery-tablesorter')
    
    items = {}
    if table:
        print("Found the table. Processing rows...")
        rows = table.find_all('tr')[1:]  # Skip the header row
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 4:
                name_cell = cols[2]
                name = name_cell.text.strip().replace('\u200e', '')  # Remove U+200E
                url = None
                
                # Check if there's a link in the name cell
                link = name_cell.find('a')
                if link and 'href' in link.attrs:
                    url = "https://core-keeper.fandom.com" + link['href']
                
                item_id = cols[0].text.strip()
                variation = cols[1].text.strip().replace('\u200e', '')  # Remove U+200E
                internal_name = cols[3].text.strip().replace('\u200e', '')  # Remove U+200E
                
                items[item_id] = {
                    "variation": variation,
                    "name": name,
                    "internal_name": internal_name,
                    "url": url,
                    "discovered": "false"  # Using string "false" for JavaScript compatibility
                }
                print(f"Processed item: {name}")
    else:
        print("Couldn't find the table with class 'fandom-table sortable jquery-tablesorter'")

    driver.quit()
    return items

def save_to_json(items, filename):
    data = {
        "item_count": len(items),
        "items": items
    }
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    items = scrape_core_keeper_items()
    save_to_json(items, "core_keeper_items.json")
    print(f"Saved {len(items)} items to core_keeper_items.json")