import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getItems, createItem, updateItem, deleteItem } from "@/lib/actions/inventory";
import { getParties, createParty, updateParty, deleteParty } from "@/lib/actions/party";
import { getSales, createSale, updateSale, deleteSale } from "@/lib/actions/sales";
import { toast } from "sonner";

// Inventory Hooks
export function useItems(profileId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["items", profileId],
    queryFn: () => getItems(profileId),
    enabled: !!profileId && (options?.enabled ?? true),
  });
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: any }) => 
      createItem(profileId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.profileId] });
      toast.success("Item created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create item");
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, itemId, data }: { profileId: string; itemId: string; data: any }) => 
      updateItem(profileId, itemId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.profileId] });
      toast.success("Item updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update item");
    },
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, itemId }: { profileId: string; itemId: string }) => 
      deleteItem(profileId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["items", variables.profileId] });
      toast.success("Item deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete item");
    },
  });
}

// Party Hooks
export function useParties(profileId: string, filter: string = "ALL", options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["parties", profileId, filter],
    queryFn: () => getParties(profileId, filter as any),
    enabled: !!profileId && (options?.enabled ?? true),
  });
}

export function useCreateParty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, input }: { profileId: string; input: any }) => 
      createParty(profileId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parties", variables.profileId] });
      toast.success("Party created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create party");
    },
  });
}

export function useUpdateParty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, partyId, input }: { profileId: string; partyId: string; input: any }) => 
      updateParty(profileId, partyId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parties", variables.profileId] });
      toast.success("Party updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update party");
    },
  });
}

export function useDeleteParty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, partyId }: { profileId: string; partyId: string }) => 
      deleteParty(profileId, partyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["parties", variables.profileId] });
      toast.success("Party deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete party");
    },
  });
}

// Sales Hooks
export function useSales(profileId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["sales", profileId],
    queryFn: () => getSales(profileId),
    enabled: !!profileId && (options?.enabled ?? true),
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, data }: { profileId: string; data: any }) => 
      createSale(profileId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["items", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["parties", variables.profileId] });
      toast.success("Sale created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create sale");
    },
  });
}

export function useUpdateSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, saleId, data }: { profileId: string; saleId: string; data: any }) => 
      updateSale(profileId, saleId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["items", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["parties", variables.profileId] });
      toast.success("Sale updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update sale");
    },
  });
}

export function useDeleteSale() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ profileId, saleId }: { profileId: string; saleId: string }) => 
      deleteSale(profileId, saleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sales", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["items", variables.profileId] });
      queryClient.invalidateQueries({ queryKey: ["parties", variables.profileId] });
      toast.success("Sale deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete sale");
    },
  });
}
