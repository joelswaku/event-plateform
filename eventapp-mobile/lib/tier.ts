import { Colors, TierKey } from '@/constants/colors';
import { TicketType } from '@/types';

export function resolveTier(ticket: Pick<TicketType, 'name' | 'kind'>): TierKey {
  const n = (ticket.name ?? '').toLowerCase();
  if (ticket.kind === 'FREE')                                                                           return 'free';
  if (n.includes('vip') || n.includes('platinum') || n.includes('premium') || n.includes('elite'))    return 'vip';
  if (n.includes('pro') || n.includes('diamond') || n.includes('ultra') || n.includes('all-access'))  return 'pro';
  if (n.includes('early') || n.includes('bird') || n.includes('presale') || n.includes('pre-sale'))   return 'early';
  if (n.includes('student') || n.includes('youth') || n.includes('concession'))                       return 'discount';
  return 'standard';
}

export function getTierConfig(ticket: Pick<TicketType, 'name' | 'kind'>) {
  return Colors.tier[resolveTier(ticket)];
}
