import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { AppState } from "react-native";
import { supabase } from "../lib/supabase";
import { OFFICE_FLOORS } from "../lib/floors";
import { signOutGoogle } from "../lib/google-signin";
import { registerForPushNotificationsAsync } from "../lib/push-notifications";
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
  status: "Pending" | "Ready" | "Delivered" | "Not Found" | "Stale";
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
  dataLoading: boolean;
  logout: () => Promise<void>;
  placeOrder: (floor: string, drink: string, sugar: string, strength?: string, note?: string) => Promise<void>;
  updateOrderStatus: (
    id: string,
    status: "Pending" | "Ready" | "Delivered" | "Not Found",
    expectedCurrentStatus?: "Pending" | "Ready" | "Delivered" | "Not Found" | "Stale"
  ) => Promise<void>;
  refreshOrders: () => Promise<void>;
  updateOrderDetails: (id: string, drink: string, sugar: string, floor: string) => Promise<void>;
  cancelOrder: (id: string) => Promise<void>;
  submitReview: (orderId: string, rating: number, comments: string) => Promise<void>;
  activeReviewOrder: Order | undefined;
  isMandatoryReview: boolean;
  setReviewOrderId: (id: string | null) => void;
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
  serviceHours: { id: string; label: string; start_time: string; end_time: string; days_of_week: number[]; brewer_id: string }[];
  addServiceHour: (brewerId: string, label: string, start: string, end: string, daysOfWeek: number[]) => Promise<void>;
  deleteServiceHour: (id: string) => Promise<void>;
  updateServiceHour: (id: string, brewerId: string, label: string, start: string, end: string, daysOfWeek: number[]) => Promise<void>;
  updateAvatarUrl: (avatarUrl: string) => Promise<void>;
  getDailyOrderNumber: (orderId: string, createdAt: string) => string;
  needsRoleSelection: boolean;
  completeOnboarding: (name: string, floorName?: string) => Promise<void>;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

// Static across the app's lifetime — hoisted so the Provider value memo never
// sees a new array identity for these.
const SUGAR_OPTIONS = ["Sugar", "No Sugar"];
const STRENGTH_OPTIONS = ["Mild", "Normal", "Strong"];

