import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { VaultItemType } from "../sheets/NewVaultItemSheet";

type SortBy = "date" | "price";
type SortDir = "asc" | "desc";

export type Filters = {
  types: VaultItemType[]; // multi-select
  sortBy: SortBy;         // single
  sortDir: SortDir;       // single
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: Filters) => void;

  // currently active filters (so modal can show what's selected)
  activeFilters: Filters;

  // optional: if you want the parent to clear too
  onClear?: () => void;
};

const ALL_TYPES: VaultItemType[] = ["receipt", "GiftCard", "email", "subscription", "other"];

const TYPE_LABEL: Record<VaultItemType, string> = {
  receipt: "Receipt",
  GiftCard: "Gift card",
  email: "Email",
  subscription: "Subscriptions",
  other: "Other",
};

export const FilterModal: React.FC<Props> = ({
  visible,
  onClose,
  onApply,
  activeFilters,
  onClear,
}) => {
  const [filters, setFilters] = React.useState<Filters>(activeFilters);

  // When modal opens, copy active filters into local draft state
  React.useEffect(() => {
    if (visible) setFilters(activeFilters);
  }, [visible, activeFilters]);

  const toggleType = (t: VaultItemType) => {
    setFilters((prev) => {
      const has = prev.types.includes(t);
      return {
        ...prev,
        types: has ? prev.types.filter((x) => x !== t) : [...prev.types, t],
      };
    });
  };

  const clearLocal = () => {
    const cleared: Filters = { types: [], sortBy: "date", sortDir: "desc" };
    setFilters(cleared);
    onClear?.(); // parent can optionally clear its active filters too
  };

  const apply = () => {
    onApply(filters);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Card (stop backdrop press) */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>Filters</Text>

          <ScrollView contentContainerStyle={styles.content}>
            {/* TYPE */}
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.rowWrap}>
              {ALL_TYPES.map((t) => {
                const selected = filters.types.includes(t);
                return (
                  <Pressable
                    key={t}
                    onPress={() => toggleType(t)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                      {TYPE_LABEL[t]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* SORT BY */}
            <Text style={styles.sectionTitle}>Sort by</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => setFilters((p) => ({ ...p, sortBy: "date" }))}
                style={[styles.option, filters.sortBy === "date" && styles.optionSelected]}
              >
                <Text style={styles.optionText}>Date</Text>
              </Pressable>

              <Pressable
                onPress={() => setFilters((p) => ({ ...p, sortBy: "price" }))}
                style={[styles.option, filters.sortBy === "price" && styles.optionSelected]}
              >
                <Text style={styles.optionText}>Price</Text>
              </Pressable>
            </View>

            {/* DIRECTION */}
            <Text style={styles.sectionTitle}>Direction</Text>
            <View style={styles.row}>
              <Pressable
                onPress={() => setFilters((p) => ({ ...p, sortDir: "asc" }))}
                style={[styles.option, filters.sortDir === "asc" && styles.optionSelected]}
              >
                <Text style={styles.optionText}>
                  {filters.sortBy === "price" ? "Low → High" : "Ascending"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setFilters((p) => ({ ...p, sortDir: "desc" }))}
                style={[styles.option, filters.sortDir === "desc" && styles.optionSelected]}
              >
                <Text style={styles.optionText}>
                  {filters.sortBy === "price" ? "High → Low" : "Descending"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={clearLocal} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Clear</Text>
            </Pressable>

            <View style={{ flex: 1 }} />

            <Pressable onPress={onClose} style={styles.secondaryBtn}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>

            <Pressable onPress={apply} style={styles.primaryBtn}>
              <Text style={styles.primaryText}>Apply</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  content: {
    paddingBottom: 8,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "700",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  chipSelected: {
    borderColor: "#111",
    backgroundColor: "#111",
  },
  chipText: {
    color: "#111",
    fontWeight: "600",
  },
  chipTextSelected: {
    color: "#fff",
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  optionSelected: {
    borderColor: "#111",
    backgroundColor: "#f2f2f2",
  },
  optionText: {
    fontWeight: "600",
    color: "#111",
  },
  actions: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  primaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#111",
  },
  primaryText: {
    color: "white",
    fontWeight: "700",
  },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#eee",
  },
  secondaryText: {
    color: "#111",
    fontWeight: "700",
  },
});
