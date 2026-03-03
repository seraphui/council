'use client';

import { useState } from 'react';
import { PREDICTIONS, PREDICTION_CATEGORIES, PREDICTION_ENTITIES, Prediction } from '@/data/predictions';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { EntityIcon } from '../Icons';
import { entities } from '@/lib/entities';

const getEntityIcon = (entityId: string) => {
  const entity = entities.find(e => e.id === entityId);
  return entity?.icon || 'brain';
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getStatusStyle(status: Prediction['status']): string {
  switch (status) {
    case 'CONFIRMED': return 'bg-[rgba(74,124,89,0.1)] text-[#4a7c59]';
    case 'FAILED': return 'bg-[rgba(192,57,43,0.1)] text-[#c0392b]';
    default: return 'bg-[#f0f0f0] text-[#888]';
  }
}

function getCategoryStyle(category: Prediction['category']): { bg: string; text: string; border: string } {
  switch (category) {
    case 'Geopolitics': return { bg: 'rgba(180,60,60,0.08)', text: 'rgba(180,60,60,0.8)', border: '#b43c3c' };
    case 'Economics': return { bg: 'rgba(50,80,160,0.08)', text: 'rgba(50,80,160,0.8)', border: '#3250a0' };
    case 'Technology': return { bg: 'rgba(120,60,160,0.08)', text: 'rgba(120,60,160,0.8)', border: '#783ca0' };
    case 'Society': return { bg: 'rgba(60,130,80,0.08)', text: 'rgba(60,130,80,0.8)', border: '#3c8250' };
    default: return { bg: 'rgba(0,0,0,0.05)', text: '#666', border: '#888' };
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 81) return '#4a7c59';
  if (confidence >= 61) return '#6a8a5b';
  if (confidence >= 41) return '#d4a017';
  return '#c0392b';
}

function getCardAccent(status: Prediction['status']): string {
  switch (status) {
    case 'CONFIRMED': return 'border-l-[3px] border-l-[#4a7c59]';
    case 'FAILED': return 'border-l-[3px] border-l-[#c0392b]';
    default: return '';
  }
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const [expanded, setExpanded] = useState(false);
  const categoryStyle = getCategoryStyle(prediction.category);

  return (
    <div className={`bg-white border border-[#e0dcd6] p-5 ${getCardAccent(prediction.status)}`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-white/70 border border-[rgba(0,0,0,0.1)] flex items-center justify-center">
            <EntityIcon icon={getEntityIcon(prediction.entity)} className="w-4 h-4" />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[1px] text-[#666]">
            {prediction.entity}
          </span>
        </div>

        <span 
          className="font-roos text-[11px] px-2 py-1 rounded"
          style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
        >
          {prediction.category}
        </span>
      </div>

      <p className="font-roos text-[15px] leading-[1.7] text-[#2a2a2a] mb-4">
        {prediction.prediction}
      </p>

      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-[12px] text-[#888]">
          Target: {formatDate(prediction.target_date)}
        </span>

        <div className="flex items-center gap-2">
          <div className="w-[100px] h-[4px] bg-[rgba(0,0,0,0.08)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ 
                width: `${prediction.confidence}%`,
                backgroundColor: getConfidenceColor(prediction.confidence)
              }}
            />
          </div>
          <span className="font-mono text-[11px] text-[#888] w-8">{prediction.confidence}%</span>
        </div>
      </div>

      <div className="mb-2">
        <span className={`font-mono text-[10px] uppercase tracking-[0.5px] px-2 py-1 ${getStatusStyle(prediction.status)}`}>
          {prediction.status}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="font-mono text-[11px] text-[#aaa]">
          Issued: {formatDate(prediction.date_issued)}
        </span>

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 font-roos text-[12px] text-[#888] hover:text-[#555] hover:underline transition-colors"
        >
          {expanded ? 'Hide reasoning' : 'View reasoning'}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {expanded && (
        <div 
          className="mt-4 pl-3 py-3 border-l-[3px]"
          style={{ 
            borderLeftColor: categoryStyle.border,
            backgroundColor: 'rgba(0,0,0,0.02)'
          }}
        >
          <p className="font-roos text-[13px] leading-[1.7] text-[#555]">
            {prediction.reasoning}
          </p>
        </div>
      )}
    </div>
  );
}

export default function PredictionsTab() {
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [entityFilter, setEntityFilter] = useState<string>('All');

  const statusOrder: Record<Prediction['status'], number> = {
    'CONFIRMED': 0,
    'PENDING': 1,
    'FAILED': 2,
  };

  const filteredPredictions = PREDICTIONS
    .filter((p) => categoryFilter === 'All' || p.category === categoryFilter)
    .filter((p) => entityFilter === 'All' || p.entity === entityFilter)
    .sort((a, b) => {
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="font-solaire text-[32px] text-[#1a1a1a] mb-2">Predictions</h2>
        <p className="font-roos text-[14px] text-[#888] italic">
          Convergent signal analysis. Specific dates. Falsifiable claims.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#888] mr-1">Entity:</span>
          {PREDICTION_ENTITIES.map((entity) => (
            <button
              key={entity}
              onClick={() => setEntityFilter(entity)}
              className={`font-roos text-[12px] px-3 py-1 rounded-full transition-colors ${
                entityFilter === entity
                  ? 'bg-[rgba(0,0,0,0.08)] border border-[#1a1a1a] text-[#1a1a1a]'
                  : 'bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] text-[#888] hover:border-[#666]'
              }`}
            >
              {entity}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[1px] text-[#888] mr-1">Category:</span>
          {PREDICTION_CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setCategoryFilter(category)}
              className={`font-roos text-[12px] px-3 py-1 rounded-full transition-colors ${
                categoryFilter === category
                  ? 'bg-[rgba(0,0,0,0.08)] border border-[#1a1a1a] text-[#1a1a1a]'
                  : 'bg-[rgba(0,0,0,0.02)] border border-[rgba(0,0,0,0.1)] text-[#888] hover:border-[#666]'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPredictions.map((prediction) => (
          <PredictionCard key={prediction.id} prediction={prediction} />
        ))}
      </div>

      {filteredPredictions.length === 0 && (
        <div className="text-center py-12">
          <p className="font-roos text-[14px] text-[#888]">No predictions match the selected filters.</p>
        </div>
      )}
    </div>
  );
}
