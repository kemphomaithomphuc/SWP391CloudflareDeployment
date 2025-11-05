# 🧪 PENALTY SYSTEM - QUICK TEST GUIDE

## ⚡ Quick Start

### Run All Tests
```bash
cd BE_ChargeHub
mvn test
```

### Run Specific Test Class
```bash
# Unit tests
mvn test -Dtest=PenaltyServiceImplTest

# Integration tests
mvn test -Dtest=PenaltyIntegrationTest
```

---

## 📋 Test Summary

### ✅ Unit Tests (25 tests)
**File:** `PenaltyServiceImplTest.java`

```
✅ AC1: Late Cancellation (4 tests)
✅ AC2: No-Show (3 tests)
✅ AC3: Overtime (2 tests)
✅ AC4: Total Payment (2 tests)
✅ AC5: Auto-Ban (2 tests)
✅ AC6: Fee History (2 tests)
✅ AC8: Rollback (1 test)
✅ Unlock Tests (4 tests)
✅ Helper Methods (5 tests)
```

### ✅ Integration Tests (8 tests)
**File:** `PenaltyIntegrationTest.java`

```
✅ Complete Flow: 3 violations → BANNED → Pay → ACTIVE
✅ Partial Payment: Should not unlock
✅ No-Show Integration
✅ Overtime Integration
✅ Fee History Integration
✅ Auto-Ban at 3 violations
✅ Cannot unlock ACTIVE user
✅ Multiple cycles
```

---

## 🎯 Key Test Cases

### Test 1: Late Cancellation
```java
@Test
void testLateCancellation_WithFee() {
    // Order starts in 5 minutes
    // Cancel now → Should have 10% fee
    // violations += 1
}
```

### Test 2: Auto-Ban
```java
@Test
void testAutoLock_ThreeViolations() {
    // User has 3 violations
    // Status should be BANNED
    // reasonReport should mention violations
}
```

### Test 3: Unlock After Payment
```java
@Test
void testUnlockUser_Success() {
    // User: BANNED, no unpaid fees
    // Unlock → Status = ACTIVE
}
```

### Test 4: Complete Integration Flow
```java
@Test
void testCompleteFlow_ThreeViolationsToUnlock() {
    // 1. Violation 1 → ACTIVE
    // 2. Violation 2 → ACTIVE
    // 3. Violation 3 → BANNED
    // 4. Pay all fees
    // 5. Unlock → ACTIVE
}
```

---

## 🔍 What Each Test Verifies

### AC1: Late Cancellation
- ✅ Fee created when < 10 minutes
- ✅ No fee when >= 10 minutes
- ✅ Violations increment
- ✅ Order status changes to CANCELED
- ✅ Exceptions for invalid operations

### AC2: No-Show
- ✅ Fee created after 15 minutes
- ✅ No fee before 15 minutes
- ✅ Only processes BOOKED orders
- ✅ Violations increment
- ✅ Order canceled

### AC3: Overtime
- ✅ Fee calculation (2,000/min)
- ✅ Session status → OVERTIME
- ✅ Multiple charges accumulate
- ✅ No fee for 0 minutes

### AC4: Total Payment
- ✅ Base cost + all fees
- ✅ Correct sum calculation
- ✅ Works with 0 fees

### AC5: Auto-Ban
- ✅ BANNED at violations >= 3
- ✅ ACTIVE when < 3
- ✅ Reason report updated
- ✅ Notification sent

### AC6: Fee History
- ✅ Get all user fees
- ✅ Get session fees
- ✅ Sorted by date
- ✅ Includes full details

### AC8: Rollback
- ✅ Exception thrown on error
- ✅ No partial updates
- ✅ Transaction rolled back

### Unlock Tests
- ✅ Can unlock when BANNED + no fees
- ✅ Cannot unlock with unpaid fees
- ✅ Cannot unlock if not BANNED
- ✅ Status changes correctly

---

## 📊 Expected Test Output

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running swp391.code.swp391.test.PenaltyServiceImplTest
[INFO] Tests run: 25, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Running swp391.code.swp391.test.PenaltyIntegrationTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 33, Failures: 0, Errors: 0, Skipped: 0
[INFO]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

---

## 🐛 Troubleshooting

### Tests Failing?

1. **Check Database:**
   ```bash
   # Verify H2 test database is available
   # Check application-test.properties
   ```

2. **Check Dependencies:**
   ```bash
   mvn clean install
   ```

3. **Run Single Test:**
   ```bash
   mvn test -Dtest=PenaltyServiceImplTest#testLateCancellation_WithFee
   ```

4. **Check Logs:**
   ```bash
   mvn test -X  # Debug mode
   ```

### Common Issues

**Issue 1: "Cannot find FeeRepository"**
- Solution: Run `mvn clean compile` first

**Issue 2: "Transaction rollback"**
- Solution: Check `@Transactional` annotations

**Issue 3: "Mock not initialized"**
- Solution: Verify `@BeforeEach` runs

---

## 🎯 Coverage Report

### Generate Coverage Report
```bash
mvn test jacoco:report
```

### View Report
```bash
# Open in browser
target/site/jacoco/index.html
```

### Expected Coverage
- Lines: 95%+
- Branches: 90%+
- Methods: 100%

---

## ✅ Test Checklist

Before committing:
- [ ] All tests pass locally
- [ ] No skipped tests
- [ ] Coverage >= 90%
- [ ] No compilation errors
- [ ] No warnings in test output

---

## 📚 Quick Links

- **Test Documentation:** `PENALTY_TEST_CASES.md`
- **Implementation Guide:** `PENALTY_SYSTEM_GUIDE.md`
- **Status Guide:** `BANNED_STATUS_FINAL.md`

---

**Last Updated:** 2025-11-03  
**Total Tests:** 33  
**Status:** ✅ All Passing

