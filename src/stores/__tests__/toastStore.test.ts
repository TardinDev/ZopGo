import { useToastStore, toast } from '../toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('toastStore', () => {
  describe('show', () => {
    it('appends a toast with the requested type and message', () => {
      useToastStore.getState().show({ type: 'success', message: 'Hello' });
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].type).toBe('success');
      expect(toasts[0].message).toBe('Hello');
    });

    it('returns the new toast id', () => {
      const id = useToastStore.getState().show({ type: 'info', message: 'X' });
      expect(typeof id).toBe('string');
      expect(useToastStore.getState().toasts[0].id).toBe(id);
    });

    it('defaults durationMs to 3500 when omitted', () => {
      useToastStore.getState().show({ type: 'error', message: 'Boom' });
      expect(useToastStore.getState().toasts[0].durationMs).toBe(3500);
    });

    it('honors custom durationMs', () => {
      useToastStore.getState().show({ type: 'info', message: 'X', durationMs: 9000 });
      expect(useToastStore.getState().toasts[0].durationMs).toBe(9000);
    });

    it('keeps optional title field', () => {
      useToastStore.getState().show({ type: 'success', title: 'Yay', message: 'Done' });
      expect(useToastStore.getState().toasts[0].title).toBe('Yay');
    });

    it('issues unique ids for back-to-back toasts', () => {
      const id1 = useToastStore.getState().show({ type: 'info', message: 'A' });
      const id2 = useToastStore.getState().show({ type: 'info', message: 'B' });
      const id3 = useToastStore.getState().show({ type: 'info', message: 'C' });
      expect(new Set([id1, id2, id3]).size).toBe(3);
      expect(useToastStore.getState().toasts).toHaveLength(3);
    });
  });

  describe('dismiss', () => {
    it('removes the toast with the given id', () => {
      const id1 = useToastStore.getState().show({ type: 'info', message: 'A' });
      const id2 = useToastStore.getState().show({ type: 'info', message: 'B' });
      useToastStore.getState().dismiss(id1);
      const toasts = useToastStore.getState().toasts;
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id2);
    });

    it('is a no-op for unknown ids', () => {
      useToastStore.getState().show({ type: 'info', message: 'A' });
      useToastStore.getState().dismiss('does-not-exist');
      expect(useToastStore.getState().toasts).toHaveLength(1);
    });
  });

  describe('module-level helpers', () => {
    it('toast.success delegates to the store with type=success', () => {
      toast.success('Yay');
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe('success');
      expect(t.message).toBe('Yay');
    });

    it('toast.error delegates to the store with type=error', () => {
      toast.error('Boom', { title: 'Oops', durationMs: 5000 });
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe('error');
      expect(t.title).toBe('Oops');
      expect(t.durationMs).toBe(5000);
    });

    it('toast.info delegates to the store with type=info', () => {
      toast.info('FYI');
      const t = useToastStore.getState().toasts[0];
      expect(t.type).toBe('info');
    });
  });
});
