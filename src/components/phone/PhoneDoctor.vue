<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import LaStethoscope from '~icons/la/stethoscope';
import BaseButton from '@/components/BaseButton.vue';
import { useCurrentUser } from '@/hooks';
import useAcl from '@/hooks/useAcl';
import UserRole from '@/models/UserRole';
import axios, { AxiosError } from 'axios';
import Language from '@/models/Language';
import useValidation from '@/hooks/useValidation';
import { isWebSocketAvailable } from '@/utils/websocket';
import PhoneTestService from '@/services/phone.test.service';
import BaseInput from '@/components/BaseInput.vue';
import User from '@/models/User';

const { t } = useI18n();
const { currentUser } = useCurrentUser();
const { $can } = useAcl();
const { validatePhoneNumber } = useValidation();
const phoneService = new PhoneTestService();

const HOTLINE_PHONE_NUMBER = computed(() => {
  if ($can('development_mode')) {
    return import.meta.env.VITE_APP_PHONE_DOCTOR_NUMBER || '2722003211';
  }

  return import.meta.env.VITE_APP_PHONE_DOCTOR_NUMBER || '4702263992';
});

const STEP_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
};

const callIssuesTroubleshootingChecklist = [
  {
    title: t('phoneDoctor.check_spam_blocking_title'),
    description: t('phoneDoctor.check_spam_blocking_instructions'),
  },
  {
    title: t('phoneDoctor.save_hotline_as_contacts_title'),
    description: t('phoneDoctor.save_hotline_as_contacts_instructions'),
  },
  {
    title: t('phoneDoctor.disable_bit_defender_title'),
    description: t('phoneDoctor.disable_bit_defender_instructions'),
  },
  {
    title: t('phoneDoctor.check_call_settings_title'),
    description: t('phoneDoctor.check_call_settings_instructions'),
  },
];

const phoneAccessToken = ref('');
const testCallConnected = ref(false);
const showingVoicemailIssues = ref(false);
const showingNoCallIssues = ref(false);
const showingNotPlayingNicelyIssues = ref(false);
const showingPressOneIssues = ref(false);
const showingPrematureHangupIssues = ref(false);

const supportedPhoneLanguages = computed(() => {
  const languages = Language.all();
  const ids = new Set([2, 7]);
  return languages.filter((l) => ids.has(Number(l.id)));
});

async function configureAgent() {
  const { data: currentAgent } = await axios.get(
    `${import.meta.env.VITE_APP_API_BASE_URL}/phone_agents/me`,
  );

  const password = import.meta.env.VITE_APP_PHONE_DEFAULT_PASSWORD;
  phoneService.username = currentAgent.agent_username;
  phoneService.password = password;
  phoneService.agent_id = currentAgent.agent_id;

  const result = await phoneService.getAccessToken();
  phoneAccessToken.value = result.accessToken;
  return { currentAgent, result };
}

const checkAgentRole = async () => {
  console.log('Checking agent role');
  const isAgent = $can('phone_agent');
  if (!isAgent) {
    const response = await UserRole.api().post(`/user_roles`, {
      user_role: 7, // Phone Agent
      user: currentUser.value.id,
    });

    console.log('Response', response);
    if (response.response instanceof AxiosError) {
      errorMessages.value.base.role = t(
        'phoneDoctor.failed_to_assign_agent_role',
      );
      stepsExpanded.value.base = true;
      return false;
    }
    return true;
  }
  console.log('Already an agent');
  return true;
};

const checkAgentLanguage = async () => {
  console.log('Checking agent language');
  stepMessages.value.base.language = [];
  stepMessages.value.base.language.push(
    t('phoneDoctor.checking_user_primary_language'),
  );
  const userPrimaryLanguage = currentUser.value.primary_language;
  const isSupported = supportedPhoneLanguages.value.some(
    (l) => l.id === userPrimaryLanguage,
  );

  if (!isSupported) {
    errorMessages.value.base.language = t(
      'phoneDoctor.primary_language_empty_unsupported',
    );
    stepMessages.value.base.language.push(
      t('phoneDoctor.updating_primary_language_english'),
    );
    const response = await User.api().patch(`/users/${currentUser.value.id}`, {
      primary_language: 2, // English
    });

    console.log('Response', response);
    if (response.response instanceof AxiosError) {
      errorMessages.value.base.language = t(
        t('phoneDoctor.failed_update_language_english'),
      );
      stepsExpanded.value.base = true;
      return false;
    }
    stepMessages.value.base.language.push(
      t('phoneDoctor.updated_language_english'),
    );
    return true;
  }
  console.log('Already supported language');
  return true;
};

