import { useState, useEffect } from 'react';
import { Lightbulb, TrendingDown, AlertCircle } from 'lucide-react';
import api from '../api/axios';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const response = await api.get('/carbon/recommendations');
      setRecommendations(response.data.data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading recommendations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Recommendations</h1>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <TrendingDown size={20} />
          <span>Reduce your carbon footprint</span>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <div className="card text-center py-12">
          <Lightbulb className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No recommendations yet</h3>
          <p className="text-gray-500">Upload bills to get personalized recommendations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`card border-2 ${getPriorityColor(rec.priority)} transition-all hover:shadow-lg`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{getPriorityIcon(rec.priority)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{rec.title}</h3>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-white border">
                      {rec.priority.toUpperCase()} PRIORITY
                    </span>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{rec.description}</p>
                  
                  <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                    <TrendingDown className="text-green-600" size={20} />
                    <span className="font-bold text-green-600">{rec.potentialReduction}</span>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <span className="font-medium">Category:</span> {rec.category}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card bg-primary-50 border-primary-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-primary-600 flex-shrink-0 mt-1" size={24} />
          <div>
            <h3 className="font-bold text-primary-900 mb-2">How to implement these recommendations:</h3>
            <ul className="space-y-1 text-sm text-primary-800">
              <li>• Start with high-priority items for maximum impact</li>
              <li>• Many recommendations have low or no upfront costs</li>
              <li>• Track your progress - upload new bills to see improvements</li>
              <li>• Consider energy audits for comprehensive analysis ($150-500)</li>
              <li>• Some utilities offer rebates for efficiency upgrades</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
