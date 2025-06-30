import { useQuery } from '@apollo/client';
import { useMemo, useCallback } from 'react';
import { 
  GET_RECENT_SWAPS, 
  GET_USER_STATS, 
  GET_DAILY_VOLUME, 
  GET_POOL_STATS,
  GET_RECENT_LIQUIDITY_EVENTS,
  GET_TOP_USERS,
  GET_VOLUME_ANALYTICS,
  GET_DASHBOARD_DATA
} from '../lib/graphql';
import type {
  SwapData,
  UserStatsData,
  DailyVolumeData,
  PoolStatsData,
  LiquidityEventData
} from '../lib/graphql';

/*
 * OPTIMIZED POLLING INTERVALS FOR REAL-TIME DEX TRADING:
 * 
 * 🚀 High Priority (3-5s):  Recent swaps, Pool stats
 * ⚡ Medium Priority (8-15s): Liquidity events, Daily volume, User stats  
 * 📊 Low Priority (30-60s):  Top users, Volume analytics
 * 
 * These intervals provide excellent real-time experience while maintaining
 * reasonable server load and network usage.
 */

// Hook for recent swaps
export const useRecentSwaps = (limit = 10) => {
  const { data, loading, error, refetch } = useQuery(GET_RECENT_SWAPS, {
    variables: { limit },
    pollInterval: 30000, // Reduced from 5000 to 30000 (30 seconds)
    errorPolicy: 'all',
    notifyOnNetworkStatusChange: false, // Prevent unnecessary re-renders
    fetchPolicy: 'cache-first', // Use cache first to reduce network calls
  });

  // Memoize the returned data to prevent object recreation on every render
  const swapData = useMemo(() => data?.swapss?.items || [], [data?.swapss?.items]);
  
  // Memoize the refetch function
  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  // Return stable object reference
  return useMemo(() => ({
    data: swapData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [swapData, loading, error, stableRefetch]);
};

// Hook for user statistics
export const useUserStats = (userAddress?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_USER_STATS, {
    variables: { userAddress },
    skip: !userAddress,
    pollInterval: 60000, // Reduced from 10000 to 60000 (1 minute)
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const userData = useMemo(() => data?.userStats, [data?.userStats]);
  
  const stableRefetch = useCallback(() => {
    if (!userAddress) return Promise.resolve();
    return refetch();
  }, [refetch, userAddress]);

  return useMemo(() => ({
    data: userData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [userData, loading, error, stableRefetch]);
};

// Hook for daily volume
export const useDailyVolume = (days = 7) => {
  const { data, loading, error, refetch } = useQuery(GET_DAILY_VOLUME, {
    variables: { days },
    pollInterval: 120000, // Reduced from 30000 to 120000 (2 minutes)
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const volumeData = useMemo(() => data?.dailyVolumess?.items || [], [data?.dailyVolumess?.items]);
  
  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return useMemo(() => ({
    data: volumeData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [volumeData, loading, error, stableRefetch]);
};

// Hook for pool statistics
export const usePoolStats = () => {
  const { data, loading, error, refetch } = useQuery(GET_POOL_STATS, {
    pollInterval: 60000, // Reduced from 15000 to 60000 (1 minute)
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const poolData = useMemo(() => data?.poolStats, [data?.poolStats]);
  
  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return useMemo(() => ({
    data: poolData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [poolData, loading, error, stableRefetch]);
};

// Hook for recent liquidity events
export const useLiquidityEvents = (limit = 10) => {
  const { data, loading, error, refetch } = useQuery(GET_RECENT_LIQUIDITY_EVENTS, {
    variables: { limit },
    pollInterval: 60000, // Reduced from 5000 to 60000 (1 minute)
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const liquidityData = useMemo(() => data?.liquidityEventss?.items || [], [data?.liquidityEventss?.items]);
  
  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return useMemo(() => ({
    data: liquidityData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [liquidityData, loading, error, stableRefetch]);
};

// Hook for top users
export const useTopUsers = (limit = 10) => {
  const { data, loading, error, refetch } = useQuery(GET_TOP_USERS, {
    variables: { limit },
    pollInterval: 300000, // 5 minutes - this data doesn't change often
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const topUsersData = useMemo(() => data?.userStatss?.items || [], [data?.userStatss?.items]);
  
  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return useMemo(() => ({
    data: topUsersData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [topUsersData, loading, error, stableRefetch]);
};

// Hook for volume analytics
export const useVolumeAnalytics = (days = 30) => {
  const { data, loading, error, refetch } = useQuery(GET_VOLUME_ANALYTICS, {
    variables: { days },
    pollInterval: 60000, // 1 minute - historical data changes slowly
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const analyticsData = useMemo(() => data?.dailyVolumess?.items || [], [data?.dailyVolumess?.items]);
  
  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return useMemo(() => ({
    data: analyticsData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [analyticsData, loading, error, stableRefetch]);
};

// Hook for dashboard data (combined query) - ONLY USE THIS IF YOU NEED ALL DATA AT ONCE
export const useDashboardData = (userAddress?: string) => {
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA, {
    variables: { userAddress },
    pollInterval: 120000, // 2 minutes
    errorPolicy: 'all',
    fetchPolicy: 'cache-first',
    notifyOnNetworkStatusChange: false,
  });

  const dashboardData = useMemo(() => ({
    recentSwaps: data?.recentSwaps?.items || [],
    poolStats: data?.poolStats,
    dailyVolumes: data?.dailyVolumes?.items || [],
    userStats: data?.userStats,
  }), [
    data?.recentSwaps?.items,
    data?.poolStats,
    data?.dailyVolumes?.items,
    data?.userStats
  ]);

  const stableRefetch = useCallback(() => {
    return refetch();
  }, [refetch]);

  return useMemo(() => ({
    data: dashboardData,
    isLoading: loading,
    error,
    refetch: stableRefetch,
  }), [dashboardData, loading, error, stableRefetch]);
};

// Hook for aggregated analytics - CAREFUL: This uses multiple queries
export const useAnalytics = () => {
  const recentSwaps = useRecentSwaps(50);
  const dailyVolume = useDailyVolume(30);
  const poolStats = usePoolStats();
  const liquidityEvents = useLiquidityEvents(20);
  
  // Memoize the aggregated data
  const aggregatedData = useMemo(() => ({
    recentSwaps: recentSwaps.data || [],
    dailyVolume: dailyVolume.data || [],
    poolStats: poolStats.data,
    liquidityEvents: liquidityEvents.data || [],
    isLoading: recentSwaps.isLoading || dailyVolume.isLoading || poolStats.isLoading,
    error: recentSwaps.error || dailyVolume.error || poolStats.error,
  }), [
    recentSwaps.data,
    recentSwaps.isLoading,
    recentSwaps.error,
    dailyVolume.data,
    dailyVolume.isLoading,
    dailyVolume.error,
    poolStats.data,
    poolStats.isLoading,
    poolStats.error,
    liquidityEvents.data
  ]);

  return aggregatedData;
};

// Helper hook for indexer health - Simple health check
export const useIndexerHealth = () => {
  const { data, loading, error } = useQuery(GET_POOL_STATS, {
    pollInterval: 30000, // 30 seconds - health check doesn't need to be too frequent
    errorPolicy: 'all',
    fetchPolicy: 'cache-first', // Changed from network-only for better performance
    notifyOnNetworkStatusChange: false,
  });

  const healthData = useMemo(() => ({
    isHealthy: !error && !!data?.poolStats,
    lastUpdated: data?.poolStats?.lastUpdated,
    error: error
  }), [error, data?.poolStats]);

  return useMemo(() => ({
    data: healthData,
    isLoading: loading,
    error,
  }), [healthData, loading, error]);
};

// Manual refetch hook - Use this for user-triggered refreshes
export const useManualRefresh = () => {
  const recentSwaps = useRecentSwaps();
  const poolStats = usePoolStats();
  const dailyVolume = useDailyVolume();

  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        recentSwaps.refetch(),
        poolStats.refetch(),
        dailyVolume.refetch(),
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [recentSwaps.refetch, poolStats.refetch, dailyVolume.refetch]);

  return { refreshAll };
};

// Re-export types for convenience
export type {
  SwapData,
  UserStatsData,
  DailyVolumeData,
  PoolStatsData,
  LiquidityEventData
};