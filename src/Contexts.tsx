import React from "react";
import { Dispatch, SetStateAction } from "react";
import { VaultItem } from "./components/VaultItemCard";





export interface NewVaultItemSheetProps {
    showNewVaultItem: boolean;
    setShowNewVaultItem: Dispatch<SetStateAction<boolean>>;
}


export const NewVaultItemSheetContext = React.createContext<NewVaultItemSheetProps>({ showNewVaultItem: false, setShowNewVaultItem: () => {} });

export interface VaultItemsProps {
    VaultItems: VaultItem[];
    setVaultItems: Dispatch<SetStateAction<VaultItem[]>>;
}


export const VaultItemsContext = React.createContext<VaultItemsProps>({ VaultItems: [], setVaultItems: () => {} });

export type Tab = "Trophies" | "home" | "vault";

export interface TabProps {
    currentTab: Tab;
    setCurrentTab: Dispatch<SetStateAction<Tab>>;
}


export const TabContext = React.createContext<TabProps>({ currentTab: "home", setCurrentTab: () => {} });


export interface ShowCameraProps {
    showCamera: boolean;
    setShowCamera: Dispatch<SetStateAction<boolean>>;
}


export const ShowCameraContext = React.createContext<ShowCameraProps>({ showCamera: false, setShowCamera: () => {} });

export interface HideNavBarProps {
    hideBar: boolean;
    setHideBar: Dispatch<SetStateAction<boolean>>;
}


export const HideNavBarContext = React.createContext<HideNavBarProps>({ hideBar: false, setHideBar: () => {} });