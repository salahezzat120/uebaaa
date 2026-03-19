import { useQuery } from "@tanstack/react-query";
import { dashboardApi, type DashboardStats } from "@/services/dashboardApi";

export function useDashboard() {
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getDashboardStats(),
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}



