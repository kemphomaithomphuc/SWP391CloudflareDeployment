# PENALTY/FEE SYSTEM - IMPLEMENTATION GUIDE

## 📋 Tổng quan

Hệ thống xử lý phí phạt (Penalty/Fee System) dựa trên các Acceptance Criteria (AC) đã định nghĩa.

### Các loại phí phạt:

| Loại | Code | Mô tả | Công thức | AC |
|------|------|-------|-----------|-----|
| **Hủy muộn** | CANCEL | Hủy < 10 phút trước giờ bắt đầu | 10% estimated cost | AC1 |
| **Không đến** | NO_SHOW | Không đến sau 15 phút | 30% estimated cost | AC2 |
| **Quá giờ** | OVERTIME | Pin đầy vẫn kết nối > 1 phút | 2,000 VNĐ/phút | AC3 |

---

## 🏗️ Architecture

### Components Created:

1. **Service Layer:**
   - `PenaltyService.java` - Interface định nghĩa các methods
   - `PenaltyServiceImpl.java` - Implementation xử lý business logic
   - `PenaltyScheduler.java` - Scheduler tự động check no-show

2. **Controller:**
   - `PenaltyController.java` - REST APIs cho penalty management

3. **DTO:**
   - `FeeDetailDTO.java` - DTO cho fee details (AC6)

4. **Entity Updates:**
   - `Fee.java` - Added OVERTIME type
   - Existing: Order, Session, Transaction

---

## 📝 Acceptance Criteria Implementation

### AC1: Hủy lịch muộn (< 10 phút)

**Trigger:** User hủy order BOOKED trong vòng 10 phút trước startTime

**Flow:**
```
1. User calls: POST /api/penalties/cancel/{orderId}
2. Check: now < startTime - 10 minutes?
   - YES → Hủy bình thường, không phí
   - NO  → Hủy muộn:
     a. Tạo Fee CANCEL (10% estimated cost)
     b. Order.status = CANCELED
     c. User.violations += 1
     d. Check auto-lock (violations >= 3)
     e. Send notification
3. Return: Fee info hoặc null
```

**Code:**
```java
Fee cancelFee = penaltyService.handleLateCancellation(orderId, userId, reason);
```

**Response:**
```json
{
  "success": true,
  "message": "Đã hủy lịch. Phí hủy muộn: 50,000 VNĐ",
  "data": {
    "canceled": true,
    "hasLateFee": true,
    "feeAmount": 50000,
    "feeDescription": "Phí hủy lịch muộn (< 10 phút): 10% × 500,000 VNĐ ước tính"
  }
}
```

---

### AC2: Không đến (No-show)

**Trigger:** Scheduler tự động check mỗi 5 phút

**Flow:**
```
1. PenaltyScheduler runs every 5 minutes
2. Find Orders: status=BOOKED AND startTime + 15 minutes < now
3. For each order:
   a. Tạo Fee NO_SHOW (30% estimated cost)
   b. Order.status = CANCELED
   c. User.violations += 1
   d. Check auto-lock (violations >= 3)
   e. Send email + notification
4. Continue với orders khác nếu có lỗi
```

**Scheduler Config:**
```java
@Scheduled(fixedRate = 300000) // Mỗi 5 phút
public void checkNoShowOrders() {
    // Auto check and process
}
```

**Manual Trigger (Admin only):**
```
POST /api/penalties/admin/no-show/{orderId}
```

---

### AC3: Sạc quá giờ (Overtime)

**Trigger:** Real-time khi detect pin đầy nhưng vẫn kết nối

**Flow:**
```
1. System detects: battery = 100% AND still connected
2. For each minute:
   a. Tạo/Update Fee OVERTIME (+2,000 VNĐ)
   b. Session.status = OVERTIME
   c. Send notification real-time
   d. Update WebSocket (TODO)
3. Continue until disconnect
```

**Code:**
```java
Fee overtimeFee = penaltyService.handleOvertimeCharging(sessionId, extraMinutes);
```

**Integration Points:**
```java
// In SessionService when battery reaches 100%
if (battery >= 100 && session.getStatus() == CHARGING) {
    int minutesOver = calculateMinutesOver(session);
    penaltyService.handleOvertimeCharging(sessionId, minutesOver);
}
```

---

### AC4: Tính tổng thanh toán

**Formula:** `Transaction.amount = Session.baseCost + sum(Fee.amount)`

**API:**
```
GET /api/penalties/session/{sessionId}/total
```

