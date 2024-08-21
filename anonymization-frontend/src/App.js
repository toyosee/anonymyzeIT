import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import React, { useState } from 'react';

function App() {
  const [data, setData] = useState(''); // For text area input
  const [anonymizedData, setAnonymizedData] = useState(null);
  const [error, setError] = useState(null);
  const [isTextInput, setIsTextInput] = useState(true); // Toggle between text input and file upload
  const [file, setFile] = useState(null);

  const handleTextSubmit = async () => {
    try {
      const parsedData = JSON.parse(data); // Parse JSON data from textarea
      const response = await fetch('http://localhost:5000/anonymize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: parsedData }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const text = await response.text();
      console.log('Raw response:', text);

      try {
        const result = JSON.parse(text);
        //console.log('Parsed anonymized data:', result.pseudonymized_data); // Log the parsed data
        
        // Add unique IDs to the anonymized data
        const dataWithIds = result.pseudonymized_data.map((item, index) => ({
          id: index + 1, // Auto-incrementing ID starting from 1
          ...item,
        }));

        setAnonymizedData(dataWithIds || []);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        setAnonymizedData([]);
        setError('Error processing data: Invalid response format.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setAnonymizedData([]);
      setError('Invalid JSON format. Please enter valid JSON data.');
    }
  };

  const handleFileSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    if (!file) {
      setError('Please upload a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const text = await response.text();
      console.log('Raw response:', text);

      try {
        const result = JSON.parse(text);
        console.log('Parsed anonymized data:', result.pseudonymized_data); // Log the parsed data
        
        // Add unique IDs to the anonymized data
        const dataWithIds = result.pseudonymized_data.map((item, index) => ({
          id: index + 1, // Auto-incrementing ID starting from 1
          ...item,
        }));

        setAnonymizedData(dataWithIds || []);
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        setAnonymizedData([]);
        setError('Error processing data: Invalid response format.');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setAnonymizedData([]);
      setError('Error communicating with server');
    }
  };

  const exportToCSV = () => {
    if (!anonymizedData || anonymizedData.length === 0) return;

    const csvRows = [];
    const headers = Object.keys(anonymizedData[0]);
    csvRows.push(headers.join(',')); // Add headers

    for (const row of anonymizedData) {
      const values = headers.map(header => {
        const escaped = ('' + row[header]).replace(/"/g, '\\"'); // Escape double quotes
        return `"${escaped}"`; // Wrap in quotes
      });
      csvRows.push(values.join(',')); // Add values
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'anonymized_data.csv');
    a.click();
    URL.revokeObjectURL(url); // Clean up
  };

  // console.log('Anonymized Data before render:', anonymizedData);

  return (
    <div className="container mt-5">
      <div className="card p-4 shadow-sm">
        <h1 className="text-center mb-4">Data Anonymization</h1>
        
        <div className="text-center mb-3">
          <button className="btn btn-primary mx-2" onClick={() => setIsTextInput(true)}>Enter Text</button>
          <button className="btn btn-primary mx-2" onClick={() => setIsTextInput(false)}>Upload File</button>
        </div>

        {isTextInput ? (
          <div className="mb-3">
            <textarea
              className="form-control"
              rows="6"
              value={data}
              onChange={(e) => setData(e.target.value)}
              placeholder='Enter data in JSON format (e.g., [{"name": "John Doe", "age": 44, "address": "123 Main St", "city": "Springfield", "email": "john.doe@example.com"}])'
            />
            <div className="text-center mt-3">
              <button className="btn btn-primary" onClick={handleTextSubmit}>Anonymize</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFileSubmit}>
            <div className="mb-3">
              <input
                type="file"
                className="form-control"
                accept=".csv,.xls,.xlsx"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
            <div className="text-center mt-3">
              <button className="btn btn-primary" type="submit">Upload and Anonymize</button>
            </div>
          </form>
        )}

        {error && (
          <div className="mt-4 alert alert-danger">
            {error}
          </div>
        )}
        
        {anonymizedData && anonymizedData.length > 0 ? (
          <div className="mt-4">
            <h3>Anonymized Data:</h3>
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead>
                  <tr>
                    {Object.keys(anonymizedData[0]).map((key, index) => (
                      <th key={index}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {anonymizedData.map((item, index) => (
                    <tr key={index}>
                      {Object.values(item).map((value, i) => (
                        <td key={i}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-center mt-3">
              <button className="btn btn-success" onClick={exportToCSV}>Export to CSV</button>
            </div>
          </div>
        ) : (
          anonymizedData && (
            <div className="mt-4 alert alert-warning">
              No anonymized data available.
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;
