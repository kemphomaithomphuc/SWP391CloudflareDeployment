import React, { useState } from 'react';
import { ArrowLeft, Calendar, Clock, DollarSign, CheckCircle, Zap, Star, Shield, Crown, Sparkles, Gift, Info, ExternalLink, Check } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { motion } from 'motion/react';

interface PremiumSubscriptionViewProps {
  onBack: () => void;
  userType?: 'driver' | 'admin';
}

export default function PremiumSubscriptionView({ onBack, userType = 'driver' }: PremiumSubscriptionViewProps) {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const translations = {
    header: {
      title: language === 'vi' ? 'Gói Đăng Ký Premium' : 'Premium Subscription Plan',
      subtitle: language === 'vi' ? 'Mở khóa những đặc quyền sạc nâng cao' : 'Unlock Enhanced Charging Privileges',
      badge: language === 'vi' ? 'Độc quyền' : 'Exclusive'
    },
    benefits: {
      title: language === 'vi' ? 'Lợi Ích Premium Của Bạn' : 'Your Premium Benefits',
      driver: {
        extendedBooking: {
          title: language === 'vi' ? 'Đặt Chỗ Mở Rộng' : 'Extended Booking',
          description: language === 'vi' 
            ? 'Đặt trước slot sạc lên đến 24 giờ (so với 2 giờ cho người dùng thường)'
            : 'Book charging slots up to 24 hours in advance (vs. 2 hours for standard users)'
        },
        discountedRates: {
          title: language === 'vi' ? 'Giá Ưu Đãi' : 'Discounted Rates',
          description: language === 'vi'
            ? 'Giảm 15-20% giá điện và phí dịch vụ tại tất cả trạm sạc'
            : '15-20% lower electricity rates and service fees at all charging stations'
        },
        freeFees: {
          title: language === 'vi' ? 'Miễn Phí Hoàn Toàn' : 'Free Fees',
          description: language === 'vi'
            ? 'Không phí đặt chỗ, không phí hủy, và miễn phí giao dịch'
            : 'No booking fees, no cancellation fees, and free transaction processing'
        }
      },
      admin: {
        systemAccess: {
          title: language === 'vi' ? 'Quyền Truy Cập Hệ Thống' : 'System Access',
          description: language === 'vi'
            ? 'Truy cập đầy đủ dashboard quản trị và công cụ phân tích nâng cao'
            : 'Full access to admin dashboard and advanced analytics tools'
        },
        stationManagement: {
          title: language === 'vi' ? 'Quản Lý Trạm Sạc' : 'Station Management',
          description: language === 'vi'
            ? 'Quản lý không giới hạn trạm sạc và thiết bị kết nối'
            : 'Unlimited charging station and connected device management'
        },
        prioritySupport: {
          title: language === 'vi' ? 'Hỗ Trợ Ưu Tiên' : 'Priority Support',
          description: language === 'vi'
            ? 'Hỗ trợ kỹ thuật 24/7 và manager account chuyên dụng'
            : '24/7 technical support and dedicated account manager'
        }
      }
    },
    planDetails: {
      title: language === 'vi' ? 'Chi Tiết Gói' : 'Plan Details',
      planName: language === 'vi' ? 'Gói Premium' : 'Premium Plan',
      pricing: language === 'vi' ? 'Xem giá tại x.ai/grok' : 'View pricing at x.ai/grok',
      subscribeBtn: language === 'vi' ? 'Đăng Ký Ngay' : 'Subscribe Now',
      manageBtn: language === 'vi' ? 'Quản Lý Gói' : 'Manage Subscription'
    },
    cta: {
      upgrade: language === 'vi' ? 'Nâng Cấp Ngay' : 'Upgrade Now',
      learnMore: language === 'vi' ? 'Tìm Hiểu Thêm' : 'Learn More',
      processing: language === 'vi' ? 'Đang xử lý...' : 'Processing...'
    },
    additional: {
      guarantee: language === 'vi' ? 'Đảm bảo hoàn tiền 30 ngày' : '30-day money-back guarantee',
      noContract: language === 'vi' ? 'Không ràng buộc hợp đồng' : 'No contract required',
      instantAccess: language === 'vi' ? 'Kích hoạt ngay lập tức' : 'Instant activation'
    }
  };

  // Subscription plans data
  const subscriptionPlans = userType === 'driver' ? [
    {
      id: 'basic',
      name: language === 'vi' ? 'Gói Cơ Bản' : 'Basic Plan',
      price: 99000,
      features: language === 'vi' ? [
        'Truy cập sạc cơ bản',
        'Tốc độ sạc tiêu chuẩn', 
        'Hỗ trợ email',
        'Phân tích sử dụng cơ bản'
      ] : [
        'Basic charging access',
        'Standard charging speed',
        'Email support', 
        'Basic usage analytics'
      ],
      current: true
    },
    {
      id: 'premium',
      name: language === 'vi' ? 'Gói Premium' : 'Premium Plan',
      price: 199000,
      features: language === 'vi' ? [
        'Truy cập sạc ưu tiên',
        'Tốc độ sạc nhanh',
        'Hỗ trợ điện thoại 24/7',
        'Phân tích nâng cao',
        'Tính năng cao cấp trên app',
        'Hệ thống đặt chỗ'
      ] : [
        'Priority charging access',
        'Fast charging speed',
        '24/7 phone support',
        'Advanced analytics',
        'Mobile app premium features',
        'Reservation system'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: language === 'vi' ? 'Gói Pro' : 'Pro Plan',
      price: 299000,
      features: language === 'vi' ? [
        'Truy cập sạc không giới hạn',
        'Sạc siêu nhanh',
        'Hỗ trợ chuyên dụng',
        'Báo cáo phân tích tùy chỉnh',
        'Truy cập API'
      ] : [
        'Unlimited charging access',
        'Ultra-fast charging',
        'Dedicated support',
        'Custom analytics reports',
        'API access'
      ]
    }
  ] : [
    {
      id: 'basic',
      name: language === 'vi' ? 'Gói Cơ Bản' : 'Basic Plan',
      price: 99000,
      features: language === 'vi' ? [
        'Quản lý cơ bản hệ thống',
        'Báo cáo tiêu chuẩn',
        'Hỗ trợ email',
        'Truy cập dashboard cơ bản'
      ] : [
        'Basic system management',
        'Standard reports',
        'Email support',
        'Basic dashboard access'
      ],
      current: true
    },
    {
      id: 'premium',
      name: language === 'vi' ? 'Gói Premium' : 'Premium Plan',
      price: 199000,
      features: language === 'vi' ? [
        'Quản lý hệ thống đầy đủ',
        'Báo cáo nâng cao',
        'Hỗ trợ ưu tiên 24/7',
        'Dashboard quản trị premium',
        'Công cụ phân tích chuyên sâu',
        'Quản lý nhân viên không giới hạn'
      ] : [
        'Full system management',
        'Advanced reporting',
        'Priority 24/7 support',
        'Premium admin dashboard',
        'Deep analytics tools',
        'Unlimited staff management'
      ],
      popular: true
    },
    {
      id: 'pro',
      name: language === 'vi' ? 'Gói Pro' : 'Pro Plan',
      price: 299000,
      features: language === 'vi' ? [
        'Quyền quản trị tối cao',
        'Báo cáo tùy chỉnh hoàn toàn',
        'Hỗ trợ chuyên dụng 24/7',
        'API truy cập đầy đủ',
        'Tích hợp hệ thống bên ngoài',
        'Tính năng white-label'
      ] : [
        'Supreme admin privileges',
        'Fully customizable reports',
        'Dedicated 24/7 support',
        'Full API access',
        'External system integration',
        'White-label features'
      ]
    }
  ];

  const benefitItems = userType === 'driver' ? [
    {
      icon: <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      title: translations.benefits.driver.extendedBooking.title,
      description: translations.benefits.driver.extendedBooking.description,
      highlight: '24h',
      color: 'blue'
    },
    {
      icon: <DollarSign className="w-8 h-8 text-green-600 dark:text-green-400" />,
      title: translations.benefits.driver.discountedRates.title,
      description: translations.benefits.driver.discountedRates.description,
      highlight: '15-20%',
      color: 'green'
    },
    {
      icon: <Gift className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      title: translations.benefits.driver.freeFees.title,
      description: translations.benefits.driver.freeFees.description,
      highlight: language === 'vi' ? 'Miễn phí' : 'Free',
      color: 'purple'
    }
  ] : [
    {
      icon: <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
      title: translations.benefits.admin.systemAccess.title,
      description: translations.benefits.admin.systemAccess.description,
      highlight: language === 'vi' ? 'Đầy đủ' : 'Full Access',
      color: 'blue'
    },
    {
      icon: <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />,
      title: translations.benefits.admin.stationManagement.title,
      description: translations.benefits.admin.stationManagement.description,
      highlight: language === 'vi' ? 'Không giới hạn' : 'Unlimited',
      color: 'green'
    },
    {
      icon: <Crown className="w-8 h-8 text-purple-600 dark:text-purple-400" />,
      title: translations.benefits.admin.prioritySupport.title,
      description: translations.benefits.admin.prioritySupport.description,
      highlight: '24/7',
      color: 'purple'
    }
  ];

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  const handleUpgrade = () => {
    setIsUpgrading(true);
    // Simulate API call
    setTimeout(() => {
      setIsUpgrading(false);
      // Redirect to external pricing page
      window.open('https://x.ai/grok', '_blank');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-teal-50 dark:from-gray-950 dark:via-blue-950/20 dark:to-green-950/20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="p-2 hover:bg-primary/10 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-6 h-6 text-primary" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">{translations.header.title}</h1>
                <Badge className="bg-gradient-to-r from-primary to-green-600 text-white">
                  {translations.header.badge}
                </Badge>
              </div>
              <p className="text-muted-foreground">{translations.header.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto p-4 space-y-8">
        {/* Current Plan Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-r from-green-50 via-green-50 to-blue-50 dark:from-green-950/20 dark:via-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {language === 'vi' ? 'Gói Hiện Tại' : 'Current Plan'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'vi' ? 'Bạn đang sử dụng Gói Cơ Bản' : 'You are currently on the Basic Plan'}
                  </p>
                </div>
                <Badge className="bg-green-600 text-white">
                  {language === 'vi' ? 'Hiện Tại' : 'Current'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Available Plans */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">
              {language === 'vi' ? 'Các Gói Đăng Ký' : 'Subscription Plans'}
            </h2>
            <p className="text-center text-muted-foreground">
              {language === 'vi' ? 'Chọn gói hoàn hảo cho nhu cầu sạc của bạn' : 'Choose the perfect plan for your charging needs'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {subscriptionPlans.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                  className="relative"
                >
                  <Card className={`relative transition-all duration-300 hover:shadow-xl ${
                    plan.popular 
                      ? 'ring-2 ring-primary shadow-lg scale-105 bg-gradient-to-br from-primary/5 to-green-500/5' 
                      : plan.current 
                        ? 'bg-muted/30 border-muted' 
                        : 'hover:shadow-lg'
                  }`}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1">
                          <Star className="w-3 h-3 mr-1" />
                          {language === 'vi' ? 'Phổ Biến' : 'Popular'}
                        </Badge>
                      </div>
                    )}

                    {plan.current && (
                      <div className="absolute -top-3 right-4">
                        <Badge variant="outline" className="bg-background">
                          {language === 'vi' ? 'Hiện Tại' : 'Current'}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4">
                      <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-3xl font-bold text-foreground">
                          {formatCurrency(plan.price)}
                        </span>
                        <span className="text-muted-foreground">
                          /{language === 'vi' ? 'tháng' : 'month'}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-2">
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
                        onClick={handleUpgrade}
                      >
                        {plan.current 
                          ? (language === 'vi' ? 'Hiện Tại' : 'Current')
                          : (language === 'vi' ? 'Nâng Cấp' : 'Upgrade Plan')
                        }
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-primary/20 shadow-xl">
            <CardHeader className="text-center pb-6 bg-gradient-to-r from-primary/5 to-green-500/5 rounded-t-lg">
              <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
                <Star className="w-6 h-6" />
                {translations.benefits.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {benefitItems.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="text-center space-y-4"
                  >
                    <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-${benefit.color}-100 to-${benefit.color}-200 dark:from-${benefit.color}-900/30 dark:to-${benefit.color}-800/30 flex items-center justify-center shadow-lg`}>
                      {benefit.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                    </div>
                    <Badge 
                      className={`bg-gradient-to-r from-${benefit.color}-500 to-${benefit.color}-600 text-white px-4 py-1`}
                    >
                      {benefit.highlight}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Card className="bg-gradient-to-r from-primary/10 via-green-500/10 to-blue-500/10 border-2 border-primary/20">
            <CardContent className="p-8">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="mb-6"
              >
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary to-green-600 flex items-center justify-center shadow-lg">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </motion.div>
              
              <h3 className="text-xl font-bold text-foreground mb-3">
                {language === 'vi' 
                  ? 'Sẵn sàng trải nghiệm những đặc quyền cao cấp?' 
                  : 'Ready to experience premium privileges?'
                }
              </h3>
              <p className="text-muted-foreground mb-6">
                {language === 'vi'
                  ? 'Nâng cấp ngay hôm nay và tận hưởng trải nghiệm sạc xe điện tốt nhất'
                  : 'Upgrade today and enjoy the ultimate EV charging experience'
                }
              </p>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleUpgrade}
                  disabled={isUpgrading}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-primary via-green-600 to-blue-600 hover:from-primary/90 hover:via-green-600/90 hover:to-blue-600/90 text-white shadow-xl text-lg"
                >
                  {isUpgrading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-3"
                      >
                        <Sparkles className="w-6 h-6" />
                      </motion.div>
                      {translations.cta.processing}
                    </>
                  ) : (
                    <>
                      <Crown className="w-6 h-6 mr-3" />
                      {translations.cta.upgrade}
                    </>
                  )}
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}