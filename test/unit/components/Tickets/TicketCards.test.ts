import { mount, flushPromises } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TicketCards from '@/components/Tickets/TicketCards.vue'; // Adjust the path if necessary
import axios from 'axios';
import { useToast } from 'vue-toastification';
import { useAuthStore, useEmitter } from '@/hooks';
import { useI18n } from 'vue-i18n';
import QRCode from '@/components/QRCode.vue';

// Mock dependencies
vi.mock('axios');
vi.mock('vue-toastification');
vi.mock('@/hooks');
vi.mock('vue-i18n');
vi.mock('@/components/QRCode.vue');

describe('TicketCards', () => {
  let wrapper;

  beforeEach(() => {
    // Reset and clear all mocks
    vi.resetAllMocks();

    // Mock the i18n function
    useI18n.mockReturnValue({
      t: (msg) => msg,
    });

    // Mock the toast function
    const toast = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    };
    useToast.mockReturnValue(toast);

    // Mock the emitter
    const emitter = {
      emit: vi.fn(),
    };
    useEmitter.mockReturnValue({ emitter });

    // Mock the auth store
    useAuthStore.mockReturnValue({
      loginWithMagicLinkToken: vi.fn(),
    });

    // Mount the component
    wrapper = mount(TicketCards, {
      props: {
        ticketData: {
          id: 1,
          user: {
            ccu_user: {
              id: 1,
              first_name: 'John',
              last_name: 'Doe',
              email: 'john.doe@example.com',
              organization: { name: 'Org' },
              accepted_terms_timestamp: '2022-01-01T00:00:00Z',
              sign_in_count: 5,
              last_sign_in_at: '2022-01-01T00:00:00Z',
            },
            name: 'John Doe',
            email: 'john.doe@example.com',
          },
          description: 'Ticket description',
          raw_subject: 'Ticket subject',
          status: 'open',
          created_at: '2022-01-01T00:00:00Z',
        },
        agents: [
          { id: 1, name: 'Agent 1' },
          { id: 2, name: 'Agent 2' },
        ],
        currentUser: {
          full_name: 'Current User',
        },
      },
      global: {
        mocks: {
          $t: (msg) => msg, // Mock the translation function
        },
      },
    });
  });

  it.todo('renders correctly with default props', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it.todo('renders the QR code with the correct value', () => {
    const qrCode = wrapper.findComponent(QRCode);
    expect(qrCode.exists()).toBe(true);
  });

  it.todo('sets the correct user information', () => {
    const userInfo = wrapper.find('.cc_user');
    expect(userInfo.text()).toContain('John Doe');
    expect(userInfo.text()).toContain('Org');
    expect(userInfo.text()).toContain('john.doe@example.com');
  });

  it.todo('fetches comments on mount', async () => {
    axios.get.mockResolvedValueOnce({
      data: {
        comments: [
          {
            id: 1,
            author_id: 1,
            body: 'Comment 1',
            attachments: [],
            metadata: { system: { ip_address: '127.0.0.1', location: 'Loc' } },
          },
        ],
      },
    });
    await flushPromises();
    expect(wrapper.vm.comments.length).toBe(1);
    expect(wrapper.vm.comments[0].body).toBe('Comment 1');
  });

  it.todo('emits the correct events on button click', async () => {
    const replyButton = wrapper.find('.reply-as .buttons__container button');
    await replyButton.trigger('click');
    expect(wrapper.vm.emitter.emit).toHaveBeenCalledWith('reFetchActiveTicket');
  });

  it.todo('sets the correct href for the zendesk link', () => {
    const zendeskLink = wrapper.find('.ticket-link');
    expect(zendeskLink.attributes('href')).toBe(
      'https://crisiscleanup.zendesk.com/agent/tickets/1',
    );
  });

  it.todo('opens the correct URL for the worksite page', () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => {});
    wrapper.vm.openWorkSitePage(1, 1);
    expect(openSpy).toHaveBeenCalledWith(
      'https://crisiscleanup.org/incident/1/work/1?showOnMap=true',
      '_blank',
    );
  });

  it.todo('calls axios to fetch the active ticket', async () => {
    axios.get.mockResolvedValueOnce({
      data: { ticket: { status: 'open', assignee_id: 1 } },
    });
    await wrapper.vm.fetchActiveTicket();
    expect(wrapper.vm.ticketTestData.status).toBe('open');
    expect(wrapper.vm.ticketTestData.assignee_id).toBe(1);
  });

  it.todo('calls axios to reply to the ticket', async () => {
    axios.put.mockResolvedValueOnce({ status: 200 });
    await wrapper.vm.replyToTicket('open');
    expect(wrapper.vm.toast.success).toHaveBeenCalledWith(
      'helpdesk.reply_success',
    );
  });

  it.todo('displays the correct invitation information', async () => {
    axios.get.mockResolvedValueOnce({
      data: { results: [{ id: 1, email: 'invite@example.com' }] },
    });
    await flushPromises();
    expect(wrapper.vm.invitations.length).toBe(1);
    expect(wrapper.vm.invitations[0].email).toBe('invite@example.com');
  });
});
