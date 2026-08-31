import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALTIN, ALTIN_COK_SOLUK, ALTIN_ORTA_SOLUK, SIYAH, SURFACE } from '@/constants/luxTheme';
import { useVeri } from '@/context/DataContext';
import { GIZLILIK_URL, KULLANIM_SARTLARI_URL } from '@/store/magaza';

const MADDELER: { ikon: keyof typeof MaterialCommunityIcons.glyphMap; metin: string }[] = [
  {
    ikon: 'cellphone-check',
    metin:
      'Girdiğin profil, öğün, su ve kilo verileri öncelikle cihazında saklanır. Bu verileri istediğin an dışa aktarabilir veya kalıcı olarak silebilirsin.',
  },
  {
    ikon: 'heart-pulse',
    metin:
      'Apple Health bağlantısını açarsan adım, aktif enerji ve kilo verilerin okunur; öğün ve su kayıtların Apple Health’e yazılır. Bu bağlantı tamamen isteğe bağlıdır.',
  },
  {
    ikon: 'robot-outline',
    metin:
      'AI Koç’a soru sorduğunda; yaşın, hedefin ve günün özet beslenme verisi, yanıt üretilmesi için Google Gemini servisine iletilir. Ham kayıtların gönderilmez.',
  },
  {
    ikon: 'shield-check-outline',
    metin:
      'Verilerin reklam veya profil çıkarma amacıyla üçüncü taraflarla paylaşılmaz. KVKK kapsamındaki erişim, düzeltme ve silme haklarını uygulama içinden kullanabilirsin.',
  },
];

export default function KvkkScreen() {
  const { kvkkOnayla } = useVeri();

  const devamEt = () => {
    kvkkOnayla();
    router.replace('/(tabs)');
  };

  return (
    <View style={stiller.kok}>
      <StatusBar style="light" />
      <SafeAreaView style={stiller.kok} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={stiller.icerik} showsVerticalScrollIndicator={false}>
          <View style={stiller.rozet}>
            <MaterialCommunityIcons name="file-document-outline" size={28} color={ALTIN} />
          </View>
          <Text style={stiller.baslik}>Verilerin ve{'\n'}Gizliliğin</Text>
          <Text style={stiller.altBaslik}>
            Başlamadan önce verilerini nasıl kullandığımızı bilmeni isteriz (KVKK Aydınlatma Metni).
          </Text>

          <View style={stiller.liste}>
            {MADDELER.map((madde) => (
              <View key={madde.metin} style={stiller.madde}>
                <MaterialCommunityIcons name={madde.ikon} size={18} color={ALTIN} />
                <Text style={stiller.maddeYazi}>{madde.metin}</Text>
              </View>
            ))}
          </View>

          <View style={stiller.saglikKarti}>
            <MaterialCommunityIcons name="medical-bag" size={18} color={ALTIN} />
            <Text style={stiller.saglikYazi}>
              Bu uygulama tıbbi tavsiye vermez. Beslenme değişiklikleri öncesi bir sağlık
              profesyoneline danışın.
            </Text>
          </View>

          <View style={stiller.linkSatiri}>
            <Pressable onPress={() => Linking.openURL(GIZLILIK_URL)}>
              <Text style={stiller.linkYazi}>Gizlilik Politikası</Text>
            </Pressable>
            <Text style={stiller.linkAyrac}>·</Text>
            <Pressable onPress={() => Linking.openURL(KULLANIM_SARTLARI_URL)}>
              <Text style={stiller.linkYazi}>Kullanım Şartları</Text>
            </Pressable>
          </View>
        </ScrollView>

        <Pressable onPress={devamEt} style={stiller.buton}>
          <Text style={stiller.butonYazi}>Okudum, Devam Et</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const stiller = StyleSheet.create({
  kok: {
    flex: 1,
    backgroundColor: SIYAH,
  },
  icerik: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 16,
  },
  rozet: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: ALTIN_COK_SOLUK,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(232,195,124,0.06)',
    marginTop: 8,
  },
  baslik: {
    color: ALTIN,
    fontFamily: 'StoriesGrand',
    fontSize: 26,
    letterSpacing: 0.5,
    textAlign: 'center',
    lineHeight: 34,
  },
  altBaslik: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19,
    textAlign: 'center',
  },
  liste: {
    alignSelf: 'stretch',
    gap: 14,
    marginTop: 4,
  },
  madde: {
    flexDirection: 'row',
    gap: 12,
  },
  maddeYazi: {
    flex: 1,
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12.5,
    fontWeight: '300',
    lineHeight: 18,
  },
  saglikKarti: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderColor: ALTIN,
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  saglikYazi: {
    flex: 1,
    color: ALTIN,
    fontSize: 13,
    fontWeight: '300',
    lineHeight: 19,
  },
  linkSatiri: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  linkYazi: {
    color: ALTIN_ORTA_SOLUK,
    fontSize: 12,
    fontWeight: '300',
    textDecorationLine: 'underline',
  },
  linkAyrac: {
    color: ALTIN_COK_SOLUK,
    fontSize: 12,
  },
  buton: {
    marginHorizontal: 24,
    marginBottom: 8,
    height: 56,
    borderRadius: 28,
    backgroundColor: ALTIN,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  butonYazi: {
    color: SIYAH,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
