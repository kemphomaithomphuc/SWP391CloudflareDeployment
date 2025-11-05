# ✅ USER STATUS & PENALTY SYSTEM - FINAL SUMMARY

## 🎯 Logic đã được sửa lại theo yêu cầu

### User Status Enum (chỉ 2 status chính):
```java
public enum UserStatus {
    ACTIVE,    // Hoạt động bình thường
    INACTIVE,  // Chưa kích hoạt tài khoản
    BANNED     // TẠM KHÓA do vi phạm >= 3 lần, có thể mở bằng thanh toán phí
}
```

**Lưu ý quan trọng:** 
- **KHÔNG CÓ KHÓA VĨNH VIỄN**
- **BANNED** là khóa TẠM THỜI, có thể mở khóa bằng thanh toán phí phạt
- Chỉ có 2 status chính: **ACTIVE** và **INACTIVE**

---

## 🔄 Flow hoạt động

### 1. Vi phạm → Auto-Ban

```
User vi phạm (late cancel / no-show)
  ↓
violations += 1
  ↓
violations >= 3?
  ↓ YES
User.status = BANNED (tạm khóa)
User.reasonReport = "Tự động khóa do vi phạm 3 lần. Thanh toán phí phạt để mở khóa."
Send notification: "Thanh toán phí phạt để mở khóa"
```

**Code:**
```java
if (user.getViolations() >= 3) {
    user.setStatus(User.UserStatus.BANNED); // Tạm khóa
    user.setReasonReport("Tự động khóa do vi phạm 3 lần...");
    // Gửi notification
}
```

### 2. Thanh toán phí → Auto-Unlock

```
User thanh toán ALL unpaid fees
  ↓
Check: user.status == BANNED && !hasUnpaidFees(userId)?
  ↓ YES
User.status = ACTIVE (mở khóa)
User.reasonReport += "[Mở khóa] Tài khoản được mở khóa sau khi thanh toán phí phạt."
Send notification: "Tài khoản đã được mở khóa"
```

**Code:**
```java
// Sau khi thanh toán thành công
if (user.getStatus() == User.UserStatus.BANNED && !hasUnpaidFees(userId)) {
    user.setStatus(User.UserStatus.ACTIVE);
    // Gửi notification
}
```

---

## 📊 So sánh Status

| Status | Mô tả | Nguyên nhân | Có thể mở khóa? | Cách mở khóa |
|--------|-------|-------------|-----------------|--------------|
| **ACTIVE** | Hoạt động bình thường | - | N/A | - |
| **INACTIVE** | Chưa kích hoạt | Đăng ký mới | ✅ Yes | Verify email |
| **BANNED** | Tạm khóa | violations >= 3 | ✅ **Yes** | **Thanh toán phí phạt** |

---

## 🔧 Implementation Files

### 1. User.java
```java
public enum UserStatus {
    ACTIVE, INACTIVE, BANNED
}
```

### 2. PenaltyServiceImpl.java

**Auto-Ban (violations >= 3):**
```java
@Override
public boolean checkAndAutoLockUser(Long userId) {
    User user = userRepository.findById(userId)...;
    
    if (user.getViolations() >= 3) {
        user.setStatus(User.UserStatus.BANNED);
        user.setReasonReport("Tự động khóa do vi phạm 3 lần. Thanh toán phí phạt để mở khóa.");
        userRepository.save(user);
        
        // Send notification
        return true;
    }
    return false;
}
```

**Auto-Unlock (sau thanh toán):**
```java
@Override
public boolean unlockUserAfterPayment(Long userId) {
    User user = userRepository.findById(userId)...;
    
    if (user.getStatus() != User.UserStatus.BANNED) {
        return false; // Không phải BANNED
    }
    
    if (hasUnpaidFees(userId)) {
        return false; // Còn phí chưa thanh toán
    }
    
    // Mở khóa
    user.setStatus(User.UserStatus.ACTIVE);
    user.setReasonReport(user.getReasonReport() + 
        "\n[Mở khóa] Đã thanh toán phí phạt.");
    userRepository.save(user);
    
    // Send notification
    return true;
}
```

