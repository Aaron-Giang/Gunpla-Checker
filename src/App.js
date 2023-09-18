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

  //filters to sort out by grade of model kit
  const tagFilters = {
    "HG" : ["HGUC","EG","HGTB","HGGTO" ,"HGGB" ,"HGBF","HGBC","HGPG" ,"HGBD" ,"HGFRS" ,"HGBD:R","HGIBO" ,"HGGBB" ,"HGGU" ,"HGFA" ,"HGSEED","HG00" ,"HGAGE" ,"HGRG" ,"HGIBA" ,"HGTWFM","NGIBO" ],
    "MG" : ["MG","RE/100"],
    "PG" : ["PG"],
    "RG" : ["RG"],
    "Mega Size": ["MSM"]

  };
  //filters out keywords from notes
  const notesKeyWords = [
    "P-Bandai",
    "tokyo",

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

  // Split the searchTerm into an array of keywords
  const keywords = searchTerm.toLowerCase().split(' ');

  const filtered = data
    .filter(item => {
      // Check if all keywords are present in the item's model_name or notes
      const hasAllKeywords = keywords.every(keyword => 
        item.model_name.toLowerCase().includes(keyword) || 
        item.notes.toLowerCase().includes(keyword) ||
        item.release_date.toLowerCase().includes(keyword)

      );
      
      const hasSelectedTag = selectedTag === 'All' || tagFilters[selectedTag].includes(item.tag);
      // Will check the tab and the notes if it contains specific keywords to filter out the model
      const hasSelectedFilter = selectedFilter === 'All' || 
        (!tabFilters.includes(item.tab.trim()) && !notesKeyWords.some(keyword => item.notes.toLowerCase().includes(keyword.toLowerCase())));
      return hasAllKeywords && hasSelectedTag && hasSelectedFilter;
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
        <select value={selectedTag} onChange={handleTagSelect} class ="custom-select">
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

      {data.length ==0 &&
        <div >
          <img className='loading' src='https://www.freeiconspng.com/uploads/spinner-icon-0.gif'></img>
        </div>
      }


    </div>
  );
}

export default App;
