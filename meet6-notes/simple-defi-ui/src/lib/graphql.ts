import {
  ApolloClient,
  InMemoryCache,
  gql,
  createHttpLink,
} from "@apollo/client";

// Create HTTP link to Ponder GraphQL endpoint
const httpLink = createHttpLink({
  uri: "http://localhost:42069/graphql",
});

// Create Apollo Client with optimized cache configuration
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Configure caching for paginated results
          swapss: {
            merge: false, // Don't merge, replace completely
            keyArgs: ["orderBy", "orderDirection", "limit"], // Cache based on these args
          },
          userStatss: {
            merge: false,
            keyArgs: ["orderBy", "orderDirection", "limit"],
          },
          dailyVolumess: {
            merge: false,
            keyArgs: ["orderBy", "orderDirection", "limit"],
          },
          liquidityEventss: {
            merge: false,
            keyArgs: ["orderBy", "orderDirection", "limit"],
          },
          transferss: {
            merge: false,
            keyArgs: ["orderBy", "orderDirection", "limit"],
          },
        },
      },
      // Cache individual records by ID
      SwapData: {
        keyFields: ["id"],
      },
      UserStatsData: {
        keyFields: ["id"],
      },
      PoolStatsData: {
        keyFields: ["id"],
      },
      DailyVolumeData: {
        keyFields: ["id"],
      },
      LiquidityEventData: {
        keyFields: ["id"],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
      fetchPolicy: "cache-first", // Use cache first
      notifyOnNetworkStatusChange: false, // Prevent unnecessary re-renders
    },
    query: {
      errorPolicy: "all",
      fetchPolicy: "cache-first",
    },
  },
  // Add connection retry logic
  connectToDevTools: process.env.NODE_ENV === "development",
});

// NOTE: Ponder 0.9+ requires you to manually set up GraphQL endpoint
// Create src/api/index.ts with:
// import { db } from "ponder:api";
// import schema from "ponder:schema";
// import { Hono } from "hono";
// import { graphql } from "ponder";
//
// const app = new Hono();
// app.use("/graphql", graphql({ db, schema }));
// export default app;

// GraphQL queries for Swaps
export const GET_RECENT_SWAPS = gql`
  query GetRecentSwaps($limit: Int = 10) {
    swapss(orderBy: "timestamp", orderDirection: "desc", limit: $limit) {
      items {
        id
        user
        tokenIn
        tokenOut
        amountIn
        amountOut
        priceImpact
        gasUsed
        blockNumber
        timestamp
        transactionHash
      }
    }
  }
`;

export const GET_SWAPS_BY_USER = gql`
  query GetSwapsByUser($userAddress: String!, $limit: Int = 10) {
    swapss(
      where: { user: $userAddress }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        tokenIn
        tokenOut
        amountIn
        amountOut
        priceImpact
        timestamp
        transactionHash
      }
    }
  }
`;

// GraphQL queries for User Stats
export const GET_USER_STATS = gql`
  query GetUserStats($userAddress: String!) {
    userStats(id: $userAddress) {
      id
      totalSwaps
      totalVolumeUSD
      liquidityProvided
      feesEarned
      firstSeen
      lastActivity
    }
  }
`;

export const GET_TOP_USERS = gql`
  query GetTopUsers($limit: Int = 10) {
    userStatss(
      orderBy: "totalVolumeUSD"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        totalSwaps
        totalVolumeUSD
        liquidityProvided
        feesEarned
        lastActivity
      }
    }
  }
`;

// GraphQL queries for Daily Volume
export const GET_DAILY_VOLUME = gql`
  query GetDailyVolume($days: Int = 7) {
    dailyVolumess(orderBy: "date", orderDirection: "desc", limit: $days) {
      items {
        id
        date
        volumeUSD
        transactionCount
        uniqueUsers
        avgGasPrice
      }
    }
  }
`;

export const GET_TOTAL_VOLUME = gql`
  query GetTotalVolume {
    dailyVolumess(orderBy: "date", orderDirection: "asc") {
      items {
        volumeUSD
        transactionCount
      }
    }
  }
`;

// GraphQL queries for Pool Stats
export const GET_POOL_STATS = gql`
  query GetPoolStats {
    poolStats(id: "latest") {
      id
      reserveA
      reserveB
      totalLiquidity
      price
      tvlUSD
      volume24h
      lastUpdated
    }
  }
`;

// GraphQL queries for Liquidity Events
export const GET_RECENT_LIQUIDITY_EVENTS = gql`
  query GetRecentLiquidityEvents($limit: Int = 10) {
    liquidityEventss(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        type
        provider
        amountA
        amountB
        liquidity
        shareOfPool
        blockNumber
        timestamp
        transactionHash
      }
    }
  }
`;

export const GET_LIQUIDITY_EVENTS_BY_USER = gql`
  query GetLiquidityEventsByUser($userAddress: String!, $limit: Int = 10) {
    liquidityEventss(
      where: { provider: $userAddress }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        type
        amountA
        amountB
        liquidity
        shareOfPool
        timestamp
        transactionHash
      }
    }
  }
`;

// GraphQL queries for Token Transfers
export const GET_RECENT_TRANSFERS = gql`
  query GetRecentTransfers($tokenAddress: String, $limit: Int = 10) {
    transferss(
      where: { token: $tokenAddress }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        token
        from
        to
        amount
        blockNumber
        timestamp
        transactionHash
      }
    }
  }
`;

