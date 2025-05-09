<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">{{ $t('~~Magazine Management') }}</h1>

    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">
        {{ magazine.id ? $t('~~Edit Magazine') : $t('~~Create Magazine') }}
      </h2>

      <div class="grid grid-cols-1 gap-6">
        <!-- Basic Magazine Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">
            {{ $t('~~Basic Information') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Magazine Title') }}
                </label>
                <base-input
                  v-model="magazine.title"
                  :placeholder="$t('~~Enter magazine title')"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Subtitle') }}
                </label>
                <base-input
                  v-model="magazine.subtitle"
                  :placeholder="$t('~~Enter magazine subtitle')"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Incident IDs') }}
                </label>
                <base-input
                  v-model="magazine.incident_ids"
                  :placeholder="$t('~~Enter incident IDs (comma-separated)')"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~Incident Name') }}
                </label>
                <base-input
                  v-model="magazine.incident_name"
                  :placeholder="$t('~~Enter incident name')"
                />
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Volume') }}
                  </label>
                  <base-input
                    v-model="magazine.volume"
                    type="number"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Issue') }}
                  </label>
                  <base-input
                    v-model="magazine.issue"
                    type="number"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('~~ISSN') }}
                </label>
                <base-input
                  v-model="magazine.issn"
                  :placeholder="$t('~~Enter ISSN')"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                {{ $t('~~Publication Date') }}
              </label>
              <datepicker
                v-model="magazine.publish_date"
                data-testid="testPublishDatePicker"
                auto-apply
                format="yyyy-MM-dd"
                class="mb-4"
              />
            </div>
          </div>
        </div>

        <!-- Timeframe Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">{{ $t('~~Timeframe') }}</h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="expandedSections.timeframe = !expandedSections.timeframe"
            >
              <i
                :class="[
                  'fa',
                  expandedSections.timeframe
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.timeframe">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Timeframe Start') }}
                  </label>
                  <datepicker
                    v-model="magazine.timeframe_start"
                    auto-apply
                    format="yyyy-MM-dd HH:mm"
                    class="mb-4"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('~~Timeframe End') }}
                  </label>
                  <datepicker
                    v-model="magazine.timeframe_end"
                    auto-apply
                    format="yyyy-MM-dd HH:mm"
                    class="mb-4"
                  />
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Publisher Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('~~Publisher Information') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="expandedSections.publisher = !expandedSections.publisher"
            >
              <i
                :class="[
                  'fa',
                  expandedSections.publisher
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.publisher">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher"
                      :placeholder="$t('~~Enter publisher name')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher City') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherCity"
                      :placeholder="$t('~~Enter publisher city')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher State') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherState"
                      :placeholder="$t('~~Enter publisher state')"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher Email') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherEmail"
                      :placeholder="$t('~~Enter publisher email')"
                      type="email"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Publisher Phone') }}
                    </label>
                    <base-input
                      v-model="magazine.publisherPhone"
                      :placeholder="$t('~~Enter publisher phone')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Subscription Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('~~Subscription Information') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="
                expandedSections.subscription = !expandedSections.subscription
              "
            >
              <i
                :class="[
                  'fa',
                  expandedSections.subscription
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.subscription">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Subscription URL') }}
                    </label>
                    <base-input
                      v-model="magazine.subscriptionUrl"
                      :placeholder="$t('~~Enter subscription URL')"
                      type="url"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Subscription Address') }}
                    </label>
                    <base-input
                      v-model="magazine.subscriptionAddress1"
                      :placeholder="$t('~~Enter subscription address')"
                    />
                  </div>
                </div>

                <div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2">
                      <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">
                          {{ $t('~~City') }}
                        </label>
                        <base-input
                          v-model="magazine.subscriptionCity"
                          :placeholder="$t('~~Enter city')"
                        />
                      </div>
                    </div>
                    <div>
                      <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">
                          {{ $t('~~State') }}
                        </label>
                        <base-input
                          v-model="magazine.subscriptionState"
                          :placeholder="$t('~~State')"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Postal Code') }}
                    </label>
                    <base-input
                      v-model="magazine.subscriptionPostalCode"
                      :placeholder="$t('~~Enter postal code')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Publication Details Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('~~Publication Details') }}
            </h3>
            <button
              class="text-gray-500 hover:text-gray-700"
              @click="
                expandedSections.publication = !expandedSections.publication
              "
            >
              <i
                :class="[
                  'fa',
                  expandedSections.publication
                    ? 'fa-chevron-down'
                    : 'fa-chevron-right',
                ]"
              ></i>
            </button>
          </div>
          <transition name="slide">
            <div v-show="expandedSections.publication">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Availability') }}
                    </label>
                    <base-select
                      v-model="magazine.availability"
                      :options="availabilityOptions"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Frequency') }}
                    </label>
                    <base-input
                      v-model="magazine.frequency"
                      :placeholder="$t('~~Enter publication frequency')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Type of Publication') }}
                    </label>
                    <base-input
                      v-model="magazine.pubType"
                      :placeholder="$t('~~Enter publication type')"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Language') }}
                    </label>
                    <base-input
                      v-model="magazine.language"
                      :placeholder="$t('~~Enter language')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('~~Format') }}
                    </label>
                    <div class="space-y-2">
                      <div>
                        <input
                          id="format-print"
                          v-model="formatOptions.print"
                          type="checkbox"
                          class="mr-2"
                        />
                        <label for="format-print">{{ $t('~~Print') }}</label>
                      </div>
                      <div>
                        <input
                          id="format-online"
                          v-model="formatOptions.online"
                          type="checkbox"
                          class="mr-2"
                        />
                        <label for="format-online">{{ $t('~~Online') }}</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </transition>
        </div>

        <!-- Magazine Editions Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">
            {{ $t('~~Magazine Editions') }}
          </h3>

          <div
            v-if="magazine.editions.length === 0"
            class="text-gray-500 mb-4 p-4 bg-gray-100 rounded"
          >
            {{ $t('~~No editions added yet') }}
          </div>

          <!-- Edition Cards -->
          <div v-else class="space-y-4 mb-4">
            <div
              v-for="(edition, index) in magazine.editions"
              :key="index"
              class="border rounded p-4 bg-white"
              :class="{
                'border-blue-500 bg-blue-50': selectedIssueIndex === index,
              }"
            >
              <div class="flex justify-between items-center mb-3">
                <h4 class="font-medium">
                  {{ $t('~~Edition') }} #{{ index + 1 }}
                </h4>
                <button
                  type="button"
                  class="text-red-500 hover:text-red-700"
                  @click="removeEdition(index)"
                >
                  <i class="fa fa-trash"></i>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <!-- Edition Name -->
                <div class="md:col-span-2">
                  <base-input
                    v-model="edition.name"
                    :label="$t('~~Edition Name')"
                    :placeholder="$t('~~Enter edition name')"
                  />
                  <base-input
                    v-model="edition.short_name"
                    :label="$t('~~Short Name')"
                    :placeholder="$t('~~Enter short name')"
                    class="mt-2"
                  />
                  <div class="mt-2">
                    <label class="flex items-center space-x-2">
                      <input
                        v-model="edition.is_primary"
                        type="checkbox"
                        class="form-checkbox h-4 w-4 text-primary"
                      />
                      <span class="text-sm text-gray-700">{{
                        $t('~~Primary Edition')
                      }}</span>
                    </label>
                  </div>
                </div>

                <!-- PDF Upload -->
                <div class="md:col-span-3">
                  <label class="block text-sm font-medium mb-2">{{
                    $t('~~PDF File')
                  }}</label>

                  <div
                    v-if="edition.file_details"
                    class="flex items-center mb-2"
                  >
                    <div class="flex-grow mr-2 text-sm">
                      <div class="flex items-center">
                        <i class="fa fa-file-pdf text-red-500 mr-2"></i>
                        <span class="truncate">{{
                          edition.file_details.filename
                        }}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      class="text-red-500 hover:text-red-700"
                      @click="removeFile(index)"
                    >
                      <i class="fa fa-times"></i>
                    </button>
                  </div>

                  <DragDrop
                    v-else
                    :multiple="false"
                    container-class="border-2 border-dashed border-gray-300 p-3 text-center rounded"
                    :disabled="saving"
                    @files="(files) => handleFileSelection(files, index)"
                  >
                    <div class="text-gray-500 text-sm">
                      <i class="fa fa-cloud-upload text-xl mb-1"></i>
                      <p>{{ $t('~~Drop PDF file here or click to upload') }}</p>
                    </div>
                  </DragDrop>

                  <!-- Thumbnail Upload -->
                  <div class="mt-4">
                    <label class="block text-sm font-medium mb-2">{{
                      $t('~~Thumbnail Image')
                    }}</label>

                    <div
                      v-if="edition.thumbnail_details"
                      class="flex items-center mb-2"
                    >
                      <div class="flex-grow mr-2">
                        <img
                          :src="edition.thumbnail_details.url"
                          class="h-20 w-auto object-cover rounded"
                          alt="Thumbnail preview"
                        />
                      </div>
                      <button
                        type="button"
                        class="text-red-500 hover:text-red-700"
                        @click="removeThumbnail(index)"
                      >
                        <i class="fa fa-times"></i>
                      </button>
                    </div>

                    <DragDrop
                      v-else
                      :multiple="false"
                      container-class="border-2 border-dashed border-gray-300 p-3 text-center rounded"
                      :disabled="saving"
                      @files="(files) => handleThumbnailSelection(files, index)"
                    >
                      <div class="text-gray-500 text-sm">
                        <i class="fa fa-image text-xl mb-1"></i>
                        <p>
                          {{
                            $t('~~Drop thumbnail image here or click to upload')
                          }}
                        </p>
                      </div>
                    </DragDrop>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <base-button
            variant="outline"
            class="mb-4 p-2"
            :action="addEdition"
            size="small"
          >
            <i class="fa fa-plus mr-2"></i>
            {{ $t('~~Add Edition') }}
          </base-button>
        </div>
      </div>

      <div class="flex justify-end mt-6 border-t pt-4">
        <base-button
          variant="outline"
          class="mr-2"
          :action="resetForm"
          size="large"
        >
          {{ $t('~~Cancel') }}
        </base-button>
        <base-button
          variant="solid"
          :action="saveMagazine"
          :show-spinner="saving"
          :disabled="saving || !isFormValid"
          size="large"
        >
          {{ magazine.id ? $t('~~Update') : $t('~~Save') }}
          <span v-if="uploadProgress > 0 && uploadProgress < 100" class="ml-2">
            ({{ uploadProgress }}%)
          </span>
        </base-button>
      </div>
    </div>
    <div v-if="existingMagazines" class="mt-6">
      <h2 class="text-xl font-bold mb-4">
        {{ $t('~~Existing Magazines') }}
      </h2>
      <div class="space-y-6">
        <div
          v-for="magazine in existingMagazines"
          :key="magazine.id"
          class="bg-white rounded-lg shadow p-6"
        >
          <div class="mb-4">
            <div v-if="editingMagazine?.id === magazine.id">
              <base-input
                v-model="editingMagazine.title"
                :label="$t('~~Title')"
                :placeholder="$t('~~Enter magazine title')"
                class="mb-2"
              />
              <base-input
                v-model="editingMagazine.subtitle"
                :label="$t('~~Subtitle')"
                :placeholder="$t('~~Enter magazine subtitle')"
                class="mb-2"
              />
              <base-input
                v-model="editingMagazine.incident_name"
                :label="$t('~~Incident Name')"
                :placeholder="$t('~~Enter incident name')"
                class="mb-2"
              />
              <base-input
                v-model="editingMagazine.incident_ids"
                :label="$t('~~Incident IDs')"
                :placeholder="$t('~~Enter incident IDs (comma-separated)')"
                class="mb-2"
              />
              <div class="grid grid-cols-2 gap-4 mb-2">
                <base-input
                  v-model="editingMagazine.volume"
                  type="number"
                  :label="$t('~~Volume')"
                  :placeholder="$t('~~Enter volume number')"
                />
                <base-input
                  v-model="editingMagazine.issue"
                  type="number"
                  :label="$t('~~Issue')"
                  :placeholder="$t('~~Enter issue number')"
                />
              </div>
              <datepicker
                v-model="editingMagazine.publish_date"
                :label="$t('~~Publication Date')"
                auto-apply
                format="yyyy-MM-dd"
                class="mb-2"
              />
              <div class="flex justify-end space-x-2">
                <base-button
                  variant="outline"
                  size="small"
                  :action="() => cancelEdit()"
                >
                  {{ $t('~~Cancel') }}
                </base-button>
                <base-button
                  variant="solid"
                  size="small"
                  :action="() => saveEdit()"
                  :show-spinner="saving"
                >
                  {{ $t('~~Save') }}
                </base-button>
              </div>
            </div>
            <div v-else>
              <h3 class="text-xl font-bold truncate">{{ magazine.title }}</h3>
              <div v-if="magazine.subtitle" class="text-sm text-gray-600">
                {{ magazine.subtitle }}
              </div>
              <div v-if="magazine.incident_name" class="text-sm text-gray-600">
                {{ $t('~~Incident') }}: {{ magazine.incident_name }}
              </div>
              <div
                v-if="magazine.incident_ids?.length"
                class="text-sm text-gray-600"
              >
                {{ $t('~~Incident IDs') }}:
                {{ magazine.incident_ids.join(', ') }}
              </div>
              <div class="text-sm text-gray-600">
                {{ $t('~~Volume') }} {{ magazine.volume }}, {{ $t('~~Issue') }}
                {{ magazine.issue }}
              </div>
              <div class="text-sm text-gray-600">
                {{ formatDate(magazine.publish_date) }}
              </div>
              <div class="mt-2">
                <base-button
                  variant="outline"
                  size="small"
                  :action="() => startEdit(magazine)"
                >
                  <i class="fa fa-edit mr-2"></i>
                  {{ $t('~~Edit') }}
                </base-button>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-bold mb-3">
              {{ $t('~~Available Editions') }}
            </h4>

            <div class="flex flex-wrap gap-2">
              <div
                v-for="edition in magazine.editions"
                :key="edition.id"
                class="border rounded p-4 relative"
              >
                <button
                  type="button"
                  class="absolute top-2 right-2 text-red-500 hover:text-red-700"
                  @click="deleteEdition(magazine.id, edition.id)"
                >
                  <i class="fa fa-trash"></i>
                </button>
                <div class="mb-2 font-medium">{{ edition.name }}</div>
                <div class="mb-3">
                  <PdfViewer
                    :pdf="edition.file_details"
                    :page="1"
                    :show-download-button="false"
                  />
                </div>
                <a
                  :href="edition.file_details.general_file_url"
                  target="_blank"
                  class="bg-primary-light px-3 py-2 text-sm transition w-full flex items-center justify-center"
                  download
                >
                  {{ $t('~~magazine.download') }}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="existingMagazines.length === 0" class="text-gray-500">
        {{ $t('~~No existing magazines found') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import moment from 'moment';
import DragDrop from '@/components/DragDrop.vue';
import { getErrorMessage } from '@/utils/errors';
import PdfViewer from '@/components/PdfViewer.vue';
import type { CCUFileItem } from '@/models/types';

interface MagazineEditionData {
  id?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  magazine?: string;
  name: string;
  short_name?: string;
  file: string | null;
  file_details?: CCUFileItem;
  file_data?: File | null;
  thumbnail_file?: string | null;
  thumbnail_details?: CCUFileItem;
  thumbnail_data?: File | null;
  is_primary: boolean;
}

interface MagazineData {
  id: string | null;
  title: string;
  subtitle: string;
  incident_ids: string | string[];
  incident_name: string;
  volume: number;
  issue: number;
  issn: string;
  publish_date: string;
  timeframe_start: string;
  timeframe_end: string;
  publisher: string;
  publisher_city: string;
  publisher_state: string;
  publisher_email: string;
  publisher_phone: string;
  subscription_url: string;
  subscription_address_1: string;
  subscription_city: string;
  subscription_state: string;
  subscription_postal_code: string;
  availability: string;
  frequency: string;
  pub_type: string;
  language: string;
  is_active: boolean;
  editions: MagazineEditionData[];
}

interface MagazineEdition {
  id: string;
  name: string;
  short_name: string;
  file: any;
  thumbnail: any;
  is_primary: boolean;
  file_details: CCUFileItem;
}

interface Magazine {
  id: string;
  title: string;
  subtitle: string;
  incident_ids: string | string[];
  incident_name: string;
  volume: number;
  issue: number;
  publish_date: string;
  editions: MagazineEdition[];
}

const { t } = useI18n();
const $toasted = useToast();

const saving = ref(false);
const selectedIssueIndex = ref<number | null>(null);
const uploadProgress = ref(0);

const existingMagazines = ref<File>(null);

const formatOptions = ref({
  print: false,
  online: false,
});

const availabilityOptions = [
  'Open Access',
  'Subscription Only',
  'Limited Access',
];

const magazine = ref<MagazineData>({
  id: null,
  title: 'Crisis Cleanup',
  subtitle: '60 Day Snapshot',
  incident_ids: [],
  incident_name: 'Hurricanes Helene & Milton',
  volume: 1,
  issue: 1,
  issn: '000000000',
  publish_date: '2025-05-12',
  timeframe_start: '2024-09-24',
  timeframe_end: '2024-12-08',
  publisher: 'Crisis Cleanup, LLC',
  publisher_city: 'Longmont',
  publisher_state: 'Colorado',
  publisher_email: 'magazine@crisiscleanup.org',
  publisher_phone: '(848) 480-0660',
  subscription_url: 'https://www.crisiscleanup.org/magazine',
  subscription_address_1: '5905 Blue Mountain Cir.',
  subscription_city: 'Longmont',
  subscription_state: 'CO',
  subscription_postal_code: '80503',
  availability: 'Open Access',
  frequency: 'Twice a month',
  pub_type: 'Magazine',
  language: 'English',
  is_active: true,
  editions: [],
});

// Initialize format options based on default values
onMounted(() => {
  formatOptions.value.print = true;
  formatOptions.value.online = true;
});

const isFormValid = computed(() => {
  if (!magazine.value.title || !magazine.value.publish_date) {
    return false;
  }

  if (magazine.value.editions.length === 0) {
    return false;
  }

  // Check if at least one format is selected
  if (!formatOptions.value.print && !formatOptions.value.online) {
    return false;
  }

  return magazine.value.editions.every(
    (edition: MagazineEditionData) =>
      edition.name && (edition.file || edition.file_data),
  );
});

function addEdition() {
  magazine.value.editions.push({
    name: '',
    short_name: '',
    file: null,
    file_details: null,
    thumbnail_file: null,
    thumbnail_details: null,
    thumbnail_data: null,
    is_primary: false,
    file_data: null,
  });
  selectedIssueIndex.value = magazine.value.editions.length - 1;
}

function removeEdition(index: number) {
  if (confirm(t('~~Are you sure you want to remove this edition?'))) {
    magazine.value.editions.splice(index, 1);
    if (selectedIssueIndex.value === index) {
      selectedIssueIndex.value = magazine.value.editions.length > 0 ? 0 : null;
    } else if (
      selectedIssueIndex.value !== null &&
      selectedIssueIndex.value > index
    ) {
      selectedIssueIndex.value--;
    }
  }
}

function removeFile(index: number) {
  magazine.value.editions[index].file = null;
  magazine.value.editions[index].file_details = null;
  magazine.value.editions[index].file_data = null;
}

function handleFileSelection(fileList: File[], index: number) {
  if (fileList.length === 0) {
    return;
  }

  const file = fileList[0];
  if (file.type !== 'application/pdf' && file.type !== 'application/zip') {
    $toasted.error(t('~~Only PDF and ZIP files are allowed'));
    return;
  }

  // Store file in memory for batch upload later
  magazine.value.editions[index].file_data = file;
  magazine.value.editions[index].file_details = {
    filename: file.name,
    size: file.size,
    mime_content_type: file.type,
  };
}

function handleThumbnailSelection(fileList: File[], index: number) {
  if (fileList.length === 0) {
    return;
  }

  const file = fileList[0];
  if (!file.type.startsWith('image/')) {
    $toasted.error(t('~~Only image files are allowed for thumbnails'));
    return;
  }

  // Store file in memory for batch upload later
  magazine.value.editions[index].thumbnail_data = file;
  magazine.value.editions[index].thumbnail_details = {
    filename: file.name,
    size: file.size,
    mime_content_type: file.type,
  };
}

function removeThumbnail(index: number) {
  magazine.value.editions[index].thumbnail_file = null;
  magazine.value.editions[index].thumbnail_details = null;
  magazine.value.editions[index].thumbnail_data = null;
}

async function uploadAllFiles(): Promise<boolean> {
  const editionsToUpload = magazine.value.editions.filter(
    (edition: MagazineEditionData) => edition.file_data && !edition.file,
  );

  if (editionsToUpload.length === 0) {
    return true; // No files to upload
  }

  uploadProgress.value = 0;
  const totalFiles = editionsToUpload.length;
  let uploadedCount = 0;

  try {
    // Upload all files in parallel
    const uploadPromises = magazine.value.editions.map(
      async (edition: MagazineEditionData, index: number) => {
        if (!edition.file_data || edition.file) {
          return; // Skip if no file data or already has a file ID
        }

        const formData = new FormData();
        formData.append('file', edition.file_data);
        formData.append('name', edition.name);
        formData.append('short_name', edition.short_name || '');
        formData.append('is_primary', edition.is_primary.toString());
        formData.append('magazine', magazine.value.id || '');

        const result = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/editions`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          },
        );

        // Update edition info with server response
        magazine.value.editions[index] = {
          ...magazine.value.editions[index],
          ...result.data,
          file_data: null, // Clear the temporary file data
        };

        // Update progress
        uploadedCount++;
        uploadProgress.value = Math.round((uploadedCount / totalFiles) * 100);
      },
    );

    await Promise.all(uploadPromises);
    return true;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
    return false;
  } finally {
    uploadProgress.value = 0;
    await getExistingMagazineFiles();
  }
}

async function getExistingMagazineFiles() {
  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/magazines`,
    );
    existingMagazines.value = data.results;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

async function saveMagazine() {
  if (!isFormValid.value) {
    $toasted.error(t('~~Please fill in all required fields'));
    return;
  }

  saving.value = true;

  try {
    // Step 1: Create or update the magazine
    const magazineData = {
      title: magazine.value.title,
      subtitle: magazine.value.subtitle,
      incident_ids: magazine.value.incident_ids
        ? magazine.value.incident_ids.split(',')
        : [],
      incident_name: magazine.value.incident_name,
      volume: magazine.value.volume,
      issue: magazine.value.issue,
      issn: magazine.value.issn,
      publish_date: magazine.value.publish_date,
      timeframe_start: magazine.value.timeframe_start,
      timeframe_end: magazine.value.timeframe_end,
      publisher: magazine.value.publisher,
      publisher_city: magazine.value.publisher_city,
      publisher_state: magazine.value.publisher_state,
      publisher_email: magazine.value.publisher_email,
      publisher_phone: magazine.value.publisher_phone,
      subscription_url: magazine.value.subscription_url,
      subscription_address_1: magazine.value.subscription_address_1,
      subscription_city: magazine.value.subscription_city,
      subscription_state: magazine.value.subscription_state,
      subscription_postal_code: magazine.value.subscription_postal_code,
      availability: magazine.value.availability,
      frequency: magazine.value.frequency,
      pub_type: magazine.value.pub_type,
      language: magazine.value.language,
      is_active: magazine.value.is_active,
    };

    const magazineResponse = await axios.post(
      `${import.meta.env.VITE_APP_API_BASE_URL}/magazines`,
      magazineData,
    );

    // Update the magazine ID
    magazine.value.id = magazineResponse.data.id;

    // Step 2: Upload all files first
    const editionsToUpload = magazine.value.editions.filter(
      (edition: MagazineEditionData) =>
        (edition.file_data || edition.thumbnail_data) &&
        (!edition.file || !edition.thumbnail_file),
    );

    if (editionsToUpload.length > 0) {
      uploadProgress.value = 0;
      const totalFiles = editionsToUpload.length * 2; // Count both PDF and thumbnail files
      let uploadedCount = 0;

      // Upload all files in parallel
      const uploadPromises = magazine.value.editions.map(
        async (edition: MagazineEditionData, index: number) => {
          const promises = [];

          // Upload PDF if needed
          if (edition.file_data && !edition.file) {
            const formData = new FormData();
            formData.append('upload', edition.file_data);
            formData.append('type_t', 'fileTypes.magazine_issue');
            formData.append('filename', edition.file_details?.filename || '');
            formData.append(
              'content_type',
              edition.file_details?.mime_content_type || '',
            );
            formData.append('title', magazine.value.title);

            const result = await axios.post(
              `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Accept: 'application/json',
                },
              },
            );

            // Update file info with server response
            magazine.value.editions[index].file = result.data.id;
            magazine.value.editions[index].file_details = result.data;
            uploadedCount++;
            uploadProgress.value = Math.round(
              (uploadedCount / totalFiles) * 100,
            );
          }

          // Upload thumbnail if needed
          if (edition.thumbnail_data && !edition.thumbnail_file) {
            const formData = new FormData();
            formData.append('upload', edition.thumbnail_data);
            formData.append('type_t', 'fileTypes.other_file');
            formData.append(
              'filename',
              edition.thumbnail_details?.filename || '',
            );
            formData.append(
              'content_type',
              edition.thumbnail_details?.mime_content_type || '',
            );
            formData.append('title', `${magazine.value.title} - Thumbnail`);

            const result = await axios.post(
              `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  Accept: 'application/json',
                },
              },
            );

            // Update thumbnail info with server response
            magazine.value.editions[index].thumbnail_file = result.data.id;
            magazine.value.editions[index].thumbnail_details = result.data;
            uploadedCount++;
            uploadProgress.value = Math.round(
              (uploadedCount / totalFiles) * 100,
            );
          }
        },
      );

      await Promise.all(uploadPromises);
    }

    // Step 3: Create all editions
    const editionPromises = magazine.value.editions.map(
      async (edition: MagazineEditionData) => {
        const editionData = {
          name: edition.name,
          short_name: edition.short_name || '',
          is_primary: edition.is_primary,
          magazine: magazine.value.id,
          file: edition.file,
          thumbnail_file: edition.thumbnail_file,
        };

        return axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/editions`,
          editionData,
        );
      },
    );

    await Promise.all(editionPromises);

    $toasted.success(t('~~Magazine saved successfully'));
    resetForm();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    saving.value = false;
    uploadProgress.value = 0;
    await getExistingMagazineFiles();
  }
}

function resetForm() {
  magazine.value = {
    id: null,
    title: '',
    subtitle: '',
    incident_ids: [],
    incident_name: '',
    volume: 1,
    issue: 1,
    issn: '',
    publish_date: moment().format('YYYY-MM-DD'),
    timeframe_start: '',
    timeframe_end: '',
    publisher: '',
    publisher_city: '',
    publisher_state: '',
    publisher_email: '',
    publisher_phone: '',
    subscription_url: '',
    subscription_address_1: '',
    subscription_city: '',
    subscription_state: '',
    subscription_postal_code: '',
    availability: 'Open Access',
    frequency: '',
    pub_type: '',
    language: '',
    is_active: true,
    editions: [],
  };
  formatOptions.value.print = false;
  formatOptions.value.online = false;
  selectedIssueIndex.value = null;
}

onMounted(() => {
  // Fetch existing magazine files if needed
  getExistingMagazineFiles();
});

// Add new ref for tracking expanded sections
const expandedSections = ref({
  timeframe: false,
  publisher: false,
  subscription: false,
  publication: false,
  versions: false,
});

function formatDate(date: string): string {
  return moment(date).format('MMMM D, YYYY');
}

const editingMagazine = ref<Magazine | null>(null);

function startEdit(magazine: Magazine) {
  editingMagazine.value = {
    ...magazine,
    incident_ids: Array.isArray(magazine.incident_ids)
      ? magazine.incident_ids
      : magazine.incident_ids
          ?.split(',')
          .map((id: string) => id.trim())
          .filter(Boolean) || [],
  };
}

function cancelEdit() {
  editingMagazine.value = null;
}

async function saveEdit() {
  if (!editingMagazine.value) return;

  saving.value = true;
  try {
    const dataToSave = {
      ...editingMagazine.value,
      incident_ids: Array.isArray(editingMagazine.value.incident_ids)
        ? editingMagazine.value.incident_ids
        : editingMagazine.value.incident_ids
            .split(',')
            .map((id: string) => id.trim())
            .filter(Boolean),
    };

    await axios.put(
      `${import.meta.env.VITE_APP_API_BASE_URL}/magazines/${editingMagazine.value.id}`,
      dataToSave,
    );
    $toasted.success(t('~~Magazine updated successfully'));
    await getExistingMagazineFiles();
    editingMagazine.value = null;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function deleteEdition(magazineId: string, editionId: string) {
  if (!confirm(t('~~Are you sure you want to delete this edition?'))) {
    return;
  }

  try {
    await axios.delete(
      `${import.meta.env.VITE_APP_API_BASE_URL}/editions/${editionId}`,
    );
    $toasted.success(t('~~Edition deleted successfully'));
    await getExistingMagazineFiles();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 1000px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}
</style>
