import { summarizeImageUploads } from '../imageUploadSummary';

describe('summarizeImageUploads', () => {
  it('keeps only the non-null URLs in order', () => {
    const r = summarizeImageUploads(['a', null, 'b']);
    expect(r.urls).toEqual(['a', 'b']);
  });

  it('reports counts for total, uploaded and failed', () => {
    const r = summarizeImageUploads(['a', null, 'b', null]);
    expect(r.total).toBe(4);
    expect(r.uploaded).toBe(2);
    expect(r.failed).toBe(2);
  });

  it('flags allFailed when every upload returned null', () => {
    const r = summarizeImageUploads([null, null]);
    expect(r.allFailed).toBe(true);
    expect(r.someFailed).toBe(false);
    expect(r.urls).toEqual([]);
  });

  it('flags someFailed for a partial failure', () => {
    const r = summarizeImageUploads(['a', null]);
    expect(r.allFailed).toBe(false);
    expect(r.someFailed).toBe(true);
  });

  it('reports a clean run when all uploads succeed', () => {
    const r = summarizeImageUploads(['a', 'b']);
    expect(r.allFailed).toBe(false);
    expect(r.someFailed).toBe(false);
    expect(r.failed).toBe(0);
  });

  it('treats an empty input as all-failed (nothing uploaded)', () => {
    const r = summarizeImageUploads([]);
    expect(r.total).toBe(0);
    expect(r.uploaded).toBe(0);
    expect(r.allFailed).toBe(true);
    expect(r.someFailed).toBe(false);
  });
});