const checkAgentPhoneNumber = async () => {
  console.log('Checking agent phone number');
  stepMessages.value.base.phoneNumber = [];
  stepMessages.value.base.phoneNumber.push(
    t('phoneDoctor.checking_your_phone_number'),
  );
  const mobile = currentUser.value.mobile;
  const { newValue, valid } = validatePhoneNumber(mobile);

  console.log('Validating phone number', newValue, valid);
  if (!valid) {
    errorMessages.value.base.phoneNumber = t(
      'phoneDoctor.invalid_phone_format',
    );
    stepsExpanded.value.base = true;
    return false;
  }
  console.log('Phone number is valid');
  return true;
};

const checkConnectFirstAgent = async () => {
  console.log('Checking agent setup with provider');
  stepStatuses.value.agent = STEP_STATUS.RUNNING;
  stepsExpanded.value.agent = true;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_BASE_URL}/phone_agents/me`,
    );
    if (response.data) {
      console.log('Already connected agent');
      stepStatuses.value.agent = STEP_STATUS.SUCCESS;
      stepsExpanded.value.agent = false;
      return true;
    } else {
      console.log('Connecting agent');
      const agentResponse: any = await phoneService.createAgent();
      console.log('agentResponse', agentResponse);
      if (agentResponse.data) {
        stepStatuses.value.agent = STEP_STATUS.SUCCESS;
        stepsExpanded.value.agent = false;
        return true;
      } else {
        stepStatuses.value.agent = STEP_STATUS.ERROR;
        errorMessages.value.agent = t('phoneDoctor.failed_to_connect_agent');
        stepsExpanded.value.agent = true;
        return false;
      }
    }
  } catch (error) {
    console.error('Error connecting agent', error);
    stepStatuses.value.agent = STEP_STATUS.ERROR;
    errorMessages.value.agent = t('phoneDoctor.failed_to_connect_agent');
    stepsExpanded.value.agent = true;
    return false;
  }
};

const checkWebSocket = async () => {
  console.log('Checking websocket');
  stepsExpanded.value.websocket = true;
  stepStatuses.value.websocket = STEP_STATUS.RUNNING;
  stepMessages.value.websocket = [];
  errorMessages.value.websocket = '';
  stepMessages.value.websocket.push(t('phoneDoctor.configuring_agent'));
  try {
    const { result } = await configureAgent();
    const websocketUrl = `wss://c01-con.vacd.biz:8080/?access_token=${result.accessToken}&agent_id=${phoneService.agent_id}`;
    stepMessages.value.websocket.push(t('phoneDoctor.checking_websocket'));
    await isWebSocketAvailable(websocketUrl);
    stepStatuses.value.websocket = STEP_STATUS.SUCCESS;
    console.log('Websocket is available');
    stepMessages.value.websocket.push(t('phoneDoctor.websocket_available'));
    stepsExpanded.value.websocket = false;
    return true;
  } catch (error) {
    console.error('Websocket error', error);
    stepStatuses.value.websocket = STEP_STATUS.ERROR;
    errorMessages.value.websocket = t(
      'phoneDoctor.websocket_unavailable_check_firewall_vpn',
    );
    stepsExpanded.value.websocket = true;
    stepMessages.value.websocket.push(t('phoneDoctor.websocket_unavailable'));
    return false;
  }
};

