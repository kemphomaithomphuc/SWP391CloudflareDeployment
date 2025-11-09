# ✅ SUBSCRIPTION PAYMENT - CHỈ VNPAY

## 📋 THAY ĐỔI QUAN TRỌNG

**Subscription payment giờ CHỈ HỖ TRỢ VNPAY, KHÔNG CÒN CASH!**

---

## 🎯 LÝ DO THAY ĐỔI

### **Tại sao bỏ CASH cho subscription?**
1. ✅ **Bảo mật cao hơn:** VNPay có xác thực 2 lớp
2. ✅ **Tự động hóa:** Không cần staff xử lý manual
3. ✅ **Chống gian lận:** Giao dịch được verify qua ngân hàng
4. ✅ **Truy vết tốt hơn:** Có transaction ID từ VNPay
5. ✅ **Professional:** Phù hợp với gói trả phí định kỳ

---

## 🔄 LUỒNG THANH TOÁN MỚI

### **Bước 1: User chọn gói subscription**
```
FE: Hiển thị BASIC, PLUS, PREMIUM
User: Click "Mua gói"
```

### **Bước 2: Khởi tạo thanh toán VNPay**
```http
POST /api/payment/subscription
Parameters:
  - userId: Long
  - subscriptionId: Long
  - returnUrl: String
  - bankCode: String (optional)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": 123,
    "amount": 50000,
    "paymentMethod": "VNPAY",
    "status": "PENDING",
    "message": "Đang chuyển hướng đến cổng thanh toán VNPay cho gói PLUS",
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?..."
  }
}
```

### **Bước 3: User thanh toán trên VNPay**
```
FE: Redirect đến paymentUrl
User: Chọn ngân hàng, nhập thông tin, xác nhận
VNPay: Xử lý giao dịch
```

### **Bước 4: VNPay callback**
```
VNPay → BE: GET /api/payment/vnpay/callback?...
BE: Verify signature
BE: Call processSubscriptionVNPayCallback(transactionId)
```

### **Bước 5: Cập nhật subscription**
```java
// Trong processSubscriptionVNPayCallback()
1. Update transaction → SUCCESS
2. Find subscription by price
3. Update user.subscription
4. Set startDate, endDate
5. Send notification
```

### **Bước 6: Redirect user về FE**
```
BE → FE: Redirect với success=true
FE: Hiển thị "Thanh toán thành công!"
User: Hưởng quyền lợi gói subscription
```

---

## 📝 API CHANGES

### **Old API (DEPRECATED):**
```http
POST /api/payment/subscription?userId=1&subscriptionId=2&paymentMethod=CASH
```
**❌ Không còn hoạt động!**

### **New API:**
```http
POST /api/payment/subscription
  ?userId=1
  &subscriptionId=2
  &returnUrl=http://localhost:3000/payment/callback
  &bankCode=NCB
```

**✅ CHỈ tạo VNPay payment URL**

---

## 🔧 CODE CHANGES

### **1. PaymentService Interface**
```java
// Old
PaymentResponseDTO payForSubscription(Long userId, Long subscriptionId, String paymentMethod);

// New
PaymentResponseDTO payForSubscription(Long userId, Long subscriptionId, String returnUrl, String bankCode);
```

### **2. PaymentServiceImpl**
```java
@Override
public PaymentResponseDTO payForSubscription(Long userId, Long subscriptionId, String returnUrl, String bankCode) {
    // CHỈ xử lý VNPay
    // Tạo transaction với VNPAY method
    // Tạo VNPay payment URL
    // Return URL cho FE redirect
}
```

### **3. Thêm method mới: processSubscriptionVNPayCallback()**
```java
@Transactional
public void processSubscriptionVNPayCallback(Long transactionId) {
    // Được gọi từ VNPayService sau khi verify
    // Update transaction → SUCCESS
    // Find subscription by price
    // Update user subscription
    // Send notification
}
```

### **4. Deprecated processSubscriptionCashPayment()**
```java
@Deprecated
protected PaymentResponseDTO processSubscriptionCashPayment(...) {
    // KHÔNG CÒN ĐƯỢC SỬ DỤNG
    // Chỉ giữ lại để tham khảo
}
```

