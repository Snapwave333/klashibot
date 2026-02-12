import React, { useState, useEffect } from 'react';
import { getMarketImage } from '../../utils/marketImageCache';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

interface MarketImagePreviewProps {
  ticker: string;
  showLabel?: boolean;
  initialUrl?: string;
}

export const MarketImagePreview: React.FC<MarketImagePreviewProps> = ({
  ticker,
  showLabel = false,
  initialUrl,
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl || null);
  const [loading, setLoading] = useState(!initialUrl);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (initialUrl) {
        setImageUrl(initialUrl);
        setLoading(false);
        return undefined;
    }

    let mounted = true;

    const loadImage = async () => {
      setLoading(true);
      setError(false);

      try {
        const url = await getMarketImage(ticker);
        if (mounted) {
          if (url) {
            setImageUrl(url);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-white/5 rounded w-16 h-16 animate-pulse">
        <ImageIcon className="w-6 h-6 text-gray-600" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="flex justify-center items-center bg-white/5 border border-white/10 rounded w-16 h-16">
        <ImageIcon className="w-6 h-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="group relative">
      <a
        href={`https://kalshi.com/markets/${ticker}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative rounded group-hover:ring-2 group-hover:ring-neon-cyan/50 overflow-hidden transition-all">
          <img
            src={imageUrl}
            alt={`${ticker} market`}
            className="w-16 h-16 object-cover group-hover:scale-110 transition-transform"
            onError={() => setError(true)}
          />

          {/* Hover overlay */}
          <div className="absolute inset-0 flex justify-center items-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4 text-white" />
          </div>
        </div>

        {showLabel && (
          <div className="right-0 -bottom-5 left-0 absolute text-center">
            <span className="bg-black/80 px-1.5 py-0.5 rounded font-mono text-[8px] text-gray-400">
              {ticker}
            </span>
          </div>
        )}
      </a>
    </div>
  );
};

/**
 * Larger preview for expanded view
 */
export const MarketImagePreviewLarge: React.FC<MarketImagePreviewProps> = ({ ticker }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadImage = async () => {
      setLoading(true);
      setError(false);

      try {
        const url = await getMarketImage(ticker);
        if (mounted) {
          if (url) {
            setImageUrl(url);
          } else {
            setError(true);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(true);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      mounted = false;
    };
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex justify-center items-center bg-white/5 rounded-lg w-full h-32 animate-pulse">
        <ImageIcon className="w-8 h-8 text-gray-600" />
      </div>
    );
  }

  if (error || !imageUrl) {
    return null;
  }

  return (
    <div className="group relative mt-2">
      <a
        href={`https://kalshi.com/markets/${ticker}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <div className="relative rounded-lg group-hover:ring-2 group-hover:ring-neon-cyan/50 overflow-hidden transition-all">
          <img
            src={imageUrl}
            alt={`${ticker} market`}
            className="w-full max-w-md h-32 object-cover group-hover:scale-105 transition-transform"
            onError={() => setError(true)}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="right-2 bottom-2 absolute flex items-center gap-1.5 bg-neon-cyan/20 backdrop-blur-sm px-2 py-1 border border-neon-cyan/30 rounded">
              <span className="font-bold text-neon-cyan text-xs">View on Kalshi</span>
              <ExternalLink className="w-3 h-3 text-neon-cyan" />
            </div>
          </div>
        </div>
      </a>
    </div>
  );
};
