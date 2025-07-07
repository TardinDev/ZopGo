import { Link, Stack } from 'expo-router';
<<<<<<< HEAD
import { Text } from 'react-native';

import { Container } from '~/components/Container';
=======

import { Text, View } from 'react-native';
>>>>>>> 5115cf2 (Initial commit)

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
<<<<<<< HEAD
      <Container>
        <Text className={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" className={styles.link}>
          <Text className={styles.linkText}>Go to home screen!</Text>
        </Link>
      </Container>
=======
      <View className={styles.container}>
        <Text className={styles.title}>{"This screen doesn't exist."}</Text>
        <Link href="/" className={styles.link}>
          <Text className={styles.linkText}>Go to home screen!</Text>
        </Link>
      </View>
>>>>>>> 5115cf2 (Initial commit)
    </>
  );
}

const styles = {
<<<<<<< HEAD
=======
  container: `items-center flex-1 justify-center p-5`,
>>>>>>> 5115cf2 (Initial commit)
  title: `text-xl font-bold`,
  link: `mt-4 pt-4`,
  linkText: `text-base text-[#2e78b7]`,
};
