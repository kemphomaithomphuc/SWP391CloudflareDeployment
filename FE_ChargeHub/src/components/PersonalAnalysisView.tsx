import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  ArrowLeft,
  TrendingUp,
  MapPin,
  Clock,
  Zap,
  DollarSign,
  Target,
  Star,
  Calendar,
  PieChart,
  BarChart3,
  Lightbulb,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Battery,
  Timer,
  CreditCard
} from "lucide-react";

interface PersonalAnalysisViewProps {
  onBack: () => void;
}

// Mock data based on HistoryView bookings
const analysisData = {
  // Usage patterns from history
  totalSessions: 6,
  completedSessions: 4,
  totalSpent: 539840, // VND
  totalEnergy: 158.8, // kWh
  averageSessionDuration: "2h 6m",
  averageCost: 134960, // VND per session
  
  // Favorite stations analysis
  favoriteStations: [
    { 
      name: "ChargeHub Station Alpha", 
      visits: 2, 
      percentage: 40,
      address: "123 Nguyen Hue, District 1",
      avgRating: 5,
      avgCost: "105,700 VND",
      totalEnergy: "60.4 kWh"
    },
    { 
      name: "ChargeHub Station Delta", 
      visits: 1, 
      percentage: 20,
      address: "321 Vo Van Tan, District 3", 
      avgRating: 5,
      avgCost: "174,240 VND",
      totalEnergy: "52.8 kWh"
    },
    { 
      name: "ChargeHub Station Beta", 
      visits: 1, 
      percentage: 20,
      address: "456 Le Loi, District 3",
      avgRating: 4,
      avgCost: "91,840 VND", 
      totalEnergy: "28.7 kWh"
    }
  ],
  
  // Time patterns
  preferredTimes: [
    { timeSlot: "morning_6am_12pm", percentage: 25, sessions: 1, avgDuration: "1h 30m" },
    { timeSlot: "afternoon_12pm_6pm", percentage: 50, sessions: 2, avgDuration: "2h 45m" },
    { timeSlot: "evening_6pm_11pm", percentage: 25, sessions: 1, avgDuration: "45m" }
  ],
  
  // Charging habits
  chargingHabits: {
    averageEnergyPerSession: 39.7, // kWh
    mostUsedChargerType: "CCS",
    preferredPaymentMethod: "Credit Card",
    averageRating: 4.5,
    costEfficiency: 85 // percentage score
  },
  
  // Monthly trends (mock data for 6 months)
  monthlyTrends: [
    { month: "Jul", sessions: 0, spent: 0, energy: 0 },
    { month: "Aug", sessions: 0, spent: 0, energy: 0 },
    { month: "Sep", sessions: 0, spent: 0, energy: 0 },
    { month: "Oct", sessions: 0, spent: 0, energy: 0 },
    { month: "Nov", sessions: 2, spent: 250080, energy: 73.9 },
    { month: "Dec", sessions: 4, spent: 289760, energy: 84.9 }
  ]
};

// Smart recommendations based on analysis
const recommendations = {
  stations: [
    {
      type: "favorite",
      titleKey: "return_to_favorite",
      station: "ChargeHub Station Alpha", 
      reasonKey: "rated_5_stars_consistently",
      actionKey: "book_again",
      savingsKey: "save_15_percent_discount"
    },
    {
      type: "discovery",
      titleKey: "try_something_new",
      station: "ChargeHub Station Echo",
      reasonKey: "similar_amenities_better_price",
      actionKey: "explore_station",
      savingsKey: "potential_12_percent_savings"
    }
  ],
  
  timing: [
    {
      titleKey: "optimal_charging_window",
      time: "2:00 PM - 4:00 PM",
      reasonKey: "afternoon_sessions_efficient",
      benefitKey: "lower_rates_faster_charging"
    },
    {
      titleKey: "avoid_peak_hours",
      time: "6:00 PM - 8:00 PM", 
      reasonKey: "evening_sessions_higher_wait",
      benefitKey: "save_20_percent_shifting_time"
    }
  ],
  
  subscriptions: [
    {
      titleKey: "chargehub_premium",
      price: "199,000 VND/month",
      currentSavings: "47,000 VND",
      projectedSavings: "156,000 VND/month",
      featureKeys: ["15_percent_discount_all_stations", "priority_booking", "free_session_cancellation", "24_7_support"],
      recommendationKey: "highly_recommended",
      reasonKey: "save_29_percent_annually"
    },
    {
      titleKey: "chargehub_basic", 
      price: "99,000 VND/month",
      currentSavings: "12,000 VND",
      projectedSavings: "78,000 VND/month", 
      featureKeys: ["10_percent_discount_partner_stations", "basic_booking", "email_support"],
      recommendationKey: "good_value",
      reasonKey: "suitable_current_usage"
    }
  ]
};

