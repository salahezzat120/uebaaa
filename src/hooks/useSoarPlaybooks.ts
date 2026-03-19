import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { soarApi, type SOARPlaybook, type SOARExecution } from "@/services/soarApi";
import { toast } from "sonner";

export function useSoarPlaybooks() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["soarPlaybooks"],
    queryFn: () => soarApi.getPlaybooks(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<SOARPlaybook>) => soarApi.createPlaybook(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["soarPlaybooks"] });
      toast.success("Playbook created successfully");
      return data;
    },
    onError: (error: Error) => {
      toast.error(`Failed to create playbook: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SOARPlaybook> }) =>
      soarApi.updatePlaybook(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soarPlaybooks"] });
      toast.success("Playbook updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update playbook: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => soarApi.deletePlaybook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["soarPlaybooks"] });
      toast.success("Playbook deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete playbook: ${error.message}`);
    },
  });

  const executeMutation = useMutation({
    mutationFn: ({ playbookId, alertIds, triggeredByUser }: { 
      playbookId: string; 
      alertIds: string[];
      triggeredByUser?: string;
    }) => soarApi.executePlaybook(playbookId, alertIds, triggeredByUser),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["soarExecutions"] });
      queryClient.invalidateQueries({ queryKey: ["alerts"] }); // Refresh alerts to show status changes
      const successCount = data.results?.filter((r: any) => r.success).length || 0;
      const total = data.results?.length || data.total || 0;
      toast.success(`Playbook executed: ${successCount}/${total} alerts processed`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to execute playbook: ${error.message}`);
    },
  });

  return {
    playbooks: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createPlaybook: createMutation.mutate,
    createPlaybookAsync: createMutation.mutateAsync,
    updatePlaybook: updateMutation.mutate,
    deletePlaybook: deleteMutation.mutate,
    executePlaybook: executeMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isExecuting: executeMutation.isPending,
  };
}

export function useSoarExecutions(filters?: {
  playbook_id?: string;
  alert_id?: string;
  status?: string;
}) {
  const query = useQuery({
    queryKey: ["soarExecutions", filters],
    queryFn: () => soarApi.getExecutions(filters),
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  return {
    executions: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