### **5. SubscriptionRepository**
```java
// Thêm method mới
List<Subscription> findByPrice(BigDecimal price);
```

---

## 🔒 VALIDATION

### **Tự động set VNPay:**
```java
// Trong payForSubscription()
// KHÔNG còn nhận paymentMethod parameter
// TỰ ĐỘNG set paymentMethod = VNPAY

transaction.setPaymentMethod(Transaction.PaymentMethod.VNPAY);
```

---

## 📊 SO SÁNH

| Feature | Session Payment | Subscription Payment |
|---------|----------------|---------------------|
| **CASH** | ✅ Có | ❌ KHÔNG |
| **VNPAY** | ✅ Có | ✅ CHỈ VNPAY |
| **Staff xử lý** | ✅ CASH payment | ❌ Không |
| **Callback** | ✅ Có | ✅ Có |
| **Auto update** | ✅ Fees, unlock | ✅ Subscription |

---

## 🎯 TEST SCENARIOS

### **TC1: Thanh toán VNPay thành công**
```
1. POST /api/payment/subscription với đầy đủ params
2. Nhận paymentUrl
3. Simulate VNPay callback success
4. Verify: transaction SUCCESS, user.subscription updated
```

### **TC2: VNPay callback failed**
```
1. POST /api/payment/subscription
2. Simulate VNPay callback failed
3. Verify: transaction FAILED, notification sent
```

### **TC3: User cancel payment**
```
1. POST /api/payment/subscription
2. User cancel trên VNPay
3. VNPay callback với error code
4. Verify: transaction FAILED
```

---

## ⚠️ BREAKING CHANGES

### **FE phải cập nhật:**
1. ❌ **Xóa option "Thanh toán bằng tiền mặt"** cho subscription
2. ✅ **Chỉ hiển thị "Thanh toán VNPay"**
3. ✅ **Thêm returnUrl parameter** khi gọi API
4. ✅ **Handle redirect** đến VNPay payment URL
5. ✅ **Handle callback** từ VNPay về FE

### **API calls cần update:**
```javascript
// Old (KHÔNG HOẠT ĐỘNG)
POST /api/payment/subscription?userId=1&subscriptionId=2&paymentMethod=CASH

// New (BẮT BUỘC)
POST /api/payment/subscription
  ?userId=1
  &subscriptionId=2
  &returnUrl=http://localhost:3000/payment/callback
  &bankCode=NCB  // optional
```

---

## 🚀 IMPLEMENTATION CHECKLIST

### **Backend:**
- [x] Update PaymentService interface
- [x] Update PaymentServiceImpl.payForSubscription()
- [x] Thêm processSubscriptionVNPayCallback()
- [x] Deprecate processSubscriptionCashPayment()
- [x] Update PaymentController endpoint
- [x] Thêm SubscriptionRepository.findByPrice()
- [x] Error handling cho failed payment

### **Frontend:**
- [ ] Xóa CASH option cho subscription
- [ ] Thêm returnUrl parameter
- [ ] Handle VNPay redirect
- [ ] Handle callback từ VNPay
- [ ] Update error messages

### **Testing:**
- [ ] Test VNPay success flow
- [ ] Test VNPay failed flow
- [ ] Test user cancel
- [ ] Test notification
- [ ] Test subscription update

---

## 💡 LƯU Ý

### **VNPay Sandbox Testing:**
```
Test Card: 9704198526191432198
Card Holder: NGUYEN VAN A
Issue Date: 07/15
OTP: 123456
```

### **Callback URL:**
```
http://localhost:8080/api/payment/vnpay/callback
```

### **Return URL (FE):**
```
http://localhost:3000/payment/subscription/callback
```

---

## 🎉 KẾT LUẬN

**Subscription payment giờ đây:**
- ✅ **CHỈ VNPAY** - an toàn, chuyên nghiệp
- ✅ **Tự động hóa** - không cần staff
- ✅ **Callback processing** - update subscription tự động
- ✅ **Error handling** - rollback và notification
- ✅ **Deprecated CASH** - không còn hỗ trợ

**Breaking change nhưng hợp lý cho subscription payment model!** 🚀