**Check có thể mở khóa:**
```java
@Override
public boolean canUnlockUser(Long userId) {
    User user = userRepository.findById(userId)...;
    return user.getStatus() == User.UserStatus.BANNED && 
           !hasUnpaidFees(userId);
}
```

### 3. UserStatusFilter.java

**Block BANNED users từ main flow:**
```java
if (isMainFlowEndpoint(requestURI)) {
    if ("BANNED".equals(status)) {
        // Block với message: "Thanh toán phí phạt để mở khóa"
        sendBannedUserResponse(response);
        return;
    }
}
```

**BANNED users được phép:**
- ✅ Login/logout
- ✅ Xem profile, fees, history
- ✅ **Thanh toán phí phạt**

**BANNED users KHÔNG được phép:**
- ❌ Create orders
- ❌ Start sessions
- ❌ Manage vehicles
- ❌ Other main operations

---

## 🔗 Integration với Payment Service

```java
// In PaymentServiceImpl.completePayment()
@Override
@Transactional
public void completePayment(Long transactionId) {
    Transaction transaction = transactionRepository.findById(transactionId)...;
    
    transaction.setStatus(Transaction.Status.SUCCESS);
    transactionRepository.save(transaction);
    
    // Đánh dấu fees đã thanh toán
    List<Fee> fees = feeCalculationService.getSessionFees(sessionId);
    fees.forEach(fee -> {
        fee.setIsPaid(true);
        feeRepository.save(fee);
    });
    
    // ============ TỰ ĐỘNG MỞ KHÓA ============
    Long userId = transaction.getUser().getUserId();
    
    // Kiểm tra và mở khóa nếu đủ điều kiện
    if (penaltyService.canUnlockUser(userId)) {
        boolean unlocked = penaltyService.unlockUserAfterPayment(userId);
        if (unlocked) {
            log.info("Auto-unlocked user {} after payment", userId);
        }
    }
    
    // Send notification
    // Send invoice email
}
```

---

## 📱 Frontend Flow

### 1. User bị BANNED

```javascript
// Check từ JWT
const decoded = jwt_decode(token);

if (decoded.status === 'BANNED') {
    // Show locked screen
    showBannedScreen({
        violations: decoded.violations,
        unpaidFees: await fetchUnpaidFees()
    });
}
```

### 2. Payment Screen

```jsx
function BannedScreen() {
    const { unpaidFees } = useUnpaidFees();
    const total = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0);
    
    return (
        <div>
            <h2>⚠️ Tài khoản bị khóa do vi phạm</h2>
            <p>Bạn đã vi phạm 3 lần. Thanh toán phí để mở khóa.</p>
            
            <div>
                <h3>Phí phạt: {formatMoney(total)}</h3>
                <ul>
                    {unpaidFees.map(fee => (
                        <li key={fee.feeId}>
                            {fee.feeTypeName}: {formatMoney(fee.amount)}
                        </li>
                    ))}
                </ul>
            </div>
            
            <button onClick={() => payAllFees()}>
                Thanh toán {formatMoney(total)}
            </button>
        </div>
    );
}
```

### 3. Sau khi thanh toán

```javascript
// Payment success callback
function onPaymentSuccess() {
    // Force logout để refresh JWT
    logout();
    
    // Show success message
    showMessage("Thanh toán thành công! Tài khoản đã được mở khóa.");
    
    // Redirect to login
    router.push('/login');
}
```

---

## 🧪 Testing Scenarios

### Test 1: Auto-Ban

```
1. User vi phạm lần 1 → violations=1, status=ACTIVE
2. User vi phạm lần 2 → violations=2, status=ACTIVE
3. User vi phạm lần 3 → violations=3, status=BANNED ✅
4. Try to create order → 403 Forbidden ✅
5. Can view unpaid fees ✅
```