const checkAgentLogin = async () => {
  console.log('Checking agent login');
  stepsExpanded.value.connection = true;
  stepStatuses.value.connection = STEP_STATUS.RUNNING;
  stepMessages.value.connection = [];
  stepMessages.value.connection.push(
    t('phoneDoctor.configuring_phone_agent_three_dots'),
  );
  try {
    const { currentAgent, result } = await configureAgent();

    try {
      phoneService.initPhoneService(result.accessToken);
      await phoneService.logout(currentAgent.agent_id);
      await phoneService.apiLogoutAgent(currentAgent.agent_id);
    } catch (error) {
      console.error('Error initializing phone service', error);
      stepStatuses.value.connection = STEP_STATUS.ERROR;
      errorMessages.value.connection = t(
        'phoneDoctor.failed_initialize_phone_service',
      );
      stepsExpanded.value.connection = true;
      return false;
    }

    stepMessages.value.connection.push(t('phoneDoctor.logging_in'));
    const response = await phoneService.login(
      phoneService.username,
      phoneService.password,
    );
    console.log('Response', response);
    stepMessages.value.connection.push(t('phoneDoctor.login_successful'));
    await phoneService.logout(currentAgent.agent_id);
    await phoneService.apiLogoutAgent(currentAgent.agent_id);
    stepStatuses.value.connection = STEP_STATUS.SUCCESS;
    stepsExpanded.value.connection = false;
    return true;
  } catch (error) {
    console.error('Error', error);
    stepStatuses.value.connection = STEP_STATUS.ERROR;
    errorMessages.value.connection = t(
      'phoneDoctor.phone_service_login_failed',
    );
    stepsExpanded.value.connection = true;
    stepMessages.value.connection.push(t('phoneDoctor.login_failed'));
    return false;
  }
};

const checkTestCall = async () => {
  console.log('Checking test call');
  stepsExpanded.value.test = true;
  stepStatuses.value.test = STEP_STATUS.RUNNING;
  stepMessages.value.test = [];

  // Wait a bit before making the test call
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const { currentAgent, result } = await configureAgent();

  try {
    // Initialize the phone service
    phoneService.initPhoneService(
      result.accessToken,
      async (info) => {
        stepMessages.value.test.push(
          t('phoneDoctor.call_connected_waiting_input'),
        );
      },
      () => {
        console.log('New call session started');
      },
      async () => {
        console.log('End Call. Logging Out');
        await phoneService.logout(currentAgent.agent_id);
        await phoneService.apiLogoutAgent(currentAgent.agent_id);

        if (!testCallConnected.value) {
          stepStatuses.value.test = STEP_STATUS.ERROR;
          errorMessages.value.test = t('phoneDoctor.failed_to_make_test_call');
          stepsExpanded.value.test = true;
          stepMessages.value.test.push(t('phoneDoctor.test_call_failed'));
        }
      },
    );

    // Logout any existing sessions
    await phoneService.logout(currentAgent.agent_id);
    await phoneService.apiLogoutAgent(currentAgent.agent_id);

    // Login and initiate the test call
    await phoneService.login(
      phoneService.username,
      phoneService.password,
      'WORKING',
    );
    await phoneService.dial(
      HOTLINE_PHONE_NUMBER.value,
      currentUser.value.mobile,
    );
    stepMessages.value.test.push(t('phoneDoctor.test_call_initiated'));

    // remove +1 from the phone number and non-numeric characters
    const agentPhone = currentUser.value.mobile
      .replaceAll(/\D/g, '')
      .slice(-10);

    // Simplified polling mechanism
    const endpointUrl = `${import.meta.env.VITE_APP_API_BASE_URL}/phone/doctor_sessions?dnis=${agentPhone}&ani=${HOTLINE_PHONE_NUMBER.value}`; // Replace with your actual endpoint URL
    let isFinalStageReached = false;

    const pollEndpoint = () => {
      return new Promise((resolve, reject) => {
        const pollingInterval = 2000; // 2 seconds
        const timeout = 30_000; // 30 seconds

        const startTime = Date.now();

        const intervalId = setInterval(async () => {
          try {
            const response = await axios.get(endpointUrl);
            const data = response.data;

            if (Object.keys(data).length === 0) {
              // No data yet
              console.log('No data received from endpoint');
            } else if (
              data.action === 'enter_ivr' &&
              data.confirmed === false
            ) {
              // Call connected
              testCallConnected.value = true;
            } else if (
              data.action === 'user_input' &&
              data.confirmed === true
            ) {
              // User has interacted (pressed 1)
              isFinalStageReached = true;
              clearInterval(intervalId);
              resolve(true);
            }

            // Check for timeout
            if (Date.now() - startTime >= timeout) {
              clearInterval(intervalId);
              reject(
                new Error(
                  '~~Timeout: User did not interact within 30 seconds.',
                ),
              );
            }
          } catch (error) {
            clearInterval(intervalId);
            reject(new Error(error));
          }
        }, pollingInterval);
      });
    };

    try {
      await pollEndpoint();

      // Success: User has pressed 1
      stepMessages.value.test.push(t('phoneDoctor.received_input'));
      stepStatuses.value.test = STEP_STATUS.SUCCESS;
      console.log('Test call successful');
      stepMessages.value.test.push(t('phoneDoctor.test_call_successful'));

      // Perform any necessary cleanup
      await phoneService.logout(currentAgent.agent_id);
      await phoneService.apiLogoutAgent(currentAgent.agent_id);
    } catch (error) {
      // Handle timeout or other errors
      console.warn(error.message);
      stepStatuses.value.test = STEP_STATUS.ERROR;
      errorMessages.value.test = t('phoneDoctor.did_not_detect_press_1');
      stepsExpanded.value.test = true;
      stepMessages.value.test.push(
        t('phoneDoctor.test_call_failed_no_user_input'),
      );

      // Perform any necessary cleanup
      await phoneService.logout(currentAgent.agent_id);
      await phoneService.apiLogoutAgent(currentAgent.agent_id);
    }
  } catch (error) {
    console.error('Error during test call', error);
    stepStatuses.value.test = STEP_STATUS.ERROR;
    errorMessages.value.test = t('~~Failed to make test call.');
    stepsExpanded.value.test = true;
    stepMessages.value.test.push(t('~~Test call failed.'));
    return false;
  }
};