export const RefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const floors = OFFICE_FLOORS;

  const [beverages, setBeverages] = useState<Beverage[]>([]);
  const drinks = useMemo(() => beverages.map((b) => b.name), [beverages]);

  const systemDate = new Date().toISOString().split("T")[0];

  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [brewers, setBrewers] = useState<BrewerItem[]>([]);
  const [brewerInvites, setBrewerInvites] = useState<BrewerInvite[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [serviceHours, setServiceHours] = useState<
    { id: string; label: string; start_time: string; end_time: string; days_of_week: number[]; brewer_id: string }[]
  >([]);
  const [cooldownLimitEnabled, setCooldownLimitEnabled] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  const [currentUser, setCurrentUser] = useState<RefreshUser | null>(null);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);

  const setAuthUser = useCallback(
    (user: RefreshUser | null, needsRole = false, options?: { persist?: boolean }) => {
      setCurrentUser(user);
      setNeedsRoleSelection(needsRole);
      if (options?.persist === false) return;
      if (user) void writeAuthCache(user, needsRole);
      else void clearAuthCache();
    },
    []
  );

  const fetchUserProfile = useCallback(async (userId: string) => {
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
  }, []);

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
      // supabase-js's internal auth lock/token-refresh can get stuck after the app
      // sits backgrounded for a long time, hanging getSession() forever (mobile apps
      // background far more often than browser tabs, so this hits harder here).
      // Race it against a timeout and trust the cache rather than blocking forever.
      const TIMED_OUT = Symbol("getSession timeout");
      const result = await Promise.race([
        supabase.auth.getSession(),
        new Promise<typeof TIMED_OUT>((resolve) =>
          setTimeout(() => resolve(TIMED_OUT), 3000)
        ),
      ]);

      if (result === TIMED_OUT) {
        const cached = await readAuthCache();
        if (cached) {
          const { needsRoleSelection: needsRole = false, ...user } = cached;
          if (!cancelled) setAuthUser(user, needsRole);
        } else if (!cancelled) {
          setAuthUser(null);
        }
        if (!cancelled) setLoading(false);
        return;
      }

      const { data: { session } } = result;
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
  }, [fetchUserProfile, setAuthUser]);

  const completeOnboarding = useCallback(
    async (name: string, floorName?: string) => {
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
    },
    [currentUser, setAuthUser]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    // Clear before signing out — the same device/installation can be reused by a
    // different user next (e.g. a shared brewer station), and this token isn't theirs.
    if (currentUser?.id) {
      await supabase.from("profiles").update({ expo_push_token: null }).eq("id", currentUser.id);
    }
    await clearAuthCache();
    await supabase.auth.signOut();
    await signOutGoogle();
    setAuthUser(null);
    setLoading(false);
  }, [currentUser, setAuthUser]);

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id, employee_id, floor_name, drink_name, sugar:sugar_level, strength, note, status,
          created_at, updated_at, feedback_rating, feedback_comments, custom_name, brewer_id,
          profiles!employee_id ( name ), brewer:profiles!brewer_id ( name )
        `)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching orders:", error.message);
        return;
      }
      const mappedOrders = data.map((o: any) => ({
        id: String(o.id),
        employeeId: o.employee_id,
        employeeName: o.custom_name || o.profiles?.name || "Anonymous Employee",
        floor: o.floor_name,
        drink: o.drink_name,
        sugar: o.sugar,
        brewerId: o.brewer_id,
        brewerName: o.brewer?.name || null,
        strength: o.strength,
        note: o.note,
        status:
          o.status === "Delivered" && o.feedback_comments === "__NOT_FOUND__"
            ? ("Not Found" as const)
            : o.status === "Delivered" && o.feedback_comments === "__STALE__"
            ? ("Stale" as const)
            : o.status,
        createdAt: o.created_at,
        updatedAt: o.updated_at || o.created_at,
        feedbackRating:
          o.feedback_comments === "__NOT_FOUND__" || o.feedback_comments === "__STALE__"
            ? null
            : o.feedback_rating,
        feedbackComments: o.feedback_comments,
      }));
      setOrders(mappedOrders);
      const mappedReviews = data
        .filter(
          (o: any) =>
            o.feedback_rating !== null &&
            o.feedback_comments !== "__NOT_FOUND__" &&
            o.feedback_comments !== "__STALE__"
        )
        .map((o: any) => ({
          id: o.id,
          orderId: o.id,
          employeeName: o.profiles?.name || o.custom_name || "Anonymous Employee",
          drinkName: o.drink_name,
          rating: o.feedback_rating,
          comments: o.feedback_comments || "",
          createdAt: o.created_at,
          brewerName: o.brewer?.name || null,
        }));
      setReviews(mappedReviews);
    } catch (err) {
      console.error("Orders fetching exception:", err);
    }
  }, []);

  const fetchBrewersList = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id, name, email, status, avatar_url").eq("role", "brewer");
      if (error) {
        console.error("Error fetching brewers:", error.message);
        return;
      }
      if (data) {
        setBrewers(
          data.map((b: any) => ({
            id: b.id,
            name: b.name,
            contact: b.email || "",
            status: (b.status === "On Break" ? "On Break" : b.status === "Off" ? "Off" : "Active") as "Active" | "On Break" | "Off",
            avatar_url: b.avatar_url || "",
          }))
        );
      }
    } catch (err) {
      console.error("Brewers fetching exception:", err);
    }
  }, []);

  const fetchEmployeesList = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id, name, email, avatar_url").eq("role", "employee");
      if (error) {
        console.error("Error fetching employees:", error.message);
        return;
      }
      setEmployees(data.map((e: any) => ({ id: e.id, name: e.name, contact: e.email || "N/A", avatar_url: e.avatar_url || "" })));
    } catch (err) {
      console.error("Employees fetching exception:", err);
    }
  }, []);

  const fetchBrewerInvites = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("brewer_invites").select("email, name").order("created_at", { ascending: false });
      if (error) {
        console.error("Error fetching brewer invites:", error.message);
        return;
      }
      if (data) setBrewerInvites(data);
    } catch (err) {
      console.error("Brewer invites fetching exception:", err);
    }
  }, []);

  const fetchBeverages = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("beverages").select("id, name, icon, enabled, sort_order").order("sort_order", { ascending: true });
      if (error) {
        console.error("Error fetching beverages:", error.message);
        return;
      }
      if (data) {
        setBeverages(data.map((b: any) => ({ id: b.id, name: b.name, icon: b.icon, enabled: b.enabled, sortOrder: b.sort_order })));
      }
    } catch (err) {
      console.error("Beverages fetching exception:", err);
    }
  }, []);

  const fetchServiceHours = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("service_hours").select("id, label, start_time, end_time, days_of_week, brewer_id").order("start_time", { ascending: true });
      if (error) {
        console.error("Error fetching service hours:", error.message);
        return;
      }
      if (data) {
        setServiceHours(
          data.map((slot: any) => ({
            id: slot.id,
            label: slot.label,
            start_time: slot.start_time.substring(0, 5),
            end_time: slot.end_time.substring(0, 5),
            days_of_week: slot.days_of_week ?? [0, 1, 2, 3, 4, 5, 6],
            brewer_id: slot.brewer_id,
          }))
        );
      }
    } catch (err) {
      console.error("Service hours fetching exception:", err);
    }
  }, []);

  const fetchCooldownSetting = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("settings").select("*").eq("key", "cooldown_limit_enabled").maybeSingle();
      if (error) {
        console.error("Error fetching cooldown setting:", error.message);
        return;
      }
      if (data) {
        const isEnabled = data.value !== undefined ? data.value === "true" : data.start_time === "true";
        setCooldownLimitEnabled(isEnabled);
      } else {
        setCooldownLimitEnabled(true);
      }
    } catch (err) {
      console.error("Exception fetching cooldown setting:", err);
    }
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setOrders([]);
      setReviews([]);
      setEmployees([]);
      setBrewers([]);
      setBeverages([]);
      setDataLoading(true);
      return;
    }
    setDataLoading(true);
    Promise.all([
      fetchOrders(),
      fetchBrewersList(),
      fetchEmployeesList(),
      fetchBrewerInvites(),
      fetchServiceHours(),
      fetchCooldownSetting(),
      fetchBeverages(),
    ]).finally(() => setDataLoading(false));

    const ordersChannel = supabase.channel("realtime-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders()).subscribe();
    const profilesChannel = supabase.channel("realtime-profiles").on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
      fetchBrewersList();
      fetchEmployeesList();
    }).subscribe();
    const settingsChannel = supabase.channel("realtime-settings").on("postgres_changes", { event: "*", schema: "public", table: "service_hours" }, () => fetchServiceHours()).subscribe();
    const settingsTableChannel = supabase.channel("realtime-settings-table").on("postgres_changes", { event: "*", schema: "public", table: "settings" }, () => fetchCooldownSetting()).subscribe();
    const beveragesChannel = supabase.channel("realtime-beverages").on("postgres_changes", { event: "*", schema: "public", table: "beverages" }, () => fetchBeverages()).subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(settingsTableChannel);
      supabase.removeChannel(beveragesChannel);
    };
  }, [
    currentUser?.id,
    fetchOrders,
    fetchBrewersList,
    fetchEmployeesList,
    fetchBrewerInvites,
    fetchServiceHours,
    fetchCooldownSetting,
    fetchBeverages,
  ]);

  // Realtime's WebSocket gets suspended by the OS while the app is backgrounded, so any
  // postgres_changes events broadcast during that window are missed entirely (Supabase
  // doesn't replay them to a reconnected client) — refetch on foreground to catch up.
  useEffect(() => {
    if (!currentUser?.id) return;
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        supabase.auth.startAutoRefresh();
        fetchOrders();
        fetchBrewersList();
        fetchEmployeesList();
        fetchServiceHours();
        fetchCooldownSetting();
        fetchBeverages();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => subscription.remove();
  }, [
    currentUser?.id,
    fetchOrders,
    fetchBrewersList,
    fetchEmployeesList,
    fetchServiceHours,
    fetchCooldownSetting,
    fetchBeverages,
  ]);

  useEffect(() => {
    if (!currentUser?.id) return;
    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;
      supabase
        .from("profiles")
        .update({ expo_push_token: token })
        .eq("id", currentUser.id)
        .then(({ error }) => {
          if (error) console.error("Error saving push token:", error.message);
        });
    });
  }, [currentUser?.id]);

  const placeOrder = useCallback(
    async (floor: string, drink: string, sugar: string, strength?: string, note?: string) => {
      if (!currentUser) return;
      const { error } = await supabase.rpc("place_order", {
        p_floor: floor,
        p_drink: drink,
        p_sugar: sugar,
        p_strength: strength || null,
        p_note: note?.trim() || null,
      });
      if (error) {
        console.error("Error placing order:", error.message);
        throw new Error(error.message);
      }
    },
    [currentUser]
  );

  const cancelOrder = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("orders").delete().eq("id", id).eq("status", "Pending");
      if (error) console.error("Error cancelling order:", error.message);
    } catch (err) {
      console.error("Exception cancelling order:", err);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (
      id: string,
      newStatus: "Pending" | "Ready" | "Delivered" | "Not Found",
      expectedCurrentStatus?: "Pending" | "Ready" | "Delivered" | "Not Found" | "Stale"
    ) => {
      let updatePayload: Record<string, unknown> = { status: newStatus, brewer_id: currentUser?.id };
      if (newStatus === "Not Found") {
        updatePayload = { status: "Delivered", feedback_comments: "__NOT_FOUND__", brewer_id: currentUser?.id };
      }
      const baseQuery = supabase.from("orders").update(updatePayload).eq("id", id);
      const query = expectedCurrentStatus ? baseQuery.eq("status", expectedCurrentStatus) : baseQuery;
      const { data, error } = await query.select("id");
      if (error) {
        console.error("Error updating status:", error.message);
        throw new Error(error.message);
      }
      if (expectedCurrentStatus && (!data || data.length === 0)) {
        await fetchOrders();
        throw new Error("This order was already updated by another brewer.");
      }
    },
    [currentUser, fetchOrders]
  );

  const updateOrderDetails = useCallback(async (id: string, drink: string, sugar: string, floor: string) => {
    try {
      const { error } = await supabase.from("orders").update({ drink_name: drink, sugar_level: sugar, floor_name: floor }).eq("id", id);
      if (error) console.error("Error updating order details:", error.message);
    } catch (err) {
      console.error("Exception updating order details:", err);
    }
  }, []);

  const submitReview = useCallback(async (orderId: string, rating: number, comments: string) => {
    try {
      const { error } = await supabase.from("orders").update({ feedback_rating: rating, feedback_comments: comments }).eq("id", orderId);
      if (error) console.error("Error submitting review:", error.message);
    } catch (err) {
      console.error("Exception submitting review:", err);
    }
  }, []);

  const { activeReviewOrder, isMandatoryReview } = useMemo(() => {
    const unreviewedOrder = currentUser
      ? orders.find(
          (o) =>
            o.employeeId === currentUser.id &&
            o.status === "Delivered" &&
            o.feedbackComments !== "__NOT_FOUND__" &&
            o.feedbackComments !== "__STALE__" &&
            (o.feedbackRating === undefined || o.feedbackRating === null)
        )
      : undefined;
    return {
      activeReviewOrder: unreviewedOrder || (reviewOrderId ? orders.find((o) => o.id === reviewOrderId) : undefined),
      isMandatoryReview: !!unreviewedOrder,
    };
  }, [currentUser, orders, reviewOrderId]);

  const removeBrewerInvite = useCallback(async (email: string) => {
    try {
      const { error } = await supabase.from("brewer_invites").delete().eq("email", email.trim().toLowerCase());
      if (error) {
        console.error("Error removing brewer invite:", error.message);
        return;
      }
      setBrewerInvites((prev) => prev.filter((inv) => inv.email !== email));
    } catch (err) {
      console.error("Exception removing brewer invite:", err);
    }
  }, []);

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) console.error("Error deleting employee:", error.message);
    } catch (err) {
      console.error("Exception deleting employee:", err);
    }
  }, []);

  const updateEmployee = useCallback(async (id: string, name: string, contact: string) => {
    try {
      const { error } = await supabase.from("profiles").update({ name, email: contact }).eq("id", id);
      if (error) console.error("Error updating employee:", error.message);
    } catch (err) {
      console.error("Exception updating employee:", err);
    }
  }, []);

  const addBrewer = useCallback(
    async (name: string, contact: string) => {
      const email = contact.trim().toLowerCase();
      if (!email) throw new Error("An email address is required to pre-assign a Brewer.");
      try {
        const { error } = await supabase.from("brewer_invites").upsert({ email, name: name.trim() });
        if (error) {
          console.error("Error adding brewer invite:", error.message);
          throw new Error(error.message);
        }
        await fetchBrewerInvites();
      } catch (err) {
        console.error("Exception adding brewer invite:", err);
        throw err;
      }
    },
    [fetchBrewerInvites]
  );

  const deleteBrewer = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("profiles").delete().eq("id", id);
      if (error) console.error("Error deleting brewer:", error.message);
    } catch (err) {
      console.error("Exception deleting brewer:", err);
    }
  }, []);

  const updateBrewer = useCallback(async (id: string, name: string, contact: string) => {
    try {
      const { error } = await supabase.from("profiles").update({ name, email: contact }).eq("id", id);
      if (error) console.error("Error updating brewer:", error.message);
    } catch (err) {
      console.error("Exception updating brewer:", err);
    }
  }, []);

  const updateBrewerStatus = useCallback(
    async (id: string, status: "Active" | "On Break" | "Off") => {
      try {
        setCurrentUser((prev) => {
          if (!prev || prev.id !== id) return prev;
          const next = { ...prev, status };
          void writeAuthCache(next, needsRoleSelection);
          return next;
        });
        const { error } = await supabase.rpc("set_brewer_status", { p_brewer_id: id, p_status: status });
        if (error) console.error("Error updating status:", error.message);
      } catch (err) {
        console.error("Exception updating status:", err);
      }
    },
    [needsRoleSelection]
  );

  const addServiceHour = useCallback(async (brewerId: string, label: string, start: string, end: string, daysOfWeek: number[]) => {
    try {
      const { error } = await supabase.from("service_hours").insert({ brewer_id: brewerId, label: label.trim(), start_time: `${start}:00`, end_time: `${end}:00`, days_of_week: daysOfWeek });
      if (error) console.error("Error adding service hour:", error.message);
    } catch (err) {
      console.error("Exception adding service hour:", err);
    }
  }, []);

  const deleteServiceHour = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from("service_hours").delete().eq("id", id);
      if (error) console.error("Error deleting service hour:", error.message);
    } catch (err) {
      console.error("Exception deleting service hour:", err);
    }
  }, []);

  const updateServiceHour = useCallback(async (id: string, brewerId: string, label: string, start: string, end: string, daysOfWeek: number[]) => {
    try {
      const { error } = await supabase
        .from("service_hours")
        .update({
          brewer_id: brewerId,
          label: label.trim(),
          start_time: start.split(":").length === 2 ? `${start}:00` : start,
          end_time: end.split(":").length === 2 ? `${end}:00` : end,
          days_of_week: daysOfWeek,
        })
        .eq("id", id);
      if (error) console.error("Error updating service hour:", error.message);
    } catch (err) {
      console.error("Exception updating service hour:", err);
    }
  }, []);

  const addBeverage = useCallback(
    async (name: string, icon: string) => {
      try {
        const { error } = await supabase.from("beverages").insert({ name: name.trim(), icon, sort_order: beverages.length });
        if (error) {
          console.error("Error adding beverage:", error.message);
          throw new Error(error.message);
        }
        await fetchBeverages();
      } catch (err) {
        console.error("Exception adding beverage:", err);
        throw err;
      }
    },
    [beverages, fetchBeverages]
  );

  const updateBeverage = useCallback(
    async (id: string, name: string, icon: string) => {
      const trimmed = name.trim();
      setBeverages((prev) => prev.map((b) => (b.id === id ? { ...b, name: trimmed, icon } : b)));
      try {
        const { error } = await supabase.from("beverages").update({ name: trimmed, icon }).eq("id", id);
        if (error) {
          console.error("Error updating beverage:", error.message);
          await fetchBeverages();
        }
      } catch (err) {
        console.error("Exception updating beverage:", err);
        await fetchBeverages();
      }
    },
    [fetchBeverages]
  );

  const toggleBeverageEnabled = useCallback(
    async (id: string, enabled: boolean) => {
      setBeverages((prev) => prev.map((b) => (b.id === id ? { ...b, enabled } : b)));
      try {
        const { error } = await supabase.from("beverages").update({ enabled }).eq("id", id);
        if (error) {
          console.error("Error toggling beverage:", error.message);
          await fetchBeverages();
        }
      } catch (err) {
        console.error("Exception toggling beverage:", err);
        await fetchBeverages();
      }
    },
    [fetchBeverages]
  );

  const deleteBeverage = useCallback(
    async (id: string) => {
      const prevBeverages = beverages;
      setBeverages((prev) => prev.filter((b) => b.id !== id));
      try {
        const { error } = await supabase.from("beverages").delete().eq("id", id);
        if (error) {
          console.error("Error deleting beverage:", error.message);
          setBeverages(prevBeverages);
        }
      } catch (err) {
        console.error("Exception deleting beverage:", err);
        setBeverages(prevBeverages);
      }
    },
    [beverages]
  );

  const toggleCooldownLimit = useCallback(async (enabled: boolean) => {
    try {
      setCooldownLimitEnabled(enabled);
      const valStr = enabled ? "true" : "false";
      const { error } = await supabase.from("settings").upsert({ key: "cooldown_limit_enabled", value: valStr });
      if (error) {
        const { error: fallbackError } = await supabase.from("settings").upsert({ key: "cooldown_limit_enabled", start_time: valStr });
        if (fallbackError) console.error("Error toggling cooldown limit fallback:", fallbackError.message);
      }
    } catch (err) {
      console.error("Exception toggling cooldown limit:", err);
    }
  }, []);

  const updateAvatarUrl = useCallback(
    async (avatarUrl: string) => {
      try {
        const { error } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", currentUser?.id);
        if (error) {
          console.error("Error updating avatar:", error.message);
          return;
        }
        if (currentUser) setAuthUser({ ...currentUser, avatar_url: avatarUrl }, needsRoleSelection);
      } catch (err) {
        console.error("Exception updating avatar:", err);
      }
    },
    [currentUser, needsRoleSelection, setAuthUser]
  );

  const getDailyOrderNumber = useCallback(
    (orderId: string, createdAt: string) => {
      if (!createdAt) return "";
      const dateStr = createdAt.substring(0, 10);
      const dayOrders = [...orders]
        .filter((o) => o.createdAt && o.createdAt.substring(0, 10) === dateStr)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      const index = dayOrders.findIndex((o) => o.id === orderId);
      return index !== -1 ? `#${index + 1}` : "";
    },
    [orders]
  );

  const value = useMemo<RefreshContextType>(
    () => ({
      orders,
      floors,
      drinks,
      beverages,
      addBeverage,
      updateBeverage,
      toggleBeverageEnabled,
      deleteBeverage,
      sugarOptions: SUGAR_OPTIONS,
      strengthOptions: STRENGTH_OPTIONS,
      employees,
      brewers,
      brewerInvites,
      reviews,
      currentUser,
      loading,
      dataLoading,
      logout,
      placeOrder,
      updateOrderStatus,
      refreshOrders: fetchOrders,
      updateOrderDetails,
      cancelOrder,
      submitReview,
      activeReviewOrder,
      isMandatoryReview,
      setReviewOrderId,
      cooldownLimitEnabled,
      toggleCooldownLimit,
      deleteEmployee,
      updateEmployee,
      addBrewer,
      removeBrewerInvite,
      deleteBrewer,
      updateBrewer,
      updateBrewerStatus,
      systemDate,
      serviceHours,
      addServiceHour,
      deleteServiceHour,
      updateServiceHour,
      updateAvatarUrl,
      getDailyOrderNumber,
      needsRoleSelection,
      completeOnboarding,
    }),
    [
      orders,
      floors,
      drinks,
      beverages,
      addBeverage,
      updateBeverage,
      toggleBeverageEnabled,
      deleteBeverage,
      employees,
      brewers,
      brewerInvites,
      reviews,
      currentUser,
      loading,
      dataLoading,
      logout,
      placeOrder,
      updateOrderStatus,
      fetchOrders,
      updateOrderDetails,
      cancelOrder,
      submitReview,
      activeReviewOrder,
      isMandatoryReview,
      cooldownLimitEnabled,
      toggleCooldownLimit,
      deleteEmployee,
      updateEmployee,
      addBrewer,
      removeBrewerInvite,
      deleteBrewer,
      updateBrewer,
      updateBrewerStatus,
      systemDate,
      serviceHours,
      addServiceHour,
      deleteServiceHour,
      updateServiceHour,
      updateAvatarUrl,
      getDailyOrderNumber,
      needsRoleSelection,
      completeOnboarding,
    ]
  );

  return <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>;
};

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
};