### Test 2: Payment & Unlock

```
1. User with status=BANNED, 3 unpaid fees (total: 150k)
2. Pay all fees → status=ACTIVE ✅
3. Logout & login → JWT updated ✅
4. Can use services ✅
```

### Test 3: Partial Payment

```
1. User with status=BANNED, 3 unpaid fees
2. Pay 2 fees → status=BANNED (still has 1 unpaid)
3. Cannot use services yet ✅
4. Pay last fee → status=ACTIVE ✅
```

---

## ⚠️ Important Notes

### 1. JWT Must Be Refreshed

```
User thanh toán → status=ACTIVE trong DB
Nhưng JWT vẫn có status=BANNED ❌

Solution: User phải logout và login lại
→ Generate new JWT với status=ACTIVE ✅
```

### 2. Không có khóa vĩnh viễn

```
BANNED ≠ Khóa vĩnh viễn
BANNED = Tạm khóa, có thể mở bằng thanh toán

Muốn khóa vĩnh viễn → Admin thay đổi status manually
(Hoặc set violations = 9999 để không thể mở khóa)
```

### 3. Logic thanh toán

```
Chỉ mở khóa khi:
1. user.status == BANNED
2. !hasUnpaidFees(userId) → Đã thanh toán HẾT phí

Không mở khóa nếu:
1. Còn bất kỳ fee nào chưa thanh toán
2. User không phải BANNED
3. Payment failed
```

---

## 📊 Database

```sql
-- User table
status ENUM('ACTIVE', 'INACTIVE', 'BANNED') NOT NULL DEFAULT 'ACTIVE'
violations INT NOT NULL DEFAULT 0
reason_report TEXT

-- Sample data: User bị banned
UPDATE users 
SET status = 'BANNED', 
    violations = 3,
    reason_report = 'Tự động khóa do vi phạm 3 lần. Thanh toán phí phạt để mở khóa.'
WHERE user_id = 1;

-- Check unpaid fees
SELECT * FROM Fee 
WHERE is_paid = FALSE 
AND (order_id IN (SELECT order_id FROM orders WHERE user_id = 1)
     OR session_id IN (SELECT session_id FROM session WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = 1)));
```

---

## 🎯 Summary

### Status Flow:

```
ACTIVE → Vi phạm x3 → BANNED → Thanh toán → ACTIVE
  ↑                                            ↓
  └────────────────────────────────────────────┘
           (Chu trình có thể lặp lại)
```

### Key Points:

1. ✅ **BANNED là tạm khóa**, KHÔNG phải vĩnh viễn
2. ✅ **Thanh toán HẾT phí** → Tự động mở khóa
3. ✅ **violations >= 3** → Tự động BANNED
4. ✅ **Phải re-login** sau khi mở khóa để refresh JWT
5. ✅ **INACTIVE vẫn giữ nguyên**, không bị ảnh hưởng

### Files Modified:

- ✅ User.java - UserStatus enum (ACTIVE, INACTIVE, BANNED)
- ✅ PenaltyServiceImpl.java - Auto-ban & unlock logic
- ✅ PenaltyService.java - unlockUserAfterPayment(), canUnlockUser()
- ✅ UserStatusFilter.java - Block BANNED from main flow
- ✅ UserStatusChecker.java - Remove LOCKED references

### Files Removed:

- ❌ UnlockService.java (không cần thiết, logic đã có trong PenaltyService)
- ❌ UnlockServiceImpl.java (không cần thiết)
- ❌ LOCKED_STATUS_GUIDE.md (logic cũ, không còn đúng)

---

**Implementation Date:** 2025-11-03  
**Status:** ✅ Complete  
**Logic:** BANNED = Temporary lock, can be unlocked by payment  
**No permanent ban!**

