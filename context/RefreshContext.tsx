import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { OFFICE_FLOORS } from "../lib/floors";
import {
  clearAuthCache,
  readAuthCache,
  writeAuthCache,
  type CachedRefreshUser,
} from "../lib/auth-cache";

type RefreshUser = Omit<CachedRefreshUser, "needsRoleSelection">;

export interface Order {
  id: string;
  employeeId: string;
  employeeName: string;
  floor: string;
  drink: string;
  sugar: string;
  status: "Pending" | "In Progress" | "Ready" | "Delivered" | "Not Found";
  brewerId?: string | null;
  brewerName?: string | null;
  createdAt: string;
  updatedAt: string;
  strength?: string | null;
  note?: string | null;
  feedbackRating?: number | null;
  feedbackComments?: string | null;
}

export interface EmployeeItem {
  id: string;
  name: string;
  contact: string;
  avatar_url?: string;
}

export interface BrewerItem {
  id: string;
  name: string;
  contact: string;
  status: "Active" | "On Break" | "Off";
  avatar_url?: string;
}

export interface BrewerInvite {
  email: string;
  name: string;
}

export interface Beverage {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  sortOrder: number;
}

export interface Review {
  id: string;
  orderId: string;
  employeeName: string;
  drinkName: string;
  rating: number;
  comments: string;
  createdAt: string;
  brewerName?: string | null;
}

