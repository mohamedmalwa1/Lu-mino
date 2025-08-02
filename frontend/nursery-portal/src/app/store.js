import { create } from "zustand";

export const useNotify = create(set => ({
  loading: false,
  setLoading: v => set({ loading: v }),
}));
