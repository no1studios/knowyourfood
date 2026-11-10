import { Redirect } from 'expo-router';

/**
 * Entry: send new installs through onboarding.
 * Later this can gate on SecureStore / onboarding_complete.
 */
export default function Index() {
  return <Redirect href="/onboarding/language" />;
}
