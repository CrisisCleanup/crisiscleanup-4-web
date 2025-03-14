/**
 * Various Constants
 */
import { snakeCase } from 'lodash';
import type { SnakeCasedProperties } from 'type-fest';

// ICONS
import attentionRed from './assets/icons/attention-red.svg';
import about from './assets/icons/about-us.svg';
import arrowLeft from './assets/icons/arrow-left.svg';
import trash from './assets/icons/delete.svg';
import arrowRight from './assets/icons/arrow-right.svg';
import attention from './assets/icons/attention.svg';
import dashboard from './assets/icons/dashboard.svg';
import home from './assets/icons/home.svg';
import cases from './assets/icons/cases.svg';
import currentDisasters from './assets/icons/current-disaster.svg';
import contact from './assets/icons/contact-us.svg';
import completed from './assets/icons/completed.svg';
import training from './assets/icons/training.svg';
import notepad from './assets/icons/notepad.svg';
import terms from './assets/icons/terms.svg';
import privacy from './assets/icons/privacy-policy.svg';
import reports from './assets/icons/reports.svg';
import calendar from './assets/icons/calendar.svg';
import calendarList from './assets/icons/calendar-list.svg';
import calendarMap from './assets/icons/calendar-map.svg';
import call from './assets/icons/call.svg';
import chat from './assets/icons/chat.svg';
import drag from './assets/icons/drag.svg';
import settings from './assets/icons/settings.svg';
import print from './assets/icons/print-big.svg';
import pin from './assets/icons/pin.svg';
import phone from './assets/icons/phone.svg';
import phoneClassic from './assets/icons/phone-classic.svg';
import phoneUser from './assets/icons/phone-user.svg';
import phoneHangup from './assets/icons/phone-hangup.svg';
import phoneHistory from './assets/icons/phone-history.svg';
import phoneStats from './assets/icons/phone-stats.svg';
import phonePlus from './assets/icons/phone-plus.svg';
import earthGlobe from './assets/icons/earth-globe.svg';
import phoneContactAdd from './assets/icons/phone-contact-add.svg';
import phoneExit from './assets/icons/phone-exit.svg';
import share from './assets/icons/share-big.svg';
import download from './assets/icons/download.svg';
import active from './assets/icons/active.svg';
import edit from './assets/icons/edit.svg';
import flag from './assets/icons/flag.svg';
import filters from './assets/icons/filters.svg';
import flagFilled from './assets/icons/flag-filled.svg';
import search from './assets/icons/search.svg';
import table from './assets/icons/table.svg';
import map from './assets/icons/notactive.svg';
import layers from './assets/icons/layers.svg';
import info from './assets/icons/inform.svg';
import information from './assets/icons/information.svg';
import leaderboard from './assets/icons/leaderboard.svg';
import organization from './assets/icons/my-organization.svg';
import admin from './assets/icons/admin.svg';
import history from './assets/icons/history.svg';
import cancel from './assets/icons/big.svg';
import help from './assets/icons/help.svg';
import up from './assets/icons/up.svg';
import down from './assets/icons/down.svg';
import updown from './assets/icons/updown.svg';
import goCase from './assets/icons/replace-case.svg';
import mapBuffer from './assets/icons/map-buffer.svg';
import mapCircle from './assets/icons/map-circle.svg';
import mapPoly from './assets/icons/map-poly.svg';
import mapRect from './assets/icons/map-rect.svg';
import mapSweep from './assets/icons/map-sweep.svg';
import mapUndo from './assets/icons/map-undo.svg';
import mapRedo from './assets/icons/map-redo.svg';
import otherorg from './assets/icons/other-org.svg';
import dialer from './assets/icons/dialer.svg';
import hangup from './assets/icons/hangup.svg';
import blog from './assets/icons/blog.svg';
import time from './assets/icons/time.svg';
import logout from './assets/icons/logout.svg';
import plane from './assets/icons/plane.svg';
import news from './assets/icons/news.svg';
import stickyNoteSolid from './assets/icons/sticky-note-solid.svg';
import downloadAppStoreBadge from './assets/icons/download-appstore-badge.svg';
import downloadPlayStoreBadge from './assets/icons/download-playstore-badge.svg';
import appleAppStore from './assets/icons/appleAppStore.svg';
import googlePlayStore from './assets/icons/googlePlayStore.svg';
import zoom from './assets/icons/zoom.svg';
import iosRound from './assets/icons/ios-round.svg';
import androidRound from './assets/icons/android-round.svg';
import bugReport from './assets/icons/bug-report.svg';
import manualDialer from './assets/icons/manual-dialer.svg';
import stats from './assets/icons/stats.svg';
import qrcode from './assets/icons/qrcode.svg';
import phoneVolunteerDashboard from './assets/icons/phone-volunteer-dashboard.svg';
import governmentDashboard from './assets/icons/government-dashboard.svg';
import fieldVolunteerDashboard from './assets/icons/field-volunteer-dashboard.svg';
import commandCenterDashboard from './assets/icons/command-center-dashboard.svg';
import defaultDashboard from './assets/icons/default-dashboard.svg';
import ellipsis from './assets/icons/ellipsis-solid.svg';
import stethoscope from './assets/icons/stethoscope.svg';

