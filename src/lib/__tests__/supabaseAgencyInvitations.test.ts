// Unmock this module so we test the real implementation against a mocked
// supabase client (the project-wide mock in jest.setup.js stubs `supabase`).
jest.unmock('../supabaseAgencyInvitations');

import { supabase } from '../supabase';
import { claimAgencyCode } from '../supabaseAgencyInvitations';

describe('claimAgencyCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects an empty code without hitting the RPC', async () => {
    const result = await claimAgencyCode('   ', 'profile-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid');
    }
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('returns ok=true and surfaces agency_name on a successful claim', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: {
        ok: true,
        agency_name: 'Air ZopGo',
        invitation_id: 'inv-123',
      },
      error: null,
    });

    const result = await claimAgencyCode(' zopgo-air-001 ', 'profile-1');
    expect(supabase.rpc).toHaveBeenCalledWith('claim_agency_code', {
      p_code: 'zopgo-air-001',
      p_profile_id: 'profile-1',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.agencyName).toBe('Air ZopGo');
      expect(result.invitationId).toBe('inv-123');
    }
  });

  it('translates a "used" reason to a French message', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { ok: false, reason: 'used' },
      error: null,
    });

    const result = await claimAgencyCode('CODE', 'profile-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('used');
      expect(result.message).toMatch(/déjà été utilisé/i);
    }
  });

  it('translates an "expired" reason', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: { ok: false, reason: 'expired' },
      error: null,
    });

    const result = await claimAgencyCode('CODE', 'profile-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('expired');
      expect(result.message).toMatch(/expir/i);
    }
  });

  it('maps RPC-level errors to reason=rpc_error with the original message', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: { message: 'Network down' },
    });

    const result = await claimAgencyCode('CODE', 'profile-1');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('rpc_error');
      expect(result.message).toBe('Network down');
    }
  });

  it('handles legacy array-wrapped responses from older Supabase clients', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValueOnce({
      data: [{ ok: true, agency_name: 'Sea ZopGo', invitation_id: 'inv-456' }],
      error: null,
    });

    const result = await claimAgencyCode('CODE', 'profile-1');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.agencyName).toBe('Sea ZopGo');
    }
  });
});
