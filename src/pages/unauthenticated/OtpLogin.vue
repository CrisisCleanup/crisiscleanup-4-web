<script lang="ts" setup>
import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/hooks/useAuth';
import Home from '@/layouts/Home.vue';
import { getAndToastErrorMessage, getErrorMessage } from '@/utils/errors';

const { requestOtp, loginWithOtp } = useAuthStore();
const toast = useToast();
const { t } = useI18n();
const phoneNumber = ref('');
const otp = ref('');
const showOtpCodeModal = ref(false);
const form = ref(null);

const sendOtp = async () => {
  try {
    const isValid = form.value.reportValidity();
    if (!isValid) {
      return;
    }
    await requestOtp(phoneNumber.value);
    showOtpCodeModal.value = true;
    toast.success(t('~~OTP sent successfully!'));
  } catch (error) {
    getAndToastErrorMessage(error);
  }
};

const verifyOtpAndLogin = async () => {
  try {
    await loginWithOtp(phoneNumber.value, otp.value);
    showOtpCodeModal.value = false;
    toast.success(t('~~Logged in successfully!'));
    // Navigate the user to the dashboard or home page after successful login
  } catch (error) {
    getAndToastErrorMessage(error);
  }
};
</script>

<template>
  <Home>
    <div class="grid--main">
      <div class="w-2/3">
        <section class="mb-4">
          <div class="text-3xl" data-testid="testOtpDiv">
            {{ $t('loginForm.login_with_cell') }}
          </div>
          <div>
            {{ $t('~~Get a code to login with your cell phone') }}
          </div>
        </section>
        <form ref="form" class="w-108 flex flex-col gap-4" autocomplete="off">
          <base-input
            v-model="phoneNumber"
            data-testid="testPhoneNumberInput"
            type="tel"
            class="input"
            size="large"
            autocomplete="off"
            :placeholder="$t('Enter your phone number')"
            required
          />
          <base-button
            size="large"
            data-testid="testSendOtpButton"
            class="px-5 py-2 m-1 flex-grow"
            variant="solid"
            :text="$t('actions.submit')"
            :alt="$t('actions.submit')"
            :action="sendOtp"
          />
        </form>

        <modal
          v-if="showOtpCodeModal"
          data-testid="testShowRequestAccessModalModal"
          :title="$t('~~OTP Verification')"
          modal-classes="w-108"
          @close="showOtpCodeModal = false"
        >
          <div class="flex justify-around m-5">
            <base-input
              v-model="otp"
              data-testid="testOtpInput"
              type="text"
              class="input"
              size="large"
              autocomplete="off"
              :placeholder="$t('~~Enter OTP verification code')"
              required
            />
          </div>
          <template #footer>
            <div class="flex p-1 justify-center">
              <base-button
                size="large"
                data-testid="testResendOtpButton"
                class="px-5 py-2 m-1 flex-grow"
                variant="solid"
                :text="$t('~~Resend Code')"
                :alt="$t('~~Resend Code')"
                :action="sendOtp"
              />
              <base-button
                size="large"
                data-testid="testVerifyOtpButton"
                class="px-5 py-2 m-1 flex-grow"
                variant="solid"
                :text="$t('~~Verify')"
                :alt="$t('~~Verify')"
                :action="verifyOtpAndLogin"
              />
            </div>
          </template>
        </modal>
      </div>
    </div>
  </Home>
</template>

<style scoped lang="scss"></style>