// DISASTER ICONS
import contaminatedWater from './assets/disaster_icons/contaminated-water.svg';
import earthquake from './assets/disaster_icons/earthquake.svg';
import fire from './assets/disaster_icons/fire.svg';
import flood from './assets/disaster_icons/flood.svg';
import floodTornadoWind from './assets/disaster_icons/flood-tornado_wind.svg';
import floodTropicalStorm from './assets/disaster_icons/flood-tstorm.svg';
import hail from './assets/disaster_icons/hail.svg';
import hurricane from './assets/disaster_icons/hurricane.svg';
import iceStorm from './assets/disaster_icons/ice-storm.svg';
import mudslide from './assets/disaster_icons/mudslide.svg';
import other from './assets/disaster_icons/other.svg';
import rebuild from './assets/disaster_icons/rebuild.svg';
import snow from './assets/disaster_icons/snow.svg';
import tornado from './assets/disaster_icons/tornado.svg';
import tornadoFlood from './assets/disaster_icons/tornado-flood.svg';
import tornadoWindFlood from './assets/disaster_icons/tornado-wind-flood.svg';
import tropicalStorm from './assets/disaster_icons/tropical-storm.svg';
import virus from './assets/disaster_icons/virus.svg';
import volcano from './assets/disaster_icons/volcano.svg';
import wind from './assets/disaster_icons/wind.svg';
import dracula from './assets/disaster_icons/dracula.svg';
import ufo from './assets/disaster_icons/ufo.svg';
import velociraptor from './assets/disaster_icons/velociraptor.svg';
import bigfoot from './assets/disaster_icons/bigfoot.svg';
import zombies from './assets/disaster_icons/zombies.svg';
import alien from './assets/disaster_icons/alien.svg';
import asteriod from './assets/disaster_icons/asteriod.svg';
import dentist from './assets/disaster_icons/dentist.svg';
import gnome from './assets/disaster_icons/gnome.svg';
import godzilla from './assets/disaster_icons/godzilla.svg';
import killerclown from './assets/disaster_icons/killerclown.svg';
import kingkong from './assets/disaster_icons/kingkong.svg';
import lightning from './assets/disaster_icons/lightning.svg';
import piranha from './assets/disaster_icons/piranha.svg';
import sharknado from './assets/disaster_icons/sharknado.svg';
import trex from './assets/disaster_icons/trex.svg';
import baby from './assets/disaster_icons/baby.svg';
import blackhole from './assets/disaster_icons/blackhole.svg';
import darth from './assets/disaster_icons/darth.svg';
import doll from './assets/disaster_icons/doll.svg';
import hazmat from './assets/disaster_icons/hazmat.svg';
import rat from './assets/disaster_icons/rat.svg';
import robot from './assets/disaster_icons/robot.svg';
import snake from './assets/disaster_icons/snake.svg';
import spider from './assets/disaster_icons/spider.svg';

