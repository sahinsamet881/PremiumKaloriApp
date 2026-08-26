import * as Notifications from 'expo-notifications';
import { useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const HATIRLATICI_GECIKME_SANIYE = 60 * 60 * 4;
const ANDROID_KANAL_ID = 'varsayilan';

export function useNotifications() {
  useEffect(() => {
    const izinleriHazirla = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(ANDROID_KANAL_ID, {
          name: 'Varsayılan',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }

      const mevcutIzin = await Notifications.getPermissionsAsync();
      if (!mevcutIzin.granted) {
        await Notifications.requestPermissionsAsync();
      }
    };

    izinleriHazirla();
  }, []);

  const hatirlaticiKur = useCallback(async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Öğününü Girmeyi Unuttun mu?',
        body: 'Hedefine ulaşmak için harika gidiyorsun, son öğününü eklemeyi unutma!',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: HATIRLATICI_GECIKME_SANIYE,
        repeats: false,
      },
    });
  }, []);

  return { hatirlaticiKur };
}
