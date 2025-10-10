import { Check, Star, Zap, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useLanguage } from "../contexts/LanguageContext";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  current?: boolean;
}

interface SubscriptionViewProps {
  onBack: () => void;
  mode: 'current' | 'explore'; // current = check current subscriptions, explore = browse available plans
}

export default function SubscriptionView({ onBack, mode }: SubscriptionViewProps) {
  const { t, language } = useLanguage();

  const getLocalizedFeatures = (planId: string) => {
    const featuresMap = {
      basic: {
        en: [
          'Basic charging access',
          'Standard charging speed',
          'Email support',
          'Basic usage analytics'
        ],
        vi: [
          'Truy cập sạc cơ bản',
          'Tốc độ sạc tiêu chuẩn',
          'Hỗ trợ email',
          'Phân tích sử dụng cơ bản'
        ]
      },
      premium: {
        en: [
          'Priority charging access',
          'Fast charging speed',
          '24/7 phone support',
          'Advanced analytics',
          'Mobile app premium features',
          'Reservation system'
        ],
        vi: [
          'Truy cập sạc ưu tiên',
          'Tốc độ sạc nhanh',
          'Hỗ trợ điện thoại 24/7',
          'Phân tích nâng cao',
          'Tính năng cao cấp trên app',
          'Hệ thống đặt chỗ'
        ]
      },
      pro: {
        en: [
          'Unlimited charging access',
          'Ultra-fast charging',
          'Dedicated support',
          'Custom analytics reports',
          'API access',
          'White-label solutions',
          'Enterprise features'
        ],
        vi: [
          'Truy cập sạc không giới hạn',
          'Sạc siêu nhanh',
          'Hỗ trợ chuyên dụng',
          'Báo cáo phân tích tùy chỉnh',
          'Truy cập API',
          'Giải pháp white-label',
          'Tính năng doanh nghiệp'
        ]
      }
    };
    return featuresMap[planId as keyof typeof featuresMap]?.[language] || [];
  };

  const plans: SubscriptionPlan[] = [
    {
      id: 'basic',
      name: t('basic_plan'),
      price: 99000,
      period: 'monthly',
      current: true,
      features: getLocalizedFeatures('basic')
    },
    {
      id: 'premium',
      name: t('premium_plan'),
      price: 199000,
      period: 'monthly',
      popular: true,
      features: getLocalizedFeatures('premium')
    },
    {
      id: 'pro',
      name: t('pro_plan'),
      price: 299000,
      period: 'monthly',
      features: getLocalizedFeatures('pro')
    }
  ];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 mr-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('back_to_dashboard')}</span>
          </Button>
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {mode === 'current' ? t('my_subscriptions') : t('subscription_plans')}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'current' 
                ? t('manage_current_subscriptions') 
                : t('choose_plan_description')
              }
            </p>
          </div>
        </div>

        {mode === 'current' ? (
          /* Current Subscriptions View */
          <div className="space-y-6 mb-8">
            {/* Active Plan */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{t('active_plan')}</h3>
                    <p className="text-muted-foreground">{t('basic_plan')} - Started on Dec 15, 2024</p>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    {t('active')}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('next_billing')}:</span>
                    <p className="font-medium">Jan 15, 2025</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('amount')}:</span>
                    <p className="font-medium">{formatPrice(99000)}/{t('month')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('status')}:</span>
                    <p className="font-medium text-green-600">{t('active')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>{t('billing_history')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{t('basic_plan')}</p>
                      <p className="text-sm text-muted-foreground">Dec 15, 2024 - Jan 15, 2025</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(99000)}</p>
                      <Badge variant="outline" className="text-xs">{t('paid')}</Badge>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <p className="font-medium">{t('basic_plan')}</p>
                      <p className="text-sm text-muted-foreground">Nov 15, 2024 - Dec 15, 2024</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatPrice(99000)}</p>
                      <Badge variant="outline" className="text-xs">{t('paid')}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Explore Plans View */
          <div className="space-y-6 mb-8">
            {/* Current Plan Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">{t('current_plan')}</h3>
                    <p className="text-muted-foreground">
                      {language === 'vi' ? 'Bạn đang sử dụng Gói Cơ Bản' : 'You are currently on the Basic Plan'}
                    </p>
                  </div>
                  <Badge className="bg-primary text-primary-foreground">
                    {t('current')}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Available Plans */}
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">{t('available_plans')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`relative ${
                      plan.popular ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                    } ${plan.current ? 'bg-muted/30' : ''}`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          <Star className="w-3 h-3 mr-1" />
                          {t('popular')}
                        </Badge>
                      </div>
                    )}

                    {plan.current && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="outline" className="bg-background">
                          {t('current')}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-3xl font-bold text-foreground">
                          {formatPrice(plan.price)}
                        </span>
                        <span className="text-muted-foreground">
                          /{plan.period === 'monthly' ? t('monthly') : t('yearly')}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <Button 
                        className={`w-full ${
                          plan.current 
                            ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                            : plan.popular 
                              ? 'bg-primary hover:bg-primary/90' 
                              : ''
                        }`}
                        disabled={plan.current}
                      >
                        {plan.current ? t('current') : t('upgrade_plan')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Benefits Section - Only show in explore mode */}
        {mode === 'explore' && (
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/10 mb-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                {language === 'vi' ? 'Tại sao nên nâng cấp gói đăng ký?' : 'Why upgrade your subscription?'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    {language === 'vi' ? 'Sạc Nhanh Hơn' : 'Faster Charging'}
                  </h4>
                  <p>
                    {language === 'vi' 
                      ? 'Truy cập trạm sạc tốc độ cao với thời gian chờ giảm thiểu'
                      : 'Access to high-speed charging stations with reduced waiting times'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    {language === 'vi' ? 'Truy Cập Ưu Tiên' : 'Priority Access'}
                  </h4>
                  <p>
                    {language === 'vi'
                      ? 'Bỏ qua hàng đợi và có quyền ưu tiên tại trạm sạc'
                      : 'Skip the queue and get priority access to charging stations'
                    }
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">
                    {language === 'vi' ? 'Hỗ Trợ Tốt Hơn' : 'Better Support'}
                  </h4>
                  <p>
                    {language === 'vi'
                      ? 'Hỗ trợ khách hàng 24/7 và quản lý tài khoản chuyên dụng'
                      : '24/7 customer support and dedicated account management'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Management - Only show in current mode */}
        {mode === 'current' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>{t('account_management')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="flex items-center space-x-2">
                  <Star className="w-4 h-4" />
                  <span>{t('upgrade_plan')}</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>{t('change_billing')}</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>{t('usage_analytics')}</span>
                </Button>
                <Button variant="outline" className="flex items-center space-x-2 text-red-600 border-red-300 hover:bg-red-50">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{t('cancel_subscription')}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}