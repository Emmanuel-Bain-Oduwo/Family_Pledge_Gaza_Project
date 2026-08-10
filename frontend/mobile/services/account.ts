import api from './api';

export async function deleteMyAccount(password: string): Promise<void> {
  await api.delete('/users/me', { data: { password } });
}
