import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, Clock, DollarSign, CheckCircle, Zap, Star, Shield, Crown, Sparkles, Gift, Info, Check, CreditCard } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { getAllSubscriptions, getUserSubscription, upgradeUserSubscription, createSubscriptionPayment, type SubscriptionResponseDTO } from '../services/api';

interface PremiumSubscriptionViewProps {
    onBack: () => void;
    userType?: 'driver' | 'admin';
}

export default function PremiumSubscriptionView({ onBack, userType = 'driver' }: PremiumSubscriptionViewProps) {
    const { language } = useLanguage();
    const { theme } = useTheme();
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [plans, setPlans] = useState<SubscriptionResponseDTO[] | null>(null);
    const [currentSub, setCurrentSub] = useState<SubscriptionResponseDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

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

    // Load BE subscriptions
    useEffect(() => {
        setLoading(true);
        (async () => {
            try {
                const all = await getAllSubscriptions();
                setPlans(all?.data || []);
                const uid = localStorage.getItem('userId');
                if (uid) {
                    const mine = await getUserSubscription(Number(uid));
                    setCurrentSub(mine?.data || null);
                }
            } catch (err) {
                console.error("Error loading subscriptions:", err);
                toast.error(language === 'vi' ? 'Không thể tải gói đăng ký' : 'Cannot load subscriptions');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const paymentStatus = localStorage.getItem('subscriptionPaymentStatus');
        if (!paymentStatus) {
            return;
        }

        const userId = localStorage.getItem('userId');

        if (paymentStatus === 'success') {
            toast.success(language === 'vi'
                ? 'Thanh toán gói đăng ký thành công!'
                : 'Subscription payment successful!'
            );
            if (userId) {
                getUserSubscription(Number(userId))
                    .then(res => {
                        setCurrentSub(res?.data || null);
                    })
                    .catch(err => {
                        console.error('Error refreshing subscription after payment:', err);
                    });
            }
        } else if (paymentStatus === 'cancelled') {
            toast.error(language === 'vi'
                ? 'Bạn đã hủy giao dịch thanh toán.'
                : 'You cancelled the payment.');
        } else if (paymentStatus === 'failed') {
            toast.error(language === 'vi'
                ? 'Thanh toán gói đăng ký không thành công.'
                : 'Subscription payment failed.');
        }

        localStorage.removeItem('subscriptionPaymentStatus');
    }, [language]);

    // Canonicalize BE types to exactly 3 plans: BASIC -> basic, PLUS -> plus, PRO -> premium
    const canonicalKey = (t: string) => {
        const k = (t || '').toUpperCase();
        if (k === 'BASIC') return 'basic';
        if (k === 'PLUS') return 'plus';
        // Map PRO to Premium as requested
        return 'premium';
    };

    const canonicalName = (key: 'basic' | 'plus' | 'premium') => {
        if (key === 'basic') return language === 'vi' ? 'Gói Cơ Bản' : 'Basic Plan';
        if (key === 'plus') return language === 'vi' ? 'Gói Plus' : 'Plus Plan';
        return language === 'vi' ? 'Gói Premium' : 'Premium Plan';
    };

    // Map BE subscriptions -> price by canonical key (NO FALLBACK)
    const priceFromBackend = (key: 'basic' | 'plus' | 'premium') => {
        if (!plans || plans.length === 0) return 0;
        const match = plans.find(p => canonicalKey(p.type || '') === key);
        // Handle both number and string (BigDecimal from backend may come as string)
        const price = match?.price;
        if (typeof price === 'number') return price;
        if (typeof price === 'string') {
            const parsed = parseFloat(price);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    };

    const featuresByKey = (key: 'basic' | 'plus' | 'premium') => {
        // Return empty array - không hiển thị features
        return [];
    };

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

    // Map BE -> exactly 3 unique plans (NO FALLBACK)
    const mappedFromBackend = useMemo(() => {
        // Only return data when BE has loaded
        if (!plans || plans.length === 0) {
            return null;
        }
        
        const currentKey = canonicalKey(currentSub?.type || '');
        const keys: Array<'basic'|'plus'|'premium'> = ['basic','plus','premium'];
        return keys.map(key => {
            const match = plans.find(p => canonicalKey(p.type || '') === key);
            return {
                id: key,
                subscriptionId: match?.subscriptionId,
                name: canonicalName(key),
                price: priceFromBackend(key),  // Only from BE, no fallback
                features: featuresByKey(key),
                popular: key === 'plus',
                current: key === currentKey,
            };
        });
    }, [plans, currentSub, language, userType]);

    const upgradeBasicPlan = async (userId: number): Promise<boolean> => {
        setIsUpgrading(true);
        try {
            const response = await upgradeUserSubscription(userId, 'BASIC');

            if (!response.success) {
                throw new Error(response.message || 'Upgrade failed');
            }

            toast.success(
                language === 'vi'
                    ? 'Nâng cấp thành công! Gói đăng ký đã được kích hoạt'
                    : 'Upgrade successful! Subscription activated'
            );

            try {
                const refreshed = await getUserSubscription(userId);
                setCurrentSub(refreshed?.data || null);
                console.log('Subscription refreshed:', refreshed?.data);
            } catch (refreshError) {
                console.error('Error refreshing subscription:', refreshError);
            }

            return true;
        } catch (error: any) {
            console.error('=== Error upgrading BASIC subscription ===', error);
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(errorMsg || (language === 'vi' ? 'Lỗi khi nâng cấp gói đăng ký' : 'Error upgrading subscription'));
            return false;
        } finally {
            setIsUpgrading(false);
        }
    };

    const handleUpgrade = async (plan: any) => {
        if (!plan) {
            return;
        }

        if (plan.id === 'basic') {
            const userIdValue = localStorage.getItem('userId');
            if (!userIdValue) {
                toast.error(language === 'vi' ? 'Vui lòng đăng nhập' : 'Please login');
                return;
            }
            await upgradeBasicPlan(Number(userIdValue));
            return;
        }

        setSelectedPlan(plan);
        setShowPaymentDialog(true);
        setPaymentStatus('pending');
    };

    const handlePaymentConfirm = async () => {
        const userIdValue = localStorage.getItem('userId');
        if (!userIdValue) {
            toast.error(language === 'vi' ? 'Vui lòng đăng nhập' : 'Please login');
            return;
        }

        if (!selectedPlan) {
            toast.error(language === 'vi' ? 'Vui lòng chọn gói đăng ký' : 'Please select a plan');
            return;
        }

        const subscriptionId = selectedPlan.subscriptionId;
        if (!subscriptionId) {
            toast.error(language === 'vi' ? 'Không tìm thấy mã gói đăng ký' : 'Subscription ID not found');
            return;
        }

        const planTypeMap: Record<string, 'BASIC' | 'PLUS' | 'PREMIUM'> = {
            basic: 'BASIC',
            plus: 'PLUS',
            premium: 'PREMIUM'
        };

        const subscriptionType = planTypeMap[selectedPlan.id];

        if (!subscriptionType) {
            toast.error(language === 'vi' ? 'Gói đăng ký không hợp lệ' : 'Invalid subscription plan');
            return;
        }

        if (subscriptionType === 'BASIC') {
            setPaymentStatus('processing');
            const success = await upgradeBasicPlan(Number(userIdValue));
            if (success) {
                setPaymentStatus('success');
                setTimeout(() => {
                    setShowPaymentDialog(false);
                    setSelectedPlan(null);
                    setPaymentStatus('pending');
                }, 2000);
            } else {
                setPaymentStatus('failed');
                setTimeout(() => setPaymentStatus('pending'), 2000);
            }
            return;
        }

        setPaymentStatus('processing');

        try {
            localStorage.setItem('paymentOrigin', 'premium-subscription');
            const paymentResponse = await createSubscriptionPayment({
                userId: Number(userIdValue),
                subscriptionId,
                returnUrl: `${window.location.origin}/payment/result`,
                cancelUrl: `${window.location.origin}/payment/result`
            });

            if (!paymentResponse.success) {
                throw new Error(paymentResponse.message || 'Payment initiation failed');
            }

            const paymentUrl = paymentResponse.data?.paymentUrl;
            if (!paymentUrl) {
                throw new Error(language === 'vi' ? 'Không tìm thấy đường dẫn thanh toán' : 'Missing payment URL');
            }

            localStorage.setItem('pendingSubscriptionType', subscriptionType);
            localStorage.setItem('pendingSubscriptionUserId', userIdValue);
            window.location.href = paymentUrl;
        } catch (error: any) {
            console.error('=== Error initiating subscription payment ===', error);
            const errorMsg = error.response?.data?.message || error.message;
            toast.error(errorMsg || (language === 'vi' ? 'Lỗi thanh toán' : 'Payment error'));
            setPaymentStatus('failed');
            setTimeout(() => setPaymentStatus('pending'), 2000);
        }
    };

    const handlePaymentCancel = () => {
        setShowPaymentDialog(false);
        setSelectedPlan(null);
        setPaymentStatus('pending');
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
                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center space-y-4">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 mx-auto"
                            >
                                <Sparkles className="w-16 h-16 text-primary" />
                            </motion.div>
                            <p className="text-lg font-medium text-muted-foreground">
                                {language === 'vi' ? 'Đang tải gói đăng ký...' : 'Loading subscription plans...'}
                            </p>
                        </div>
                    </div>
                ) : !mappedFromBackend || mappedFromBackend.length === 0 ? (
                    /* Error State */
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                                <Info className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">
                                {language === 'vi' ? 'Không thể tải gói đăng ký' : 'Cannot load subscription plans'}
                            </h3>
                            <p className="text-muted-foreground">
                                {language === 'vi' ? 'Vui lòng thử lại sau' : 'Please try again later'}
                            </p>
                            <Button onClick={() => window.location.reload()} variant="outline">
                                {language === 'vi' ? 'Tải lại trang' : 'Reload Page'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    /* Data loaded successfully */
                    <>
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
                                                {language === 'vi'
                                                    ? `Bạn đang sử dụng ${canonicalName(canonicalKey(currentSub?.type || ''))}`
                                                    : `You are currently on the ${canonicalName(canonicalKey(currentSub?.type || ''))}`}
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
                            {mappedFromBackend?.map((plan: any, index: number) => (
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
                                                {plan.features.map((feature: string, featureIndex: number) => (
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
                                                disabled={plan.current || (plan.id === 'basic' && isUpgrading)}
                                                onClick={() => handleUpgrade(plan)}
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
                                    onClick={() => handleUpgrade(mappedFromBackend?.find(p => !p.current))}
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
                    </>
                )}
            </div>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="w-[min(95vw,32rem)] max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-border/60 p-6">
                    <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                            <CreditCard className="w-5 h-5 text-primary" />
                            <span>
                {language === 'vi' ? 'Thanh Toán Gói Đăng Ký' : 'Subscription Payment'}
              </span>
                        </DialogTitle>
                        <DialogDescription>
                            {language === 'vi'
                                ? 'Chọn phương thức thanh toán để kích hoạt gói đăng ký'
                                : 'Select payment method to activate your subscription'}
                        </DialogDescription>
                    </DialogHeader>

                    {paymentStatus === 'pending' && selectedPlan && (
                        <div className="space-y-6 py-4">
                            {/* Plan Summary */}
                            <Card className="bg-gradient-to-r from-primary/5 to-green-500/5 border-primary/20">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-semibold text-lg">{selectedPlan.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                {language === 'vi' ? 'Gói đăng ký hàng tháng' : 'Monthly subscription'}
                                            </p>
                                        </div>
                                        <Badge className="bg-primary text-white text-lg px-4 py-1">
                                            {formatCurrency(selectedPlan.price)}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payment Methods */}
                            <div className="p-6 rounded-lg border-2 border-primary bg-primary/5 shadow-lg">
                                <div className="flex items-start space-x-4">
                                    <CreditCard className="w-8 h-8 text-primary" />
                                    <div className="flex-1">
                                        <h4 className="font-semibold mb-1">VNPay</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {language === 'vi'
                                                ? 'Thanh toán trực tuyến qua cổng VNPay'
                                                : 'Secure online payment via VNPay gateway'}
                                        </p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-primary" />
                                </div>
                            </div>

                            {/* Total */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <span className="font-semibold text-lg">
                  {language === 'vi' ? 'Tổng cộng' : 'Total'}
                </span>
                                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(selectedPlan.price)}
                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3">
                                <Button variant="outline" onClick={handlePaymentCancel}>
                                    {language === 'vi' ? 'Hủy' : 'Cancel'}
                                </Button>
                                <Button
                                    onClick={handlePaymentConfirm}
                                    className="bg-primary hover:bg-primary/90"
                                >
                                    {language === 'vi' ? 'Thanh Toán' : 'Pay Now'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Processing Status */}
                    {paymentStatus === 'processing' && (
                        <div className="py-12 text-center">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-16 h-16 mx-auto mb-4"
                            >
                                <Sparkles className="w-16 h-16 text-primary" />
                            </motion.div>
                            <h3 className="text-xl font-semibold mb-2">
                                {language === 'vi' ? 'Đang xử lý thanh toán...' : 'Processing payment...'}
                            </h3>
                            <p className="text-muted-foreground">
                                {language === 'vi' ? 'Vui lòng chờ trong giây lát' : 'Please wait a moment'}
                            </p>
                        </div>
                    )}

                    {/* Success Status */}
                    {paymentStatus === 'success' && (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">
                                {language === 'vi' ? 'Thanh toán thành công!' : 'Payment successful!'}
                            </h3>
                            <p className="text-muted-foreground">
                                {language === 'vi'
                                    ? 'Gói đăng ký của bạn đã được kích hoạt'
                                    : 'Your subscription has been activated'}
                            </p>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}