// src/Services/SubscriptionService.ts
import Purchases, { CustomerInfo, LOG_LEVEL } from "react-native-purchases";
import { Platform } from "react-native";

const IOS_API_KEY = "REVENUECAT_IOS_API_KEY";
const ANDROID_API_KEY = "REVENUECAT_ANDROID_API_KEY";

export const ENTITLEMENT_ID = "pro"; // det du kalder dit entitlement i RevenueCat

export function configureRevenueCat() {
  Purchases.setLogLevel(LOG_LEVEL.INFO);

  Purchases.configure({
    apiKey: Platform.OS === "ios" ? IOS_API_KEY : ANDROID_API_KEY,
  });
}

export async function setAppUserId(appUserId: string) {
  // binder dine accounts til RevenueCat user (vigtigt hvis du har login)
  await Purchases.logIn(appUserId);
}

export async function clearAppUserId() {
  // hvis du logger ud helt, kan du vælge at logOut i RevenueCat
  // (det gør at du går tilbage til en anonym RC-user)
  await Purchases.logOut();
}

export function isProActive(info: CustomerInfo | null | undefined) {
  return Boolean(info?.entitlements?.active?.[ENTITLEMENT_ID]);
}

export async function getCustomerInfo() {
  return Purchases.getCustomerInfo();
}
