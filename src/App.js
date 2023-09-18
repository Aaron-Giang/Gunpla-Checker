import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('All'); // Default value for dropdown
  const [selectedFilter, setSelectedFilter] = useState('Normal');
  const [listCount, setListCount] = useState(0);
  const [FilteredlistCount, setFilteredListCount] = useState(0);

  const tabFilters = [
    "B-Club",
    "Other",
    "Exclusives",
    "Special Editions",
    "Accessories",
    "Special Editions & Exclusives",
  ]

  const tagFilters = {
    "HG" : ["HGUC","EG","HGTB","HGGTO" ,"HGGB" ,"HGBF","HGBC","HGPG" ,"HGBD" ,"HGFRS" ,"HGBD:R","HGIBO" ,"HGGBB" ,"HGGU" ,"HGFA" ,"HGSEED","HG00" ,"HGAGE" ,"HGRG" ,"HGIBA" ,"HGTWFM","NGIBO" ],
    "MG" : ["MG","RE/100"],
    "PG" : ["PG"],
    "RG" : ["RG"],
    "Mega Size": ["MSM"]

  };

  const notesKeyWords = [
    "P-Bandai",

]

  useEffect(() => {
    // Fetch data from AWS Lambda function
    const fetchData = async () => {
      try {
        const response = await fetch('https://mrs3yfmb73efg52cfdx4f77j2a0wanuc.lambda-url.us-east-2.on.aws/');
        const jsonData = await response.json();
        setData(jsonData);
        setFilteredData(jsonData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    setFilteredListCount(filteredData.length);

  },[filteredData]);

  useEffect(() => {
    setListCount(data.length);
  
    const filtered = data
      .filter(item => {
        const hasSearchTerm = item.model_name.toLowerCase().includes(searchTerm.toLowerCase()) 
          || item.notes.toLowerCase().includes(searchTerm.toLowerCase());
        const hasSelectedTag = selectedTag === 'All' || tagFilters[selectedTag].includes(item.tag);
        //will check the tab and the notes if it contains specific keywords to filter out the model
        const hasSelectedFilter = selectedFilter === 'All' || 
        (!tabFilters.includes(item.tab.trim()) && !notesKeyWords.some(keyword => item.notes.toLowerCase().includes(keyword.toLowerCase())));
        return hasSearchTerm && hasSelectedTag && hasSelectedFilter;
      })
      .sort((a, b) => new Date(a.release_date) - new Date(b.release_date)); // Sort by release date
  
    setFilteredData(filtered);
  }, [data, searchTerm, selectedTag, selectedFilter]);

  const handleSearch = event => {
    setSearchTerm(event.target.value);
  };

  const handleTagSelect = event => {
    setSelectedTag(event.target.value);
  };

  const handleFilterSelect = event => {
    setSelectedFilter(event.target.value);
  };




  return (
    <div className="App">
      <h1>Gunpla Price Checker</h1>
      <div>Total Entries:{listCount}</div>
      <div>Filtered Entries:{FilteredlistCount}</div>

      <div>
        <input type="text" placeholder="Search by model name" value={searchTerm} onChange={handleSearch} />
        <select value={selectedTag} onChange={handleTagSelect}>
          <option value="All">All Tags</option>
          <option value="HG">HG</option>
          <option value="MG">MG</option>
          <option value="PG">PG</option>
          <option value="RG">RG</option>
          <option value="Mega Size">Mega Size</option>


          {/* Add more tag options as needed */}
        </select>
        <select value={selectedFilter} onChange={handleFilterSelect}>
          <option value="Normal">Normal Kits</option>
          <option value="All">All Kits</option>
          

          {/* Add more tag options as needed */}
        </select>
      </div>

      {filteredData.length < 200 &&
      <div className = "dataMap">
        {filteredData.map(item => (
          <div key={item.index} className='data'>
            <p> <b>Model Name:</b> {item.model_name}</p>
            <p> <b>Grade:</b> {item.tag}</p>
            <p> <b>Series:</b> {item.series}</p>
            <p> <b>Price:</b> {item.price}</p>
            <p> <b>Release Date:</b> {item.release_date}</p>
            <p> <b>Notes:</b> {item.notes}</p>

            {/* Render other details as needed */}
          </div>
        ))}
      </div>

        }
      {filteredData.length >= 200 &&
        <div>Search for a specific model kit</div>
      }
    </div>
  );
}

export default App;
