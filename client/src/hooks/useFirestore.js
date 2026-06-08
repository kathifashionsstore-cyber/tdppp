import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addDocument, deleteDocument, getDocument, listDocuments, setDocument, updateDocument } from '@/services/firestoreService';

export const useCollection = (collectionName, options = {}) => useQuery({
  queryKey: [collectionName, options],
  queryFn: () => listDocuments(collectionName, options),
  enabled: options.enabled !== false,
  staleTime: 5 * 60 * 1000
});

export const useDoc = (collectionName, id) => useQuery({
  queryKey: [collectionName, id],
  queryFn: () => getDocument(collectionName, id),
  enabled: Boolean(collectionName && id),
  staleTime: 5 * 60 * 1000
});

export const useCrud = (collectionName) => {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [collectionName] });
  return {
    create: useMutation({ mutationFn: (data) => addDocument(collectionName, data), onSuccess: invalidate }),
    set: useMutation({ mutationFn: ({ id, data }) => setDocument(collectionName, id, data), onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => updateDocument(collectionName, id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: (id) => deleteDocument(collectionName, id), onSuccess: invalidate })
  };
};
