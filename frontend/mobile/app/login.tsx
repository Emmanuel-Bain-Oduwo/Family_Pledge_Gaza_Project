import { Redirect } from 'expo-router';

export default function DemoRouteAlias() {
  return <Redirect href="/auth/login" />;
}
