import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, TrendingDown, Activity, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { getMarketTrends, MarketTrendsData } from '../api/marketTrends';
import { motion, AnimatePresence } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketTrendsWidgetProps {
  className?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export default function MarketTrendsWidget({ className, isExpanded: externalIsExpanded, onExpandChange }: MarketTrendsWidgetProps) {
  const { language } = useLanguage();
  const [data, setData] = useState<MarketTrendsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = (value: boolean) => {
    if (onExpandChange) {
      onExpandChange(value);
    } else {
      setInternalIsExpanded(value);
    }
  };

  useEffect(() => {
    const fetchMarketTrends = async () => {
      try {
        setLoading(true);
        setError(null);
        const trendsData = await getMarketTrends();
        setData(trendsData);
      } catch (err: any) {
        console.error('Error loading market trends:', err);
        setError(err?.response?.data?.message || (language === 'en' ? 'Failed to load market trends' : 'Không thể tải xu hướng thị trường'));
      } finally {
        setLoading(false);
      }
    };

    fetchMarketTrends();
  }, [language]);

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <Card className={`${className} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {language === 'en' ? 'Market Trends' : 'Xu hướng thị trường'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            {language === 'en' ? 'Market Trends' : 'Xu hướng thị trường'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 gap-2 text-muted-foreground">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Kiểm tra nếu API trả về plain text
  if (data?.text && typeof data.text === 'string') {
    // Parse text: dòng đầu tiên làm subtitle, các dòng tiếp theo làm cards
    const lines = data.text.split('\n').filter(line => line.trim() !== '');
    const subtitle = lines[0] || '';
    const trendItems = lines.slice(1); // Các dòng từ dòng thứ 2 trở đi

    // Hàm parse tiêu đề và nội dung từ một dòng
    const parseTrendItem = (item: string) => {
      const trimmed = item.trim();
      // Tìm pattern: *** tiêu đề: nội dung
      const titleMatch = trimmed.match(/^\*\*\*\s*(.+?):\s*(.+)$/);
      if (titleMatch) {
        // Loại bỏ tất cả *** khỏi tiêu đề
        const cleanTitle = titleMatch[1].trim().replace(/\*\*\*/g, '').trim();
        return {
          title: cleanTitle,
          content: titleMatch[2].trim(),
          hasTitle: true
        };
      }
      // Tìm pattern: tiêu đề: nội dung (có thể có *** trong tiêu đề)
      const simpleMatch = trimmed.match(/^(.+?):\s*(.+)$/);
      if (simpleMatch) {
        // Loại bỏ tất cả *** khỏi tiêu đề
        const cleanTitle = simpleMatch[1].trim().replace(/\*\*\*/g, '').trim();
        return {
          title: cleanTitle,
          content: simpleMatch[2].trim(),
          hasTitle: true
        };
      }
      // Nếu không có pattern, trả về toàn bộ là nội dung
      return {
        title: '',
        content: trimmed,
        hasTitle: false
      };
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className={`${className} border-2`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  {language === 'en' ? 'Market Trends' : 'Xu hướng thị trường'}
                </CardTitle>
                {subtitle && (
                  <CardDescription className="text-base font-medium text-foreground mt-2">
                    {subtitle}
                  </CardDescription>
                )}
              </div>
              {trendItems.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-8 w-8 p-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <AnimatePresence>
            {isExpanded && trendItems.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <CardContent className="space-y-3">
                  {trendItems.map((item, index) => {
                    const parsed = parseTrendItem(item);
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors shadow-sm"
                      >
                        {parsed.hasTitle ? (
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-primary leading-tight">
                              {parsed.title}
                            </h4>
                            <p className="text-sm text-foreground leading-relaxed">
                              {parsed.content}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-foreground leading-relaxed">
                            {parsed.content}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    );
  }

  const trends = data?.trends || [];
  const summary = data?.summary || {};
  const totalGrowth = summary.totalGrowth ?? 0;
  const averageGrowth = summary.averageGrowth ?? 0;
  const currentValue = summary.currentValue ?? 0;
  const previousValue = summary.previousValue ?? 0;

  // Prepare chart data
  const chartData = trends.map((trend) => ({
    period: trend.period,
    value: trend.value,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`${className} border-2`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {language === 'en' ? 'Market Trends' : 'Xu hướng thị trường'}
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'Current market trends and growth indicators' 
                  : 'Xu hướng thị trường và chỉ số tăng trưởng hiện tại'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Total Growth */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Total Growth' : 'Tăng trưởng tổng'}
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-2 ${totalGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {totalGrowth >= 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          {formatPercent(totalGrowth)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Average Growth */}
                  <div className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {language === 'en' ? 'Average Growth' : 'Tăng trưởng trung bình'}
                        </p>
                        <p className={`text-2xl font-bold flex items-center gap-2 ${averageGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {averageGrowth >= 0 ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                          {formatPercent(averageGrowth)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current vs Previous Value */}
                {(currentValue > 0 || previousValue > 0) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'en' ? 'Current Value' : 'Giá trị hiện tại'}
                      </p>
                      <p className="text-xl font-semibold">{formatValue(currentValue)}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-card">
                      <p className="text-sm text-muted-foreground mb-1">
                        {language === 'en' ? 'Previous Value' : 'Giá trị trước đó'}
                      </p>
                      <p className="text-xl font-semibold">{formatValue(previousValue)}</p>
                    </div>
                  </div>
                )}

                {/* Trend Chart */}
                {chartData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-4">
                      {language === 'en' ? 'Trend Over Time' : 'Xu hướng theo thời gian'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="period" 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                        />
                        <YAxis 
                          className="text-xs"
                          tick={{ fill: 'currentColor' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Trend List */}
                {trends.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-4">
                      {language === 'en' ? 'Recent Trends' : 'Xu hướng gần đây'}
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {trends.slice(0, 5).map((trend, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium">{trend.period}</p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'en' ? 'Value' : 'Giá trị'}: {formatValue(trend.value)}
                            </p>
                          </div>
                          {trend.changePercent !== undefined && (
                            <div className={`flex items-center gap-1 ${trend.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {trend.changePercent >= 0 ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="text-sm font-medium">
                                {formatPercent(trend.changePercent)}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {trends.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">
                      {language === 'en' 
                        ? 'No trend data available' 
                        : 'Không có dữ liệu xu hướng'}
                    </p>
                  </div>
                )}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

