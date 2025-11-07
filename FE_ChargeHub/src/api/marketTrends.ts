import { api } from '../services/api';

// Market Trends Widget API
export interface MarketTrendsData {
  trends?: Array<{
    period: string;
    value: number;
    change?: number;
    changePercent?: number;
  }>;
  summary?: {
    totalGrowth?: number;
    averageGrowth?: number;
    currentValue?: number;
    previousValue?: number;
  };
  [key: string]: any; // Allow for flexible API response structure
}

export const getMarketTrends = async (): Promise<MarketTrendsData> => {
  try {
    console.log('Fetching market trends data...');
    // API trả về dạng text, cần chỉ định responseType là 'text'
    const response = await api.get<string>('/api/admin/widget/market-trends', {
      responseType: 'text'
    });
    
    console.log('Market trends API response (text):', response.data);
    
    // Parse text response thành JSON
    let parsedData: MarketTrendsData;
    
    if (typeof response.data === 'string') {
      try {
        // Thử parse JSON từ text
        parsedData = JSON.parse(response.data);
      } catch (parseError) {
        // Nếu không phải JSON, xử lý text trực tiếp
        console.warn('Response is not JSON, treating as plain text');
        // Trả về object với text field
        parsedData = {
          text: response.data,
          trends: [],
          summary: {}
        };
      }
    } else {
      // Nếu response.data không phải string, sử dụng trực tiếp
      parsedData = response.data as MarketTrendsData;
    }
    
    console.log('Parsed market trends data:', parsedData);
    return parsedData;
  } catch (error: any) {
    console.error('Error fetching market trends:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

