// ~/bus-admin-backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db'); 

const app = express();
const port = 5000; 

app.use(cors()); 
app.use(express.json());

// ROUTE: Lấy danh sách các trạm xe buýt
app.get('/api/stations', async (req, res) => {
    try {
        // Dùng ST_AsGeoJSON để trả về dữ liệu vị trí
        const result = await db.query(
            "SELECT id, name, description, ST_AsGeoJSON(location) AS location_geojson FROM bus_stations"
        );
        
        const stations = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            // Parse chuỗi GeoJSON thành object JavaScript
            location: JSON.parse(row.location_geojson) 
        }));
        
        res.status(200).json(stations);
    } catch (err) {
        console.error("Lỗi khi lấy trạm xe:", err);
        res.status(500).send("Lỗi máy chủ nội bộ");
    }
});

// ROUTE 2: Lấy danh sách các TUYẾN XE BUÝT (MỚI)
app.get('/api/routes', async (req, res) => {
    try {
        const result = await db.query(
            // Lấy thêm tên điểm đầu và điểm cuối bằng JOIN
            "SELECT r.id, r.route_name, " +
            "s_start.name AS start_station_name, s_end.name AS end_station_name, " +
            "ST_AsGeoJSON(r.route_path) AS route_path_geojson " +
            "FROM bus_routes r " +
            "JOIN bus_stations s_start ON r.start_station_id = s_start.id " +
            "JOIN bus_stations s_end ON r.end_station_id = s_end.id"
        );

        const routes = result.rows.map(row => ({
            id: row.id,
            name: row.route_name,
            start: row.start_station_name,
            end: row.end_station_name,
            // Parse GeoJSON LineString thành object
            path: JSON.parse(row.route_path_geojson)
        }));
        
        res.status(200).json(routes);
    } catch (err) {
        console.error("Lỗi khi lấy tuyến xe:", err);
        res.status(500).send("Lỗi máy chủ nội bộ");
    }
});

app.listen(port, () => {
    console.log(`Server API đang chạy tại http://localhost:${port}`);
});
