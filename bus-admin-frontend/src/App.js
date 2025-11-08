// ~/bus-admin-backend/bus-admin-frontend/src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css'; 
import L from 'leaflet';
import './App.css'; 

// Fix lỗi icon mặc định của Leaflet (quan trọng cho React)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const defaultCenter = [21.0285, 105.8542]; // Tâm bản đồ mặc định
const ROUTE_COLOR = '#4a148c'; 
const HIGHLIGHT_COLOR = '#e84c3d'; 

// Component xử lý việc di chuyển bản đồ khi vị trí thay đổi (tự động zoom khi dùng GPS)
function LocationHandler({ center }) {
    const map = useMap(); 
    useEffect(() => {
        if (center) {
            map.setView(center, 14); // Di chuyển đến tọa độ và zoom level 14
        }
    }, [map, center]);
    return null;
}

function MapComponent() {
  const [stations, setStations] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null); 
  
  // --- State cho chức năng Tìm Chuyến Xe ---
  const [currentLocation, setCurrentLocation] = useState(null); // [lat, lng] (Lấy từ GPS/giả lập)
  const [startStationName, setStartStationName] = useState(''); // Tên trạm khởi hành (NHẬP)
  const [destinationName, setDestinationName] = useState('Đại học Bách Khoa'); // Tên trạm đích
  const [foundTripRouteId, setFoundTripRouteId] = useState(null); 
  const [tripCost, setTripCost] = useState(null); 

  // Tải dữ liệu Trạm và Tuyến từ Backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/stations').then(res => setStations(res.data)).catch(console.error);
    axios.get('http://localhost:5000/api/routes').then(res => setRoutes(res.data)).catch(console.error);
  }, []);

  // Hàm tìm trạm gần nhất với vị trí [lat, lng]
  const findClosestStation = useCallback((lat, lng) => {
    let closest = null;
    let minDistanceSq = Infinity;

    stations.forEach(station => {
        const stationLng = station.location.coordinates[0]; 
        const stationLat = station.location.coordinates[1]; 
        
        const distanceSq = Math.pow(lat - stationLat, 2) + Math.pow(lng - stationLng, 2);

        if (distanceSq < minDistanceSq) {
            minDistanceSq = distanceSq;
            closest = station;
        }
    });
    return closest;
  }, [stations]);

  // Lấy Vị trí GPS hiện tại
  const getCurrentLocation = () => {
    setFoundTripRouteId(null); 
    setTripCost(null);
    // Reset ô nhập liệu trạm đi khi dùng GPS
    setStartStationName(''); 

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCurrentLocation([latitude, longitude]);
                alert(`Đã lấy vị trí GPS thành công: Lat ${latitude}, Lng ${longitude}`);
            },
            (error) => {
                console.error("Lỗi GPS:", error);
                // Dùng vị trí giả lập nếu GPS thất bại (Hà Nội: Bến xe Mỹ Đình)
                setCurrentLocation([21.0315, 105.7766]); 
                alert("Không thể lấy GPS. Đã dùng vị trí giả lập.");
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        alert("Trình duyệt không hỗ trợ GPS. Đã dùng vị trí giả lập.");
        setCurrentLocation([21.0315, 105.7766]); 
    }
  };

  // Xử lý logic Tìm Chuyến Đi
  const handleFindTrip = () => {
    setFoundTripRouteId(null);
    setTripCost(null);

    // A. Xác định Trạm Khởi hành
    let actualStartStation;
    if (startStationName) {
        // Nếu người dùng nhập trạm: Lấy trạm đã nhập
        actualStartStation = stations.find(s => 
            s.name.toLowerCase().trim() === startStationName.toLowerCase().trim()
        );
    } else if (currentLocation) {
        // Nếu dùng GPS: Tìm trạm gần GPS nhất để bắt bus
        actualStartStation = findClosestStation(currentLocation[0], currentLocation[1]);
    } else {
        alert("Vui lòng chọn trạm đi hoặc xác định vị trí GPS.");
        return;
    }

    // B. Xác định Trạm Đích
    const destinationStation = stations.find(s => 
        s.name.toLowerCase().trim() === destinationName.toLowerCase().trim()
    );

    if (!actualStartStation || !destinationStation) {
        alert(`Không tìm thấy trạm: ${!actualStartStation ? (startStationName || 'GPS') : destinationName}`);
        return;
    }

    // C. Tìm Tuyến Phù hợp (Logic: Tuyến đi thẳng từ trạm BẮT ĐẦU đến trạm KẾT THÚC)
    const foundRoute = routes.find(route => 
        route.start.toLowerCase() === actualStartStation.name.toLowerCase() && 
        route.end.toLowerCase() === destinationStation.name.toLowerCase()
    );

    if (foundRoute) {
        setFoundTripRouteId(foundRoute.id);
        const cost = Math.floor(Math.random() * 5 + 7) * 1000; // Giá vé ngẫu nhiên
        setTripCost(cost);
        alert(`🚌 Tuyến phù hợp: ${foundRoute.name}. Giá vé: ${cost.toLocaleString()} VND.`);
    } else {
        alert("Không tìm thấy tuyến xe buýt trực tiếp nào phù hợp.");
    }
  };
  
  // Xử lý logic Thanh toán/Thu tiền
  const handleCheckout = () => {
    if (!foundTripRouteId || !tripCost) {
        alert("Vui lòng tìm chuyến xe trước khi thanh toán.");
        return;
    }
    
    alert(`Thanh toán ${tripCost.toLocaleString()} VND thành công! Chúc bạn có chuyến đi vui vẻ.`);
    
    // Reset trạng thái sau khi thanh toán
    setFoundTripRouteId(null);
    setTripCost(null);
    setStartStationName('');
    setDestinationName('');
    setCurrentLocation(null);
  }

  // Hàm chuyển đổi GeoJSON LineString thành mảng [lat, lng] cho Leaflet
  const geojsonToLatLng = (geojsonPath) => {
    if (geojsonPath && geojsonPath.coordinates) {
        return geojsonPath.coordinates.map(coord => [coord[1], coord[0]]);
    }
    return [];
  };

  const handleRouteSelect = (event) => {
    setSelectedRouteId(event.target.value === "" ? null : parseInt(event.target.value));
    setFoundTripRouteId(null); 
    setTripCost(null);
  };
  
  const routesToDisplay = selectedRouteId 
    ? routes.filter(r => r.id === selectedRouteId) 
    : routes;


  return (
    <>
      <div className="controls">
        
        {/* CHỨC NĂNG TÌM CHUYẾN XE (Start/End) */}
        <div className="trip-planner">
            <input 
                type="text" 
                placeholder="Trạm Đi (Bắt Đầu)"
                value={startStationName}
                onChange={(e) => setStartStationName(e.target.value)}
                list="station-names" 
            />
            <button onClick={getCurrentLocation} className="btn-gps">
                {currentLocation ? '✅ GPS' : '📍 Dùng GPS'}
            </button>
            <input 
                type="text" 
                placeholder="Trạm Đích (Điểm Xuống)"
                value={destinationName}
                onChange={(e) => setDestinationName(e.target.value)}
                list="station-names" 
            />
            <datalist id="station-names">
                {stations.map(s => <option key={s.id} value={s.name} />)}
            </datalist>

            <button onClick={handleFindTrip} className="btn-find-trip" disabled={!startStationName && !currentLocation}>
                Tìm Chuyến Xe
            </button>
        </div>

        {/* CHỨC NĂNG THANH TOÁN */}
        {tripCost && (
            <div className="checkout-box">
                <p>Giá vé: <b>{tripCost.toLocaleString()} VND</b></p>
                <button onClick={handleCheckout} className="btn-checkout">
                    THANH TOÁN & ĐI
                </button>
            </div>
        )}

        {/* CHỨC NĂNG LỌC TUYẾN */}
        <select onChange={handleRouteSelect} value={selectedRouteId || ""}>
          <option value="">-- Lọc Tuyến Xe --</option>
          {routes.map(route => (
            <option key={route.id} value={route.id}>
              {route.name}
            </option>
          ))}
        </select>
      </div>

      <MapContainer 
        center={currentLocation || defaultCenter} 
        zoom={12} 
        style={{ height: '100vh', width: '100%' }}
        scrollWheelZoom={true} 
      >
        <LocationHandler center={currentLocation} /> 
        <TileLayer
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Marker cho VỊ TRÍ HIỆN TẠI (GPS) */}
        {currentLocation && (
            <Marker position={currentLocation}> 
                <Popup>Vị trí Hiện tại (GPS)</Popup>
            </Marker>
        )}

        {/* VẼ TUYẾN XE BUÝT */}
        {(selectedRouteId ? routesToDisplay : routes).map((route) => {
            const isHighlight = foundTripRouteId === route.id;
            
            return (
              <Polyline 
                key={route.id}
                positions={geojsonToLatLng(route.path)}
                color={isHighlight ? HIGHLIGHT_COLOR : ROUTE_COLOR}
                weight={isHighlight ? 8 : 4}
                opacity={0.8}
                dashArray={isHighlight ? '10, 5' : null}
              >
                <Popup>
                    Tuyến: <b>{route.name}</b> <br/>
                    Từ: {route.start} → Đến: {route.end}
                </Popup>
              </Polyline>
            );
        })}

        {/* Marker Trạm Xe */}
        {stations.map(station => {
          const position = [station.location.coordinates[1], station.location.coordinates[0]];
          
          return (
            <Marker 
              key={station.id} 
              position={position}
            >
              <Popup>
                <h3>{station.name}</h3>
                <p>{station.description}</p>
              </Popup>
            </Marker>
          );
        })}

      </MapContainer>
    </>
  );
}

function App() {
  return <MapComponent />;
}

export default App;
