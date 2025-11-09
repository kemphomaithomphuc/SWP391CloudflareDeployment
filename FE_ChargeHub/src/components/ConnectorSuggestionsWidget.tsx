import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { getConnectorSuggestions, ConnectorSuggestion } from '../api/connectorSuggestions';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Loader2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ConnectorSuggestionsWidgetProps {
  className?: string;
  isExpanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
}

export default function ConnectorSuggestionsWidget({ className, isExpanded: externalIsExpanded, onExpandChange }: ConnectorSuggestionsWidgetProps) {
  const { language } = useLanguage();
  const [suggestions, setSuggestions] = useState<ConnectorSuggestion[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const [expandedNormalConnectors, setExpandedNormalConnectors] = useState<Set<string>>(new Set());
  
  const isExpanded = externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = (value: boolean) => {
    if (onExpandChange) {
      onExpandChange(value);
    } else {
      setInternalIsExpanded(value);
    }
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getConnectorSuggestions();
        setSuggestions(data.suggestions || []);
        const summaryText = data.summary || '';
        setSummary(summaryText);
        
        // Hiển thị summary và tự động ẩn sau 2 giây
        if (summaryText) {
          setShowSummary(true);
          setTimeout(() => {
            setShowSummary(false);
          }, 2000);
        }
      } catch (err: any) {
        console.error('Error loading connector suggestions:', err);
        setError(err?.response?.data?.message || (language === 'en' ? 'Failed to load suggestions' : 'Không thể tải gợi ý'));
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [language]);

  // Parse suggestion message to determine action
  const parseSuggestion = (suggestion: ConnectorSuggestion) => {
    const message = suggestion.suggestionMessage || '';
    const isRemove = message.includes('GỠ BỚT') || message.includes('THAY THẾ') || message.toLowerCase().includes('remove');
    const isNormal = message.includes('Hoạt động bình thường') || message.toLowerCase().includes('normal');
    
    return {
      action: isRemove ? 'REMOVE' as const : isNormal ? 'NORMAL' as const : null,
      reason: message,
      utilizationRate: suggestion.utilizationRate
    };
  };

  const getActionIcon = (action: string | null) => {
    if (action === 'REMOVE') {
      return <Minus className="w-4 h-4" />;
    }
    return null;
  };

  const getActionBadgeVariant = (action: string | null) => {
    return action === 'REMOVE' ? 'destructive' : 'secondary';
  };

  const formatUtilizationRate = (rate: number) => {
    const percentage = (rate * 100).toFixed(2);
    return `${percentage}%`;
  };

  // Group suggestions by station name
  const groupByStation = (suggestions: ConnectorSuggestion[]) => {
    const grouped: Record<string, ConnectorSuggestion[]> = {};
    suggestions.forEach(suggestion => {
      const stationName = suggestion.stationName || 'Unknown';
      if (!grouped[stationName]) {
        grouped[stationName] = [];
      }
      grouped[stationName].push(suggestion);
    });
    return grouped;
  };

  const groupedStations = groupByStation(suggestions);
  const stationNames = Object.keys(groupedStations);

  if (loading) {
    return (
      <Card className={`${className} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            {language === 'en' ? 'AI Connector Suggestions' : 'Gợi ý Trụ sạc AI'}
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
            <Zap className="w-5 h-5" />
            {language === 'en' ? 'AI Connector Suggestions' : 'Gợi ý Trụ sạc AI'}
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
                <Zap className="w-5 h-5 text-primary" />
                {language === 'en' ? 'AI Connector Suggestions' : 'Gợi ý Trụ sạc AI'}
              </CardTitle>
              <CardDescription>
                {language === 'en' 
                  ? 'AI-powered recommendations for optimizing charging stations' 
                  : 'Gợi ý từ AI để tối ưu hóa trạm sạc'}
              </CardDescription>
            </div>
            {stationNames.length > 0 && (
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
          {isExpanded && stationNames.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <CardContent>
                {summary && showSummary && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-foreground">{summary}</p>
                    </div>
                  </motion.div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stationNames.map((stationName, stationIndex) => {
                    const stationSuggestions = groupedStations[stationName] ?? [];
                    
                    return (
                      <motion.div
                        key={stationName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: stationIndex * 0.1, duration: 0.3 }}
                        className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors shadow-sm"
                      >
                        <div className="space-y-3">
                          {/* Station Header */}
                          <div className="flex items-start gap-2 pb-2 border-b">
                            <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <h3 className="text-base font-semibold text-foreground">
                              {stationName}
                            </h3>
                          </div>

                          {/* Connector Types */}
                          <div className="space-y-2">
                            {stationSuggestions.map((suggestion, index) => {
                              const parsed = parseSuggestion(suggestion);
                              const connectorKey = `${stationName}-${suggestion.connectorType}-${index}`;
                              const isNormal = parsed.action === 'NORMAL';
                              const isExpanded = expandedNormalConnectors.has(connectorKey);
                              
                              // Nếu là NORMAL và chưa expand, hiển thị compact
                              if (isNormal && !isExpanded) {
                                return (
                                  <motion.div
                                    key={index}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-2 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                                    onClick={() => {
                                      setExpandedNormalConnectors(prev => {
                                        const newSet = new Set(prev);
                                        newSet.add(connectorKey);
                                        return newSet;
                                      });
                                    }}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="default" className="flex items-center gap-1 text-xs">
                                          <CheckCircle className="w-3 h-3" />
                                          {language === 'en' ? 'Normal' : 'Bình thường'}
                                        </Badge>
                                        {suggestion.connectorType && (
                                          <span className="text-xs text-muted-foreground">
                                            {suggestion.connectorType}
                                          </span>
                                        )}
                                      </div>
                                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </div>
                                  </motion.div>
                                );
                              }
                              
                              // Hiển thị đầy đủ cho REMOVE hoặc NORMAL đã expand
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-3 rounded-lg border bg-muted/30"
                                >
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {parsed.action && (
                                        <Badge 
                                          variant={getActionBadgeVariant(parsed.action)}
                                          className="flex items-center gap-1 text-xs"
                                        >
                                          {getActionIcon(parsed.action)}
                                          {parsed.action === 'REMOVE' 
                                            ? (language === 'en' ? 'Remove' : 'Gỡ bớt') 
                                            : ''}
                                        </Badge>
                                      )}
                                      {parsed.action === 'NORMAL' && (
                                        <>
                                          <Badge variant="default" className="flex items-center gap-1 text-xs">
                                            <CheckCircle className="w-3 h-3" />
                                            {language === 'en' ? 'Normal' : 'Bình thường'}
                                          </Badge>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => {
                                              setExpandedNormalConnectors(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(connectorKey);
                                                return newSet;
                                              });
                                            }}
                                          >
                                            <ChevronUp className="w-3 h-3" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                    {suggestion.connectorType && (
                                      <Badge variant="outline" className="text-xs">
                                        {suggestion.connectorType}
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Suggestion Message */}
                                  {parsed.reason && (
                                    <div className={`flex items-start gap-2 p-2 rounded mb-2 ${
                                      parsed.action === 'REMOVE' 
                                        ? 'bg-destructive/10 border border-destructive/20' 
                                        : parsed.action === 'NORMAL'
                                        ? 'bg-green-500/10 border border-green-500/20'
                                        : 'bg-primary/5 border border-primary/10'
                                    }`}>
                                      {parsed.action === 'REMOVE' ? (
                                        <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 flex-shrink-0" />
                                      ) : parsed.action === 'NORMAL' ? (
                                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <Info className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                                      )}
                                      <p className={`text-xs leading-relaxed ${
                                        parsed.action === 'REMOVE' 
                                          ? 'text-destructive' 
                                          : parsed.action === 'NORMAL'
                                          ? 'text-green-700 dark:text-green-400'
                                          : 'text-foreground'
                                      }`}>
                                        {parsed.reason}
                                      </p>
                                    </div>
                                  )}

                                  {/* Utilization Rate */}
                                  <div className="flex items-center justify-between p-1.5 rounded bg-background/50">
                                    <span className="text-xs text-muted-foreground">
                                      {language === 'en' ? 'Utilization:' : 'Tỷ lệ sử dụng:'}
                                    </span>
                                    <span className={`text-xs font-semibold ${
                                      parsed.utilizationRate < 0.01 
                                        ? 'text-destructive' 
                                        : parsed.utilizationRate < 0.1
                                        ? 'text-orange-600'
                                        : 'text-green-600'
                                    }`}>
                                      {formatUtilizationRate(parsed.utilizationRate)}
                                    </span>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>


        {stationNames.length === 0 && !loading && !error && (
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'en' 
                  ? 'No suggestions at this time. Your charging network is optimized!' 
                  : 'Không có gợi ý vào lúc này. Mạng lưới sạc của bạn đã được tối ưu hóa!'}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </motion.div>
  );
}

