<template>
  <div
    class="flex flex-col items-center justify-center"
    data-testid="testSpinnerDiv"
  >
    <font-awesome-icon :size="size" icon="spinner" spin />
    <div v-if="showQuote" class="my-3">{{ $t(randomQuote) }}</div>
    <div
      v-if="allowReset && showReset"
      class="my-3 flex flex-col items-center justify-center"
    >
      <div>
        {{ $t('spinner.stuck_refresh') }}
      </div>
      <base-button
        data-testid="testSpinnerResetButton"
        variant="outline"
        :action="resetStates"
        class="p-1"
        :alt="$t('actions.reset_user_states')"
      >
        {{ $t('actions.reset_user_states') }}
      </base-button>
    </div>
  </div>
</template>

<script lang="ts">
import { sample } from 'lodash';
import { useCurrentUser } from '@/hooks';

const RANDOM_QUOTES = [
  'spinner.loading_perpetual_motion',
  'spinner.loading_break_from_reality',
  'spinner.loading_quantum_physics',
  'spinner.loading_time_illusion',
  'spinner.loading_universe_spinning',
  'spinner.loading_patience_virtue',
  'spinner.loading_olympic_games',
  'spinner.loading_sit_back_relax',
  'spinner.loading_circles_captivating',
  'spinner.loading_warning_circus',
  'spinner.loading_spinner_mission',
  'spinner.loading_getting_sleepy',
  'spinner.loading_grasshopper_zen_mode',
  'spinner.loading_think_i_can',
  'spinner.loading_spinner_nobody_sees',
  'spinner.loading_twist_twirl_almost_there',
  'spinner.loading_watch_learn_dance',
  'spinner.loading_magic_in_progress',
  'spinner.loading_ufo',
  'spinner.loading_spin_me_right_round',
  'spinner.loading_politician',
  'spinner.loading_tick_tock',
  'spinner.loading_patience_padawan',
  'spinner.loading_revving_engines',
  'spinner.loading_stay_calm_spin_on',
  'spinner.loading_sprinkle_magic',
  'spinner.loading_pirouettes',
  'spinner.loading_dj_remix',
  'spinner.loading_invisible_hamster',
  'spinner.loading_pixelated_snail',
  'spinner.loading_invisible_ninjas',
  'spinner.loading_magic_clown',
  'spinner.loading_caffeinated_squirrel',
  'spinner.loading_mad_scientist',
  'spinner.loading_trained_penguins',
  'spinner.loading_intergalactic_turtle',
  'spinner.loading_tap_dancing_kangaroo',
  'spinner.loading_cheetah_intern',
  'spinner.loading_synchronized_swimmers',
  'spinner.loading_superhero_squirrel',
  'spinner.loading_ants_circle',
  'spinner.loading_tornado_octopus',
  'spinner.loading_wizard_spells',
  'spinner.loading_conjuring_magician',
  'spinner.loading_turbo_turtle',
  'spinner.loading_dj_sloth',
  'spinner.loading_synchronized_skydivers',
  'spinner.loading_spin_style',
  'spinner.loading_hamster_moon_walk',
  'spinner.loading_coding_sensei',
  'spinner.loading_friendly_ghost',
  'spinner.loading_website_yawn',
  'spinner.loading_spinner_miles',
  'spinner.loading_cyborg_hedgehog',
  'spinner.loading_data_bunnies',
  'spinner.loading_snacks_menu',
  'spinner.loading_roses_are_red',
  'spinner.loading_patience_halo',
  'spinner.loading_sloth_marathon',
  'spinner.loading_streaming_aging',
  'spinner.loading_time_machine',
  'spinner.loading_spinner_mocking',
  'spinner.loading_sloth_conservation',
  'spinner.loading_mona_lisa',
  'spinner.loading_mindfulness_meditation',
  'spinner.loading_world_record',
  'spinner.loading_enter_matrix',
  'spinner.loading_steam_engines',
  'spinner.loading_never_ending_load',
  'spinner.loading_waiting_rooms',
  'spinner.loading_slo_mo',
  'spinner.loading_time_is_money',
  'spinner.loading_delorean_gigawatt',
  'spinner.loading_disco_ball',
  'spinner.loading_toilet_flush',
  'spinner.loading_sonic_boom',
  'spinner.loading_fairy_breadcrumbs',
  'spinner.loading_11_kids',
  'spinner.loading_pixel_dragons',
  'spinner.website_doctor_bugs',
  'spinner.website_break_up_internet',
  'spinner.website_ladder_search_results',
  'spinner.keyboard_trouble_copying',
  'spinner.website_cold_pages_freezing',
  'spinner.website_diet_cookies',
  'spinner.website_party_network',
  'spinner.website_meditating_inner_webpage',
  'spinner.loading_invisible_artist_painting',
  'spinner.loading_boldly_go',
  'spinner.loading_clown_unicycle',
  'spinner.loading_row_boat_stream',
  'spinner.loading_sly_spinner_poem',
  'spinner.loading_zzzzzzz',
  'spinner.loading_spinner_twirl_poem',
  'spinner.loading_pixel_rodeo',
  'spinner.loading_practicing_lasso',
  'spinner.loading_where_stop_nobody_knows',
  'spinner.loading_synchronized_dolphins',
  'spinner.loading_circle_of_circles',
  'spinner.loading_wheels_on_the_bus',
  'spinner.loading_circle_of_life',
  'spinner.loading_circles_all_the_way_down',
  'spinner.loading_circleception',
  'spinner.loading_where_is_spinner_going',
  'spinner.loading_pixel_lemmings',
  'spinner.loading_surprised_how_many_phrases',
  'spinner.loading_wish_go_somewhere',
  'spinner.loading_mastered_moonwalk',
  'spinner.loading_why_cross_road',
  'spinner.loading_this_is_not_a_spinner',
  'spinner.loading_louvre_when_done',
  'spinner.loading_worse_than_sisyphus',
  'spinner.loading_conveyor_of_happiness',
  'spinner.loading_double_click_icon_surprise',
  'spinner.loading_rollin_swollen_rawhide',
  'spinner.loading_wheel_on_the_screen_turning',
  'spinner.loading_for_everything_season',
  'spinner.loading_twinkle_twinkle',
  'spinner.loading_itsy_bitsy_pixel_spider',
  'spinner.loading_hokey_pokey_turn',
  'spinner.loading_summoning_superpowers',
  'spinner.loading_like_no_tomorrow',
  'spinner.loading_patience_virtue_virtuoso',
  'spinner.loading_how_many_popcorn_count',
  'spinner.loading_not_lost_scenic route',
  'spinner.loading_ninja_conquering_loading',
  'spinner.loading_digital_world_go_round',
  'spinner.loading_secrets_of_universe',
  'spinner.loading_enjoy_the_suspense',
  'spinner.loading_drive_parkways_park_driveways',
  'spinner.loading_stretching_loading_muscles',
  'spinner.loading_snail_break_sound_barrier',
  'spinner.loading_enjoy_the_show_main_attraction',
  'spinner.loading_digital_barista_mixing',
  'spinner.loading_might_start_breakdancing',
  'spinner.loading_bits_bytes_conga_line',
  'spinner.loading_loading_adventure_this_page',
  'spinner.loading_are_we_there_yet',
  'spinner.loading_virtual_chef_mayo_white_bread',
  'spinner.loading_hamster_caffeine',
  'spinner.loading_loading_bars_overrated',
  'spinner.loading_dance_nobodys_watching',
  'spinner.loading_imagine_no_loading_beautiful',
  'spinner.loading_as_amazing_as_you',
  'spinner.loading_spinning_groove_join_dance',
  'spinner.loading_spinning_prowess',
  'spinner.loading_great_things_wait_for_me',
  'spinner.loading_americas_got_spin',
  'spinner.loading_art_spinning_picasso',
  'spinner.loading_pixelated_stardust_screen',
  'spinner.loading_realm_of_loading',
  'spinner.loading_meaning_of_life_101010',
  'spinner.loading_meaning_of_life_42_137',
  'spinner.loading_spinner_backflip',
  'spinner.loading_rome_built_loading_screen',
  'spinner.loading_bird_plane_super_spinner',
  'spinner.loading_not_moon_pixel_space_station',
  'spinner.loading_digital_turntable_party',
  'spinner.loading_won_fastest_spinner_competition',
  'spinner.loading_hold_applause',
  'spinner.loading_shooting_star_grant_wishes',
  'spinner.loading_wheel_of_fortune',
  'spinner.loading_spinning_into_your_heart',
  'spinner.loading_cheetah_on_roller_skates',
  'spinner.loading_virtual_popcorn',
  'spinner.loading_take_me_with_you',
  'spinner.loading_harbinger_good_things',
  'spinner.loading_entertain_digital_dance',
  'spinner.loading_dont_blink_grand_reveal',
  'spinner.loading_loading_tour_guide',
  'spinner.loading_guess_whats_loading',
  'spinner.loading_voted_most_entertaining',
  'spinner.loading_magic_spinner_suspense',
  'spinner.loading_double_your_pay',
  'spinner.loading_doing_great_15_minutes_sleep',
  'spinner.loading_calm_before_after_storm',
  'spinner.loading_personal_digital_rollercoaster',
  'spinner.loading_breath_drink_nap_high_five',
  'spinner.loading_cant_wait_to_see',
  'spinner.loading_pleasure_meeting_you',
  'spinner.loading_grow_up_be_like_you',
  'spinner.loading_sunshine_after_storm',
  'spinner.loading_spinner_and_disaster_will_pass',
  'spinner.3_2_1_spin',
  'spinner.website_eyeball_crib',
  'spinner.website_broke_up_server',
  'spinner.website_broke_up_font',
  'spinner.website_vacation_refresh',
  'spinner.spinner_strong_wait_lifting',
  'spinner.spinner_favorite_music_spinstrumental',
  'spinner.faster_internet_motivational_quotes',
  'spinner.cloud_digital_pillow_fort',
  'spinner.use_cookies_hungry',
  'spinner.404_hide_and_seek',
  'spinner.like_button_army_hamsters',
  'spinner.captcha_robot_human',
  'spinner.email_fairy',
  'spinner.back_button_personal_time_machine',
  'spinner.wifi_like_cat',
  'spinner.witty_comment_internet_comedian',
  'spinner.deep_breath_nap',
  'spinner.doing_great_thank_you',
  'spinner.one_more_spin_amazing_appear',
  'spinner.moment_of_anticipation',
  'spinner.here_keep_you_company',
  'spinner.light_bulb_one_take_forever',
  'spinner.load_dishes_and_web_pages',
  'spinner.twirling_snowman_smile',
  'spinner.centipede_on_rollerskates',
  'spinner.look_great_covered_in_mud',
  'spinner.we_know_hours_volunteer',
  'spinner.digital_disco_ball',
  'spinner.tiny_ferris_wheel',
  'spinner.galactic_navigator',
  'spinner.virtual_tornado',
  'spinner.lemmings_infinite_labyrinth',
  'spinner.cyber_lighthouse',
  'spinner.digital_fortune_teller',
  'spinner.magic_spinning_portal',
  'spinner.webpage_catcher',
  'spinner.clown_unicycle_flat_tire',
  'spinner.share_a_smile',
  'spinner.code_weaver_tapestry',
  'spinner.digital_caterpillar_butterfly',
  'spinner.perpetual_motion_frictionless_top',
  'spinner.windmill_of_wonder',
  'spinner.kaleidoscope_beta_version',
  'spinner.quantum_spinner',
  'spinner.cosmic_whirlpool',
  'spinner.binary_beacon',
  'spinner.pixel_pianist',
  'spinner.pixel_potters_wheel',
  'spinner.invisble_ballerina_tu_tu',
  'spinner.gymnast_training_backflips',
  'spinner.pixel_conjurer_magic',
  'spinner.quantum_entangler',
  'spinner.pixel_dancer',
  'spinner.invisible_juggler',
  'spinner.roses_spinner_sleeps_more_than_you',
  'spinner.roses_spinners_in_motion',
  'spinner.roses_creating_webpage',
  'spinner.roses_brings_smiles',
  'spinner.more_than_minute_refresh',
  'spinner.no_soup_for_you',
  'spinner.exceeded_limit_helping',
  'spinner.dial_000_rotary_phone',
  'spinner.three_turns_lock',
  'spinner.addicted_spinning_turning_life_around',
  'spinner.friend_spin_faster_circular_argument',
  'spinner.support_group_spinning',
  'spinner.magic_revolving_door',
  'spinner.spinner_gps_turn_right',
  'spinner.pixel_record_player',
  'spinner.slow_internet_circus_gig',
  'spinner.modern_rotary_phone',
  'spinner.remember_good_old_days_rotary_phones',
  'spinner.spinner_is_rotary_phone_of_internet',
  'spinner.dedication_shines_bright',
  'spinner.real_superhero_boring_sweaty',
  'spinner.kindness_hard_work_beacon',
  'spinner.disasters_resilience_compassion',
  'spinner.you_make_exhaustion_look_good',
  'spinner.unsung_hero_for_survivors',
  'spinner.cleaning_debris_lifting_hearts',
  'spinner.people_generally_good',
  'spinner.mess_ray_of_light',
  'spinner.cleaning_disaster_restoring_hope',
  'spinner.sawdust_man_glitter',
  'spinner.superheros_wear_gloves_tired_smile',
  'spinner.inspiring_committment',
  'spinner.imagine_beach_beach_ball',
  'spinner.staff_server_dial_up',
  'spinner.ccu_not_in_aarons_basement',
  'spinner.powered_by_neurotic_idiots',
  'spinner.faster_than_paper',
  'spinner.eat_your_heart_out_google',
  'spinner.well_that_was_easy_not_say',
  'spinner.wish_smaller_chainsaw_not_say',
  'spinner.slept_well_not_say',
  'spinner.catch_the_game_not_say',
  'spinner.spare_time_not_say',
  'spinner.team_half_size_not_say',
  'spinner.packaged_snacks_dinner_not_say',
  'spinner.sleep_overrated_not_say',
  'spinner.ninety_nine_buckets_of_mud',
  'spinner.disaster_great_date_night',
  'spinner.overwhelming_inconvenience_disaster',
  'spinner.do_you_come_here_often',
  'spinner.pleasure_meeting_never_see_again',
  'spinner.faster_than_fax',
  'spinner.faster_than_snail_mail',
  'spinner.faster_than_fema',
  'spinner.faster_than_tree_service',
  'spinner.more_fun_than_dentist',
  'spinner.zombie_apocalypse_warning',
  'spinner.disasters_growth_industry',
  'spinner.powered_by_hamster_wheel',
  'spinner.powered_by_hyperactive_squirrels',
  'spinner.faster_than_sloth_sedatives',
  'spinner.wish_more_paperwork_not_say',
  'spinner.cot_better_than_bed_not_say',
  'spinner.more_zoom_meetings_not_say',
  'spinner.romantic_dinners_flashlight',
  'spinner.faster_than_herd_of_turtles',
  'spinner.better_than_watching_paint_dry',
  'spinner.more_nights_cot_than_bed',
  'spinner.tsa_food_truck',
  'spinner.alphabet_soup',
  'spinner.accidentally_blow_up_website',
  'spinner.spinner_of_death',
  'spinner.total_eclipse_of_the_heart',
  'spinner.load_so_fast_cant_read',
  'spinner.pi',
  'spinner.marvelous_magnetic_marbles',
  'spinner.normal_person_abnormal_situation',
  'spinner.we_got_this_together',
  'spinner.volunteers_favorite_people',
  'spinner.minutes_and_minutes_sleep',
  'spinner.netflix_binge',
  'spinner.better_than_you_feel',
  'spinner.top_prize_muddiest_shirt',
  'spinner.perspiration_inspiration',
  'spinner.stand_upright_half_sentence',
  'spinner.three_brain_cells',
  'spinner.happy_know_it_shower',
  'spinner.happy_know_it_nap',
  'spinner.restoring_hope_doing_it_right',
  'spinner.spinner_seasick',
  'spinner.deja_vu',
  'spinner.knick_knack_paddy_whack',
  'spinner.hotdog_sandwich',
  'spinner.androids_are_better',
  'spinner.time_travel_future_tourists',
  'spinner.phone_buzz_275_times_today',
  'spinner.thank_you_dashing_too',
  'spinner.look_all_those_chickens',
  'spinner.brought_to_you_series_tubes',
  'spinner.ccu_waging_war_on_paper',
  'spinner.fifth_c_competition',
  'spinner.download_app_cool',
  'spinner.with_pickles',
  'spinner.not_spinner_steam_roller',
  'spinner.be_sure_drink_ovaltine',
  'spinner.hey_sawing_here',
  'spinner.waiting_keep_company',
  'spinner.nobody_likes_know_it_all',
  'spinner.scientists_biblical_prophets_growth_industry',
  'spinner.climate_change_janitorial_staff',
  'spinner.muckers_gonna_muck',
  'spinner.ants_go_marching_one_by_one',
  'spinner.one_potato_two_potatoes',
  'spinner.one_two_buckle_my_shoe',
  'spinner.yes_we_have_no_bananas',
  'spinner.service_like_peeing_your_pants',
  'spinner.two_types_of_fun',
  'spinner.aaron_titus_h2prep_author',
  'spinner.calm_clarity',
  'spinner.chaotic_clutter',
  'spinner.clear_chaos',
  'spinner.hazardous_heaps',
  'spinner.hurricane_havoc',
  'spinner.coastal_communities',
  'spinner.disaster_debris',
  'spinner.cat_chase_tail',
  'spinner.server_tea_party',
  'spinner.bouncing_balloons',
  'spinner.fidget_spinner',
  'spinner.one_bite_doughnut',
  'spinner.cookie_teensy_bite',
  'spinner.hamster_dryer_socks',
  'spinner.use_time_on_novel',
  'spinner.dedicate_page_to_you',
  'spinner.see_mold',
];

export default defineComponent({
  name: 'Spinner',
  props: {
    size: {
      type: String,
      default: 'xl',
    },
    showQuote: {
      type: Boolean,
    },
    allowReset: {
      type: Boolean,
    },
  },
  setup() {
    const { updateCurrentUser } = useCurrentUser();
    const showReset = ref(false);

    setTimeout(() => {
      showReset.value = true;
    }, 30_000);
    async function resetStates() {
      await updateCurrentUser({
        states: {},
      });
      window.location.reload();
    }
    const randomQuote = ref<string>(sample(RANDOM_QUOTES));
    return {
      randomQuote,
      resetStates,
      showReset,
    };
  },
});
</script>
