export const Trophies = [
    {
        id: 1,
        name: "Bronze Trophies",
        icon: "🥉",
        Trophies: [
            { id: 1, name: "First Item Added", description: "Add your first item to the vault", icon: "first_item" },
            { id: 2, name: "Five Items Added", description: "Add five items to the vault", icon: "five_items" },
            { id: 3, name: "Ten Items Added", description: "Add ten items to the vault", icon: "ten_items" },

            { id: 10, name: "First Scan", description: "Scan your first gift card or receipt", icon: "first_scan" },
            { id: 11, name: "Expiry Starter", description: "Add an item with an expiry date", icon: "expiry_starter" },
            { id: 12, name: "Vault Organizer", description: "Edit the title or description of an item", icon: "vault_organizer" },
            { id: 13, name: "Category Starter", description: "Add items of two different types", icon: "category_starter" },
            { id: 14, name: "Picture Perfect", description: "Add an item with an image", icon: "picture_perfect" },
        ],
    },

    {
        id: 2,
        name: "Silver Trophies",
        icon: "🥈",
        Trophies: [
            { id: 4, name: "Fifty Items Added", description: "Add fifty items to the vault", icon: "fifty_items" },
            { id: 5, name: "Hundred Items Added", description: "Add one hundred items to the vault", icon: "hundred_items" },

            { id: 15, name: "Expiry Watcher", description: "Have five items with expiry dates", icon: "expiry_watcher" },
            { id: 16, name: "No Expiry Missed", description: "Go 30 days without an item expiring", icon: "no_expiry_missed" },
            { id: 17, name: "Scanner Pro", description: "Scan ten items using QR or barcode", icon: "scanner_pro" },
            { id: 18, name: "Multi-Merchant", description: "Store items from five different merchants", icon: "multi_merchant" },
            { id: 19, name: "Currency Collector", description: "Store items in three different currencies", icon: "currency_collector" },
        ],
    },
    {
        id: 3,
        name: "Gold Trophies",
        icon: "🥇",
        Trophies: [
            { id: 6, name: "Five Hundred Items Added", description: "Add five hundred items to the vault", icon: "five_hundred_items" },
            { id: 7, name: "Thousand Items Added", description: "Add one thousand items to the vault", icon: "thousand_items" },

            { id: 20, name: "Vault Master", description: "Maintain 100 active (non-expired) items", icon: "vault_master" },
            { id: 21, name: "Expiry Saver", description: "Use or remove ten items before they expire", icon: "expiry_saver" },
            { id: 22, name: "Digital Minimalist", description: "Remove or archive twenty expired items", icon: "digital_minimalist" },
            { id: 23, name: "Trusted Vault", description: "Use the app for six consecutive months", icon: "trusted_vault" },
            { id: 24, name: "Savings Guardian", description: "Track items worth a total of 1,000+", icon: "savings_guardian" },
        ],
    },

    {
        id: 4,
        name: "Secrets",
        icon: "❓",
        Trophies: [
            { id: 8, name: "Midnight Scanner", description: "Scan between 00:00–05:00", icon: "secret_midnight" },
            { id: 9, name: "Last Second Save", description: "Open item < 24h before expiry", icon: "secret_last_second" },
            { id: 25, name: "Lucky Seven", description: "Add item on day 7", icon: "secret_lucky_seven" },
            { id: 26, name: "Perfectionist", description: "10 items fully filled", icon: "secret_perfectionist" },
            { id: 27, name: "Comeback Kid", description: "Return after 30 days", icon: "secret_comeback" },
            { id: 28, name: "Early Bird", description: "Open app before 06:00", icon: "secret_early_bird" },
            { id: 29, name: "Vault Cleaner", description: "Remove 10 expired items", icon: "secret_vault_cleaner" },
            { id: 30, name: "Hidden Fortune", description: "Total value in the vault 2,000+", icon: "secret_hidden_fortune" },
            { id: 31, name: "Daily Visitor", description: "Open app 7 days in a row", icon: "secret_daily_visitor" },
            { id: 32, name: "The Hoarder", description: "50+ active items", icon: "secret_hoarder" },
        ],
    }
];
/*
Name                	Unlock Hint (hidden from user)

Midnight Scanner	-   Scan between 00:00–05:00
Last Second Save    -   Open item < 24h before expiry
Lucky Seven         -   Add item on day 7
Perfectionist       -	10 items fully filled
Comeback Kid        -	Return after 30 days
Early Bird          -	Open app before 06:00
Vault Cleaner       -	Remove 10 expired items
Hidden Fortune      -	Total value ≥ 2,000
Daily Visitor       -	Open app 7 days in a row
The Hoarder         -	50+ active items
*/