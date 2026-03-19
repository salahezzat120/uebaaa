import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi, type Report } from "@/services/reportsApi";
import { toast } from "sonner";

export function useReports(filters?: { type?: string; status?: string; frequency?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["reports", filters],
    queryFn: () => reportsApi.getAll(filters),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const createMutation = useMutation({
    mutationFn: (report: Omit<Report, 'id' | 'created_at' | 'updated_at' | 'status'>) =>
      reportsApi.create(report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create report: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Report> }) =>
      reportsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update report: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete report: ${error.message}`);
    },
  });

  const generateMutation = useMutation({
    mutationFn: ({ 
      id, 
      timePeriod, 
      customStart, 
      customEnd 
    }: { 
      id: string; 
      timePeriod?: 'today' | 'week' | 'month' | 'year' | 'custom';
      customStart?: string;
      customEnd?: string;
    }) => reportsApi.generate(id, timePeriod, customStart, customEnd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report generation started");
    },
    onError: (error: Error) => {
      toast.error(`Failed to generate report: ${error.message}`);
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const blob = await reportsApi.download(id);
      const report = queryClient.getQueryData<Report[]>(["reports"])?.find(r => r.id === id);
      const fileName = report?.name.replace(/[^a-z0-9]/gi, '_') || 'report';
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast.success("Report downloaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to download report: ${error.message}`);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({ id, next_scheduled_at }: { id: string; next_scheduled_at: string }) =>
      reportsApi.schedule(id, next_scheduled_at),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule report: ${error.message}`);
    },
  });

  return {
    reports: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    createReport: createMutation.mutate,
    updateReport: updateMutation.mutate,
    deleteReport: deleteMutation.mutate,
    generateReport: (id: string, timePeriod?: 'today' | 'week' | 'month' | 'year' | 'custom', customStart?: string, customEnd?: string) => 
      generateMutation.mutate({ id, timePeriod, customStart, customEnd }),
    downloadReport: downloadMutation.mutate,
    scheduleReport: scheduleMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isGenerating: generateMutation.isPending,
    isDownloading: downloadMutation.isPending,
    isScheduling: scheduleMutation.isPending,
  };
}

