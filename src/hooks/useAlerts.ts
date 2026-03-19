import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi, type Alert } from "@/services/alertsApi";
import { toast } from "sonner";

export function useAlerts(filters?: { status?: string; severity?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["alerts", filters],
    queryFn: () => alertsApi.getAll(filters),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Alert['status'] }) =>
      alertsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert status updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update alert: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete alert: ${error.message}`);
    },
  });

  return {
    alerts: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    updateStatus: updateStatusMutation.mutate,
    delete: deleteMutation.mutate,
    isUpdating: updateStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}