export const GET_TRANSFERS_BY_USER = gql`
  query GetTransfersByUser($userAddress: String!, $limit: Int = 10) {
    transferss(
      where: { OR: [{ from: $userAddress }, { to: $userAddress }] }
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        token
        from
        to
        amount
        timestamp
        transactionHash
      }
    }
  }
`;

// Combined dashboard query
export const GET_DASHBOARD_DATA = gql`
  query GetDashboardData($userAddress: String) {
    # Recent swaps
    recentSwaps: swapss(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: 5
    ) {
      items {
        id
        user
        tokenIn
        tokenOut
        amountIn
        amountOut
        priceImpact
        timestamp
      }
    }

    # Pool stats
    poolStats(id: "latest") {
      reserveA
      reserveB
      totalLiquidity
      price
      tvlUSD
      volume24h
      lastUpdated
    }

    # Daily volume (last 7 days)
    dailyVolumes: dailyVolumess(
      orderBy: "date"
      orderDirection: "desc"
      limit: 7
    ) {
      items {
        date
        volumeUSD
        transactionCount
        uniqueUsers
      }
    }

    # User stats (if userAddress provided)
    userStats(id: $userAddress) {
      totalSwaps
      totalVolumeUSD
      liquidityProvided
      feesEarned
      firstSeen
      lastActivity
    }
  }
`;

// Analytics queries
export const GET_VOLUME_ANALYTICS = gql`
  query GetVolumeAnalytics($days: Int = 30) {
    dailyVolumess(orderBy: "date", orderDirection: "desc", limit: $days) {
      items {
        date
        volumeUSD
        transactionCount
        uniqueUsers
        avgGasPrice
      }
    }
  }
`;

export const GET_TOP_TRADERS = gql`
  query GetTopTraders($limit: Int = 20) {
    userStatss(
      where: { totalSwaps_gt: 0 }
      orderBy: "totalVolumeUSD"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        totalSwaps
        totalVolumeUSD
        liquidityProvided
        feesEarned
        firstSeen
        lastActivity
      }
    }
  }
`;

export const GET_LIQUIDITY_PROVIDERS = gql`
  query GetLiquidityProviders($limit: Int = 20) {
    userStatss(
      where: { liquidityProvided_gt: 0 }
      orderBy: "liquidityProvided"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        totalSwaps
        totalVolumeUSD
        liquidityProvided
        feesEarned
        firstSeen
        lastActivity
      }
    }
  }
`;

// Real-time activity query
export const GET_RECENT_ACTIVITY = gql`
  query GetRecentActivity($limit: Int = 20) {
    # Recent swaps
    recentSwaps: swapss(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        user
        tokenIn
        tokenOut
        amountIn
        amountOut
        timestamp
        transactionHash
      }
    }

    # Recent liquidity events
    recentLiquidityEvents: liquidityEventss(
      orderBy: "timestamp"
      orderDirection: "desc"
      limit: $limit
    ) {
      items {
        id
        type
        provider
        amountA
        amountB
        liquidity
        timestamp
        transactionHash
      }
    }
  }
`;

// Search queries
export const SEARCH_TRANSACTIONS = gql`
  query SearchTransactions($hash: String!) {
    # Search swaps
    swaps: swapss(where: { transactionHash: $hash }) {
      items {
        id
        user
        tokenIn
        tokenOut
        amountIn
        amountOut
        priceImpact
        timestamp
        transactionHash
      }
    }

    # Search liquidity events
    liquidityEvents: liquidityEventss(where: { transactionHash: $hash }) {
      items {
        id
        type
        provider
        amountA
        amountB
        liquidity
        timestamp
        transactionHash
      }
    }

    # Search transfers
    transfers: transferss(where: { transactionHash: $hash }) {
      items {
        id
        token
        from
        to
        amount
        timestamp
        transactionHash
      }
    }
  }
`;

// Helper function to format BigInt values for GraphQL
export const formatBigIntForGraphQL = (value: bigint): string => {
  return value.toString();
};

// Helper function to parse BigInt values from GraphQL
export const parseBigIntFromGraphQL = (value: string): bigint => {
  return BigInt(value);
};

// Type definitions for GraphQL responses
export interface SwapData {
  id: string;
  user: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  priceImpact: number;
  gasUsed: string;
  blockNumber: string;
  timestamp: string;
  transactionHash: string;
}

export interface UserStatsData {
  id: string;
  totalSwaps: number;
  totalVolumeUSD: number;
  liquidityProvided: string;
  feesEarned: number;
  firstSeen: string;
  lastActivity: string;
}

export interface DailyVolumeData {
  id: string;
  date: string;
  volumeUSD: number;
  transactionCount: number;
  uniqueUsers: number;
  avgGasPrice: string;
}

export interface PoolStatsData {
  id: string;
  reserveA: string;
  reserveB: string;
  totalLiquidity: string;
  price: string;
  tvlUSD: number;
  volume24h: number;
  lastUpdated: string;
}

export interface LiquidityEventData {
  id: string;
  type: "ADD" | "REMOVE";
  provider: string;
  amountA: string;
  amountB: string;
  liquidity: string;
  shareOfPool: number;
  blockNumber: string;
  timestamp: string;
  transactionHash: string;
}

export interface TransferData {
  id: string;
  token: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: string;
  timestamp: string;
  transactionHash: string;
}