interface RefreshContextType {
  orders: Order[];
  floors: readonly string[];
  drinks: string[];
  beverages: Beverage[];
  addBeverage: (name: string, icon: string) => Promise<void>;
  updateBeverage: (id: string, name: string, icon: string) => Promise<void>;
  toggleBeverageEnabled: (id: string, enabled: boolean) => Promise<void>;
  deleteBeverage: (id: string) => Promise<void>;
  sugarOptions: string[];
  strengthOptions: string[];
  employees: EmployeeItem[];
  brewers: BrewerItem[];
  brewerInvites: BrewerInvite[];
  reviews: Review[];
  currentUser: RefreshUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  placeOrder: (floor: string, drink: string, sugar: string, strength?: string, note?: string) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: "Pending" | "In Progress" | "Ready" | "Delivered" | "Not Found",
    expectedCurrentStatus?: "Pending" | "In Progress" | "Ready" | "Delivered" | "Not Found"
  ) => Promise<void>;
  refreshOrders: () => Promise<void>;
  updateOrderDetails: (id: string, drink: string, sugar: string, floor: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  submitReview: (orderId: string, rating: number, comments: string) => Promise<void>;
  cooldownLimitEnabled: boolean;
  toggleCooldownLimit: (enabled: boolean) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
  updateEmployee: (id: string, name: string, contact: string) => Promise<void>;
  addBrewer: (name: string, contact: string) => Promise<void>;
  removeBrewerInvite: (email: string) => Promise<void>;
  deleteBrewer: (id: string) => Promise<void>;
  updateBrewer: (id: string, name: string, contact: string) => Promise<void>;
  updateBrewerStatus: (id: string, status: "Active" | "On Break" | "Off") => Promise<void>;
  systemDate: string;
  serviceHours: { id: string; label: string; start_time: string; end_time: string; days_of_week: number[] }[];
  addServiceHour: (label: string, start: string, end: string, daysOfWeek: number[]) => Promise<void>;
  deleteServiceHour: (id: string) => Promise<void>;
  updateServiceHour: (id: string, label: string, start: string, end: string, daysOfWeek: number[]) => Promise<void>;
  updateAvatarUrl: (avatarUrl: string) => Promise<void>;
  getDailyOrderNumber: (orderId: string, createdAt: string) => string;
  needsRoleSelection: boolean;
  completeOnboarding: (name: string, floorName?: string) => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const sugarOptions = ["Sugar", "No Sugar"];
  const strengthOptions = ["Mild", "Normal", "Strong"];
  const floors = OFFICE_FLOORS;

  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const drinks = beverages.map((b) => b.name);

  const systemDate = new Date().toISOString().split("T")[0];

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [brewers, setBrewers] = useState<BrewerItem[]>([]);
  const [brewerInvites, setBrewerInvites] = useState<BrewerInvite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [serviceHours, setServiceHours] = useState<
    { id: string; label: string; start_time: string; end_time: string; days_of_week: number[] }[]
  >([]);
  const [cooldownLimitEnabled, setCooldownLimitEnabled] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const [currentUser, setCurrentUser] = useState<RefreshUser | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [loading, setLoading] = useState(true);

  const setAuthUser = (
    user: RefreshUser | null,
    needsRole = false,
    options?: { persist?: boolean }
  ) => {
    setCurrentUser(user);
    setNeedsRoleSelection(needsRole);
    if (options?.persist === false) return;
    if (user) void writeAuthCache(user, needsRole);
    else void clearAuthCache();
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
      if (error) {
        console.error("Error retrieving profile:", error.message);
        return null;
      }
      return data;
    } catch (err) {
      console.error("Database query failed:", err);
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;

    const userFromSession = async (sessionUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }): Promise<{ user: RefreshUser; needsRole: boolean }> => {
      const profile = await fetchUserProfile(sessionUser.id);
      if (!profile || !profile.role) {
        return {
          needsRole: true,
          user: {
            id: sessionUser.id,
            name:
              (sessionUser.user_metadata?.name as string | undefined) ||
              sessionUser.email?.split("@")[0] ||
              "New User",
            role: "Employee",
            contact: sessionUser.email || "",
            status: "Off",
          },
        };
      }
      const roleStr = profile.role || "employee";
      const mappedRole = roleStr === "admin" ? "Admin" : roleStr === "brewer" ? "Brewer" : "Employee";
      return {
        needsRole: false,
        user: {
          id: sessionUser.id,
          name: profile.name || "Anonymous Employee",
          role: mappedRole,
          contact: profile.email || sessionUser.email || "",
          floor: profile.floor || undefined,
          status: (profile.status === "On Break" ? "On Break" : profile.status === "Off" ? "Off" : "Active") as RefreshUser["status"],
          avatar_url: profile.avatar_url || "",
        },
      };
    };

    const applySession = async (
      session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null,
      showLoading: boolean
    ) => {
      if (showLoading) setLoading(true);
      try {
        if (!session?.user) {
          if (!cancelled) setAuthUser(null);
          return;
        }
        const cached = await readAuthCache();
        if (cached?.id === session.user.id) {
          const { needsRoleSelection: needsRole = false, ...user } = cached;
          if (!cancelled) setAuthUser(user, needsRole);
          return;
        }
        const { user, needsRole } = await userFromSession(session.user);
        if (!cancelled) setAuthUser(user, needsRole);
      } catch (err) {
        console.error("Session lookup error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const cached = await readAuthCache();
      if (session?.user && cached?.id === session.user.id) {
        const { needsRoleSelection: needsRole = false, ...user } = cached;
        if (!cancelled) setAuthUser(user, needsRole);
        if (!cancelled) setLoading(false);
        return;
      }
      if (!session?.user && cached) {
        await clearAuthCache();
        if (!cancelled) setAuthUser(null);
        if (!cancelled) setLoading(false);
        return;
      }
      await applySession(session, !cached);
    };

    void bootstrap();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        await clearAuthCache();
        if (!cancelled) {
          setAuthUser(null);
          setLoading(false);
        }
        return;
      }
      const cached = await readAuthCache();
      const sameUser = !!(session?.user && cached?.id === session.user.id);
      if (sameUser) return;
      await applySession(session, true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const completeOnboarding = async (name: string, floorName?: string) => {
    if (!currentUser?.id) return;
    try {
      setLoading(true);
      const { data: profile, error } = await supabase.rpc("claim_profile", { p_name: name.trim() });
      if (error) {
        console.error("Error claiming profile:", error.message);
        throw error;
      }
      let finalProfile = profile;
      if (profile.role === "employee" && floorName) {
        const { data: updated, error: floorError } = await supabase
          .from("profiles")
          .update({ floor: floorName })
          .eq("id", currentUser.id)
          .select()
          .single();
        if (floorError) {
          console.error("Error setting floor:", floorError.message);
        } else if (updated) {
          finalProfile = updated;
        }
      }
      const mappedRole = finalProfile.role === "admin" ? "Admin" : finalProfile.role === "brewer" ? "Brewer" : "Employee";
      setAuthUser(
        {
          id: currentUser.id,
          name: finalProfile.name,
          role: mappedRole,
          contact: currentUser.contact,
          floor: finalProfile.floor || undefined,
          status: finalProfile.status as RefreshUser["status"],
          avatar_url: finalProfile.avatar_url || "",
        },
        false
      );
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await clearAuthCache();
    await supabase.auth.signOut();
    setAuthUser(null);
    setLoading(false);
  };

  // Remaining fields (orders/employees/brewers/beverages/service-hours/settings CRUD
  // and their realtime subscriptions) are added in Task 8, in the same provider body.
  // This placeholder throws so it's obvious if Task 8 is skipped.
  const notYetImplemented = (name: string) => () => {
    throw new Error(`${name} not implemented yet — see Task 8`);
  };

  return (
    <RefreshContext.Provider
      value={{
        orders,
        floors,
        drinks,
        beverages,
        addBeverage: notYetImplemented("addBeverage"),
        updateBeverage: notYetImplemented("updateBeverage"),
        toggleBeverageEnabled: notYetImplemented("toggleBeverageEnabled"),
        deleteBeverage: notYetImplemented("deleteBeverage"),
        sugarOptions,
        strengthOptions,
        employees,
        brewers,
        brewerInvites,
        reviews,
        currentUser,
        loading,
        logout,
        placeOrder: notYetImplemented("placeOrder"),
        updateOrderStatus: notYetImplemented("updateOrderStatus"),
        refreshOrders: notYetImplemented("refreshOrders"),
        updateOrderDetails: notYetImplemented("updateOrderDetails"),
        cancelOrder: notYetImplemented("cancelOrder"),
        submitReview: notYetImplemented("submitReview"),
        cooldownLimitEnabled,
        toggleCooldownLimit: notYetImplemented("toggleCooldownLimit"),
        deleteEmployee: notYetImplemented("deleteEmployee"),
        updateEmployee: notYetImplemented("updateEmployee"),
        addBrewer: notYetImplemented("addBrewer"),
        removeBrewerInvite: notYetImplemented("removeBrewerInvite"),
        deleteBrewer: notYetImplemented("deleteBrewer"),
        updateBrewer: notYetImplemented("updateBrewer"),
        updateBrewerStatus: notYetImplemented("updateBrewerStatus"),
        systemDate,
        serviceHours,
        addServiceHour: notYetImplemented("addServiceHour"),
        deleteServiceHour: notYetImplemented("deleteServiceHour"),
        updateServiceHour: notYetImplemented("updateServiceHour"),
        updateAvatarUrl: notYetImplemented("updateAvatarUrl"),
        getDailyOrderNumber: () => "",
        needsRoleSelection,
        completeOnboarding,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};
