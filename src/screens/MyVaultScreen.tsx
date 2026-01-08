import React, { useContext, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { VaultItem } from '../components/VaultItemCard';
import { MyVaultItemCard } from '../components/MyVaultItemCard';
import { MyVaultInfoModal, VaultItemLayout } from '../components/MyVaultInfoModal';
import { VaultItemsContext } from '../Contexts';
import { FilterModal, Filters } from '../components/FilterModal';

interface MyVaultScreenProps {
    vaultItems: VaultItem[] | null;
}

export const MyVaultScreen: React.FC<MyVaultScreenProps> = () => {
    const { VaultItems, setVaultItems } = useContext(VaultItemsContext);
    const [displayedItems, setDisplayedItems] = useState<VaultItem[] | null>(VaultItems);
    const hasItems = VaultItems && VaultItems.length > 0;
    const [clickedItem, setClickedItem] = React.useState<VaultItem | null>(null);
    const [origin, setOrigin] = useState<VaultItemLayout | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeFilters, setActiveFilters] = useState<Filters>({
        types: [],
        sortBy: "date",
        sortDir: "desc",
    });
    useEffect(() => {
        setDisplayedItems(VaultItems);
    }, [VaultItems]);
    const onDelete = (item: VaultItem) => {
        console.log("Deleteing");
        console.log("Delete item:", item);
        const updatedItems = VaultItems?.filter(v => v.vaultItem !== item.vaultItem) || [];
        setVaultItems(updatedItems);
        setModalVisible(false);
    }
    const ApplyFilters = (filters: Filters) => {
        if (!VaultItems) return;

        let filteredItems = [...VaultItems];

        // Filter by type (same as before)
        if (filters.types.length > 0) {
            filteredItems = filteredItems.filter(item =>
                item.vaultItem && filters.types.includes(item.vaultItem.Type)
            );
        }

        // Sort by ONE thing: date OR price
        filteredItems.sort((a, b) => {
            if (filters.sortBy === "date") {
                const dateA = new Date(a.vaultItem?.ExpiryDate ?? 0).getTime();
                const dateB = new Date(b.vaultItem?.ExpiryDate ?? 0).getTime();
                return filters.sortDir === "asc" ? dateA - dateB : dateB - dateA;
            }

            // sortBy === "price"
            const priceA = a.vaultItem?.MoneyAmount ?? 0;
            const priceB = b.vaultItem?.MoneyAmount ?? 0;
            return filters.sortDir === "asc" ? priceA - priceB : priceB - priceA;
        });

        setDisplayedItems(filteredItems);
    };

    return (
        <View style={{ flex: 1 }}>

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>My Vault🔒</Text>
                <View style={{ display: "flex", justifyContent: "space-between", flexDirection: "row" }}>
                    <Text style={styles.subtitle}>
                        {hasItems ? `${VaultItems!.length} items` : 'No items yet'}
                    </Text>
                    <Pressable
                        onPress={() => setShowFilterModal(true)}
                    >
                        <Text style={{ padding: 8, borderWidth: 1, borderColor: "black", borderRadius: 8, fontWeight: "600" }}>
                            Filter {activeFilters.types.length > 0 && `(${activeFilters.types.length})`}
                        </Text>
                    </Pressable>
                </View>

            </View>

            {/* Content */}
            {hasItems ? (
                <FlatList
                    style={{ flex: 1 }}
                    data={displayedItems!}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 90 }]} // adjust to your nav height
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <MyVaultItemCard
                            vaultItem={item}
                            onClick={({ item: clicked, origin }) => {
                                setClickedItem(clicked);
                                setOrigin(origin);
                                setModalVisible(true);
                            }}
                        />
                    )}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Your vault is empty</Text>
                    <Text style={styles.emptyText}>
                        Upload a gift card to see it here.
                    </Text>
                </View>
            )}
            <MyVaultInfoModal
                visible={modalVisible}
                item={clickedItem}
                origin={origin}
                onDelete={(item) => onDelete(item)}
                onRequestClose={() => {
                    setModalVisible(false);
                }}
            />
            <FilterModal
                visible={showFilterModal}
                activeFilters={activeFilters}
                onClose={() => setShowFilterModal(false)}
                onApply={(f) => {
                    setActiveFilters(f);
                    ApplyFilters(f);
                    setShowFilterModal(false);
                }}
                onClear={() => {
                    setActiveFilters({ types: [], sortBy: "date", sortDir: "desc" });
                    setDisplayedItems(VaultItems);
                    setShowFilterModal(false);
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        // backgroundColor: '#0F172A', // dark slate
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#000000ff',
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 4,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        overflow: 'visible',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#343434ff',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
    },
});

