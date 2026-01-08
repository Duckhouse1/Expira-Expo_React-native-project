
import * as Notifications from "expo-notifications";


async function enableLocalNotifs() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    Notifications.setNotificationHandler({
        handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: true,

            // ✅ required by newer expo-notifications types
            shouldShowBanner: true,
            shouldShowList: true,
        }),
    });
}


async function scheduleExpiryReminder(expires: Date, title: string) {
    if (isNaN(expires.getTime())) throw new Error("Invalid date");

    // must be in the future
    if (expires.getTime() <= Date.now()) {
        console.log("Date is in the past; scheduling 10 seconds from now for test");
        await Notifications.scheduleNotificationAsync({
            content: { title: "Giftcard is expiring soon!", body: "Your giftcard: \"" + title + "\" is expiring soon. Don't forget to use it before it's too late! 🎁⏳" },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: 10,
            },
        });
        return;
    }
    const date = new Date(expires);
    date.setDate(date.getDate() - 7);
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title: `Giftcard is expiring soon!`,
            body: "Your giftcard: \"" + title + "\" is expiring soon. Don't forget to use it before it's too late! 🎁⏳",
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: date,
        },
    });

    console.log("Scheduled notification id:", id, "for", date.toString());
}


const ExpiresServices = {
    enableLocalNotifs,
    scheduleExpiryReminder,
};

export default ExpiresServices;