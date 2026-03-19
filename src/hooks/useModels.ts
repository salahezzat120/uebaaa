import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { modelsApi, type AIModel, type CreateModelRequest } from "@/services/modelsApi";
import { toast } from "sonner";

export function useModels() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["models"],
    queryFn: () => modelsApi.getAll(),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const uploadMutation = useMutation({
    mutationFn: (data: CreateModelRequest) => modelsApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Model uploaded successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to upload model: ${error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AIModel> }) =>
      modelsApi.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Model updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update model: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => modelsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
      toast.success("Model deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete model: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      modelsApi.toggle(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["models"] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle model: ${error.message}`);
    },
  });

  return {
    models: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    upload: uploadMutation.mutateAsync,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    toggle: toggleMutation.mutate,
    isUploading: uploadMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}