// Helper function to check if the previous step was successful
const isPreviousStepSuccessful = (currentKey) => {
  const currentIndex = steps.value.findIndex((step) => step.key === currentKey);
  if (currentIndex === 0) {
    // First step, always available
    return true;
  }
  const previousStep = steps.value[currentIndex - 1];
  return stepStatuses.value[previousStep.key] === STEP_STATUS.SUCCESS;
};

const steps = ref([
  {
    key: 'base',
    description: t('~~Check Agent Role, Language, Phone number format'),
    action: async () => {
      stepStatuses.value.base = STEP_STATUS.RUNNING;
      stepsExpanded.value.base = true;
      const role = await checkAgentRole();
      const language = await checkAgentLanguage();
      const phoneNumber = await checkAgentPhoneNumber();

      if (role && language && phoneNumber) {
        stepStatuses.value.base = STEP_STATUS.SUCCESS;
        stepsExpanded.value.base = false;
        return true;
      } else {
        stepStatuses.value.base = STEP_STATUS.ERROR;
        stepsExpanded.value.base = true;
        return false;
      }
    },
  },
  {
    key: 'agent',
    description: t('~~Check Agent Setup with provider'),
    action: checkConnectFirstAgent,
  },
  {
    key: 'websocket',
    description: t('~~Check for firewall or VPN blocking'),
    action: checkWebSocket,
  },
  {
    key: 'connection',
    description: t(
      '~~Checking connection from Crisis Cleanup to Telephone Provider',
    ),
    action: checkAgentLogin,
  },
  {
    key: 'test',
    description: t('~~Send Test Call'),
    action: checkTestCall,
  },
]);

const stepStatuses = ref(
  steps.value.reduce((acc, step) => {
    acc[step.key] = STEP_STATUS.PENDING;
    return acc;
  }, {}),
);

const errorMessages = ref(
  steps.value.reduce((acc, step) => {
    acc[step.key] =
      step.key === 'base'
        ? {
            role: '',
            language: '',
            phoneNumber: '',
          }
        : '';
    return acc;
  }, {}),
);

const stepMessages = ref(
  steps.value.reduce((acc, step) => {
    acc[step.key] = [];
    return acc;
  }, {}),
);

const stepsExpanded = ref(
  steps.value.reduce((acc, step) => {
    acc[step.key] = false;
    return acc;
  }, {}),
);

const newPhoneNumber = ref('');