export default function PersonalAnalysisView({ onBack }: PersonalAnalysisViewProps) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
  };

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/20 border-primary/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('efficiency_score')}</p>
                <p className="text-2xl font-bold text-primary">85%</p>
                <p className="text-xs text-primary/80">{t('above_average')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/20 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('monthly_savings')}</p>
                <p className="text-2xl font-bold text-green-500">47K</p>
                <p className="text-xs text-green-500/80">{t('potential_with_premium')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/20 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('usage_trend')}</p>
                <p className="text-2xl font-bold text-blue-500">+150%</p>
                <p className="text-xs text-blue-500/80">{t('vs_last_month')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charging Pattern Overview */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="w-5 h-5 text-primary" />
            <span>{t('your_charging_patterns')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">{t('preferred_time_slots')}</h4>
              {analysisData.preferredTimes.map((time, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{t(time.timeSlot)}</span>
                    <span className="font-medium">{time.percentage}%</span>
                  </div>
                  <Progress value={time.percentage} className="h-2" />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">{t('station_preferences')}</h4>
              {analysisData.favoriteStations.slice(0, 3).map((station, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{station.name}</span>
                    <span className="font-medium">{station.percentage}%</span>
                  </div>
                  <Progress value={station.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{analysisData.totalSessions}</p>
            <p className="text-xs text-muted-foreground">{t('total_sessions')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Battery className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analysisData.totalEnergy}</p>
            <p className="text-xs text-muted-foreground">{t('kwh_charged')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Timer className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analysisData.averageSessionDuration}</p>
            <p className="text-xs text-muted-foreground">{t('avg_duration')}</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm">
          <CardContent className="p-4 text-center">
            <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{analysisData.chargingHabits.averageRating}</p>
            <p className="text-xs text-muted-foreground">{t('avg_rating')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const RecommendationsTab = () => (
    <div className="space-y-6">
      {/* Station Recommendations */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>{t('station_recommendations')}</span>
          </CardTitle>
          <CardDescription>
            {t('based_on_history')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.stations.map((rec, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant={rec.type === "favorite" ? "default" : "secondary"}>
                      {rec.type === "favorite" ? (
                        <Star className="w-3 h-3 mr-1 fill-current" />
                      ) : (
                        <Sparkles className="w-3 h-3 mr-1" />
                      )}
                      {t(rec.type === "favorite" ? "favorite" : "discovery")}
                    </Badge>
                  </div>
                  <h4 className="font-medium">{t(rec.titleKey)}</h4>
                  <p className="text-sm font-medium text-primary">{rec.station}</p>
                </div>
                <Button size="sm">
                  {t(rec.actionKey)}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{t(rec.reasonKey)}</p>
              <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 p-2 rounded text-sm">
                💡 {t(rec.savingsKey)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Time Recommendations */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>{t('optimal_timing')}</span>
          </CardTitle>
          <CardDescription>
            {t('smart_scheduling')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.timing.map((rec, index) => (
            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium flex items-center space-x-2">
                    {index === 0 ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span>{t(rec.titleKey)}</span>
                  </h4>
                  <p className="text-sm font-medium text-primary">{rec.time}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{t(rec.reasonKey)}</p>
              <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-2 rounded text-sm">
                ⚡ {t(rec.benefitKey)}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Subscription Recommendations */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <span>{t('subscription_recommendations')}</span>
          </CardTitle>
          <CardDescription>
            {t('save_money_right_plan')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.subscriptions.map((sub, index) => (
            <div key={index} className={`border rounded-lg p-4 space-y-4 ${
              t(sub.recommendationKey) === t('highly_recommended')
                ? "border-primary bg-primary/5" 
                : "border-border"
            }`}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium">{t(sub.titleKey)}</h4>
                    <Badge variant={t(sub.recommendationKey) === t('highly_recommended') ? "default" : "secondary"}>
                      {t(sub.recommendationKey) === t('highly_recommended') ? (
                        <Award className="w-3 h-3 mr-1" />
                      ) : (
                        <Target className="w-3 h-3 mr-1" />
                      )}
                      {t(sub.recommendationKey)}
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-primary">{sub.price}</p>
                </div>
                <Button variant={t(sub.recommendationKey) === t('highly_recommended') ? "default" : "outline"}>
                  {t('choose_plan')}
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground">{t(sub.reasonKey)}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('features')}:</p>
                  <ul className="text-xs space-y-1">
                    {sub.featureKeys.map((featureKey, fIndex) => (
                      <li key={fIndex} className="flex items-center space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{t(featureKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t('savings_projection')}:</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>{t('current_monthly_savings')}:</span>
                      <span className="font-medium text-green-600">{sub.currentSavings}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>{t('projected_monthly_savings')}:</span>
                      <span className="font-medium text-green-600">{sub.projectedSavings}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  const TrendsTab = () => (
    <div className="space-y-6">
      {/* Usage Trends Chart */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>{t('usage_trends')}</span>
          </CardTitle>
          <CardDescription>
            {t('charging_activity_6_months')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Simple Bar Chart Representation */}
            <div className="grid grid-cols-6 gap-2 h-40">
              {analysisData.monthlyTrends.map((month, index) => (
                <div key={index} className="flex flex-col items-center justify-end space-y-2">
                  <div 
                    className="w-8 bg-primary/20 rounded-t flex items-end justify-center transition-all duration-500"
                    style={{ 
                      height: `${Math.max(month.sessions * 20, 4)}px`,
                      backgroundColor: month.sessions > 0 ? 'var(--primary)' : 'var(--muted)'
                    }}
                  >
                    {month.sessions > 0 && (
                      <span className="text-xs text-primary-foreground mb-1">
                        {month.sessions}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{month.month}</span>
                </div>
              ))}
            </div>
            
            {/* Trend Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium">{t('growing_usage')}</p>
                <p className="text-xs text-muted-foreground">{t('increase_vs_nov')}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <DollarSign className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium">{t('monthly_spend')}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(289760)} {t('in_dec')}</p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <Zap className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="text-sm font-medium">{t('energy_usage')}</p>
                <p className="text-xs text-muted-foreground">84.9 kWh {t('in_dec')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Habit Analysis */}
      <Card className="bg-card/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-primary" />
            <span>{t('charging_habits_analysis')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">{t('charging_efficiency')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('energy_per_session')}</span>
                  <span className="text-sm font-medium">{analysisData.chargingHabits.averageEnergyPerSession} kWh</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('preferred_charger')}</span>
                  <Badge variant="secondary">{analysisData.chargingHabits.mostUsedChargerType}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">{t('payment_method')}</span>
                  <span className="text-sm font-medium">{analysisData.chargingHabits.preferredPaymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">{t('cost_efficiency_score')}</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('your_score')}</span>
                  <span className="text-sm font-medium">{analysisData.chargingHabits.costEfficiency}%</span>
                </div>
                <Progress value={analysisData.chargingHabits.costEfficiency} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {t('more_efficient_than')}
                </p>
              </div>
              
              <div className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 p-3 rounded text-sm">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                {t('great_job_efficient')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-accent/30">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back_to_dashboard')}
              </Button>
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary via-primary/90 to-primary/70 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 transform group-hover:scale-110 transition-transform duration-300">
                    <BarChart3 className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <h1 className="font-semibold text-foreground">
                    {t('personal_analysis')}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {t('personal_analysis_insights')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <PieChart className="w-4 h-4 mr-2" />
              {t('overview')}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Target className="w-4 h-4 mr-2" />
              {t('recommendations')}
            </TabsTrigger>
            <TabsTrigger value="trends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="w-4 h-4 mr-2" />
              {t('trends')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="recommendations">
            <RecommendationsTab />
          </TabsContent>

          <TabsContent value="trends">
            <TrendsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}