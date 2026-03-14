import { fetchJSON, downloadJSON } from './api';

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------
beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// fetchJSON
// ---------------------------------------------------------------------------
describe('fetchJSON', () => {
  it('returns parsed JSON on a successful response', async () => {
    const payload = { results: [{ score: 42 }] };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(payload),
    });

    const data = await fetchJSON('/api/align', { method: 'POST', body: '{}' });
    expect(data).toEqual(payload);

    // Verify Content-Type header was sent
    expect(global.fetch).toHaveBeenCalledWith('/api/align', expect.objectContaining({
      headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      method: 'POST',
      body: '{}',
    }));
  });

  it('throws with the error message extracted from a JSON error response', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ error: 'Sequence too short' }),
    });

    await expect(fetchJSON('/api/align')).rejects.toThrow('Sequence too short');
  });

  it('throws a generic server error when the error response is not JSON', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.reject(new Error('not json')),
    });

    await expect(fetchJSON('/api/align')).rejects.toThrow('Server error (502)');
  });

  it('merges custom headers with the default Content-Type', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await fetchJSON('/api/test', { headers: { Authorization: 'Bearer tok' } });

    expect(global.fetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer tok',
      },
    }));
  });
});

// ---------------------------------------------------------------------------
// downloadJSON
// ---------------------------------------------------------------------------
describe('downloadJSON', () => {
  it('creates a temporary link, clicks it, and revokes the object URL', () => {
    const mockClick = jest.fn();
    const mockCreateElement = jest.spyOn(document, 'createElement').mockReturnValue({
      set href(v) { this._href = v; },
      get href() { return this._href; },
      set download(v) { this._download = v; },
      get download() { return this._download; },
      click: mockClick,
    });

    const fakeUrl = 'blob:http://localhost/fake-id';
    const mockCreateObjectURL = jest.fn(() => fakeUrl);
    const mockRevokeObjectURL = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;

    const data = { score: 99, identity: 85 };
    downloadJSON(data, 'cm-blosum-nw-alignment');

    // A Blob should have been created and an object URL generated
    expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    const blobArg = mockCreateObjectURL.mock.calls[0][0];
    expect(blobArg).toBeInstanceOf(Blob);

    // The anchor element should have been clicked
    expect(mockClick).toHaveBeenCalledTimes(1);

    // The object URL should have been revoked after the click
    expect(mockRevokeObjectURL).toHaveBeenCalledWith(fakeUrl);

    // Download filename should contain the prefix and today's date
    const today = new Date().toISOString().slice(0, 10);
    const anchor = mockCreateElement.mock.results[0].value;
    expect(anchor._download).toBe(`cm-blosum-nw-alignment-${today}.json`);

    mockCreateElement.mockRestore();
  });
});
