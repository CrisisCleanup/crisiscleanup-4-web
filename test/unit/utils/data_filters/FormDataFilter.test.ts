import { describe, expect, test } from 'vitest';
import FormDataFilter from '@/utils/data_filters/FormDataFilter';

describe('FormDataFilter', () => {
  test('packFunction should return packed data when values are present', () => {
    const formDataFilter = new FormDataFilter('test', {
      key1: true,
      key2: false,
      key3: true,
    });
    const packed = formDataFilter.packFunction();
    expect(packed).toEqual({ form_data: 'key1:true,key3:true' });
  });

  test('packFunction should return an empty object when no values are present', () => {
    const formDataFilter = new FormDataFilter('test', {
      key1: false,
      key2: false,
    });
    const packed = formDataFilter.packFunction();
    expect(packed).toEqual({});
  });

  test('getCount should return the count of true values', () => {
    const formDataFilter = new FormDataFilter('test', {
      key1: true,
      key2: false,
      key3: true,
    });
    const count = formDataFilter.getCount();
    expect(count).toBe(2);
  });

  test('getCount should return 0 when no values are true', () => {
    const formDataFilter = new FormDataFilter('test', {
      key1: false,
      key2: false,
    });
    const count = formDataFilter.getCount();
    expect(count).toBe(0);
  });

  test('getCount should return 0 when data is undefined', () => {
    const formDataFilter = new FormDataFilter('test', undefined);
    const count = formDataFilter.getCount();
    expect(count).toBe(0);
  });

  test('getFilterLabels should return the correct labels', () => {
    const formDataFilter = new FormDataFilter('test', {
      key1: true,
      key2: false,
      key3: true,
    });
    const labels = formDataFilter.getFilterLabels();
    expect(labels).toEqual({
      key1: 'formLabels.key1',
      key3: 'formLabels.key3',
    });
  });

  test('removeField should set the field to false', () => {
    const formDataFilter = new FormDataFilter('test', {
      key1: true,
      key2: true,
    });
    formDataFilter.removeField('key1');
    expect(formDataFilter.data).toEqual({ key1: false, key2: true });
  });
});