const updatePhoneNumber = async () => {
  stepMessages.value.base.phoneNumber = [];
  console.log('Updating phone number to', newPhoneNumber.value);
  const { newValue, valid } = validatePhoneNumber(newPhoneNumber.value);
  if (!valid) {
    errorMessages.value.base.phoneNumber = t('~~Invalid phone number format.');
    return;
  }
  try {
    const response = await User.api().patch(`/users/${currentUser.value.id}`, {
      mobile: newValue,
    });
    console.log('Response', response);
    if (response.response instanceof AxiosError) {
      errorMessages.value.base.phoneNumber = t(
        '~~Failed to update phone number.',
      );
    } else {
      stepMessages.value.base.phoneNumber.push(t('~~Phone number updated.'));
      currentUser.value.mobile = newValue;
      // Re-run the phone number check
      const phoneNumber = await checkAgentPhoneNumber();
      if (phoneNumber) {
        errorMessages.value.base.phoneNumber = '';
        stepStatuses.value.base = STEP_STATUS.SUCCESS;
        stepsExpanded.value.base = false;
      }
    }
  } catch (error) {
    console.error('Error updating phone number', error);
    errorMessages.value.base.phoneNumber = t(
      '~~Failed to update phone number.',
    );
  }
};

const isDiagnosticsRunning = ref(false);

const runDiagnostics = async () => {
  isDiagnosticsRunning.value = true;
  showingVoicemailIssues.value = false;
  showingNoCallIssues.value = false;
  showingNotPlayingNicelyIssues.value = false;
  showingPressOneIssues.value = false;
  showingPrematureHangupIssues.value = false;

  // Reset step statuses
  for (const step of steps.value) {
    stepStatuses.value[step.key] = STEP_STATUS.PENDING;
  }

  for (const step of steps.value) {
    // Check if previous step was successful
    if (!isPreviousStepSuccessful(step.key)) {
      isDiagnosticsRunning.value = false;
      return;
    }
    // Run the step action
    const result = await step.action();
    // If the step failed, stop diagnostics
    if (!result) {
      isDiagnosticsRunning.value = false;
      return;
    }
  }
  isDiagnosticsRunning.value = false;
};

const resetStep = (key) => {
  stepStatuses.value[key] = STEP_STATUS.PENDING;
  errorMessages.value[key] = '';
  stepMessages.value[key] = [];
  stepsExpanded.value[key] = false;
  isDiagnosticsRunning.value = false;
};

const resetDiagnostics = () => {
  showingVoicemailIssues.value = false;
  showingNoCallIssues.value = false;
  showingNotPlayingNicelyIssues.value = false;
  showingPressOneIssues.value = false;
  showingPrematureHangupIssues.value = false;

  for (const step of steps.value) {
    stepStatuses.value[step.key] = STEP_STATUS.PENDING;
  }
  for (const key in errorMessages.value) {
    errorMessages.value[key] = '';
  }
  for (const key in stepMessages.value) {
    stepMessages.value[key] = [];
  }
  for (const key in stepsExpanded.value) {
    stepsExpanded.value[key] = false;
  }
  isDiagnosticsRunning.value = false;
};
</script>

