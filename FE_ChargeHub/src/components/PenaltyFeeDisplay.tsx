import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Badge } from './ui/badge';
import { AlertCircle, Clock, Timer } from 'lucide-react';

interface PenaltyFee {
  lateArrival?: number;
  overstay?: number;
  total: number;
}

interface PenaltyFeeDisplayProps {
  penaltyFees: PenaltyFee;
  compact?: boolean;
}

export default function PenaltyFeeDisplay({ penaltyFees, compact = false }: PenaltyFeeDisplayProps) {
  const { language } = useLanguage();

  const formatCurrency = (amount: number) => {
    return language === 'vi' 
      ? `${Math.round(amount).toLocaleString('vi-VN')}đ`
      : `$${(amount / 23000).toFixed(2)}`;
  };

  if (penaltyFees.total === 0) {
    return null;
  }

  if (compact) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {language === 'vi' ? 'Phí phạt:' : 'Penalty:'} {formatCurrency(penaltyFees.total)}
      </Badge>
    );
  }

  return (
    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-medium mb-3">
        <AlertCircle className="w-5 h-5" />
        {language === 'vi' ? 'Phí Phạt Được Áp Dụng' : 'Penalty Fees Applied'}
      </div>
      
      <div className="space-y-2 text-sm">
        {penaltyFees.lateArrival && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
              <span>{language === 'vi' ? 'Phí trễ giờ' : 'Late arrival fee'}</span>
            </div>
            <span className="font-medium text-orange-600 dark:text-orange-400">
              +{formatCurrency(penaltyFees.lateArrival)}
            </span>
          </div>
        )}
        
        {penaltyFees.overstay && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Timer className="w-4 h-4" />
              <span>{language === 'vi' ? 'Phí vượt thời gian' : 'Overstay fee'}</span>
            </div>
            <span className="font-medium text-red-600 dark:text-red-400">
              +{formatCurrency(penaltyFees.overstay)}
            </span>
          </div>
        )}
        
        <div className="border-t border-red-200 dark:border-red-800 pt-2 mt-3">
          <div className="flex items-center justify-between font-medium">
            <span className="text-red-700 dark:text-red-400">
              {language === 'vi' ? 'Tổng phí phạt:' : 'Total penalty:'}
            </span>
            <span className="text-red-700 dark:text-red-400">
              {formatCurrency(penaltyFees.total)}
            </span>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground italic mt-2">
          {language === 'vi' 
            ? '* Phí phạt được tính tự động dựa trên thời gian thực tế sử dụng'
            : '* Penalty fees are automatically calculated based on actual usage time'
          }
        </div>
      </div>
    </div>
  );
}