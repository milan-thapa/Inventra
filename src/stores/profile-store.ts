// src/stores/profile-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Profile {
  id: string;
  name: string;
  type: string;
  category?: string | null;
  logo?: string | null;
  address?: string | null;
  theme: string;
  currency: string;
  currencyPos: string;
  language: string;
  calendarType: string;
  numberFormat: string;
  privacyMode: boolean;
  appLock: boolean;
}

interface ProfileStore {
  activeProfileId: string | null;
  profiles: Profile[];
  setActiveProfileId: (id: string) => void;
  setProfiles: (profiles: Profile[]) => void;
  getActiveProfile: () => Profile | undefined;
  updateActiveProfile: (updates: Partial<Profile>) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      activeProfileId: null,
      profiles: [],
      setActiveProfileId: (id) => set({ activeProfileId: id }),
      setProfiles: (profiles) => set({ profiles }),
      getActiveProfile: () => {
        const { activeProfileId, profiles } = get();
        return profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
      },
      updateActiveProfile: (updates) => {
        const { activeProfileId, profiles } = get();
        if (!activeProfileId) return;
        const newProfiles = profiles.map((p) =>
          p.id === activeProfileId ? { ...p, ...updates } : p
        );
        set({ profiles: newProfiles });
      },
    }),
    { name: "inventra-profile" }
  )
);

// src/stores/ui-store.ts
interface UIStore {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  notificationsOpen: boolean;
  addExpenseOpen: boolean;
  addIncomeOpen: boolean;
  addPaymentInOpen: boolean;
  addPaymentOutOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setNotificationsOpen: (open: boolean) => void;
  setAddExpenseOpen: (open: boolean) => void;
  setAddIncomeOpen: (open: boolean) => void;
  setAddPaymentInOpen: (open: boolean) => void;
  setAddPaymentOutOpen: (open: boolean) => void;
}

import { create as createUI } from "zustand";

export const useUIStore = createUI<UIStore>((set) => ({
  sidebarOpen: true,
  commandPaletteOpen: false,
  notificationsOpen: false,
  addExpenseOpen: false,
  addIncomeOpen: false,
  addPaymentInOpen: false,
  addPaymentOutOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  setAddExpenseOpen: (open) => set({ addExpenseOpen: open }),
  setAddIncomeOpen: (open) => set({ addIncomeOpen: open }),
  setAddPaymentInOpen: (open) => set({ addPaymentInOpen: open }),
  setAddPaymentOutOpen: (open) => set({ addPaymentOutOpen: open }),
}));