<template>
  <div class="mt-20 px-6 max-h-[calc(100vh-20rem)] overflow-auto">
    <div class="flex items-start gap-2">
      <LaStethoscope
        class="w-1/3 text-7xl font-light text-crisiscleanup-dark-100"
      />
      <div>
        <span class="text-lg">
          {{
            $t(
              "~~'Phone Doctor' is a quick tool to check if your phone is ready for our virtual call center. It runs a setup check, ensuring settings and connections are good to go. If there's an issue, the doctor will suggest easy fixes to get you up and running!",
            )
          }}
        </span>
        <base-button
          :action="runDiagnostics"
          :disabled="isDiagnosticsRunning"
          class="my-6 mx-auto"
          size="large"
          variant="solid"
        >
          <span v-if="isDiagnosticsRunning">{{
            $t('~~Running Diagnostics...')
          }}</span>
          <span v-else>{{ $t('~~phoneDoctor.run_diagnostic') }}</span>
        </base-button>
      </div>
    </div>

    <div>
      <template v-for="step in steps" :key="step.key">
        <div>
          <div
            class="flex items-center gap-2 py-2 border w-full p-1 cursor-pointer"
          >
            <base-button
              :action="
                stepStatuses[step.key] === STEP_STATUS.RUNNING
                  ? () => resetStep(step.key)
                  : step.action
              "
              :disabled="!isPreviousStepSuccessful(step.key)"
              size="small"
              class="bg-primary-light"
              :class="
                stepStatuses[step.key] === STEP_STATUS.RUNNING
                  ? 'bg-red-500 text-white'
                  : 'bg-crisiscleanup-dark-100'
              "
            >
              <span v-if="stepStatuses[step.key] === STEP_STATUS.RUNNING">
                {{ $t('actions.cancel') }}
              </span>
              <span v-else>{{ $t('actions.run') }}</span>
            </base-button>

            <div
              class="flex justify-between w-full"
              @click="stepsExpanded[step.key] = !stepsExpanded[step.key]"
            >
              <div class="flex flex-col">
                <span>{{ step.description }}</span>
                <span
                  v-if="!isPreviousStepSuccessful(step.key)"
                  class="text-sm text-gray-500"
                >
                  {{ $t('~~Please complete the previous step first.') }}
                </span>
              </div>

              <div class="flex items-center">
                <span v-if="stepStatuses[step.key] === STEP_STATUS.SUCCESS">
                  <!-- Checkmark icon -->
                  <svg
                    class="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                <span v-else-if="stepStatuses[step.key] === STEP_STATUS.ERROR">
                  <!-- X icon -->
                  <svg
                    class="w-6 h-6 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </span>
                <span
                  v-else-if="stepStatuses[step.key] === STEP_STATUS.RUNNING"
                  @click="() => resetStep(step.key)"
                >
                  <!-- Spinner icon -->
                  <svg
                    class="animate-spin w-6 h-6 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                </span>
                <span v-else>
                  <!-- Pending -->
                </span>
              </div>
            </div>
          </div>

          <div v-if="stepsExpanded[step.key]" class="pl-2">
            <div class="mb-4">
              <!-- Error messages and step messages for 'base' step -->
              <div v-if="step.key === 'base'">
                <!-- Error messages -->
                <div v-if="errorMessages.base.role" class="text-red-500">
                  {{ errorMessages.base.role }}
                </div>
                <div v-if="stepMessages.base.role">
                  <div
                    v-for="message in stepMessages.base.role"
                    :key="message"
                    class="text-gray-700"
                  >
                    {{ message }}
                  </div>
                </div>
                <div v-if="errorMessages.base.language" class="text-red-500">
                  {{ errorMessages.base.language }}
                </div>
                <div v-if="stepMessages.base.language">
                  <div
                    v-for="message in stepMessages.base.language"
                    :key="message"
                    class="text-gray-700"
                  >
                    {{ message }}
                  </div>
                </div>
                <div v-if="errorMessages.base.phoneNumber" class="text-red-500">
                  {{ errorMessages.base.phoneNumber }}
                </div>
                <div v-if="stepMessages.base.phoneNumber">
                  <div
                    v-for="message in stepMessages.base.phoneNumber"
                    :key="message"
                    class="text-gray-700"
                  >
                    {{ message }}
                  </div>
                </div>

                <!-- Potential solutions or inputs -->
                <div v-if="errorMessages.base.phoneNumber">
                  <div class="flex items-center justify-between">
                    <label>{{ $t('~~Enter a valid phone number:') }}</label>
                    <base-input
                      v-model="newPhoneNumber"
                      type="text"
                      :validator="validatePhoneNumber"
                    />
                    <base-button
                      :action="updatePhoneNumber"
                      size="small"
                      variant="solid"
                    >
                      {{ $t('~~Update Phone Number') }}
                    </base-button>
                  </div>
                </div>
              </div>

              <!-- Error messages and step messages for other steps -->
              <div v-else>
                <div v-if="errorMessages[step.key]" class="text-red-500">
                  {{ errorMessages[step.key] }}
                </div>
                <div
                  v-for="message in stepMessages[step.key]"
                  :key="message"
                  class="text-gray-700"
                >
                  {{ message }}
                </div>

                <div
                  v-if="
                    step.key === 'websocket' &&
                    stepStatuses[step.key] === STEP_STATUS.ERROR
                  "
                >
                  <div>
                    {{
                      $t(`~~Are you using a work WIFI/computer or a WIFI/Computer with a VPN? If yes, please try a different computer or WIFI network. You are unable to use a VPN or strong firewall to make or receive calls.

                    To test for this we are going to use your cellphone.
                    1.  Turn off the wifi on your phone
                    2.  Go to crisiscleanup.org and log into the phone page
                    3.  Run the phone doctor there and see if we pass this stage.

                    If it still does not work, please click the help button and create a help ticket to receive further support.`)
                    }}
                  </div>
                  <div class="flex items-center justify-end">
                    <base-button
                      :action="step.action"
                      size="small"
                      class="my-2"
                      variant="solid"
                    >
                      {{ $t('~~Retry') }}
                    </base-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="stepStatuses['test'] === STEP_STATUS.ERROR">
        <div class="flex gap-3 mt-5">
          <base-button
            :action="
              () => {
                showingVoicemailIssues = true;
                showingNoCallIssues = false;
                showingNotPlayingNicelyIssues = false;
                showingPressOneIssues = false;
                showingPrematureHangupIssues = false;
              }
            "
            variant="outline"
            size="large"
          >
            {{ $t('~~Went to VoiceMail') }}
          </base-button>
          <base-button
            :action="
              () => {
                showingNoCallIssues = true;
                showingVoicemailIssues = false;
                showingNotPlayingNicelyIssues = false;
                showingPressOneIssues = false;
                showingPrematureHangupIssues = false;
              }
            "
            variant="outline"
            size="large"
          >
            {{ $t('~~No Call Received') }}
          </base-button>
          <base-button
            :action="
              () => {
                showingNotPlayingNicelyIssues = true;
                showingNoCallIssues = false;
                showingVoicemailIssues = false;
                showingPressOneIssues = false;
              }
            "
            variant="outline"
            size="large"
          >
            {{ $t('~~Not Playing Nicely') }}
          </base-button>
          <base-button
            :action="
              () => {
                showingPressOneIssues = true;
                showingNotPlayingNicelyIssues = false;
                showingNoCallIssues = false;
                showingVoicemailIssues = false;
                showingPrematureHangupIssues = false;
              }
            "
            variant="outline"
            size="large"
          >
            {{ $t('~~Press 1 Did Not Work') }}
          </base-button>
          <base-button
            :action="
              () => {
                showingPrematureHangupIssues = true;
                showingPressOneIssues = false;
                showingNotPlayingNicelyIssues = false;
                showingNoCallIssues = false;
                showingVoicemailIssues = false;
              }
            "
            variant="outline"
            size="large"
          >
            {{ $t('~~Hung up on Me') }}
          </base-button>
        </div>

        <div v-if="showingNotPlayingNicelyIssues" class="mt-5">
          {{
            $t(
              '~~Something about the system is not working correctly. You can try taking calls, but it may not work. If that happens, run the test again in about four hours. If the problem persists, please click "Help" and create a helpdesk ticket.',
            )
          }}
          <base-button
            :action="checkTestCall"
            size="small"
            variant="solid"
            class="my-3"
          >
            {{ $t('phoneDashboard.try_again') }}
          </base-button>
        </div>
        <div v-if="showingPressOneIssues" class="mt-5">
          {{ $t('~~You are dumb. Learn how to use a phone.') }}
          <base-button
            :action="checkTestCall"
            size="small"
            variant="solid"
            class="my-3"
          >
            {{ $t('phoneDashboard.try_again') }}
          </base-button>
        </div>
        <div v-if="showingVoicemailIssues" class="mt-5">
          {{
            $t(
              '~~Go into your phone settings and ensure that ‘silence unknown callers,’ ‘silence spam callers,’ and any robo-blockers/spam blockers are turned off.',
            )
          }}
        </div>

        <div v-if="showingNoCallIssues" class="mt-5">
          <div
            v-for="issue in callIssuesTroubleshootingChecklist"
            :key="issue.title"
          >
            <div class="font-bold">{{ issue.title }}</div>
            <div>{{ issue.description }}</div>

            <base-button
              :action="checkTestCall"
              size="small"
              variant="solid"
              class="my-3"
            >
              {{ $t('phoneDashboard.try_again') }}
            </base-button>
          </div>
        </div>
        <div v-if="showingPrematureHangupIssues" class="mt-5">
          {{
            $t(
              '~~If the system hung up on you without playing a message, then there is likely a problem with the telephone system. Wait 4 hours and try again. You may try taking calls, but you may run into problems. If the problem persists, enter a helpdesk ticket.',
            )
          }}
          <base-button
            :action="checkTestCall"
            size="small"
            variant="solid"
            class="my-3"
          >
            {{ $t('phoneDashboard.try_again') }}
          </base-button>
        </div>
      </div>

      <base-button
        :action="resetDiagnostics"
        size="small"
        variant="outline"
        class="mx-auto mt-5"
      >
        {{ $t('~~Start Over') }}
      </base-button>
    </div>
  </div>
</template>

<style scoped></style>
