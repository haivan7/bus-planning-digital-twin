
# 🧩 Hướng Dẫn Cài Đặt Cơ Sở Dữ Liệu PostgreSQL + PostGIS cho Dự Án Bus Map

Dự án **Bus Planning Digital Twin (Bus Map Project)** sử dụng **PostgreSQL** kết hợp với **PostGIS** để lưu trữ dữ liệu không gian (geospatial data) của **các trạm xe buýt** và **các tuyến đường** dưới dạng **Point** và **LineString**.  
Tài liệu này hướng dẫn chi tiết cách cài đặt, tạo cơ sở dữ liệu, và nhập dữ liệu mẫu.

---

## ⚙️ 1. Cài đặt PostgreSQL và PostGIS

### 🧱 Cài đặt bằng APT (trên Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgis postgresql-15-postgis-3
```

---

## 🚀 2. Khởi động và kiểm tra dịch vụ PostgreSQL

### 🔹 Khởi động PostgreSQL
```bash
sudo systemctl start postgresql
```

### 🔹 Kiểm tra trạng thái (đảm bảo báo “active (running)”)
```bash
sudo systemctl status postgresql
```

---

## 👤 3. Tạo User và Database cho dự án Bus Map

### 🔹 Đăng nhập vào PostgreSQL với quyền `postgres`:
```bash
sudo -u postgres psql
```

### 🔹 Tạo user mới cho dự án:
```sql
CREATE USER my_bus_admin WITH PASSWORD 'abc123';
```

### 🔹 Cấp quyền quản trị:
```sql
ALTER USER my_bus_admin WITH SUPERUSER;
```

### 🔹 Tạo database mới cho hệ thống Bus Map:
```sql
CREATE DATABASE bus_db OWNER my_bus_admin;
```

### 🔹 Thoát khỏi psql:
```sql
\q
```

---

## 🧭 4. Kết nối vào database `bus_db`

Đăng nhập bằng user vừa tạo:

```bash
psql -U my_bus_admin -d bus_db -h localhost
```

Sau khi nhập mật khẩu (`abc123`), bạn sẽ thấy prompt:
```
bus_db=#
```

---

## 🗺️ 5. Cài đặt PostGIS Extension

Kích hoạt extension **PostGIS** trong cơ sở dữ liệu:

```sql
CREATE EXTENSION postgis;
```

---

## 🧱 6. Tạo các bảng dữ liệu cho hệ thống Bus Map

### 🚌 Bảng 1: Các trạm xe buýt (`bus_stations`)
```sql
CREATE TABLE bus_stations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    location GEOMETRY(Point, 4326)
);
```

### 🚏 Bảng 2: Các tuyến xe buýt (`bus_routes`)
```sql
CREATE TABLE bus_routes (
    id SERIAL PRIMARY KEY,
    route_name VARCHAR(100) UNIQUE NOT NULL,
    start_station_id INTEGER REFERENCES bus_stations(id),
    end_station_id INTEGER REFERENCES bus_stations(id),
    route_path GEOMETRY(LineString, 4326)
);
```

---

## 📥 7. Nhập dữ liệu mẫu (Demo Data)

### 🧩 Thêm 3 trạm xe buýt mẫu
```sql
INSERT INTO bus_stations (name, description, location) VALUES 
('Bến xe Mỹ Đình', 'Bến xe lớn', ST_SetSRID(ST_MakePoint(105.7766, 21.0315), 4326)),
('Đại học Bách Khoa', 'Trường học', ST_SetSRID(ST_MakePoint(105.8459, 21.0076), 4326)),
('Hồ Gươm', 'Trung tâm Hà Nội', ST_SetSRID(ST_MakePoint(105.8524, 21.0280), 4326));
```

### 🧭 Thêm 2 tuyến xe buýt mẫu
#### Tuyến 1: Mỹ Đình → Hồ Gươm
```sql
INSERT INTO bus_routes (route_name, start_station_id, end_station_id, route_path)
VALUES (
    'Tuyến Mẫu 01',
    1,
    3,
    ST_SetSRID(
        ST_GeomFromText('LINESTRING(105.7766 21.0315, 105.79 21.03, 105.82 21.02, 105.8524 21.0280)'),
        4326
    )
);
```

#### Tuyến 2: Hồ Gươm → Đại học Bách Khoa
```sql
INSERT INTO bus_routes (route_name, start_station_id, end_station_id, route_path)
VALUES (
    'Tuyến Mẫu 02',
    3,
    2,
    ST_SetSRID(
        ST_GeomFromText('LINESTRING(105.8524 21.0280, 105.85 21.015, 105.8459 21.0076)'),
        4326
    )
);
```

---

## 🔍 8. Kiểm tra dữ liệu đã nhập

### Xem danh sách trạm xe:
```sql
SELECT id, name, ST_AsText(location) FROM bus_stations;
```

### Xem danh sách tuyến xe:
```sql
SELECT id, route_name, ST_AsText(route_path) FROM bus_routes;
```

---

## 🧹 9. (Tuỳ chọn) Xoá toàn bộ dữ liệu demo

Nếu cần xoá dữ liệu thử nghiệm:

```sql
TRUNCATE TABLE bus_routes, bus_stations RESTART IDENTITY;
```

---

## ✅ 10. Kiểm tra kết nối từ Backend

Sau khi hoàn thành bước trên, backend Node.js của bạn có thể kết nối bằng thông tin:

| Thông số | Giá trị |
|-----------|----------|
| **Host** | `localhost` |
| **Database** | `bus_db` |
| **User** | `my_bus_admin` |
| **Password** | `abc123` |
| **Port** | `5432` |

---

## 📦 11. Tóm tắt nhanh lệnh thiết lập

```bash
sudo apt install postgis postgresql-15-postgis-3
sudo systemctl start postgresql
sudo -u postgres psql

CREATE USER my_bus_admin WITH PASSWORD 'abc123';
ALTER USER my_bus_admin WITH SUPERUSER;
CREATE DATABASE bus_db OWNER my_bus_admin;
\q

psql -U my_bus_admin -d bus_db -h localhost
CREATE EXTENSION postgis;
-- Tạo bảng và chèn dữ liệu như hướng dẫn trên
```

---

### 🧠 Mẹo thêm:
- Bạn có thể quản lý dữ liệu trực quan bằng **pgAdmin 4**.
- Để backup dữ liệu:  
  ```bash
  pg_dump -U my_bus_admin -d bus_db > bus_db_backup.sql
  ```
- Để phục hồi:
  ```bash
  psql -U my_bus_admin -d bus_db -f bus_db_backup.sql
  ```

---

### 📚 Tài liệu tham khảo

- [PostGIS Documentation](https://postgis.net/documentation/)
- [PostgreSQL 15 Docs](https://www.postgresql.org/docs/15/)
- [Leaflet GeoJSON Guide](https://leafletjs.com/examples/geojson/)

---
