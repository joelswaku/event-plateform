import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function TeamEventDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();

  useEffect(() => {
    if (id) router.replace(`/events/${id}` as never);
  }, [id]);

  return null;
}
