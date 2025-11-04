# USER STATUS RESTRICTION - QUICK START GUIDE

## Tóm tắt nhanh

### Người dùng BANNED/INACTIVE:
- ✅ **Được phép:** Đăng nhập, xem thông tin (GET requests)
- ❌ **Không được phép:** Đặt chỗ, sạc xe, quản lý phương tiện, giao dịch

---

## 1. Files đã được tạo/cập nhật

### Mới tạo:
- ✅ `exception/UserStatusException.java` - Custom exception cho status restriction
- ✅ `util/UserStatusChecker.java` - Utility để check status trong service layer
- ✅ `doc/USER_STATUS_RESTRICTION.md` - Tài liệu chi tiết

### Đã cập nhật:
- ✅ `filter/UserStatusFilter.java` - Filter để check status từ JWT
- ✅ `exception/GlobalExceptionHandler.java` - Handler cho UserStatusException

---

## 2. Cách hoạt động

### Flow Diagram:
```
Request → JWT Auth → UserStatusFilter → Check Status
                            ↓
                    Is Public Endpoint? → Yes → Allow ✅
                            ↓ No
                    Is Read-Only (GET)? → Yes → Allow ✅
                            ↓ No
                    Is Main Flow? → Yes → Check Status
                            ↓                    ↓
                            No              ACTIVE? → Yes → Allow ✅
                            ↓                    ↓ No
                        Allow ✅         Return 403 ❌ BANNED/INACTIVE
```

---

## 3. Endpoints Classification

### 🟢 Public (No Auth Required)
```
/api/auth/**
/api/otp/**
/api/payment/**
/api/test/**
```

### 🔵 Read-Only (All authenticated users)
```
GET /api/users/**
GET /api/charging-stations/**
GET /api/connector-types/**
GET /api/car-models/**
GET /api/subscriptions/**
GET /api/notifications/**
GET /api/vehicles/user/{id}
```

### 🔴 Main Flow (Requires ACTIVE status)
```
/api/orders/**          - Booking orders
/api/sessions/**        - Charging sessions
/api/vehicles/**        - Manage vehicles (POST/PUT/DELETE)
/api/issue-reports/**   - Create reports
/api/transactions/**    - Transactions
/api/users/{id}/update  - Update profile
/api/subscriptions/*/subscribe
```

---

## 4. Sử dụng trong Service Layer

### Option A: Inject UserStatusChecker (Recommended)

```java
@Service
@RequiredArgsConstructor
public class YourService {
    
    private final UserStatusChecker userStatusChecker;
    
    public void sensitiveOperation() {
        // Check status before operation
        userStatusChecker.requireActiveStatus();
        
        // Your logic here
    }
}
```

### Option B: Manual Check

```java
@Service
public class YourService {
    
    public void operation(User user) {
        if (user.getStatus() != User.UserStatus.ACTIVE) {
            throw new UserStatusException(
                user.getStatus(),
                "Cannot perform this operation",
                "USER_NOT_ACTIVE"
            );
        }
        
        // Your logic here
    }
}
```

---

## 5. Testing Examples

### Test 1: BANNED user trying to book
```bash
# Login as BANNED user
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "banned@example.com", "password": "password"}'

# Try to book (should fail with 403)
curl -X POST http://localhost:8080/api/orders/confirm \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{...order data...}'

# Expected Response:
{
  "success": false,
  "message": "Tài khoản của bạn đã bị khóa...",
  "data": {
    "status": "BANNED",
    "reason": "USER_BANNED"
  }
}
```

### Test 2: BANNED user viewing stations (should work)
```bash
# View stations (should succeed with 200)
curl -X GET http://localhost:8080/api/charging-stations \
  -H "Authorization: Bearer <token>"

# Expected: 200 OK with stations list
```

---

## 6. Admin Operations

### Change user status:
```java
// In AdminController or UserService
public void banUser(Long userId, String reason) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    
    user.setStatus(User.UserStatus.BANNED);
    user.setReasonReport(reason);
    userRepository.save(user);
    
    // User needs to re-login for new status to take effect
}
```

### Get users by status:
```java
// Already exists in UserRepository
List<User> bannedUsers = userRepository.findByStatus(User.UserStatus.BANNED);
List<User> inactiveUsers = userRepository.findByStatus(User.UserStatus.INACTIVE);
```

---

## 7. Response Format

### Success (Active User):
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": { ... }
}
```

### Forbidden (Banned User):
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

### Forbidden (Inactive User):
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

---

## 8. Important Notes

⚠️ **JWT Token Update:**
- Status được lưu trong JWT token
- Khi thay đổi status trong DB, user cần **logout và login lại** để token được cập nhật
- Filter chỉ check status từ token, không query database

⚠️ **Role vs Status:**
- **Role:** ADMIN, STAFF, DRIVER (quyền hạn)
- **Status:** ACTIVE, INACTIVE, BANNED (trạng thái tài khoản)
- Filter check cả role VÀ status

⚠️ **Thứ tự Filter:**
```
1. JwtBlacklistFilter (check token bị revoke)
2. BearerTokenAuthenticationFilter (xác thực JWT)
3. UserStatusFilter (check status) ← New
4. AuthorizationFilter (check role)
```

---

## 9. Frontend Integration

### Check status from JWT:
```javascript
// Decode JWT token
const token = localStorage.getItem('accessToken');
const decoded = jwt_decode(token);

// Check status
if (decoded.status === 'BANNED') {
  showBannedMessage();
} else if (decoded.status === 'INACTIVE') {
  showInactiveMessage();
}
```

### Handle 403 responses:
```javascript
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data.data?.reason === 'USER_BANNED') {
        // Show banned message
        alert(data.message);
        // Optionally logout
      } else if (data.data?.reason === 'USER_INACTIVE') {
        // Show inactive message
        alert(data.message);
      }
    }
    return Promise.reject(error);
  }
);
```

---

## 10. Database Setup

Đảm bảo User table có columns:
```sql
status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
violations INT NOT NULL DEFAULT 0,
reason_report TEXT
```

Enum values: `ACTIVE`, `INACTIVE`, `BANNED`

---

## Checklist

✅ UserStatusFilter created and configured
✅ UserStatusException created  
✅ GlobalExceptionHandler updated
✅ UserStatusChecker utility created
✅ Documentation created
✅ Filter chain order correct
✅ JWT includes status claim
✅ Repository has status queries

## Next Steps

1. **Test với Postman:**
   - Tạo user với mỗi status
   - Test các endpoints khác nhau
   - Verify responses

2. **Frontend Integration:**
   - Handle 403 responses
   - Show appropriate messages
   - Disable UI buttons based on status

3. **Admin Dashboard:**
   - Add UI để thay đổi user status
   - Show banned/inactive users list
   - Add reason field khi ban user

---

**Need Help?** Check `doc/USER_STATUS_RESTRICTION.md` for detailed documentation.

