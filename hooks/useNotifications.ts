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
const OGUN_HATIRLATICI_ID = 'ogun-hatirlatici';
const DENEME_HATIRLATICI_ID = 'deneme-hatirlatici';
const BIR_GUN_MS = 24 * 60 * 60 * 1000;

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
    await Notifications.cancelScheduledNotificationAsync(OGUN_HATIRLATICI_ID).catch(() => {});
    await Notifications.scheduleNotificationAsync({
      identifier: OGUN_HATIRLATICI_ID,
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

  const denemeHatirlaticisiKur = useCallback(async (denemeBitisMs: number | null) => {
    await Notifications.cancelScheduledNotificationAsync(DENEME_HATIRLATICI_ID).catch(() => {});
    if (!denemeBitisMs) {
      return;
    }
    const hatirlatmaZamani = denemeBitisMs - BIR_GUN_MS;
    if (hatirlatmaZamani <= Date.now() + 60 * 1000) {
      return;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: DENEME_HATIRLATICI_ID,
      content: {
        title: 'Ücretsiz Deneme Süren Yarın Bitiyor',
        body: 'Premium devam etsin istemiyorsan App Store > Abonelikler bölümünden iptal edebilirsin. İptal etmezsen abonelik otomatik başlar.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(hatirlatmaZamani),
      },
    });
  }, []);

  return { hatirlaticiKur, denemeHatirlaticisiKur };
}
