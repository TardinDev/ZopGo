import { Link, Stack } from 'expo-router';

import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops !' }} />
      <View className={styles.container}>
        <Text className={styles.title}>{"Cette page n'existe pas."}</Text>
        <Link href="/" className={styles.link}>
          <Text className={styles.linkText}>{"Retour à l'accueil"}</Text>
        </Link>
      </View>
    </>
  );
}

const styles = {
  container: `items-center flex-1 justify-center p-5`,
  title: `text-xl font-bold`,
  link: `mt-4 pt-4`,
  linkText: `text-base text-[#2e78b7]`,
};