**Response:**
```json
{
  "success": true,
  "message": "Tính toán thành công",
  "data": {
    "totalAmount": 580000,
    "baseCost": 500000,
    "totalFees": 80000,
    "feeCount": 2,
    "fees": [
      {
        "feeId": 1,
        "feeType": "OVERTIME",
        "amount": 30000,
        "description": "Phí sạc quá giờ: 15 phút × 2,000 VNĐ/phút"
      },
      {
        "feeId": 2,
        "feeType": "NO_SHOW",
        "amount": 50000,
        "description": "Phí không đến theo lịch: 30% × 500,000 VNĐ ước tính"
      }
    ]
  }
}
```

**Integration với Transaction:**
```java
Double totalAmount = penaltyService.calculateTotalPaymentAmount(sessionId);

Transaction transaction = new Transaction();
transaction.setAmount(totalAmount); // Includes all fees
transaction.setSession(session);
// ... save transaction

// Mark fees as paid
List<Long> feeIds = session.getFees().stream()
    .map(Fee::getFeeId)
    .collect(Collectors.toList());
penaltyService.markFeesAsPaid(feeIds);
```

---

### AC5: Auto-lock khi 3 vi phạm

**Trigger:** Sau mỗi lần tạo fee CANCEL hoặc NO_SHOW

**Flow:**
```
1. User.violations += 1
2. Check: violations >= 3?
   - YES → 
     a. User.status = BANNED
     b. User.reasonReport = "Tự động khóa do vi phạm 3 lần"
     c. Send notification
     d. Return true
   - NO → Return false
3. User needs to re-login for status to take effect (JWT)
```

**Code:**
```java
boolean isLocked = penaltyService.checkAndAutoLockUser(userId);
if (isLocked) {
    // User is now BANNED
    // UserStatusFilter will block main operations
}
```

**Integration với UserStatusFilter:**
- User với status BANNED không thể:
  - Đặt chỗ (orders)
  - Bắt đầu session
  - Quản lý vehicles
  - Etc.

---

### AC6: Xem lịch sử phí

**APIs:**

1. **User Fee History:**
```
GET /api/penalties/user/{userId}/history
```

Response: List of FeeDetailDTO with full context

2. **Session Fee Details:**
```
GET /api/penalties/session/{sessionId}/details
```

Response: List of fees for that session

3. **Unpaid Fees:**
```
GET /api/penalties/user/{userId}/unpaid
```

Response: Fees with isPaid = false

**FeeDetailDTO includes:**
- feeId, feeType, feeTypeName (tiếng Việt)
- amount, description, isPaid, createdAt
- orderId, sessionId, userId, userName
- orderStartTime, orderEndTime
- chargingStationName, chargingPointName

---

### AC7: Cấu hình phí có thể thay đổi

**Current Implementation:**
```java
// In PenaltyServiceImpl
private static final int LATE_CANCEL_MINUTES = 10;
private static final int NO_SHOW_GRACE_MINUTES = 15;
private static final int AUTO_LOCK_VIOLATIONS = 3;

// In FeeCalculationServiceImpl
private static final BigDecimal OVERCHARGE_RATE = new BigDecimal("2000.00"); // VND/minute
private static final BigDecimal NO_SHOW_RATE = new BigDecimal("0.30"); // 30%
private static final BigDecimal CANCEL_RATE = new BigDecimal("0.10"); // 10%
```

**Future Enhancement (Move to SystemConfig):**
```sql
INSERT INTO system_config (config_key, config_value, description) VALUES
('penalty.late_cancel_minutes', '10', 'Số phút tối thiểu để tính phí hủy muộn'),
('penalty.no_show_grace_minutes', '15', 'Số phút grace cho no-show'),
('penalty.overtime_rate', '2000', 'Phí overtime per minute (VNĐ)'),
('penalty.cancel_rate', '0.10', 'Tỷ lệ % phí hủy'),
('penalty.no_show_rate', '0.30', 'Tỷ lệ % phí no-show'),
('penalty.auto_lock_violations', '3', 'Số vi phạm để tự động khóa');
```

**Load from config:**
```java
@Value("${penalty.overtime-rate:2000}")
private BigDecimal overtimeRate;

// Or from SystemConfigService
BigDecimal rate = systemConfigService.getBigDecimal("penalty.overtime_rate", new BigDecimal("2000"));
```

**Important:** Fees đã tạo không bị ảnh hưởng khi config thay đổi (immutable).

---

### AC8: Rollback nếu lỗi

**Implementation:**
```java
@Transactional(rollbackFor = Exception.class)
public Fee handleLateCancellation(...) {
    try {
        // 1. Create fee
        Fee fee = feeCalculationService.calculateCancelFee(order);
        
        // 2. Update order
        order.setStatus(Order.Status.CANCELED);
        orderRepository.save(order);
        
        // 3. Increment violations
        incrementViolationCount(userId, reason);
        
        // 4. Check auto-lock
        checkAndAutoLockUser(userId);
        
        // 5. Send notification
        notificationService.createNotification(...);
        
        return fee;
        
    } catch (Exception e) {
        // Transaction will be rolled back automatically
        // Order, Fee, User all reverted
        log.error("Error: {}", e.getMessage(), e);
        throw new RuntimeException("Lỗi hệ thống: " + e.getMessage());
    }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Lỗi hệ thống khi xử lý hủy lịch: Connection timeout",
  "data": null
}
```

