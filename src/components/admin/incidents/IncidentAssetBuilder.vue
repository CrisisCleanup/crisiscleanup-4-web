<template>
  <div class="flex flex-col">
    <div class="flex self-end gap-2">
      <base-button
        :action="saveAssets"
        :alt="$t('actions.save')"
        class="mb-4 self-end p-2"
        variant="solid"
      >
        {{ $t('actions.save') }}
      </base-button>
      <base-button
        :action="() => saveAssets(true)"
        :alt="$t('actions.save_and_publish')"
        class="mb-4 self-end p-2"
        variant="solid"
      >
        {{ $t('actions.save_and_publish') }}
      </base-button>
    </div>
    <div class="flex gap-2">
      <div class="grid grid-cols-3 gap-2 w-full">
        <base-select
          v-model="selectedAssetType"
          class="flex-1"
          data-testid="testLanguagesSelect"
          :options="AssetTypes"
          item-key="key"
          label="value"
          select-classes="bg-white border"
        />
        <base-select
          v-model="selectedWorkTypes"
          class="flex-1"
          data-testid="testWorkTypesSelect"
          :options="selectableWorkTypes"
          item-key="key"
          label="value"
          select-classes="bg-white border"
          multiple
          max="4"
          :placeholder="$t('incidentAssets.relevant_work_types')"
        />
        <base-select
          v-model="selectedLanguages"
          data-testid="testLanguageSelect"
          class="flex-1"
          :options="supportedLanguages"
          item-key="id"
          label="name_t"
          size="large"
          multiple
          select-classes="bg-white border text-xs p-1"
          :placeholder="$t('incidentAssets.languages')"
        />
        <datepicker
          v-model="selectedEndDate"
          data-testid="testCurrentAniStartAtSelect"
          :timezone="currentIncident.timezone"
          :placeholder="$t('incidentAssets.end_date')"
          v-bind="datePickerDefaultProps"
        >
          <template #menu-header>
            <div
              class="my-header flex items-center text-center w-full justify-center mt-3"
            >
              {{ currentIncident.timezone }}
            </div>
          </template>
        </datepicker>
        <base-select
          v-model="selectedAnis"
          class="flex-1"
          data-testid="testVisibilitySelect"
          :options="anis"
          item-key="id"
          label="phone_number"
          multiple
          select-classes="bg-white border"
          :placeholder="$t('incidentAssets.choose_anis')"
        />
      </div>
    </div>
    <base-button
      :action="generateAsset"
      class="ml-2 p-2 mt-4"
      variant="solid"
      :alt="$t('incidentAssets.add_asset')"
    >
      {{ $t('incidentAssets.add_asset') }}
    </base-button>
    <Card
      v-for="(assetGroup, assetType) in groupedAssets"
      :key="assetType"
      class="border p-3 my-2"
    >
      <template #header>
        <div class="flex items-center justify-between w-full mb-2">
          <div class="flex items-center justify-center">
            <div v-if="checkIfAssetTypeSaved(assetType)">
              <font-awesome-icon
                icon="check"
                size="md"
                class="mx-1 text-green-600 cursor-pointer"
                type="up"
              />
            </div>
            <div v-else>
              <font-awesome-icon
                icon="times"
                size="md"
                class="mx-1 text-red-600 cursor-pointer"
                type="up"
              />
            </div>
            <base-text class="px-2 py-3 text-base font-bold">
              {{ $t(assetType) }}
            </base-text>
          </div>
          <div class="flex gap-2">
            <base-button
              v-if="checkIfAssetTypeSaved(assetType)"
              :action="() => publishAssets(assetType)"
              class="p-2 mb-1"
              variant="outline"
              :alt="$t('actions.publish_all')"
            >
              {{ $t('actions.publish_all') }}
            </base-button>
            <base-button
              :action="() => deleteAssets(assetType)"
              class="p-2 mb-1"
              variant="outline"
              :alt="$t('actions.delete_all')"
            >
              {{ $t('actions.delete_all') }}
            </base-button>
            <base-button
              :action="() => saveAssetsForType(assetType)"
              class="p-2 mb-1"
              variant="solid"
              :alt="$t('actions.save_all')"
            >
              {{ $t('actions.save_all') }}
            </base-button>
          </div>
        </div>
      </template>

      <div class="grid grid-cols-1 gap-4 mt-4">
        <div
          v-for="asset in assetGroup"
          :key="`${asset.asset_type}:${asset.language}:${asset.ani}`"
          class="p-3 h-max"
        >
          <IncidentAssetEditor
            :key="asset.content"
            :ref="
              (el) =>
                setEditorRef(el, asset.asset_type, asset.language, asset.ani)
            "
            v-model="asset.content"
            :print-size="AssetPrintOptions[asset.asset_type].printSize"
            :print-container-style="
              AssetPrintOptions[asset.asset_type].printContainerStyle
            "
            :per-page="AssetPrintOptions[asset.asset_type].perPage"
          />
          <base-input
            v-model="asset.share_text_t"
            text-area
            class="mt-3"
            :placeholder="$t('incidentAssets.sharing_text')"
          />
          <div class="flex mt-2 items-center justify-between">
            <div class="flex gap-5 items-center">
              {{ getIncidentName(asset.incident) }}
              {{ getAniPhoneNumber(asset.ani) }}
              <LanguageTag
                class="tag-item mx-0.5"
                :language-id="asset.language"
              />
              <div class="flex justify-self-end">
                <base-button
                  :action="
                    () =>
                      printEditorContent(
                        asset.asset_type,
                        asset.language,
                        asset.ani,
                      )
                  "
                  ccu-icon="print"
                  icon-size="md"
                  :alt="$t('actions.print')"
                />
                <base-button
                  v-if="asset.files && asset.files.length > 0"
                  :action="() => downloadAsset(asset)"
                  class="p-2"
                  ccu-icon="download"
                  icon-size="md"
                  :alt="$t('actions.download')"
                />
                <base-button
                  :action="() => deleteAsset(asset)"
                  ccu-icon="trash"
                  icon-size="md"
                  :alt="$t('actions.delete')"
                />
              </div>
              <div
                v-if="asset.files && asset.files.length > 0"
                class="text-xs text-crisiscleanup-dark-300"
              >
                {{ $t('incidentAssets.last_published') }}:
                {{
                  moment(asset.files[0].file_updated_at).format(
                    'YYYY-MM-DD HH:mm',
                  )
                }}
              </div>
              <div v-else class="text-xs text-crisiscleanup-dark-300">
                {{ $t('incidentAssets.not_published') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>

<script lang="ts">
import { ref, computed, type ComputedRef, watch } from 'vue';
import axios from 'axios';
import IncidentAssetEditor from '@/components/IncidentAssetEditor.vue';
import {
  doorHangerTemplate,
  handbillTemplate,
  pullTabFlyerTemplate,
  replacePlaceholders,
  socialMediaTemplate,
} from '@/templates/incident_asset_templates';
import { templates } from '@/icons/icons_templates';
import useTranslation from '@/hooks/useTranslation';
import Language from '@/models/Language';
import BaseButton from '@/components/BaseButton.vue';
import Incident from '@/models/Incident';
import type { Ani, CCUFileItem } from '@/models/types';
import Card from '@/components/cards/Card.vue';
import { useToast } from 'vue-toastification';
import LanguageTag from '@/components/tags/LanguageTag.vue';
import { formatNationalNumber, getWorkTypeName } from '@/filters';
import moment from 'moment/moment';
import downloads from '@/pages/Downloads.vue';
import { forceFileDownload } from '@/utils/downloads';
import CcuIcon from '@/components/BaseIcon.vue';
import QRCode from 'qrcode-svg';
import { i18n } from '@/modules/i18n';
import { i18nService } from '@/services/i18n.service';
import size from 'lodash/size';
import BaseSelect from '@/components/BaseSelect.vue';
import { useCurrentIncident } from '@/hooks';
import type { VueDatePicker } from '@vuepic/vue-datepicker';
import BaseInput from '@/components/BaseInput.vue';

export interface IncidentAniAsset {
  id?: number;
  asset_type: string;
  language: number;
  content: string;
  ani: number;
  incident: number;
  visibility: string;
  published_at: string | null;
  created_at: string;
  files: CCUFileItem[];
  share_text_t: string;
}

export interface AssetTypeValue {
  key: string;
  value: string;
}

export interface VisibilityValue {
  key: string;
  value: string;
}

export interface GroupedAssets {
  [assetType: string]: IncidentAniAsset[];
}

interface PrintOption {
  printContainerStyle: string;
  perPage: number;
  printSize: string;
}

export default {
  components: {
    BaseInput,
    BaseSelect,
    CcuIcon,
    LanguageTag,
    Card,
    BaseButton,
    IncidentAssetEditor,
  },

  props: {
    incident: {
      type: Incident,
      required: true,
    },
    anis: {
      type: Array,
      required: true,
    },
    selectableWorkTypes: {
      type: Array,
      default: () => [],
    },
  },

  setup(props) {
    const { translate } = useTranslation();
    const languages = Language.all();
    const $toasted = useToast();
    const { t, setLocaleMessage } = useI18n();

    const AssetTypes: AssetTypeValue[] = [
      {
        key: 'incidentAniAsset.handbill',
        value: t('incidentAniAsset.handbill'),
      },
      {
        key: 'incidentAniAsset.door_hanger',
        value: t('incidentAniAsset.door_hanger'),
      },
      {
        key: 'incidentAniAsset.pull_tab_flyer',
        value: t('incidentAniAsset.pull_tab_flyer'),
      },
      {
        key: 'incidentAniAsset.social_media',
        value: t('incidentAniAsset.social_media'),
      },
    ];

    const AssetPrintOptions: Record<string, PrintOption> = {
      'incidentAniAsset.handbill': {
        printContainerStyle:
          'display: flex; flex-direction: column;gap: 0.5rem;',
        perPage: 4,
        printSize: '8.5in 11in',
      },
      'incidentAniAsset.door_hanger': {
        printContainerStyle: 'display: flex;gap: 0.1rem;',
        perPage: 3,
        printSize: '11in 8.5in',
      },
      'incidentAniAsset.pull_tab_flyer': {
        printContainerStyle: '',
        perPage: 1,
        printSize: '8.5in 11in',
      },

      'incidentAniAsset.social_media': {
        printContainerStyle: '',
        perPage: 1,
        printSize: '5.5in 3.5in',
      },
    };

    const Visibilities: VisibilityValue[] = [
      { key: 'SHARED', value: 'Shared' },
      { key: 'PUBLIC', value: 'Public' },
      { key: 'PRIVATE', value: 'Private' },
    ];

    const datePickerDefaultProps = reactive<VueDatePicker>({
      format: 'yyyy-MM-dd HH:mm:ss',
      autoApply: true,
      enableSeconds: true,
      weekStart: 0,
    });

    const anis = computed(() => props.anis);
    const { currentIncident } = useCurrentIncident();

    const assets = ref<IncidentAniAsset[]>([]);
    const selectedAssetType = ref('incidentAniAsset.handbill');
    const selectedWorkTypes = ref<string[]>([]);
    const selectedLanguages = ref<string[]>([]);
    const selectedAnis = ref<string[]>([]);
    const selectedEndDate = ref<string | null>(null);
    const getWorktypeSVGByKey = (
      workTypeKey: string,
      size = 53,
      color: string = '#000000',
    ) => {
      const template = templates[workTypeKey] || templates.unknown;
      return encodeURIComponent(
        template
          .replaceAll('{{fillColor}}', color)
          .replaceAll('{{strokeColor}}', color)
          .replaceAll(/(width="[1-9]+")/g, `width="${size}"`)
          .replaceAll(/(height="[1-9]+")/g, `height="${size}"`),
      );
    };

    async function generateDefaultTemplateValues(
      ani: Ani,
      incident: Incident,
      language: Language,
    ) {
      const data = await i18nService.getLanguage(language.subtag);
      const { translations } = data;
      if (size(translations) > 0) {
        setLocaleMessage(language.subtag, translations);
      }
      const endDate = moment(ani.end_at)
        .subtract(((moment(ani.end_at).day() + 1) % 7) + 1, 'days')
        .format('dddd, MMMM D, YYYY');

      const englishValues = {
        header: 'CRISISCLEANUP.ORG',
        incident_name: `${incident?.name.toUpperCase()} CLEANUP HOTLINE`,
        phone_number: formatNationalNumber(ani.phone_number?.toString()),
        assistance: `If you need help cleaning up damage from the ${incident?.name}, call ${formatNationalNumber(ani.phone_number?.toString())} to ask for help. We will connect you with volunteers from local relief organizations, community groups and faith communities who may be able to assist with:`,
        hotline_text: `All services are free, but service is not guaranteed due to the overwhelming need. This hotline will remain open through ${endDate}.`,
        notes_text:
          'PLEASE NOTE: this hotline CANNOT assist with social services such as food, clothing, shelter, insurance, or questions about FEMA registration. Volunteers work free of charge and provide the tools and equipment necessary to complete the work.',
        work_types: selectedWorkTypes.value
          ?.map((workType: string) => {
            return `<div style="margin-top: 0.5rem; width: max-content;">
                <div style="display: inline-flex; align-items: center;">
                    <img
                        style="width: 25px; height: 25px; margin-right: 0.25rem;"
                        src='data:image/svg+xml;utf8,${getWorktypeSVGByKey(
                          workType,
                          30,
                          '#000000',
                        )}'>
                    ${t(
                      `workType.${workType}`,
                      {},
                      {
                        locale: language.subtag,
                      },
                    )}
                </div>
              </div>`;
          })
          .join(''),
        volunteer_help: 'Volunteer Cleanup Help:',
        qr_code: new QRCode({
          content: formatNationalNumber(ani.phone_number?.toString()),
          width: 160,
          height: 160,
        }).svg(),
        language,
        ani,
        incident,
      };

      if (language?.subtag.startsWith('en')) {
        return englishValues;
      }

      return {
        header: englishValues.header,
        incident_name: await translate(
          englishValues.incident_name,
          'en-US',
          language.subtag,
        ),
        phone_number: englishValues.phone_number,
        assistance: await translate(
          englishValues.assistance,
          'en-US',
          language.subtag,
        ),
        hotline_text: await translate(
          englishValues.hotline_text,
          'en-US',
          language.subtag,
        ),
        notes_text: await translate(
          englishValues.notes_text,
          'en-US',
          language.subtag,
        ),
        volunteer_help: await translate(
          englishValues.volunteer_help,
          'en-US',
          language.subtag,
        ),
        work_types: englishValues.work_types,
        qr_code: new QRCode({
          content: formatNationalNumber(ani.phone_number?.toString()),
          width: 160,
          height: 160,
        }).svg(),
        language,
        ani,
        incident,
      };
    }

    const generateAsset = async () => {
      for (let language of selectedLanguages.value) {
        const defaultTemplateValues = await Promise.all(
          anis.value
            .filter((ani: Ani) => selectedAnis.value.includes(ani.id))
            .map(async (ani: Ani) => {
              return generateDefaultTemplateValues(
                ani,
                props.incident,
                supportedLanguages.value.find((l) => l.id === language),
              );
            }),
        );

        const assetTypeTemplates: Record<string, string> = {
          'incidentAniAsset.handbill': handbillTemplate,
          'incidentAniAsset.social_media': socialMediaTemplate,
          'incidentAniAsset.pull_tab_flyer': pullTabFlyerTemplate,
          'incidentAniAsset.door_hanger': doorHangerTemplate,
        };

        assets.value = [
          ...assets.value,
          ...defaultTemplateValues.map((value) => {
            return {
              asset_type: selectedAssetType.value,
              language: value.language.id,
              content: replacePlaceholders(
                assetTypeTemplates[selectedAssetType.value],
                value,
              ),
              ani: value.ani.ani,
              incident: value.incident.id,
              visibility: 'public',
              invalidated_at: selectedEndDate.value,
            };
          }),
        ];
      }
    };

    const supportedLanguages = computed(() => {
      const languages = Language.all();
      const ids = new Set([2, 3, 7, 91, 11, 165, 166]);
      return languages.filter((l) => ids.has(Number(l.id)));
    });

    const groupedAssets: ComputedRef<GroupedAssets> = computed(() => {
      const assetsByType: GroupedAssets = {};

      // Group assets by their asset type
      for (const asset of assets.value) {
        const assetType = asset.asset_type;
        if (!assetsByType[assetType]) {
          assetsByType[assetType] = [];
        }
        assetsByType[assetType].push(asset);
      }

      // Sort each group of assets
      for (const assetType in assetsByType) {
        assetsByType[assetType].sort((a, b) => {
          // Sort by presence of id first (new items without id come first)
          return Number(a.language) - Number(b.language);
        });
      }

      return assetsByType;
    });

    const saveAssetsForType = async (type: string) => {
      const assetsToSave = assets.value.filter(
        (asset) => asset.asset_type === type,
      );

      if (assetsToSave.length === 0) {
        $toasted.warning('No assets to save.');
        return;
      }

      await Promise.all(
        assetsToSave.map((asset) => {
          return asset.id
            ? axios.put(
                `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets/${
                  asset.id
                }`,
                asset,
              )
            : axios.post(
                `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets`,
                asset,
              );
        }),
      );

      await getAssets(type);

      await $toasted.success(t('info.upload_file_successful'));
    };

    const publishAssets = async (type: string) => {
      const assetsToPublish = assets.value.filter(
        (asset) => asset.asset_type === type && Boolean(asset.id),
      );

      if (assetsToPublish.length === 0) {
        $toasted.warning(
          'No saved assets to publish. Please save assets first.',
        );
        return;
      }

      await Promise.all(
        assetsToPublish.map((asset) => {
          return publishAsset(asset);
        }),
      );

      await getAssets();

      await $toasted.success(t('info.publish_assets_successful'));
    };

    const deleteAssets = async (type: string) => {
      assets.value = assets.value.filter(
        (asset) => !(asset.asset_type === type && !asset.id),
      );

      const assetsToDelete = assets.value.filter(
        (asset) => asset.asset_type === type && Boolean(asset.id),
      );

      if (assetsToDelete.length === 0) {
        return;
      }

      await Promise.all(
        assetsToDelete.map((asset) => {
          return axios.delete(
            `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets/${
              asset.id
            }`,
          );
        }),
      );

      await getAssets();

      await $toasted.success(t('info.delete_assets_successful'));
    };

    const deleteAsset = async (asset: IncidentAniAsset) => {
      if (!asset.id) {
        assets.value = assets.value.filter((a) => a !== asset);
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets/${asset.id}`,
      );

      await getAssets();

      await $toasted.success(t('info.delete_asset_successful'));
    };

    async function saveAssets(publish = false) {
      const assetsToSave = assets.value;

      if (assetsToSave.length === 0) {
        console.warn('No assets to save.');
        return;
      }

      const savedAssetsResponses = await Promise.all(
        assetsToSave.map((asset) => {
          return asset.id
            ? axios.put(
                `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets/${
                  asset.id
                }`,
                {
                  ...asset,
                  published_at: publish ? moment().toISOString() : null,
                },
              )
            : axios.post(
                `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets`,
                {
                  ...asset,
                  published_at: publish ? moment().toISOString() : null,
                },
              );
        }),
      );

      if (publish) {
        await Promise.all(
          savedAssetsResponses.map((response) => {
            return publishAsset(response.data as IncidentAniAsset);
          }),
        );
      }

      await getAssets();

      await $toasted.success(t('info.upload_file_successful'));
    }

    function getIncidentName(value: number) {
      const incident = Incident.query().where('id', Number(value)).first();
      return incident ? incident.name : '';
    }

    function getAniPhoneNumber(value: number) {
      const ani = anis.value.find((ani) => ani.ani === value);
      return ani ? ani.phone_number : '';
    }

    async function getAssets(type = '') {
      const response = await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets`,
        {
          params: {
            incident: props.incident.id,
          },
        },
      );

      if (type) {
        assets.value = assets.value.filter(
          (asset) => asset.asset_type !== type,
        );
        assets.value = assets.value.concat(
          response.data.results.filter(
            (asset: IncidentAniAsset) => asset.asset_type === type,
          ),
        );
      } else {
        assets.value = response.data.results;
      }
    }

    const publishAsset = async (asset: IncidentAniAsset) => {
      await axios.get(
        `${import.meta.env.VITE_APP_API_BASE_URL}/incident_assets/${
          asset.id
        }/publish`,
      );
    };

    const downloadAsset = async (asset: IncidentAniAsset) => {
      const response = await axios.get(asset.files[0].general_file_url, {
        responseType: 'blob',
        headers: {
          Authorization: null,
        },
      });
      forceFileDownload(response, asset.files[0].filename);
    };

    const editors = ref<Record<string, any>>({});

    const setEditorRef = (
      el: HTMLBaseElement,
      asset_type: string,
      language: number,
      ani: number,
    ) => {
      editors.value[`${asset_type}:${language}:${ani}`] = el;
    };

    const printEditorContent = (
      asset_type: string,
      language: number,
      ani: number,
    ) => {
      if (
        editors.value[`${asset_type}:${language}:${ani}`] &&
        editors.value[`${asset_type}:${language}:${ani}`].printContent
      ) {
        editors.value[`${asset_type}:${language}:${ani}`].printContent();
      }
    };

    const checkIfAssetTypeSaved = (asset_type: string) => {
      const assetsToCheck = assets.value.filter(
        (asset) => asset.asset_type === asset_type && Boolean(asset.id),
      );
      return assetsToCheck.length > 0;
    };

    watch(
      () => props.incident,
      (newVal) => {
        if (newVal) {
          getAssets();
        }
      },
    );

    return {
      assets,
      languages,
      selectedAssetType,
      selectedWorkTypes,
      AssetTypes,
      AssetPrintOptions,
      Visibilities,
      generateAsset,
      groupedAssets,
      saveAssets,
      getIncidentName,
      getAniPhoneNumber,
      publishAssets,
      publishAsset,
      downloadAsset,
      setEditorRef,
      printEditorContent,
      deleteAssets,
      deleteAsset,
      moment,
      checkIfAssetTypeSaved,
      selectedLanguages,
      supportedLanguages,
      selectedEndDate,
      currentIncident,
      datePickerDefaultProps,
      saveAssetsForType,
      selectedAnis,
    };
  },
  computed: {
    downloads() {
      return downloads;
    },
  },
};
</script>
