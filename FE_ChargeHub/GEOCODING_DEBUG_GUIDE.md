# Hướng dẫn Debug GeocodingControl

## Vấn đề có thể gặp phải:

### 1. **API Key không đúng hoặc thiếu**
- Kiểm tra file `.env` có chứa `VITE_MAPTILER_API_KEY`
- Mở Developer Console (F12) và xem log "MapTiler API Key: Đã có" hoặc "THIẾU"

### 2. **GeocodingControl không tồn tại trong SDK**
- Kiểm tra log "maptilersdk.GeocodingControl: function" hoặc "undefined"
- Nếu undefined, sẽ tự động chuyển sang Custom Search Control

### 3. **Element không hiển thị**
- Kiểm tra log "Found geocoder element with selector: ..."
- Nếu không có log này, GeocodingControl không được render

### 4. **Custom Search Control**
- Nếu GeocodingControl không hoạt động, sẽ tự động tạo Custom Search Control
- Custom control sẽ xuất hiện ở góc trên bên trái bản đồ

## Cách kiểm tra:

1. **Mở Developer Console (F12)**
2. **Reload trang**
3. **Xem các log sau:**
   ```
   MapTiler API Key: Đã có
   maptilersdk.GeocodingControl: function
   GeocodingControl đã được thêm vào map
   Found geocoder element with selector: .maplibregl-ctrl-geocoder
   ```

4. **Nếu thấy log lỗi:**
   ```
   VITE_MAPTILER_API_KEY không được cấu hình!
   GeocodingControl không tồn tại trong maptilersdk
   Custom search control đã được tạo
   ```

## Giải pháp:

### Nếu thiếu API Key:
1. Tạo file `.env` trong thư mục gốc
2. Thêm dòng: `VITE_MAPTILER_API_KEY=your_api_key_here`
3. Restart development server

### Nếu GeocodingControl không hoạt động:
- Custom Search Control sẽ được tạo tự động
- Có chức năng tương tự như GeocodingControl
- Tìm kiếm trong dataset POI và di chuyển bản đồ

### Nếu vẫn không hiển thị:
- Kiểm tra CSS có bị ẩn không
- Kiểm tra z-index
- Thử thay đổi position của control

## Custom Search Control Features:
- Tìm kiếm theo tên POI
- Tìm kiếm theo địa chỉ POI
- Hiển thị dropdown kết quả
- Click để di chuyển bản đồ
- Tự động đóng khi click bên ngoài