HTTP Status: 400 Bad Request (for business logic errors) or 500 Internal Server Error (for system errors)

---

## 🔗 Integration Points

### 1. OrderService Integration

```java
// In OrderService
public void cancelOrder(Long orderId, Long userId, String reason) {
    // Delegate to PenaltyService
    Fee cancelFee = penaltyService.handleLateCancellation(orderId, userId, reason);
    
    if (cancelFee != null) {
        // Handle late cancellation fee
        log.info("Late cancellation fee: {}", cancelFee.getAmount());
    }
}
```

### 2. SessionService Integration

```java
// In SessionService - when battery reaches 100%
public void checkOvertimeCharging(Long sessionId) {
    Session session = getSession(sessionId);
    
    if (session.getBatteryLevel() >= 100 && session.getStatus() == CHARGING) {
        LocalDateTime fullBatteryTime = session.getFullBatteryTime();
        int minutesOver = Duration.between(fullBatteryTime, LocalDateTime.now()).toMinutes();
        
        if (minutesOver > 0) {
            penaltyService.handleOvertimeCharging(sessionId, minutesOver);
        }
    }
}
```

### 3. PaymentService Integration

```java
// In PaymentService - when creating transaction
public Transaction createTransaction(Long sessionId) {
    // Get total including fees
    Double totalAmount = penaltyService.calculateTotalPaymentAmount(sessionId);
    
    Transaction transaction = new Transaction();
    transaction.setAmount(totalAmount);
    transaction.setSession(session);
    // ... process payment
    
    if (transaction.getStatus() == Transaction.Status.SUCCESS) {
        // Mark fees as paid
        List<Long> feeIds = session.getFees().stream()
            .map(Fee::getFeeId)
            .collect(Collectors.toList());
        penaltyService.markFeesAsPaid(feeIds);
    }
    
    return transaction;
}
```

### 4. WebSocket Integration (TODO)

```java
// For AC3 - real-time overtime fee updates
@MessageMapping("/session/overtime")
public void sendOvertimeFeeUpdate(Long sessionId, Fee overtimeFee) {
    Long userId = session.getOrder().getUser().getUserId();
    
    messagingTemplate.convertAndSendToUser(
        userId.toString(),
        "/queue/overtime-fee",
        FeeDetailDTO.fromEntity(overtimeFee)
    );
}
```

---

## 📊 API Endpoints Summary

### User Endpoints

| Method | Endpoint | Description | AC |
|--------|----------|-------------|-----|
| POST | `/api/penalties/cancel/{orderId}` | Hủy order (có thể có phí) | AC1 |
| GET | `/api/penalties/user/{userId}/history` | Lịch sử phí | AC6 |
| GET | `/api/penalties/user/{userId}/unpaid` | Phí chưa thanh toán | AC6 |
| GET | `/api/penalties/session/{sessionId}/details` | Chi tiết phí session | AC6 |
| GET | `/api/penalties/session/{sessionId}/total` | Tổng thanh toán | AC4 |

### Admin Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/penalties/admin/no-show/{orderId}` | Manual trigger no-show |
| GET | `/api/penalties/admin/unpaid-all` | All unpaid fees |

---

## 🧪 Testing Guide

### Test Case 1: Late Cancellation (AC1)

```bash
# 1. Create order with startTime = now + 5 minutes
POST /api/orders/confirm
{
  "startTime": "2025-11-03T15:05:00",
  ...
}

# 2. Try to cancel (should have fee)
POST /api/penalties/cancel/{orderId}
{
  "reason": "Test late cancellation"
}

# Expected: 403 with fee info (10%)
```

### Test Case 2: Normal Cancellation (AC1)

```bash
# 1. Create order with startTime = now + 2 hours
POST /api/orders/confirm
{
  "startTime": "2025-11-03T17:00:00",
  ...
}

# 2. Cancel immediately
POST /api/penalties/cancel/{orderId}
{
  "reason": "Changed plans"
}

# Expected: 200 OK, no fee
```

### Test Case 3: No-Show (AC2)

```bash
# 1. Create order with startTime = now - 20 minutes
# (Manually in DB for testing)

# 2. Wait for scheduler or trigger manually
POST /api/penalties/admin/no-show/{orderId}

# Expected: Fee created (30%), order canceled, violations +1
```

