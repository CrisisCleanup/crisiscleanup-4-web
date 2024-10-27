import { i18n } from '@/modules/i18n';
import { MD5 } from 'crypto-js';
import { store } from '@/store';
import type { Ani, Portal } from '@/models/types';
import _ from 'lodash';
import type { CamelCasedPropertiesDeep } from 'type-fest';
import defu from 'defu';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import createDebug from 'debug';
import type { Moment } from 'moment/moment';
import moment from 'moment';
import type Worksite from '@/models/Worksite';
const debug = createDebug('@ccu:utils:helpers');

/**
 * Convert rem to pixels.
 * @param rem
 * @returns {number}
 */
export const convertRemToPixels = (rem: number): number => {
  return (
    rem * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  );
};

/**
 * Simple formatting for amounts.
 * @returns {number | string}
 * @param number_
 */
export function nFormatter(number_: number): number | string {
  if (!number_) return 0;
  if (number_ >= 1_000_000_000) {
    return `${(number_ / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}G`;
  }

  if (number_ >= 1_000_000) {
    return `${(number_ / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }

  if (number_ >= 1000) {
    return `${(number_ / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return number_;
}

export function formatCmsItem(text: string): string {
  return text.replaceAll(/{(.*?)}/g, (m, translation) => {
    return i18n.global.t(translation);
  });
}

export function numeral(
  value: number,
  type: string | undefined = undefined,
): string {
  const portal = store.getters['enums/portal'] as Portal;
  const locale = portal?.default_language || 'en-US';
  let formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  });
  if (type === 'currency') {
    formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: portal?.default_currency || 'USD',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  }

  if (type === 'percentage') {
    formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  return formatter.format(value || 0);
}

export function generateHash(s: string) {
  return MD5(s).toString();
}

/**
 * Utility function to generate url
 * @param {string} endpoint - The endpoint to be appended to the base URL
 * @returns {string} - The complete API URL
 * @example
 * // returns "http://api.example.com/languages" if VITE_APP_API_BASE_URL is "http://api.example.com"
 * getApiUrl("/languages")
 */
export function getApiUrl(endpoint: string): string {
  return `${import.meta.env.VITE_APP_API_BASE_URL}${endpoint}`;
}

export function isLandscape() {
  return window.matchMedia(
    'only screen and (max-device-width: 1223px) and (orientation: landscape)',
  ).matches;
}

// source: https://github.com/Chalarangelo/30-seconds-of-code
export const generateUUID = (): string =>
  // eslint-disable-next-line unicorn/prefer-string-replace-all, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-plus-operands
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16),
  );

/**
 * Recursively convert object|array|string to camel case.
 * @param object
 */
export const toCamelCase = <T>(object: T): CamelCasedPropertiesDeep<T> => {
  if (_.isArray(object)) {
    return object.map((item) => toCamelCase(item));
  } else if (_.isObject(object)) {
    return _.transform(object, (result, value, key) => {
      result[_.camelCase(<string>key)] = toCamelCase(value);
    });
  }
  return object;
};

export const createAxiosCasingTransform = (
  options?: Partial<AxiosInstance | AxiosRequestConfig>,
  instance?: AxiosInstance,
): AxiosRequestConfig => {
  const axiosInstance = instance ?? axios;
  const baseOptions = Object.assign({}, axiosInstance.defaults);
  const transformOptions: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_APP_API_BASE_URL,
    transformResponse: [
      (data) =>
        data
          ? toCamelCase<string | object>(
              typeof data === 'string' ? JSON.parse(data) : <object>data,
            )
          : data,
    ],
  };
  const axiosOptions = defu(baseOptions, transformOptions, options);
  debug('axios options: %o', axiosOptions);
  return axiosOptions as AxiosRequestConfig;
};

export function getColorContrast(
  bgColor: string,
  darkColor = '#000000',
  lightColor = '#ffffff',
) {
  const color = bgColor.charAt(0) === '#' ? bgColor.slice(1, 7) : bgColor;
  const r = Number.parseInt(color.slice(0, 2), 16); // hexToR
  const g = Number.parseInt(color.slice(2, 4), 16); // hexToG
  const b = Number.parseInt(color.slice(4, 6), 16); // hexToB
  const uicolors = [r / 255, g / 255, b / 255];
  const c = uicolors.map((col) => {
    if (col <= 0.039_28) {
      return col / 12.92;
    }
    return Math.pow((col + 0.055) / 1.055, 2.4);
  });
  const L = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return L > 0.179 ? darkColor : lightColor;
}

export function extractIconNameFromPath(path: string): string {
  // Example path: /src/assets/disaster_icons/wind.svg
  // Use the lastIndexOf method to find the last '/' character and slice everything after that
  const lastIndex = path.lastIndexOf('/');
  const filenameWithExtension =
    lastIndex === -1 ? path : path.slice(lastIndex + 1);

  // Use the lastIndexOf method again to remove the file extension
  const lastDotIndex = filenameWithExtension.lastIndexOf('.');
  const iconName =
    lastDotIndex === -1
      ? filenameWithExtension
      : filenameWithExtension.slice(0, lastDotIndex);

  return iconName;
}

export function getAniClosingDate(ani: Ani) {
  return moment(ani.end_at).subtract(
    ((moment(ani.end_at).day() + 1) % 7) + 1,
    'days',
  );
}

export function formatHotlineClosingDate(date: Moment | Date | string) {
  const formattedDate = moment(date).format('dddd, MMMM D, YYYY');
  const relativeDate = moment(date).fromNow();
  return `${formattedDate} (${relativeDate})`;
}

export function formatWorksiteAddress(worksite: Worksite) {
  if (!worksite) {
    return '';
  }
  const { address, city, state, postal_code: postalCode } = worksite;
  const parts = [address, city, state, postalCode].filter(Boolean);
  return parts.join(', ');
}

export function formatWorksiteAddressHtml(worksite: Worksite) {
  if (!worksite) {
    return '';
  }
  const {
    address = '',
    city = '',
    state,
    postal_code: postalCode,
    county,
  } = worksite;
  const addressParts = [
    address,
    `${city}${state ? `, ${state}` : ''}${county ? `, ${county}` : ''}`,
    postalCode,
  ];
  return addressParts.filter(Boolean).join(' <br> ');
}

/**
 * Generate Google Maps link from address
 * and optional latitude & longitude
 *
 * @see https://stackoverflow.com/questions/2660201/what-parameters-should-i-use-in-a-google-maps-url-to-go-to-a-lat-lon
 * @see https://stackoverflow.com/a/33759316
 * @see https://dddavemaps.blogspot.com/2015/07/google-maps-url-tricks.html
 *
 * @param address
 * @param latitude
 * @param longitude
 */
export function generateGoogleMapsLink(
  address: string,
  latitude?: number,
  longitude?: number,
) {
  const baseUrl = 'https://maps.google.com/maps/place/';
  const encodedAddress = encodeURIComponent(address);
  return latitude && longitude
    ? `${baseUrl}${encodedAddress}/@${latitude},${longitude},15z`
    : `${baseUrl}${encodedAddress}`;
}
