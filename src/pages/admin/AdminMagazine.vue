<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">
      {{ $t('adminMagazine.magazine_management') }}
    </h1>

    <div class="mb-6">
      <h2 class="text-xl font-bold mb-4">
        {{
          magazine.id
            ? $t('actions.edit_magazine')
            : $t('actions.create_magazine')
        }}
      </h2>

      <div class="grid grid-cols-1 gap-6">
        <!-- Basic Magazine Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-lg font-semibold mb-4">
            {{ $t('adminMagazine.basic_information') }}
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('adminMagazine.magazine_title') }}
                </label>
                <base-input
                  v-model="magazine.title"
                  :placeholder="$t('adminMagazine.enter_magazine_title')"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('adminMagazine.subtitle') }}
                </label>
                <base-input
                  v-model="magazine.subtitle"
                  :placeholder="$t('adminMagazine.enter_magazine_subtitle')"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('adminMagazine.incident_ids') }}
                </label>
                <base-input
                  v-model="magazine.incident_ids"
                  :placeholder="$t('adminMagazine.incident_ids')"
                />
              </div>

              <div class="mb-4">
                <label class="block text-sm font-medium mb-2">
                  {{ $t('adminMagazine.incident_name') }}
                </label>
                <base-input
                  v-model="magazine.incident_name"
                  :placeholder="$t('adminMagazine.enter_incident_name')"
                />
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium mb-2">
                    {{ $t('adminMagazine.volume') }}
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
                    {{ $t('adminMagazine.issue') }}
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
                  {{ $t('adminMagazine.issn') }}
                </label>
                <base-input
                  v-model="magazine.issn"
                  :placeholder="$t('adminMagazine.enter_issn')"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">
                {{ $t('adminMagazine.publication_date') }}
              </label>
              <datepicker
                v-model="magazine.publish_at"
                data-testid="testPublishDatePicker"
                auto-apply
                format="yyyy-MM-dd"
                class="mb-4"
              />
            </div>
            <div>
              <label class="block text-sm font-medium mb-2">
                {{ $t('adminMagazine.timeframe_start') }}
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
                {{ $t('adminMagazine.timeframe_end') }}
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

        <!-- Publisher Information Section -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ $t('adminMagazine.publisher_information') }}
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
                      {{ $t('adminMagazine.publisher') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher"
                      :placeholder="$t('adminMagazine.enter_publisher_name')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.publisher_city') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher_city"
                      :placeholder="$t('adminMagazine.enter_publisher_city')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.publisher_state') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher_state"
                      :placeholder="$t('adminMagazine.enter_publisher_state')"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.publisher_email') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher_email"
                      :placeholder="$t('adminMagazine.enter_publisher_email')"
                      type="email"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.publisher_phone') }}
                    </label>
                    <base-input
                      v-model="magazine.publisher_phone"
                      :placeholder="$t('adminMagazine.enter_publisher_phone')"
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
              {{ $t('adminMagazine.subscription_information') }}
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
                      {{ $t('adminMagazine.subscription_url') }}
                    </label>
                    <base-input
                      v-model="magazine.subscription_url"
                      :placeholder="$t('adminMagazine.enter_subscription_url')"
                      type="url"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.subscription_address') }}
                    </label>
                    <base-input
                      v-model="magazine.subscription_address_1"
                      :placeholder="
                        $t('adminMagazine.enter_subscription_address')
                      "
                    />
                  </div>
                </div>

                <div>
                  <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2">
                      <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">
                          {{ $t('adminMagazine.city') }}
                        </label>
                        <base-input
                          v-model="magazine.subscription_city"
                          :placeholder="$t('adminMagazine.enter_city')"
                        />
                      </div>
                    </div>
                    <div>
                      <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">
                          {{ $t('adminMagazine.state') }}
                        </label>
                        <base-input
                          v-model="magazine.subscription_state"
                          :placeholder="$t('adminMagazine.enter_state')"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.postal_code') }}
                    </label>
                    <base-input
                      v-model="magazine.subscription_postal_code"
                      :placeholder="$t('adminMagazine.enter_postal_code')"
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
              {{ $t('adminMagazine.publication_details') }}
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
                      {{ $t('adminMagazine.availability') }}
                    </label>
                    <base-select
                      v-model="magazine.availability"
                      :options="availabilityOptions"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.frequency') }}
                    </label>
                    <base-input
                      v-model="magazine.frequency"
                      :placeholder="
                        $t('adminMagazine.enter_publication_frequency')
                      "
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.type_of_publication') }}
                    </label>
                    <base-input
                      v-model="magazine.pub_type"
                      :placeholder="$t('adminMagazine.enter_publication_type')"
                    />
                  </div>
                </div>

                <div>
                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.language') }}
                    </label>
                    <base-input
                      v-model="magazine.language"
                      :placeholder="$t('adminMagazine.enter_language')"
                    />
                  </div>

                  <div class="mb-4">
                    <label class="block text-sm font-medium mb-2">
                      {{ $t('adminMagazine.format') }}
                    </label>
                    <div class="space-y-2">
                      <div>
                        <input
                          id="format-print"
                          v-model="formatOptions.print"
                          type="checkbox"
                          class="mr-2"
                        />
                        <label for="format-print">{{
                          $t('adminMagazine.print')
                        }}</label>
                      </div>
                      <div>
                        <input
                          id="format-online"
                          v-model="formatOptions.online"
                          type="checkbox"
                          class="mr-2"
                        />
                        <label for="format-online">{{
                          $t('adminMagazine.online')
                        }}</label>
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
            {{ $t('adminMagazine.magazine_editions') }}
          </h3>

          <div
            v-if="magazine.editions.length === 0"
            class="text-gray-500 mb-4 p-4 bg-gray-100 rounded"
          >
            {{ $t('adminMagazine.no_editions_added_yet') }}
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
                  {{ $t('adminMagazine.edition') }} #{{ index + 1 }}
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
                    :label="$t('adminMagazine.edition_name')"
                    :placeholder="$t('adminMagazine.enter_edition_name')"
                  />
                  <base-input
                    v-model="edition.short_name"
                    :label="$t('adminMagazine.short_name')"
                    :placeholder="$t('adminMagazine.enter_short_name')"
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
                        $t('adminMagazine.primary_edition')
                      }}</span>
                    </label>
                  </div>
                </div>

                <!-- PDF Upload -->
                <div class="md:col-span-3">
                  <label class="block text-sm font-medium mb-2">{{
                    $t('adminMagazine.pdf_file')
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
                      <p>{{ $t('adminMagazine.upload_pdf') }}</p>
                    </div>
                  </DragDrop>

                  <!-- Thumbnail Upload -->
                  <div class="mt-4">
                    <label class="block text-sm font-medium mb-2">{{
                      $t('adminMagazine.thumbnail_image')
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
                          {{ $t('adminMagazine.upload_thumbnail') }}
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
            {{ $t('adminMagazine.add_edition') }}
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
          {{ $t('actions.cancel') }}
        </base-button>
        <base-button
          variant="solid"
          :action="saveMagazine"
          :show-spinner="saving"
          :disabled="saving || !isFormValid"
          size="large"
        >
          {{ magazine.id ? $t('actions.update') : $t('actions.save') }}
          <span v-if="uploadProgress > 0 && uploadProgress < 100" class="ml-2">
            ({{ uploadProgress }}%)
          </span>
        </base-button>
      </div>
    </div>
    <div v-if="existingMagazines" class="mt-6">
      <h2 class="text-xl font-bold mb-4">
        {{ $t('adminMagazine.existing_magazines') }}
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
                :label="$t('adminMagazine.title')"
                :placeholder="$t('adminMagazine.enter_magazine_title')"
                class="mb-2"
              />
              <base-input
                v-model="editingMagazine.subtitle"
                :label="$t('adminMagazine.subtitle')"
                :placeholder="$t('adminMagazine.enter_magazine_subtitle')"
                class="mb-2"
              />
              <base-input
                v-model="editingMagazine.incident_name"
                :label="$t('adminMagazine.incident_name')"
                :placeholder="$t('adminMagazine.enter_incident_name')"
                class="mb-2"
              />
              <base-input
                v-model="editingMagazine.incident_ids"
                :label="$t('adminMagazine.incident_ids')"
                :placeholder="
                  $t('adminMagazine.enter_incident_ids_comma_separated')
                "
                class="mb-2"
              />
              <div class="grid grid-cols-2 gap-4 mb-2">
                <base-input
                  v-model="editingMagazine.volume"
                  type="number"
                  :label="$t('adminMagazine.volume')"
                  :placeholder="$t('adminMagazine.enter_volume_number')"
                />
                <base-input
                  v-model="editingMagazine.issue"
                  type="number"
                  :label="$t('adminMagazine.issue')"
                  :placeholder="$t('adminMagazine.enter_issue_number')"
                />
              </div>
              <datepicker
                v-model="editingMagazine.publish_at"
                :label="$t('adminMagazine.publication_date')"
                auto-apply
                format="yyyy-MM-dd"
                class="mb-2"
              />

              <!-- Editions Section -->
              <div class="mt-6">
                <h4 class="font-bold mb-3">
                  {{ $t('adminMagazine.magazine_editions') }}
                </h4>

                <!-- Edition Cards -->
                <div class="space-y-4 mb-4">
                  <div
                    v-for="(edition, index) in editingMagazine.editions"
                    :key="index"
                    class="border rounded p-4 bg-white"
                  >
                    <div class="flex justify-between items-center mb-3">
                      <h4 class="font-medium">
                        {{ $t('adminMagazine.edition') }} #{{ index + 1 }}
                      </h4>
                      <button
                        type="button"
                        class="text-red-500 hover:text-red-700"
                        @click="removeEditionFromEdit(index)"
                      >
                        <i class="fa fa-trash"></i>
                      </button>
                    </div>

                    <div
                      class="grid grid-cols-1 md:grid-cols-5 gap-4 items-start"
                    >
                      <!-- Edition Name -->
                      <div class="md:col-span-2">
                        <base-input
                          v-model="edition.name"
                          :label="$t('adminMagazine.edition_name')"
                          :placeholder="$t('adminMagazine.enter_edition_name')"
                        />
                        <base-input
                          v-model="edition.short_name"
                          :label="$t('adminMagazine.short_name')"
                          :placeholder="$t('adminMagazine.enter_short_name')"
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
                              $t('adminMagazine.primary_edition')
                            }}</span>
                          </label>
                        </div>
                      </div>

                      <!-- PDF Upload -->
                      <div class="md:col-span-3">
                        <label class="block text-sm font-medium mb-2">{{
                          $t('adminMagazine.pdf_file')
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
                            @click="removeFileFromEdit(index)"
                          >
                            <i class="fa fa-times"></i>
                          </button>
                        </div>

                        <DragDrop
                          v-else
                          :multiple="false"
                          container-class="border-2 border-dashed border-gray-300 p-3 text-center rounded"
                          :disabled="saving"
                          @files="
                            (files) => handleFileSelectionForEdit(files, index)
                          "
                        >
                          <div class="text-gray-500 text-sm">
                            <i class="fa fa-cloud-upload text-xl mb-1"></i>
                            <p>{{ $t('adminMagazine.upload_pdf') }}</p>
                          </div>
                        </DragDrop>

                        <!-- Thumbnail Upload -->
                        <div class="mt-4">
                          <label class="block text-sm font-medium mb-2">{{
                            $t('adminMagazine.thumbnail_image')
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
                              @click="removeThumbnailFromEdit(index)"
                            >
                              <i class="fa fa-times"></i>
                            </button>
                          </div>

                          <DragDrop
                            v-else
                            :multiple="false"
                            container-class="border-2 border-dashed border-gray-300 p-3 text-center rounded"
                            :disabled="saving"
                            @files="
                              (files) =>
                                handleThumbnailSelectionForEdit(files, index)
                            "
                          >
                            <div class="text-gray-500 text-sm">
                              <i class="fa fa-image text-xl mb-1"></i>
                              <p>
                                {{ $t('adminMagazine.upload_thumbnail') }}
                              </p>
                            </div>
                          </DragDrop>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Add Edition Button -->
                <base-button
                  variant="outline"
                  class="mb-4 p-2"
                  :action="() => addEditionToExistingMagazine(magazine.id)"
                  size="small"
                >
                  <i class="fa fa-plus mr-2"></i>
                  {{ $t('adminMagazine.add_edition') }}
                </base-button>
              </div>

              <div class="flex justify-end space-x-2 mt-4">
                <base-button
                  variant="outline"
                  size="small"
                  :action="() => cancelEdit()"
                >
                  {{ $t('actions.cancel') }}
                </base-button>
                <base-button
                  variant="solid"
                  size="small"
                  :action="() => saveEdit()"
                  :show-spinner="saving"
                >
                  {{ $t('actions.save') }}
                </base-button>
              </div>
            </div>
            <div v-else>
              <h3 class="text-xl font-bold truncate">{{ magazine.title }}</h3>
              <div v-if="magazine.subtitle" class="text-sm text-gray-600">
                {{ magazine.subtitle }}
              </div>
              <div v-if="magazine.incident_name" class="text-sm text-gray-600">
                {{ $t('adminMagazine.incident_name') }}:
                {{ magazine.incident_name }}
              </div>
              <div
                v-if="magazine.incident_ids?.length"
                class="text-sm text-gray-600"
              >
                {{ $t('adminMagazine.incident_ids') }}:
                {{ magazine.incident_ids.join(', ') }}
              </div>
              <div class="text-sm text-gray-600">
                {{ $t('adminMagazine.volume') }} {{ magazine.volume }},
                {{ $t('adminMagazine.issue') }}
                {{ magazine.issue }}
              </div>
              <div class="text-sm text-gray-600">
                {{ formatDate(magazine.publish_at) }}
              </div>
              <div class="mt-2">
                <base-button
                  variant="outline"
                  size="small"
                  :action="() => startEdit(magazine)"
                >
                  <i class="fa fa-edit mr-2"></i>
                  {{ $t('actions.edit') }}
                </base-button>
              </div>
            </div>
          </div>

          <div>
            <h4 class="font-bold mb-3">
              {{ $t('adminMagazine.available_editions') }}
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
                    v-if="edition.file_details"
                    :pdf="edition.file_details"
                    :page="1"
                    :show-download-button="false"
                  />
                  <div
                    v-else
                    class="text-gray-500 text-center p-4 bg-gray-50 rounded"
                  >
                    {{ $t('adminMagazine.no_pdf_uploaded') }}
                  </div>
                </div>
                <a
                  v-if="edition.file_details?.general_file_url"
                  :href="edition.file_details.general_file_url"
                  target="_blank"
                  class="bg-primary-light px-3 py-2 text-sm transition w-full flex items-center justify-center"
                  download
                >
                  {{ $t('adminMagazine.magazine_download') }}
                </a>
              </div>

              <!-- Add New Edition Button -->
              <div
                v-if="editingMagazine?.id === magazine.id"
                class="border-2 border-dashed border-gray-300 rounded p-4 flex items-center justify-center cursor-pointer hover:border-primary"
                @click="addEditionToExistingMagazine(magazine.id)"
              >
                <div class="text-center">
                  <i class="fa fa-plus text-2xl mb-2"></i>
                  <p>{{ $t('adminMagazine.add_new_edition') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="existingMagazines.length === 0" class="text-gray-500">
        {{ $t('adminMagazine.no_existing_magazines_found') }}
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
  publish_at: string;
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
  publish_at: string;
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
  subtitle: '60-Day Snapshot',
  incident_ids: [],
  incident_name: '',
  volume: new Date().getFullYear() - 2025 + 1,
  issue: 1,
  issn: '000000000',
  publish_at: '2025-05-12',
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
  getNextIssueNumber(magazine.value.volume).then((nextIssue) => {
    magazine.value.issue = nextIssue;
  });
});

const isFormValid = computed(() => {
  if (!magazine.value.title || !magazine.value.publish_at) {
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
  if (confirm(t('adminMagazine.remove_edition_confirmation'))) {
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
    $toasted.error(t('adminMagazine.only_pdf_and_zip_files_are_allowed'));
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
    $toasted.error(
      t('adminMagazine.only_image_files_are_allowed_for_thumbnails'),
    );
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
    $toasted.error(t('adminMagazine.please_fill_in_all_required_fields'));
    return;
  }

  saving.value = true;

  try {
    // Step 1: Create the magazine
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
      publish_at: magazine.value.publish_at,
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

    // Step 2: Create all editions
    for (const edition of magazine.value.editions) {
      // First upload the file if it exists
      let fileId = null;
      if (edition.file_data) {
        const fileFormData = new FormData();
        fileFormData.append('upload', edition.file_data);
        fileFormData.append('type_t', 'fileTypes.magazine_issue');
        fileFormData.append('filename', edition.file_details?.filename || '');
        fileFormData.append(
          'content_type',
          edition.file_details?.mime_content_type || '',
        );
        fileFormData.append('title', magazine.value.title);

        const fileResponse = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
          fileFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          },
        );
        fileId = fileResponse.data.id;
      }

      // Then upload the thumbnail if it exists
      let thumbnailId = null;
      if (edition.thumbnail_data) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('upload', edition.thumbnail_data);
        thumbnailFormData.append('type_t', 'fileTypes.other_file');
        thumbnailFormData.append(
          'filename',
          edition.thumbnail_details?.filename || '',
        );
        thumbnailFormData.append(
          'content_type',
          edition.thumbnail_details?.mime_content_type || '',
        );
        thumbnailFormData.append(
          'title',
          `${magazine.value.title} - Thumbnail`,
        );

        const thumbnailResponse = await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
          thumbnailFormData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Accept: 'application/json',
            },
          },
        );
        thumbnailId = thumbnailResponse.data.id;
      }

      // Finally create the edition
      const editionData = {
        name: edition.name,
        short_name: edition.short_name || '',
        is_primary: edition.is_primary,
        magazine: magazine.value.id,
        file: fileId,
        thumbnail_file: thumbnailId,
      };

      await axios.post(
        `${import.meta.env.VITE_APP_API_BASE_URL}/editions`,
        editionData,
      );
    }

    $toasted.success(t('adminMagazine.magazine_saved_successfully'));
    resetForm();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    saving.value = false;
    uploadProgress.value = 0;
    await getExistingMagazineFiles();
  }
}

async function getNextIssueNumber(volume: number): Promise<number> {
  try {
    const { data } = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/magazines?volume=${volume}`,
    );

    if (!data.results || data.results.length === 0) {
      return 1;
    }

    const lastIssue = Math.max(
      ...data.results.map((mag: Magazine) => mag.issue),
    );
    return lastIssue + 1;
  } catch (error) {
    console.error('Error fetching last issue number:', error);
    return 1;
  }
}

function resetForm() {
  const currentVolume = new Date().getFullYear() - 2025 + 1;

  magazine.value = {
    id: null,
    title: '',
    subtitle: '',
    incident_ids: [],
    incident_name: '',
    volume: currentVolume,
    issue: 1, // This will be updated after fetching the last issue number
    issn: '',
    publish_at: '2025-05-12',
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
  };

  // Fetch the next issue number for the current volume
  getNextIssueNumber(currentVolume).then((nextIssue) => {
    magazine.value.issue = nextIssue;
  });

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

    // Save the magazine data
    await axios.put(
      `${import.meta.env.VITE_APP_API_BASE_URL}/magazines/${editingMagazine.value.id}`,
      dataToSave,
    );

    // Save any new editions
    const newEditions = editingMagazine.value.editions.filter(
      (edition: { id: any }) => !edition.id,
    );
    if (newEditions.length > 0) {
      for (const edition of newEditions) {
        // First upload the file if it exists
        let fileId = null;
        if (edition.file_data) {
          const fileFormData = new FormData();
          fileFormData.append('upload', edition.file_data);
          fileFormData.append('type_t', 'fileTypes.magazine_issue');
          fileFormData.append('filename', edition.file_details?.filename || '');
          fileFormData.append(
            'content_type',
            edition.file_details?.mime_content_type || '',
          );
          fileFormData.append('title', editingMagazine.value.title);

          const fileResponse = await axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
            fileFormData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
              },
            },
          );
          fileId = fileResponse.data.id;
        }

        // Then upload the thumbnail if it exists
        let thumbnailId = null;
        if (edition.thumbnail_data) {
          const thumbnailFormData = new FormData();
          thumbnailFormData.append('upload', edition.thumbnail_data);
          thumbnailFormData.append('type_t', 'fileTypes.other_file');
          thumbnailFormData.append(
            'filename',
            edition.thumbnail_details?.filename || '',
          );
          thumbnailFormData.append(
            'content_type',
            edition.thumbnail_details?.mime_content_type || '',
          );
          thumbnailFormData.append(
            'title',
            `${editingMagazine.value.title} - Thumbnail`,
          );

          const thumbnailResponse = await axios.post(
            `${import.meta.env.VITE_APP_API_BASE_URL}/files`,
            thumbnailFormData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
              },
            },
          );
          thumbnailId = thumbnailResponse.data.id;
        }

        // Finally create the edition
        const editionData = {
          name: edition.name,
          short_name: edition.short_name || '',
          is_primary: edition.is_primary,
          magazine: editingMagazine.value.id,
          file: fileId,
          thumbnail_file: thumbnailId,
        };

        await axios.post(
          `${import.meta.env.VITE_APP_API_BASE_URL}/editions`,
          editionData,
        );
      }
    }

    $toasted.success(t('adminMagazine.magazine_updated_successfully'));
    await getExistingMagazineFiles();
    editingMagazine.value = null;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function deleteEdition(magazineId: string, editionId: string) {
  if (!confirm(t('adminMagazine.delete_edition_confirmation'))) {
    return;
  }

  try {
    await axios.delete(
      `${import.meta.env.VITE_APP_API_BASE_URL}/editions/${editionId}`,
    );
    $toasted.success(t('adminMagazine.edition_deleted_successfully'));
    await getExistingMagazineFiles();
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

async function addEditionToExistingMagazine(magazineId: string) {
  try {
    const newEdition = {
      name: '',
      short_name: '',
      file: null,
      file_details: null,
      thumbnail_file: null,
      thumbnail_details: null,
      thumbnail_data: null,
      is_primary: false,
      file_data: null,
    };

    // Add to the editing magazine's editions array
    if (editingMagazine.value) {
      editingMagazine.value.editions.push(newEdition);
    }

    // Show the edition form
    selectedIssueIndex.value = editingMagazine.value?.editions.length
      ? editingMagazine.value.editions.length - 1
      : 0;
  } catch (error) {
    $toasted.error(getErrorMessage(error));
  }
}

function removeEditionFromEdit(index: number) {
  if (confirm(t('adminMagazine.remove_edition_confirmation'))) {
    editingMagazine.value?.editions.splice(index, 1);
  }
}

function removeFileFromEdit(index: number) {
  if (editingMagazine.value) {
    editingMagazine.value.editions[index].file = null;
    editingMagazine.value.editions[index].file_details = null;
    editingMagazine.value.editions[index].file_data = null;
  }
}

function removeThumbnailFromEdit(index: number) {
  if (editingMagazine.value) {
    editingMagazine.value.editions[index].thumbnail_file = null;
    editingMagazine.value.editions[index].thumbnail_details = null;
    editingMagazine.value.editions[index].thumbnail_data = null;
  }
}

function handleFileSelectionForEdit(fileList: File[], index: number) {
  if (fileList.length === 0 || !editingMagazine.value) {
    return;
  }

  const file = fileList[0];
  if (file.type !== 'application/pdf' && file.type !== 'application/zip') {
    $toasted.error(t('adminMagazine.only_pdf_and_zip_files_are_allowed'));
    return;
  }

  editingMagazine.value.editions[index].file_data = file;
  editingMagazine.value.editions[index].file_details = {
    filename: file.name,
    size: file.size,
    mime_content_type: file.type,
  };
}

function handleThumbnailSelectionForEdit(fileList: File[], index: number) {
  if (fileList.length === 0 || !editingMagazine.value) {
    return;
  }

  const file = fileList[0];
  if (!file.type.startsWith('image/')) {
    $toasted.error(
      t('adminMagazine.only_image_files_are_allowed_for_thumbnails'),
    );
    return;
  }

  editingMagazine.value.editions[index].thumbnail_data = file;
  editingMagazine.value.editions[index].thumbnail_details = {
    filename: file.name,
    size: file.size,
    mime_content_type: file.type,
  };
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
