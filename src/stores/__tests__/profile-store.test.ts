import { describe, it, expect, beforeEach } from "vitest";
import { useProfileStore, useUIStore } from "@/stores/profile-store";

// ── Profile Store ─────────────────────────────────────────
describe("useProfileStore", () => {
  beforeEach(() => {
    const store = useProfileStore.getState();
    store.setActiveProfileId("");
    store.setProfiles([]);
  });

  it("has correct initial state", () => {
    const state = useProfileStore.getState();
    expect(state.profiles).toEqual([]);
  });

  it("sets active profile id", () => {
    useProfileStore.getState().setActiveProfileId("profile-1");
    expect(useProfileStore.getState().activeProfileId).toBe("profile-1");
  });

  it("sets profiles", () => {
    const profiles = [
      {
        id: "p1",
        name: "Business",
        type: "BUSINESS",
        theme: "light",
        currency: "Rs.",
        currencyPos: "start",
        language: "en",
        calendarType: "AD",
        dateFormat: "dd/MM/yyyy",
        timeFormat: "12h",
        numberFormat: "indian",
        privacyMode: false,
        appLock: false,
        taxEnabled: false,
        taxRate: 0,
        taxType: "inclusive",
        subscriptionPlan: "free",
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    useProfileStore.getState().setProfiles(profiles);
    expect(useProfileStore.getState().profiles).toHaveLength(1);
    expect(useProfileStore.getState().profiles[0].name).toBe("Business");
  });

  it("getActiveProfile returns matching profile", () => {
    const profiles = [
      createProfile("p1", "First"),
      createProfile("p2", "Second"),
    ];
    const store = useProfileStore.getState();
    store.setProfiles(profiles);
    store.setActiveProfileId("p2");

    expect(useProfileStore.getState().getActiveProfile()?.name).toBe("Second");
  });

  it("getActiveProfile falls back to first profile", () => {
    const profiles = [createProfile("p1", "First")];
    const store = useProfileStore.getState();
    store.setProfiles(profiles);
    store.setActiveProfileId("non-existent");

    expect(useProfileStore.getState().getActiveProfile()?.name).toBe("First");
  });

  it("updateActiveProfile merges updates", () => {
    const profiles = [createProfile("p1", "Business")];
    const store = useProfileStore.getState();
    store.setProfiles(profiles);
    store.setActiveProfileId("p1");
    store.updateActiveProfile({ name: "Updated Business", theme: "dark" });

    const active = useProfileStore.getState().getActiveProfile();
    expect(active?.name).toBe("Updated Business");
    expect(active?.theme).toBe("dark");
  });

  it("updateActiveProfile does nothing without activeProfileId", () => {
    const profiles = [createProfile("p1", "Business")];
    const store = useProfileStore.getState();
    store.setProfiles(profiles);
    store.setActiveProfileId("");
    store.updateActiveProfile({ name: "Should not change" });

    expect(useProfileStore.getState().profiles[0].name).toBe("Business");
  });
});

// ── UI Store ──────────────────────────────────────────────
describe("useUIStore", () => {
  it("has sidebar open by default", () => {
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("toggles sidebar", () => {
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().toggleSidebar();
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("sets sidebar open state", () => {
    useUIStore.getState().setSidebarOpen(false);
    expect(useUIStore.getState().sidebarOpen).toBe(false);
    useUIStore.getState().setSidebarOpen(true);
    expect(useUIStore.getState().sidebarOpen).toBe(true);
  });

  it("manages command palette state", () => {
    expect(useUIStore.getState().commandPaletteOpen).toBe(false);
    useUIStore.getState().setCommandPaletteOpen(true);
    expect(useUIStore.getState().commandPaletteOpen).toBe(true);
  });

  it("manages notifications state", () => {
    expect(useUIStore.getState().notificationsOpen).toBe(false);
    useUIStore.getState().setNotificationsOpen(true);
    expect(useUIStore.getState().notificationsOpen).toBe(true);
  });

  it("manages expense modal state", () => {
    useUIStore.getState().setAddExpenseOpen(true);
    expect(useUIStore.getState().addExpenseOpen).toBe(true);
    useUIStore.getState().setAddExpenseOpen(false);
    expect(useUIStore.getState().addExpenseOpen).toBe(false);
  });

  it("manages income modal state", () => {
    useUIStore.getState().setAddIncomeOpen(true);
    expect(useUIStore.getState().addIncomeOpen).toBe(true);
  });

  it("manages payment in modal state", () => {
    useUIStore.getState().setAddPaymentInOpen(true);
    expect(useUIStore.getState().addPaymentInOpen).toBe(true);
  });

  it("manages payment out modal state", () => {
    useUIStore.getState().setAddPaymentOutOpen(true);
    expect(useUIStore.getState().addPaymentOutOpen).toBe(true);
  });
});

// Helper
function createProfile(id: string, name: string) {
  return {
    id,
    name,
    type: "BUSINESS",
    theme: "light",
    currency: "Rs.",
    currencyPos: "start",
    language: "en",
    calendarType: "AD",
    dateFormat: "dd/MM/yyyy",
    timeFormat: "12h",
    numberFormat: "indian",
    privacyMode: false,
    appLock: false,
    taxEnabled: false,
    taxRate: 0,
    taxType: "inclusive",
    subscriptionPlan: "free",
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