export const VERSION_3_LAUNCH_DATE = '2020-03-25';
export const EASTER_EGG_DISASTER_ICONS: Record<string, any> = {
  bigfoot,
  dracula,
  ufo,
  velociraptor,
  zombies,
  alien,
  asteriod,
  dentist,
  gnome,
  godzilla,
  killerclown,
  kingkong,
  lightning,
  piranha,
  sharknado,
  trex,
  baby,
  blackhole,
  darth,
  doll,
  hazmat,
  rat,
  robot,
  snake,
  spider,
};
export const DISASTER_ICONS: Record<string, any> = {
  'contaminated-water': contaminatedWater,
  earthquake,
  fire,
  flood,
  'flood-tornado_wind': floodTornadoWind,
  'flood-tstorm': floodTropicalStorm,
  hail,
  hurricane,
  'ice-storm': iceStorm,
  mudslide,
  other,
  rebuild,
  snow,
  tornado,
  'tornado-flood': tornadoFlood,
  'tornado-wind-flood': tornadoWindFlood,
  'tropical-storm': tropicalStorm,
  virus,
  volcano,
  wind,
};

export const TEXT_VARIANTS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'body',
  'bodysm',
  'bodyxsm',
] as const;
export const ICON_MAP = {
  ellipsis,
  'attention-red': attentionRed,
  about,
  'arrow-left': arrowLeft,
  'arrow-right': arrowRight,
  attention,
  dashboard,
  home,
  cases,
  'current-disasters': currentDisasters,
  contact,
  completed,
  training,
  notepad,
  terms,
  privacy,
  reports,
  calendar,
  'calendar-list': calendarList,
  'calendar-map': calendarMap,
  call,
  chat,
  drag,
  settings,
  print,
  pin,
  phone,
  blog,
  'phone-classic': phoneClassic,
  'phone-user': phoneUser,
  'phone-hangup': phoneHangup,
  'phone-history': phoneHistory,
  'phone-stats': phoneStats,
  'phone-plus': phonePlus,
  'earth-globe': earthGlobe,
  'phone-contact-add': phoneContactAdd,
  'phone-exit': phoneExit,
  share,
  download,
  active,
  edit,
  flag,
  filters,
  'flag-filled': flagFilled,
  stethoscope,
  search,
  table,
  map,
  layers,
  info,
  information,
  leaderboard,
  trash,
  organization,
  admin,
  history,
  cancel,
  help,
  up,
  down,
  updown,
  'go-case': goCase,
  'map-buffer': mapBuffer,
  'map-circle': mapCircle,
  'map-poly': mapPoly,
  'map-rect': mapRect,
  'map-sweep': mapSweep,
  'map-undo': mapUndo,
  'map-redo': mapRedo,
  otherorg,
  dialer,
  hangup,
  time,
  logout,
  plane,
  news,
  'download-playstore-badge': downloadPlayStoreBadge,
  'download-appstore-badge': downloadAppStoreBadge,
  'google-play-store': googlePlayStore,
  'apple-app-store': appleAppStore,
  'sticky-note-solid': stickyNoteSolid,
  zoom: zoom,
  'ios-round': iosRound,
  'android-round': androidRound,
  'bug-report': bugReport,
  'manual-dialer': manualDialer,
  stats: stats,
  qrcode: qrcode,
  'phone-volunteer-dashboard': phoneVolunteerDashboard,
  'government-dashboard': governmentDashboard,
  'field-volunteer-dashboard': fieldVolunteerDashboard,
  'command-center-dashboard': commandCenterDashboard,
  'default-dashboard': defaultDashboard,
};

export const ICONS = Object.fromEntries(
  Object.entries(ICON_MAP).map(([key]) => [snakeCase(key), key]),
) as SnakeCasedProperties<typeof ICON_MAP>;
export const ICON_SIZES = [
  'xxs',
  'xs',
  'tiny',
  'sm',
  'small',
  'md',
  'medium',
  'base',
  'lg',
  'large',
  'xl',
] as const;
export const BUTTON_STYLES = [
  'primary',
  'danger',
  'warning',
  'link',
  'bare',
] as const;
export const BUTTON_SIZES = {
  SM: 'small',
  MD: 'medium',
  LG: 'large',
} as const;
export const BUTTON_VARIANTS = {
  SOLID: 'solid',
  OUTLINE: 'outline',
  OUTLINE_DARK: 'outline-dark',
  TEXT: 'text',
  TEXT_DARK: 'text-dark',
} as const;

export const SVG_STROKE_WIDTH = 0.5;
export const INTERACTIVE_ZOOM_LEVEL = 12;
