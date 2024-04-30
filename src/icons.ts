// Disaster Icons
import contaminatedWater from '~icons/ccu-disaster-icons/contaminated-water';
import earthquake from '~icons/ccu-disaster-icons/earthquake';
import fire from '~icons/ccu-disaster-icons/fire';
import flood from '~icons/ccu-disaster-icons/flood';
import floodTornadoWind from '~icons/ccu-disaster-icons/flood-tornado_wind';
import floodTropicalStorm from '~icons/ccu-disaster-icons/flood-tstorm';
import hail from '~icons/ccu-disaster-icons/hail';
import hurricane from '~icons/ccu-disaster-icons/hurricane';
import iceStorm from '~icons/ccu-disaster-icons/ice-storm';
import mudslide from '~icons/ccu-disaster-icons/mudslide';
import other from '~icons/ccu-disaster-icons/other';
import rebuild from '~icons/ccu-disaster-icons/rebuild';
import snow from '~icons/ccu-disaster-icons/snow';
import tornado from '~icons/ccu-disaster-icons/tornado';
import tornadoFlood from '~icons/ccu-disaster-icons/tornado-flood';
import tornadoWindFlood from '~icons/ccu-disaster-icons/tornado-wind-flood';
import tropicalStorm from '~icons/ccu-disaster-icons/tropical-storm';
import virus from '~icons/ccu-disaster-icons/virus';
import volcano from '~icons/ccu-disaster-icons/volcano';
import wind from '~icons/ccu-disaster-icons/wind';

// Easter Egg Disaster Icons
import dracula from '~icons/ccu-disaster-icons/dracula';
import ufo from '~icons/ccu-disaster-icons/ufo';
import velociraptor from '~icons/ccu-disaster-icons/velociraptor';
import bigfoot from '~icons/ccu-disaster-icons/bigfoot';
import zombies from '~icons/ccu-disaster-icons/zombies';
import alien from '~icons/ccu-disaster-icons/alien';
import asteriod from '~icons/ccu-disaster-icons/asteriod';
import dentist from '~icons/ccu-disaster-icons/dentist';
import gnome from '~icons/ccu-disaster-icons/gnome';
import godzilla from '~icons/ccu-disaster-icons/godzilla';
import killerclown from '~icons/ccu-disaster-icons/killerclown';
import kingkong from '~icons/ccu-disaster-icons/kingkong';
import lightning from '~icons/ccu-disaster-icons/lightning';
import piranha from '~icons/ccu-disaster-icons/piranha';
import sharknado from '~icons/ccu-disaster-icons/sharknado';
import trex from '~icons/ccu-disaster-icons/trex';
import baby from '~icons/ccu-disaster-icons/baby';
import blackhole from '~icons/ccu-disaster-icons/blackhole';
import darth from '~icons/ccu-disaster-icons/darth';
import doll from '~icons/ccu-disaster-icons/doll';
import hazmat from '~icons/ccu-disaster-icons/hazmat';
import rat from '~icons/ccu-disaster-icons/rat';
import robot from '~icons/ccu-disaster-icons/robot';
import snake from '~icons/ccu-disaster-icons/snake';
import spider from '~icons/ccu-disaster-icons/spider';

export const DISASTER_ICONS = {
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
export type DisasterIcons = keyof typeof DISASTER_ICONS;

export const EASTER_EGG_DISASTER_ICONS = {
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
export type EasterEggDisasterIcons = keyof typeof EASTER_EGG_DISASTER_ICONS;

export const CCU_ICONS = {
  ...DISASTER_ICONS,
  ...EASTER_EGG_DISASTER_ICONS,
};
export type CcuIcons = keyof typeof CCU_ICONS;
