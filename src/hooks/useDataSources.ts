import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dataSourcesApi, type DataSource, type CreateDataSourceRequest } from "@/services/dataSourcesApi";
import { useEffect } from "react";
import { toast } from "sonner";

export function useDataSources() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dataSources"],
    queryFn: () => dataSourcesApi.getAll(),
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Set up real-time updates
  useEffect(() => {
    dataSourcesApi.startRealTimeUpdates((sources) => {
      queryClient.setQueryData(["dataSources"], sources);
    });

    return () => {
      dataSourcesApi.stopRealTimeUpdates();
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: (data: CreateDataSourceRequest) => dataSourcesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Data source created successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to create data source: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<DataSource> }) =>
      dataSourcesApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Data source updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update data source: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => dataSourcesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Data source deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete data source: ${error.message}`);
    },
  });

  const connectMutation = useMutation({
    mutationFn: (id: string) => dataSourcesApi.connect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Connecting to data source...");
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (id: string) => dataSourcesApi.disconnect(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Data source disconnected");
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (id: string) => dataSourcesApi.sync(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("Sync started...");
    },
    onError: (error: Error) => {
      toast.error(`Failed to sync: ${error.message}`);
    },
  });

  const uploadCSVMutation = useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) =>
      dataSourcesApi.uploadCSV(name, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("CSV uploaded and processed successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload CSV: ${error.message}`);
    },
  });

  const reprocessCSVMutation = useMutation({
    mutationFn: async (id: string) => {
      // First get file info
      const fileInfo = await dataSourcesApi.reprocessCSV(id);
      // Then download the file
      const blob = await dataSourcesApi.downloadCSV(id);
      // Convert blob to File
      const file = new File([blob], fileInfo.fileName, { type: 'text/csv' });
      return { file, dataSourceId: id, fileName: fileInfo.fileName };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataSources"] });
      toast.success("CSV file ready for reprocessing");
    },
    onError: (error: Error) => {
      toast.error(`Failed to prepare CSV for replay: ${error.message}`);
    },
  });

  return {
    dataSources: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    uploadCSV: uploadCSVMutation.mutateAsync,
    reprocessCSV: reprocessCSVMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isConnecting: connectMutation.isPending,
    isSyncing: syncMutation.isPending,
    isUploading: uploadCSVMutation.isPending,
    isReprocessing: reprocessCSVMutation.isPending,
  };
}

