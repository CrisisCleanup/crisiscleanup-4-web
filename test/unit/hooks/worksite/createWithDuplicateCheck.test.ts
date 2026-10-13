import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { createWithDuplicateCheck } from '@/hooks/worksite/createWithDuplicateCheck';

const conflict = () =>
  new AxiosError('conflict', '409', undefined, undefined, {
    status: 409,
    data: { potential_duplicates: [{ case_number: 'Q1646' }] },
  } as AxiosResponse);

describe('createWithDuplicateCheck', () => {
  it('skips the check when it is off', async () => {
    const create = vi.fn().mockResolvedValue({ response: { id: 1 } });
    const confirm = vi.fn();
    await createWithDuplicateCheck(create, false, confirm);
    expect(create).toHaveBeenCalledWith(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('saves without asking when the API finds no duplicate', async () => {
    const create = vi.fn().mockResolvedValue({ response: { id: 1 } });
    const confirm = vi.fn();
    const result = await createWithDuplicateCheck(create, true, confirm);
    expect(create.mock.calls).toEqual([[false]]);
    expect(confirm).not.toHaveBeenCalled();
    expect(result).toEqual({ response: { id: 1 } });
  });

  it('asks on a possible duplicate and creates anyway on yes', async () => {
    const create = vi
      .fn()
      .mockResolvedValueOnce({ response: conflict() })
      .mockResolvedValueOnce({ response: { id: 2 } });
    const confirm = vi.fn().mockResolvedValue(true);
    const result = await createWithDuplicateCheck(create, true, confirm);
    expect(create.mock.calls).toEqual([[false], [true]]);
    expect(confirm).toHaveBeenCalledOnce();
    expect(result).toEqual({ response: { id: 2 } });
  });

  it('handles a thrown 409 the same way', async () => {
    const create = vi
      .fn()
      .mockRejectedValueOnce(conflict())
      .mockResolvedValueOnce({ response: { id: 3 } });
    const confirm = vi.fn().mockResolvedValue(true);
    const result = await createWithDuplicateCheck(create, true, confirm);
    expect(create.mock.calls).toEqual([[false], [true]]);
    expect(result).toEqual({ response: { id: 3 } });
  });

  it('rethrows other thrown errors', async () => {
    const create = vi.fn().mockRejectedValue(new Error('network'));
    await expect(
      createWithDuplicateCheck(create, true, vi.fn()),
    ).rejects.toThrow('network');
  });

  it('creates nothing when the user cancels', async () => {
    const create = vi.fn().mockResolvedValue({ response: conflict() });
    const confirm = vi.fn().mockResolvedValue(false);
    expect(await createWithDuplicateCheck(create, true, confirm)).toBeNull();
    expect(create).toHaveBeenCalledOnce();
  });

  it('passes other errors through unchanged', async () => {
    const forbidden = new AxiosError('forbidden', '403', undefined, undefined, {
      status: 403,
    } as AxiosResponse);
    const create = vi.fn().mockResolvedValue({ response: forbidden });
    const confirm = vi.fn();
    const result = await createWithDuplicateCheck(create, true, confirm);
    expect(result).toEqual({ response: forbidden });
    expect(confirm).not.toHaveBeenCalled();
  });
});
