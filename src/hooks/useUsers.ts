import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, type User } from "@/services/usersApi";
import { toast } from "sonner";

export function useUsers(includeStats: boolean = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["users", includeStats],
    queryFn: () => usersApi.getAll(includeStats),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => usersApi.suspendUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User suspended successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to suspend user: ${error.message}`);
    },
  });

  const forcePasswordResetMutation = useMutation({
    mutationFn: (id: string) => usersApi.forcePasswordReset(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("Password reset forced successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to force password reset: ${error.message}`);
    },
  });

  const triggerMFAMutation = useMutation({
    mutationFn: (id: string) => usersApi.triggerMFA(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("MFA challenge triggered successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to trigger MFA: ${error.message}`);
    },
  });

  const revokeTokensMutation = useMutation({
    mutationFn: (id: string) => usersApi.revokeTokens(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("API tokens revoked successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to revoke tokens: ${error.message}`);
    },
  });

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    suspendUser: suspendMutation.mutate,
    forcePasswordReset: forcePasswordResetMutation.mutate,
    triggerMFA: triggerMFAMutation.mutate,
    revokeTokens: revokeTokensMutation.mutate,
    isSuspending: suspendMutation.isPending,
    isResettingPassword: forcePasswordResetMutation.isPending,
    isTriggeringMFA: triggerMFAMutation.isPending,
    isRevokingTokens: revokeTokensMutation.isPending,
  };
}

export function useUser(id: string) {
  const query = useQuery({
    queryKey: ["users", id],
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}



