import { useQuery } from "@tanstack/react-query";
import { activityApi } from "@/services/activityApi";

export function useActivityLogs(filters?: { 
  type?: string; 
  status?: string; 
  search?: string;
}) {
  const query = useQuery({
    queryKey: ["activityLogs", filters],
    queryFn: () => activityApi.getAll(filters),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  return {
    logs: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}



