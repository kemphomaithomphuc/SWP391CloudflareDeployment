# USER STATUS RESTRICTION IMPLEMENTATION

## Tổng quan (Overview)

Hệ thống cho phép người dùng có status là **BANNED** hoặc **INACTIVE** vẫn có thể đăng nhập, nhưng sẽ bị giới hạn không thể sử dụng các chức năng chính (main flow services).

## User Status Types

### 1. ACTIVE ✅
- Người dùng có thể sử dụng toàn bộ chức năng
- Không bị hạn chế gì

### 2. INACTIVE ⏸️
- Tài khoản chưa được kích hoạt hoặc đang tạm ngưng
- **Được phép:**
  - Đăng nhập
  - Xem thông tin cá nhân
  - Xem danh sách trạm sạc
  - Xem thông tin xe, connector types, car models
  - Đọc notifications
  
- **Không được phép:**
  - Đặt chỗ sạc (booking orders)
  - Bắt đầu phiên sạc (charging sessions)
  - Quản lý phương tiện (thêm/sửa/xóa vehicles)
  - Tạo báo cáo sự cố (issue reports)
  - Thực hiện giao dịch (transactions)
  - Đăng ký gói subscription
  - Cập nhật thông tin cá nhân

### 3. BANNED 🚫
- Tài khoản bị khóa do vi phạm
- **Được phép:** (giống INACTIVE)
  - Đăng nhập
  - Xem thông tin cá nhân
  - Xem danh sách trạm sạc
  - Xem thông tin xe, connector types, car models
  - Đọc notifications
  
- **Không được phép:** (giống INACTIVE)
  - Tất cả các hoạt động chính

## Kiến trúc Implementation

### 1. UserStatusFilter (Filter Layer)

**File:** `src/main/java/swp391/code/swp391/filter/UserStatusFilter.java`

Filter này được chạy sau `BearerTokenAuthenticationFilter` và kiểm tra status từ JWT token.

**Cơ chế hoạt động:**
1. Check nếu endpoint là public → Cho phép truy cập
2. Check nếu endpoint là read-only (GET requests) → Cho phép truy cập
3. Check nếu endpoint là main flow → Kiểm tra status:
   - BANNED → Trả về 403 với message
   - INACTIVE → Trả về 403 với message
   - ACTIVE → Cho phép truy cập

**Main Flow Endpoints được bảo vệ:**
```
/api/orders/**           - Đặt chỗ sạc
/api/sessions/**         - Quản lý phiên sạc
/api/vehicles/**         - Quản lý phương tiện (trừ GET)
/api/issue-reports/**    - Báo cáo sự cố
/api/transactions/**     - Giao dịch
/api/users/{id}/update   - Cập nhật profile
/api/subscriptions/*/subscribe - Đăng ký gói
```

**Read-Only Endpoints (Allowed for all):**
```
GET /api/users/**
GET /api/charging-stations/**
GET /api/connector-types/**
GET /api/car-models/**
GET /api/subscriptions/**
GET /api/notifications/**
GET /api/vehicles/user/{id}
```

### 2. UserStatusException (Exception Layer)

**File:** `src/main/java/swp391/code/swp391/exception/UserStatusException.java`

Custom exception chứa thông tin về:
- User status (BANNED/INACTIVE)
- Error message
- Reason code

### 3. GlobalExceptionHandler Enhancement

**File:** `src/main/java/swp391/code/swp391/exception/GlobalExceptionHandler.java`

Thêm handler cho `UserStatusException`:
```java
@ExceptionHandler(UserStatusException.class)
public ResponseEntity<APIResponse<Object>> handleUserStatusException(UserStatusException ex)
```

Response format:
```json
{
  "success": false,
  "message": "Tài khoản của bạn đã bị khóa...",
  "data": {
    "status": "BANNED",
    "reason": "USER_BANNED"
  }
}
```

### 4. UserStatusChecker (Utility Layer)

**File:** `src/main/java/swp391/code/swp391/util/UserStatusChecker.java`

Utility class để kiểm tra status trong service layer.

**Methods:**
- `requireActiveStatus()` - Throw exception nếu user không ACTIVE
- `requireActiveStatus(User user)` - Kiểm tra status của user cụ thể
- `getCurrentUserStatus()` - Lấy status của user hiện tại
- `isCurrentUserActive()` - Check nếu user ACTIVE
- `isCurrentUserBanned()` - Check nếu user BANNED
- `isCurrentUserInactive()` - Check nếu user INACTIVE

## Cách sử dụng trong Service Layer

### Option 1: Sử dụng UserStatusChecker

