import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { addDocument, deleteDocument, getDocument, listDocuments, setDocument, subscribeDocument, subscribeDocuments, updateDocument } from '@/services/firestoreService';

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

export const useRealtimeCollection = (collectionName, options = {}) => {
  const [state, setState] = useState({ data: [], isLoading: options.enabled === false ? false : true, error: null });

  useEffect(() => {
    if (!collectionName || options.enabled === false) {
      setState((current) => ({ ...current, isLoading: false }));
      return undefined;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    return subscribeDocuments(collectionName, options, (data) => {
      setState({ data, isLoading: false, error: null });
    }, (error) => {
      setState((current) => ({ ...current, isLoading: false, error }));
    });
  }, [collectionName, JSON.stringify(options)]);

  return state;
};

export const useRealtimeDoc = (collectionName, id, options = {}) => {
  const [state, setState] = useState({ data: null, isLoading: options.enabled === false ? false : Boolean(collectionName && id), error: null });

  useEffect(() => {
    if (!collectionName || !id || options.enabled === false) {
      setState((current) => ({ ...current, isLoading: false }));
      return undefined;
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));
    return subscribeDocument(collectionName, id, (data) => {
      setState({ data, isLoading: false, error: null });
    }, (error) => {
      setState((current) => ({ ...current, isLoading: false, error }));
    });
  }, [collectionName, id, options.enabled]);

  return state;
};

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
