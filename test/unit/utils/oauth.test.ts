import { describe, expect, test } from 'vitest';
import { getAuthorizeState } from '@/utils/oauth';

describe('oauth >> getAuthorizeState', () => {
  test('keeps the page the user asked for', () => {
    expect(getAuthorizeState('/incident/320/work?showTable=true')).toBe(
      '/incident/320/work?showTable=true',
    );
  });

  test('uses the dashboard when no page is given', () => {
    expect(getAuthorizeState()).toBe('/dashboard');
  });

  test('never returns to the callback page, which holds a used code', () => {
    expect(getAuthorizeState('/o/callback?code=abc&state=%2Fdashboard')).toBe(
      '/dashboard',
    );
  });
});
