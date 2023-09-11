import { it, describe, expect } from 'vitest';
import { nextTick } from 'vue';
import { useRecentWorksites } from '@/hooks/useRecentWorksites';

describe('useRecentWorksites', () => {
  it('should add a recent worksite', async () => {
    const { recentWorksites, addRecentWorksite } = useRecentWorksites();
    const worksite = { id: 1, name: 'Test Worksite' };
    addRecentWorksite(worksite);
    await nextTick();
    expect(recentWorksites.value).toContainEqual(worksite);
  });

  it('should get recent worksites', async () => {
    const { recentWorksites, addRecentWorksite, getRecentWorksite } =
      useRecentWorksites();
    const worksite1 = { id: 1, name: 'Test Worksite 1' };
    const worksite2 = { id: 2, name: 'Test Worksite 2' };
    addRecentWorksite(worksite1);
    addRecentWorksite(worksite2);
    await nextTick();
    const w1 = getRecentWorksite(worksite1.id);
    const w2 = getRecentWorksite(worksite2.id);
    await nextTick();
    expect(w1).toEqual(worksite1);
    expect(w2).toEqual(worksite2);
    expect(recentWorksites.value).toMatchInlineSnapshot(`
      [
        {
          "id": 1,
          "name": "Test Worksite 1",
        },
        {
          "id": 2,
          "name": "Test Worksite 2",
        },
      ]
    `);
  });

  it('should delete a recent worksite', async () => {
    const { recentWorksites, addRecentWorksite, deleteRecentWorksite } =
      useRecentWorksites();
    const worksite = { id: 1, name: 'Test Worksite' };
    addRecentWorksite(worksite);
    await nextTick();
    deleteRecentWorksite(worksite.id);
    await nextTick();
    console.log('hello world');
    expect(recentWorksites.value).not.toContainEqual(worksite);
  });

  it('should clear all recent worksites', async () => {
    const { recentWorksites, addRecentWorksite, clearRecentWorksites } =
      useRecentWorksites();
    const worksite1 = { id: 1, name: 'Test Worksite 1' };
    const worksite2 = { id: 2, name: 'Test Worksite 2' };
    addRecentWorksite(worksite1);
    addRecentWorksite(worksite2);
    await nextTick();
    clearRecentWorksites();
    await nextTick();
    expect(recentWorksites.value).toEqual([]);
  });

  it('should not exceed the limit of recent worksites', async () => {
    const { recentWorksites, addRecentWorksite } = useRecentWorksites();
    for (let i = 1; i <= 5; i++) {
      addRecentWorksite({ id: i, name: `Test Worksite ${i}` });
      await nextTick();
    }
    expect(recentWorksites.value.length).toBe(4);
    expect(recentWorksites.value).not.toContainEqual({
      id: 1,
      name: 'Test Worksite 1',
    });
  });
});
