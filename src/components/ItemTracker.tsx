import React, { useState, useEffect, useRef } from 'react';

interface Item {
  id: string;
  name: string;
  internal_name: string;
  url: string | null;
  discovered: boolean;
  variation: string;
}

interface ItemsData {
  item_count: number;
  items: { [key: string]: Item };
}

interface DiscoveredObject {
  objectID: number;
  variation: number;
}

interface UserData {
  discoveredObjects2: DiscoveredObject[];
}

type FilterOption = 'all' | 'discovered' | 'undiscovered';

const ItemTracker: React.FC = () => {
  const [items, setItems] = useState<[string, Item][]>([]);
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const [userData, setUserData] = useState<UserData | null>(null);
  const [filter, setFilter] = useState<FilterOption>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/core_keeper_items.json')
      .then(response => response.json())
      .then((data: ItemsData) => {
        console.log('Loaded items:', data);
        setItems(Object.entries(data.items).map(([id, item]) => [id, {...item, discovered: false}]));
      })
      .catch(error => console.error('Error loading items:', error));

    fetch('/item_images_list.json')
      .then(response => response.json())
      .then((data: string[]) => {
        console.log('Loaded image list:', data);
        const imageMap: { [key: string]: string } = {};
        data.forEach(filename => {
          const match = filename.match(/^(\d+)_/);
          if (match) {
            const id = match[1];
            imageMap[id] = filename;
          }
        });
        console.log('Image map:', imageMap);
        setImages(imageMap);
      })
      .catch(error => console.error('Error loading image list:', error));
  }, []);

  const handleItemClick = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target?.result as string);
          setUserData(json);
          updateItemDiscoveryStatus(json);
        } catch (error) {
          console.error('Error parsing JSON:', error);
          alert('Error parsing JSON file. Please make sure it\'s a valid JSON.');
        }
      };
      reader.readAsText(file);
    }
  };

  const updateItemDiscoveryStatus = (userData: UserData) => {
    setItems(prevItems => {
      return prevItems.map(([id, item]) => {
        const discovered = userData.discoveredObjects2.some(
          obj => obj.objectID === parseInt(id) && obj.variation === parseInt(item.variation)
        );
        return [id, { ...item, discovered }] as [string, Item];
      });
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFilterChange = (option: FilterOption) => {
    setFilter(option);
  };

  const filteredItems = items.filter(([, item]) => {
    if (filter === 'all') return true;
    if (filter === 'discovered') return item.discovered;
    if (filter === 'undiscovered') return !item.discovered;
    return true;
  });

  return (
    <div className="ItemTracker">
      <h1>Core Keeper Items</h1>
      <div className="top-controls">
        <button onClick={triggerFileInput}>Upload JSON</button>
        <div className="filter-menu">
          <span>Filter: </span>
          <select 
            value={filter} 
            onChange={(e) => handleFilterChange(e.target.value as FilterOption)}
          >
            <option value="all">All</option>
            <option value="discovered">Discovered</option>
            <option value="undiscovered">Undiscovered</option>
          </select>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileUpload}
        accept=".json"
      />
      <div className="item-grid">
        {filteredItems.map(([id, item]) => (
          <div 
            key={id} 
            className={`item ${item.discovered ? 'discovered' : ''}`} 
            onClick={() => handleItemClick(item.url)}
            title={`${item.name} (ID: ${id})`}
          >
            <img 
              src={images[id] ? `/item_images/${images[id]}` : '/placeholder.png'} 
              alt={item.name} 
              onError={(e) => {
                e.currentTarget.src = '/placeholder.png';
                console.log(`Failed to load image for item ${id}: ${item.name}`);
              }}
            />
            <p>{item.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ItemTracker;