### Test Case 4: Overtime Charging (AC3)

```bash
# 1. Start session
POST /api/sessions/start

# 2. Simulate battery full + 10 minutes
# (Call from SessionService)
penaltyService.handleOvertimeCharging(sessionId, 10);

# Expected: Fee = 20,000 VNĐ (10 minutes × 2,000)
```

### Test Case 5: Auto-Lock (AC5)

```bash
# 1. Create 3 late cancellations for same user
POST /api/penalties/cancel/{orderId1}  # violations = 1
POST /api/penalties/cancel/{orderId2}  # violations = 2
POST /api/penalties/cancel/{orderId3}  # violations = 3, AUTO BANNED

# 2. Check user status
GET /api/users/{userId}

# Expected: status = "BANNED", reasonReport contains violations
```

### Test Case 6: Total Payment (AC4)

```bash
# 1. Complete session with fees
GET /api/penalties/session/{sessionId}/total

# Expected:
{
  "totalAmount": 580000,
  "baseCost": 500000,
  "totalFees": 80000,
  "fees": [...]
}
```

### Test Case 7: Fee History (AC6)

```bash
GET /api/penalties/user/{userId}/history

# Expected: List of all fees with details
```

---

## 🔧 Configuration

### Application Properties

```properties
# Penalty System Configuration
penalty.late-cancel-minutes=10
penalty.no-show-grace-minutes=15
penalty.overtime-rate=2000
penalty.cancel-rate=0.10
penalty.no-show-rate=0.30
penalty.auto-lock-violations=3

# Scheduler
spring.task.scheduling.pool.size=5
```

### Scheduler Control

```java
// In PenaltyScheduler
@Scheduled(fixedRate = 300000) // 5 minutes
public void checkNoShowOrders() { ... }

@Scheduled(fixedRate = 180000) // 3 minutes
public void sendNoShowReminders() { ... }

@Scheduled(cron = "0 0 2 * * *") // 2:00 AM daily
public void cleanupOldOrders() { ... }
```

---

## 🚨 Error Handling

### Business Logic Errors

```java
// ApiRequestException - 400 Bad Request
throw new ApiRequestException("Order không tồn tại");
throw new ApiRequestException("Bạn không có quyền hủy order này");
```

### System Errors

```java
// RuntimeException - 500 Internal Server Error
throw new RuntimeException("Lỗi hệ thống: " + e.getMessage());
```

### Transaction Rollback

```java
@Transactional(rollbackFor = Exception.class)
// Any exception will rollback entire transaction
```

---

## 📈 Monitoring & Logging

### Log Levels

```java
log.info("AC1: Processing late cancellation for order {}", orderId);
log.warn("Late cancellation detected: {} minutes before start", minutes);
log.error("Error in handleLateCancellation: {}", e.getMessage(), e);
```

### Metrics to Track

- Total fees created per type
- Average fee amount per type
- No-show rate (%)
- Late cancellation rate (%)
- Users auto-locked count
- Unpaid fees total amount

---

## ✅ Checklist

- [x] PenaltyService interface created
- [x] PenaltyServiceImpl implemented
- [x] PenaltyScheduler created
- [x] PenaltyController created
- [x] FeeDetailDTO created
- [x] Fee.Type updated with OVERTIME
- [x] @EnableScheduling added
- [x] AC1: Late cancellation implemented
- [x] AC2: No-show implemented with scheduler
- [x] AC3: Overtime charging implemented
- [x] AC4: Total payment calculation implemented
- [x] AC5: Auto-lock implemented
- [x] AC6: Fee history APIs implemented
- [x] AC7: Configuration documented
- [x] AC8: Transaction rollback implemented
- [ ] WebSocket integration for real-time updates
- [ ] Email service integration
- [ ] SystemConfig integration
- [ ] Admin UI for fee management
- [ ] Comprehensive unit tests
- [ ] Integration tests

---

## 🔜 Next Steps

1. **Testing:**
   - Unit tests for all service methods
   - Integration tests for complete flows
   - Test with real database

2. **WebSocket Integration:**
   - Real-time overtime fee updates (AC3)
   - Notifications for fee creation

3. **Email Integration:**
   - Send email for no-show (AC2)
   - Send email when user is locked (AC5)

4. **Admin Features:**
   - Dashboard for fee statistics
   - Manual fee adjustment
   - Violation history management

5. **Frontend Integration:**
   - Display fees in transaction history
   - Show unpaid fees
   - Confirm dialog for late cancellations
   - Real-time overtime fee display

6. **Optimization:**
   - Move config to SystemConfig table
   - Cache fee calculations
   - Batch processing for scheduler

---

**Implementation Date:** 2025-11-03  
**Version:** 1.0  
**Status:** ✅ Core Implementation Complete

