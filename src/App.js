import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function App() {
  const [listings, setListings] = useState([]);
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [price, setPrice] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [selectedListing, setSelectedListing] = useState(null);

  const [viewMode, setViewMode] = useState('all'); 
  const [editingListing, setEditingListing] = useState(null);
  const [editName, setEditName] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [editPrice, setEditPrice] = useState('');

  // STARE NOUĂ PENTRU FILTRUL DE PREȚ (setăm 2000$ ca valoare maximă implicită)
  const [maxPrice, setMaxPrice] = useState(10000);

  const fetchListings = () => {
    fetch('https://airbnb-clone-backend-u392.onrender.com/api/listings')
      .then(response => response.json())
      .then(data => setListings(data))
      .catch(error => console.error('Eroare la preluarea datelor:', error));
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const newListing = { name, neighborhood, price: parseFloat(price) };

    fetch('https://airbnb-clone-backend-u392.onrender.com/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newListing),
    })
      .then(response => {
        if (response.ok) {
          fetchListings();
          setName('');
          setNeighborhood('');
          setPrice('');
        }
      })
      .catch(error => console.error('Eroare:', error));
  };

  const handleDelete = (id) => {
    fetch(`https://airbnb-clone-backend-u392.onrender.com/api/listings/${id}`, { method: 'DELETE' })
      .then(response => { if (response.ok) fetchListings(); })
      .catch(error => console.error('Eroare:', error));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    const updatedData = { name: editName, neighborhood: editNeighborhood, price: parseFloat(editPrice) };

    fetch(`https://airbnb-clone-backend-u392.onrender.com/api/listings/${editingListing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    })
      .then(response => {
        if (response.ok) {
          fetchListings();
          setEditingListing(null); 
        }
      })
      .catch(error => console.error('Eroare:', error));
  };

  const openEditModal = (listing, e) => {
    e.stopPropagation(); 
    setEditingListing(listing);
    setEditName(listing.name);
    setEditNeighborhood(listing.neighborhood);
    setEditPrice(listing.price);
  };

  const baseListings = viewMode === 'mine' 
    ? listings.filter(l => l.room_type === null || l.room_type === undefined)
    : listings;

  // LOGICĂ NOUĂ: Am adăugat condiția pentru preț (listing.price <= maxPrice)
  const filteredListings = baseListings.filter(listing => 
    (listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (listing.neighborhood && listing.neighborhood.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    listing.price <= maxPrice
  );

  const sortedListings = filteredListings.sort((a, b) => {
    return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedListings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedListings.length / itemsPerPage);

  const getChartData = () => {
    const neighborhoodStats = {};
    listings.forEach(listing => {
      if (listing.neighborhood && listing.price) {
        if (!neighborhoodStats[listing.neighborhood]) neighborhoodStats[listing.neighborhood] = { total: 0, count: 0 };
        neighborhoodStats[listing.neighborhood].total += listing.price;
        neighborhoodStats[listing.neighborhood].count += 1;
      }
    });
    return Object.keys(neighborhoodStats)
      .map(name => ({ numeCartier: name, pretMediu: Math.round(neighborhoodStats[name].total / neighborhoodStats[name].count) }))
      .sort((a, b) => b.pretMediu - a.pretMediu).slice(0, 10);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>Airbnb Clone - Lista Cazărilor</h1>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button 
          onClick={() => { setViewMode('all'); setCurrentPage(1); }}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: viewMode === 'all' ? '#333' : '#ddd', color: viewMode === 'all' ? 'white' : 'black', cursor: 'pointer' }}>
          Toate Cazările
        </button>
        <button 
          onClick={() => { setViewMode('mine'); setCurrentPage(1); }}
          style={{ padding: '10px 20px', borderRadius: '6px', border: 'none', background: viewMode === 'mine' ? '#ff385c' : '#ddd', color: viewMode === 'mine' ? 'white' : 'black', cursor: 'pointer' }}>
          Cazările Mele
        </button>
      </div>

      {/* ZONA DE FILTRARE ACTUALIZATĂ */}
      <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap', background: '#f0f0f0', padding: '15px', borderRadius: '8px' }}>
        <input type="text" placeholder="Caută..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ flex: '1', minWidth: '200px', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
        
        {/* SLIDER-UL PENTRU PREȚ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '250px' }}>
          <label style={{ fontWeight: 'bold' }}>Preț maxim: ${maxPrice}</label>
          <input 
            type="range" 
            min="10" 
            max="10000" 
            step="10"
            value={maxPrice} 
            onChange={(e) => { setMaxPrice(Number(e.target.value)); setCurrentPage(1); }} 
            style={{ flex: '1', cursor: 'pointer' }}
          />
        </div>

        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
          <option value="asc">Preț: Crescător</option>
          <option value="desc">Preț: Descrescător</option>
        </select>
      </div>

      {viewMode === 'all' && (
        <>
          <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
            <h3>Adaugă o cazare nouă</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input type="text" placeholder="Nume cazare" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '8px', flex: '1' }} />
              <input type="text" placeholder="Cartier" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} required style={{ padding: '8px', flex: '1' }} />
              <input type="number" placeholder="Preț" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ padding: '8px', width: '120px' }} />
              <button type="submit" style={{ background: '#ff385c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Adaugă</button>
            </form>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd', height: '400px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', textAlign: 'center' }}>Top 10 Cartiere - Prețul mediu pe noapte</h3>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="numeCartier" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Preț Mediu']} />
                <Bar dataKey="pretMediu" fill="#ff385c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <p>Apartamente găsite în secțiunea curentă: <strong>{sortedListings.length}</strong></p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
        {currentItems.map(listing => (
          <div key={listing.id} onClick={() => setSelectedListing(listing)} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', cursor: 'pointer', background: 'white' }}>
            <h3>{listing.name}</h3>
            <p><strong>Cartier:</strong> {listing.neighborhood}</p>
            <p><strong>Preț:</strong> ${listing.price} / noapte</p>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(listing.id); }} style={{ background: '#d9534f', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Șterge</button>
              
              {viewMode === 'mine' && (
                <button onClick={(e) => openEditModal(listing, e)} style={{ background: '#0275d8', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Editează</button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '30px' }}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Anterioara</button>
        <span style={{ alignSelf: 'center' }}>Pagina {currentPage} din {totalPages || 1}</span>
        <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(prev => prev + 1)} style={{ padding: '8px 16px', cursor: 'pointer' }}>Următoarea</button>
      </div>

      {selectedListing && !editingListing && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%' }}>
            <h2>{selectedListing.name}</h2>
            <p><strong>Cartier:</strong> {selectedListing.neighborhood}</p>
            <p><strong>Preț pe noapte:</strong> ${selectedListing.price}</p>
            <button onClick={() => setSelectedListing(null)} style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginTop: '15px' }}>Închide</button>
          </div>
        </div>
      )}

      {editingListing && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '8px', maxWidth: '500px', width: '100%' }}>
            <h2>Editează Cazarea</h2>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ padding: '10px' }} />
              <input type="text" value={editNeighborhood} onChange={(e) => setEditNeighborhood(e.target.value)} required style={{ padding: '10px' }} />
              <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required style={{ padding: '10px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" style={{ background: '#28a745', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Salvează Modificările</button>
                <button type="button" onClick={() => setEditingListing(null)} style={{ background: '#333', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' }}>Anulează</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;