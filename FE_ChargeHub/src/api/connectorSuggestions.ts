import { api } from '../services/api';

// Admin AI Connector Suggestions API
export interface ConnectorSuggestion {
  stationName: string;
  connectorType: string;
  suggestionMessage: string;
  utilizationRate: number;
}

export interface ConnectorSuggestionsAPIResponse {
  success: boolean;
  message: string;
  data: ConnectorSuggestion[];
  timestamp: string | null;
}

export interface ConnectorSuggestionsResponse {
  suggestions: ConnectorSuggestion[];
  summary?: string;
  totalSuggestions?: number;
}

export const getConnectorSuggestions = async (): Promise<ConnectorSuggestionsResponse> => {
  try {
    console.log('Fetching connector suggestions...');
    const response = await api.get<ConnectorSuggestionsAPIResponse>('/api/admin/ai/connector-suggestions');
    console.log('Connector suggestions API response:', response.data);
    
    // Transform API response to component format
    const apiData = response.data;
    return {
      suggestions: apiData.data || [],
      summary: apiData.message,
      totalSuggestions: apiData.data?.length || 0
    };
  } catch (error: any) {
    console.error('Error fetching connector suggestions:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
};