```java
@Service
@RequiredArgsConstructor
public class OrderServiceImpl {
    
    private final UserStatusChecker userStatusChecker;
    
    public void createOrder(OrderRequestDTO request) {
        // Kiểm tra status trước khi thực hiện
        userStatusChecker.requireActiveStatus();
        
        // Logic tạo order
        // ...
    }
}
```

### Option 2: Manual Check

```java
@Service
public class SessionService {
    
    public void startSession(Long userId, ...) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new UserStatusException(
                user.getStatus(),
                "Không thể bắt đầu phiên sạc. Tài khoản không ở trạng thái ACTIVE"
            );
        }
        
        // Logic start session
        // ...
    }
}
```

## Response Examples

### 1. BANNED User trying to create order

**Request:**
```http
POST /api/orders/confirm
Authorization: Bearer <token_with_banned_status>
```

**Response:**
```json
{
  "success": false,
  "message": "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin để biết thêm chi tiết.",
  "data": {
    "status": "BANNED",
    "reason": "USER_BANNED"
  }
}
```
**Status Code:** 403 Forbidden

### 2. INACTIVE User trying to start session

**Request:**
```http
POST /api/sessions/start
Authorization: Bearer <token_with_inactive_status>
```

**Response:**
```json
{
  "success": false,
  "message": "Tài khoản của bạn chưa được kích hoạt. Vui lòng kích hoạt tài khoản để sử dụng dịch vụ.",
  "data": {
    "status": "INACTIVE",
    "reason": "USER_INACTIVE"
  }
}
```
**Status Code:** 403 Forbidden

### 3. BANNED User viewing charging stations (Allowed)

**Request:**
```http
GET /api/charging-stations
Authorization: Bearer <token_with_banned_status>
```

**Response:**
```json
{
  "success": true,
  "message": "Success",
  "data": [
    {
      "stationId": 1,
      "stationName": "Station A",
      ...
    }
  ]
}
```
**Status Code:** 200 OK

## JWT Token Structure

Status được nhúng trong JWT token khi generate:

```java
JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
    .subject(user.getUsername())
    .claim("roles", user.getAuthorities()...)
    .claim("status", user.getUser().getStatus().name()) // ACTIVE/BANNED/INACTIVE
    .issueTime(issueTime)
    .expirationTime(expiredTime)
    .build();
```

## Testing Guide

### Test Case 1: BANNED user cannot create order
```
1. Login với user có status = BANNED
2. Thử POST /api/orders/confirm
3. Expected: 403 Forbidden với message về BANNED
```

### Test Case 2: INACTIVE user cannot start session
```
1. Login với user có status = INACTIVE
2. Thử POST /api/sessions/start
3. Expected: 403 Forbidden với message về INACTIVE
```

### Test Case 3: BANNED user can view stations
```
1. Login với user có status = BANNED
2. Thử GET /api/charging-stations
3. Expected: 200 OK với danh sách stations
```

### Test Case 4: BANNED user can view own profile
```
1. Login với user có status = BANNED
2. Thử GET /api/users/{userId}
3. Expected: 200 OK với thông tin user
```

### Test Case 5: ACTIVE user can do everything
```
1. Login với user có status = ACTIVE
2. Thử tất cả endpoints
3. Expected: Hoạt động bình thường
```

## Configuration in SecurityConfig

Filter chain order:
```
1. JwtBlacklistFilter
2. BearerTokenAuthenticationFilter
3. UserStatusFilter ← Check status here
4. AuthorizationFilter
```

## Admin Management

Admin có thể:
1. Xem danh sách user theo status:
   ```
   GET /api/admin/users?status=BANNED
   GET /api/admin/users?status=INACTIVE
   ```

2. Thay đổi status của user:
   ```
   PUT /api/admin/users/{userId}/status
   Body: { "status": "BANNED", "reason": "Vi phạm quy định..." }
   ```

3. Xem lý do ban:
   - User entity có field `reasonReport` để lưu lý do

## Notes

- Filter chỉ check status từ JWT token, không query database
- Nếu status thay đổi trong DB, user cần logout và login lại để JWT được cập nhật
- Admin và Staff không bị ảnh hưởng bởi filter này (có role-based check riêng)
- WebSocket connections vẫn được phép cho tất cả authenticated users

## Future Enhancements

1. **Real-time status update:**
   - Implement WebSocket notification khi status thay đổi
   - Force logout user khi bị BANNED

2. **Detailed restriction:**
   - Cho phép config chi tiết hơn về từng endpoint
   - Support multiple restriction levels

3. **Audit log:**
   - Log tất cả attempts của BANNED/INACTIVE users
   - Tracking violations

