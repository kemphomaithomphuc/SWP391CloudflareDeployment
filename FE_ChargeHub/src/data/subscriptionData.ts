export interface SubscriptionPlan {
  id: string;
  name: string;
  type: 'basic' | 'premium' | 'pro';
  price: number;
  discount: number; // Discount percentage (0-100)
  duration: 'monthly' | 'yearly';
  features: string[];
  chargingDiscount: number; // Specific discount for charging sessions
  maxSessions: number; // Max charging sessions per month
}

export interface UserSubscription {
  id: string;
  userId: string;
  planId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: string;
  endDate: string;
  sessionsUsed: number;
}

export const subscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Plan',
    type: 'basic',
    price: 99000, // VND
    discount: 5,
    duration: 'monthly',
    chargingDiscount: 10,
    maxSessions: 10,
    features: [
      'Up to 10 charging sessions per month',
      '10% discount on charging fees',
      'Basic customer support',
      'Mobile app access'
    ]
  },
  {
    id: 'premium-monthly',
    name: 'Premium Plan',
    type: 'premium',
    price: 199000, // VND
    discount: 15,
    duration: 'monthly',
    chargingDiscount: 20,
    maxSessions: 25,
    features: [
      'Up to 25 charging sessions per month',
      '20% discount on charging fees',
      'Priority customer support',
      'Advanced analytics',
      'Reservation priority'
    ]
  },
  {
    id: 'pro-monthly',
    name: 'Pro Plan',
    type: 'pro',
    price: 399000, // VND
    discount: 25,
    duration: 'monthly',
    chargingDiscount: 30,
    maxSessions: -1, // Unlimited
    features: [
      'Unlimited charging sessions',
      '30% discount on charging fees',
      '24/7 premium support',
      'Advanced analytics & reports',
      'Priority reservations',
      'Exclusive charging stations'
    ]
  }
];

// Mock user subscriptions
export const mockUserSubscriptions: UserSubscription[] = [
  {
    id: 'sub-001',
    userId: 'user-001',
    planId: 'premium-monthly',
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    sessionsUsed: 12
  },
  {
    id: 'sub-002',
    userId: 'user-002',
    planId: 'basic-monthly',
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-12-15',
    sessionsUsed: 5
  }
];

export const getCurrentUserSubscription = (userId: string): UserSubscription | null => {
  return mockUserSubscriptions.find(sub => 
    sub.userId === userId && sub.status === 'active'
  ) || null;
};

export const getSubscriptionPlan = (planId: string): SubscriptionPlan | null => {
  return subscriptionPlans.find(plan => plan.id === planId) || null;
};

export const calculateDiscountedPrice = (originalPrice: number, subscription: UserSubscription | null): {
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  discountAmount: number;
} => {
  if (!subscription) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discount: 0,
      discountAmount: 0
    };
  }

  const plan = getSubscriptionPlan(subscription.planId);
  if (!plan) {
    return {
      originalPrice,
      discountedPrice: originalPrice,
      discount: 0,
      discountAmount: 0
    };
  }

  const discountAmount = Math.round(originalPrice * (plan.chargingDiscount / 100));
  const discountedPrice = originalPrice - discountAmount;

  return {
    originalPrice,
    discountedPrice,
    discount: plan.chargingDiscount,
    discountAmount
  };
};