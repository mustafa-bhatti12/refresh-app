import { View, Text, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { StarIcon, ChartAverageIcon } from "@hugeicons/core-free-icons";
import { useColors } from "@/constants/use-colors";
import type { ColorRamp } from "@/constants/colors";
import type { BrewerItem, Order } from "@/context/RefreshContext";
import { StatTile } from "./stat-tile";

function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  const displayHr = h % 12 === 0 ? 12 : h % 12;
  return `${displayHr}${ampm}`;
}

export function AnalyticsPanel({
  dayOrders,
  floors,
  drinks,
  avgRating,
  totalReviews,
  brewers,
}: {
  dayOrders: Order[];
  floors: readonly string[];
  drinks: string[];
  avgRating: string;
  totalReviews: number;
  brewers: BrewerItem[];
}) {
  const colors = useColors();
  const s = styles(colors);

  const totalOrders = dayOrders.length;
  const pendingOrders = dayOrders.filter((o) => o.status === "Pending").length;
  const activeOrders = dayOrders.filter((o) => o.status === "In Progress" || o.status === "Ready").length;
  const deliveredOrders = dayOrders.filter((o) => o.status === "Delivered").length;
  const notFoundOrders = dayOrders.filter((o) => o.status === "Not Found").length;

  const floorCounts: Record<string, number> = {};
  floors.forEach((f) => (floorCounts[f] = dayOrders.filter((o) => o.floor === f).length));
  const drinkCounts: Record<string, number> = {};
  drinks.forEach((d) => (drinkCounts[d] = dayOrders.filter((o) => o.drink === d).length));

  const hourBuckets = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }));
  dayOrders.forEach((o) => {
    const hr = new Date(o.createdAt).getHours();
    hourBuckets[hr].count += 1;
  });
  const activeHours = hourBuckets.filter((h) => h.count > 0 || (h.hour >= 8 && h.hour <= 18));
  const maxHourCount = Math.max(...hourBuckets.map((h) => h.count), 1);

  const brewerStats = [...brewers]
    .map((bwr) => {
      const handled = dayOrders.filter((o) => o.brewerId === bwr.id);
      const completed = handled.filter((o) => o.status === "Delivered" || o.status === "Not Found");
      const ratedOrders = handled.filter((o) => o.feedbackRating != null && o.feedbackComments !== "__NOT_FOUND__");
      const avgBrewerRating = ratedOrders.length ? ratedOrders.reduce((acc, o) => acc + (o.feedbackRating || 0), 0) / ratedOrders.length : null;
      return { ...bwr, ordersHandled: completed.length, avgBrewerRating };
    })
    .sort((a, b) => b.ordersHandled - a.ordersHandled);

  return (
    <View style={{ gap: 16 }}>
      <View style={s.statRow}>
        <StatTile label="Total Orders" value={String(totalOrders)} />
        <StatTile label="Pending" value={String(pendingOrders)} />
        <StatTile label="In Progress" value={String(activeOrders)} />
        <StatTile label="Delivered" value={String(deliveredOrders)} emphasis="ink" />
        <StatTile label="Not Found" value={String(notFoundOrders)} emphasis="outline" />
        <StatTile label="Avg Satisfaction" value={avgRating} />
      </View>

      <View style={s.card}>
        <Text style={s.title}>Peak Orders Time</Text>
        <View style={s.chartRow}>
          {activeHours.map((bucket) => {
            const heightPercent = Math.max((bucket.count / maxHourCount) * 100, 4);
            return (
              <View key={bucket.hour} style={s.barColumn}>
                <View style={s.barTrack}>
                  <View style={[s.bar, { height: `${heightPercent}%` }, bucket.count === 0 && s.barEmpty]} />
                </View>
                <Text style={s.barLabel}>{formatHour(bucket.hour)}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.title}>Popularity Insights</Text>
        <Text style={s.subLabel}>Beverages Ordered</Text>
        <View style={{ gap: 6, marginBottom: 14 }}>
          {drinks.map((drink) => {
            const count = drinkCounts[drink] || 0;
            const pct = totalOrders ? (count / totalOrders) * 100 : 0;
            return (
              <View key={drink} style={s.distRow}>
                <Text style={s.distLabel} numberOfLines={1}>{drink}</Text>
                <View style={s.distTrack}>
                  <View style={[s.distFill, { width: `${pct}%` }]} />
                </View>
                <Text style={s.distCount}>{count}</Text>
              </View>
            );
          })}
        </View>
        <Text style={s.subLabel}>Order Activity per Floor</Text>
        <View style={{ gap: 6 }}>
          {floors.map((floor) => {
            const count = floorCounts[floor] || 0;
            const pct = totalOrders ? (count / totalOrders) * 100 : 0;
            return (
              <View key={floor} style={s.distRow}>
                <Text style={s.distLabel} numberOfLines={1}>{floor}</Text>
                <View style={s.distTrack}>
                  <View style={[s.distFill, { width: `${pct}%`, backgroundColor: colors.midZinc }]} />
                </View>
                <Text style={s.distCount}>{count}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={s.title}>Feedback</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
            <Text style={s.ratingValue}>{avgRating}</Text>
            {avgRating !== "N/A" && <HugeiconsIcon icon={StarIcon} size={14} color={colors.ink} />}
          </View>
        </View>
        <Text style={s.subtitle}>{totalReviews} review{totalReviews !== 1 ? "s" : ""}</Text>
      </View>

      <View style={s.card}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <HugeiconsIcon icon={ChartAverageIcon} size={16} color={colors.ink} />
          <Text style={s.title}>Brewer Performance</Text>
        </View>
        {brewerStats.length === 0 ? (
          <Text style={s.emptyText}>No brewers added yet.</Text>
        ) : (
          <View style={{ marginTop: 10 }}>
            {brewerStats.map((bwr, idx) => (
              <View key={bwr.id} style={[s.brewerRow, idx === brewerStats.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={s.brewerName}>{bwr.name}</Text>
                    <View style={s.brewerStatusPill}>
                      <Text style={s.brewerStatusText}>{bwr.status}</Text>
                    </View>
                  </View>
                  <Text style={s.brewerMeta}>{bwr.ordersHandled} order{bwr.ordersHandled !== 1 ? "s" : ""} handled</Text>
                </View>
                {bwr.avgBrewerRating !== null ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Text style={s.brewerRating}>{bwr.avgBrewerRating.toFixed(1)}</Text>
                    <HugeiconsIcon icon={StarIcon} size={13} color={colors.ink} />
                  </View>
                ) : (
                  <Text style={s.emptyText}>No ratings</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = (colors: ColorRamp) =>
  StyleSheet.create({
    statRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    card: { borderRadius: 12, borderWidth: 1, borderColor: colors.dividerZinc, backgroundColor: colors.white, padding: 20 },
    title: { fontSize: 15, fontWeight: "700", color: colors.ink },
    subtitle: { fontSize: 11, color: colors.softZinc, marginTop: 4 },
    subLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: colors.softZinc, marginBottom: 8, marginTop: 6 },
    chartRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 140, marginTop: 12 },
    barColumn: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
    barTrack: { flex: 1, width: "100%", justifyContent: "flex-end" },
    bar: { width: "100%", backgroundColor: colors.slateZinc, borderRadius: 3 },
    barEmpty: { backgroundColor: colors.surfaceZinc },
    barLabel: { fontSize: 8, color: colors.softZinc, marginTop: 4 },
    distRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    distLabel: { width: 76, fontSize: 11, fontWeight: "600", color: colors.slateZinc },
    distTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceZinc, overflow: "hidden" },
    distFill: { height: "100%", backgroundColor: colors.ink, borderRadius: 4 },
    distCount: { width: 24, textAlign: "right", fontSize: 11, fontWeight: "700", color: colors.ink },
    ratingValue: { fontSize: 18, fontWeight: "800", color: colors.ink },
    emptyText: { fontSize: 11, color: colors.softZinc, marginTop: 8 },
    brewerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.dividerZinc },
    brewerName: { fontSize: 13, fontWeight: "700", color: colors.ink },
    brewerMeta: { fontSize: 10, color: colors.softZinc, marginTop: 1 },
    brewerStatusPill: { backgroundColor: colors.surfaceZinc, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
    brewerStatusText: { fontSize: 9, fontWeight: "700", color: colors.midZinc },
    brewerRating: { fontSize: 13, fontWeight: "700", color: colors.ink },
  });
