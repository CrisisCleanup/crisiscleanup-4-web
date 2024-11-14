<script setup lang="ts">
interface SocialLink {
  name: string;
  label: string;
  link: string;
  icon: string;
}

const socials: SocialLink[] = [
  {
    name: 'facebook',
    label: 'Facebook',
    link: 'https://www.facebook.com/CrisisCleanup',
    icon: 'fa-brands fa-facebook',
  },
  {
    name: 'instagram',
    label: 'Instagram',
    link: 'https://www.instagram.com/crisiscleanup',
    icon: 'fa-brands fa-instagram',
  },
  {
    name: 'x',
    label: 'X',
    link: 'https://x.com/CrisisCleanup',
    icon: 'fa-brands fa-x-twitter',
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/company/crisis-cleanup-org',
    icon: 'fa-brands fa-linkedin',
  },
];
</script>

<template>
  <div class="socials">
    <div v-for="item in socials" :key="item.name" class="social-item">
      <a :href="item.link" target="_blank">
        <ccu-icon
          :data-testid="`testSocialLink_${item.name}`"
          :alt="`${item.name}_link`"
          size="lg"
          fa
          :type="item.icon"
          linked
        />
      </a>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.socials {
  @apply flex gap-4;
}
</style>
