import axios from 'axios';
import { store } from '@/store';
import Incident from '@/models/Incident';
import PhoneOutbound from '@/models/PhoneOutbound';
import useEmitter from '@/hooks/useEmitter';
import useCurrentUser from '@/hooks/useCurrentUser';
import usePhoneService from '@/hooks/phone/usePhoneService';

export interface SimulateInput {
  dnisId?: number | string;
  dnis?: string;
  phoneInboundId?: number | string;
  phoneInboundSessionId?: string;
  phoneOutboundId?: number | string;
  incidentId?: number | string;
}

const API = () => import.meta.env.VITE_APP_API_BASE_URL;

function makeSessionId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `sim-${Date.now()}-${rand}`;
}

export default function useCallSimulator() {
  const { emitter } = useEmitter();
  const currentUserStore = useCurrentUser();
  const phoneService = usePhoneService();

  async function resolvePhoneDnis({
    dnisId,
    dnis,
  }: {
    dnisId?: number | string;
    dnis?: string;
  }) {
    if (dnisId !== undefined && dnisId !== null && String(dnisId).length > 0) {
      const { data } = await axios.get(`${API()}/phone_dnis/${dnisId}`);
      return data;
    }
    if (dnis) {
      const { data } = await axios.get(
        `${API()}/phone_dnis?dnis=${encodeURIComponent(
          dnis,
        )}&sort=-created_at&limit=1`,
      );
      const [first] = data.results ?? [];
      if (!first) {
        throw new Error(`No phone_dnis record found for ${dnis}`);
      }
      return first;
    }
    throw new Error('Must provide dnisId or dnis');
  }

  async function requestIncidentAccess(incidentIds: Array<number | string>) {
    const currentUser = currentUserStore.currentUser.value;
    if (incidentIds.length === 0 || !currentUser) return;

    const available = new Set(Incident.all().map((i: any) => i.id));
    const toRequest = incidentIds.filter((id) => !available.has(id));
    try {
      await Promise.all(
        toRequest.map(async (id) =>
          axios.post(`${API()}/incident_requests`, {
            organization: currentUser.organization.id,
            incident: id,
            temporary_access: true,
          }),
        ),
      );
      await Incident.api().fetchById(incidentIds[0]);
      await currentUserStore.updateUserStates({ incident: incidentIds[0] });
      emitter.emit('update:incident', incidentIds[0]);
    } catch {
      // Matches the silent-fail behaviour of phone.service.ts:onNewCall
    }
  }

  async function simulateInbound(input: SimulateInput) {
    const currentIncidentId = store.getters['incident/currentIncidentId'];
    const incidentId = input.incidentId ?? currentIncidentId;

    let inbound: any;
    if (input.phoneInboundId) {
      const { data } = await axios.get(
        `${API()}/phone_inbound/${input.phoneInboundId}`,
      );
      inbound = data;
    } else if (input.phoneInboundSessionId) {
      const { data } = await axios.get(
        `${API()}/phone_inbound/get_by_session_id?session_id=${encodeURIComponent(
          input.phoneInboundSessionId,
        )}`,
      );
      inbound = data;
    } else {
      const preDnis = await resolvePhoneDnis(input);
      const { data } = await axios.post(`${API()}/phone_inbound`, {
        dnis: preDnis.dnis,
        incident_id: incidentId ? [Number(incidentId)] : [],
        session_id: makeSessionId(),
      });
      inbound = data;
    }

    const dnis = await resolvePhoneDnis({
      dnisId: input.dnisId,
      dnis: input.dnis ?? String(inbound?.ani ?? inbound?.dnis ?? ''),
    });

    const sessionId = inbound?.session_id ?? makeSessionId();

    phoneService.callInfo = {
      callType: 'INBOUND',
      uii: sessionId,
      sessionId,
      ani: dnis.dnis,
    };

    store.commit('phone/setIncomingCall', inbound);
    store.commit('phone/setCaller', dnis);
    store.commit('phone/setState', 'ENGAGED-INBOUND');
    store.commit('phone/setCallType', 'INBOUND');
    store.commit('phone/setCurrentCall', inbound);

    const { data: history } = await axios.post(`${API()}/phone/history`, {
      session_id: sessionId,
      dnis: dnis.id,
      inbound: inbound?.id ?? null,
    });
    store.commit('phone/setCurrentDnisHistoryRecord', history);

    const incidentIds: Array<number | string> = Array.isArray(
      inbound?.incident_id,
    )
      ? inbound.incident_id
      : [];
    await requestIncidentAccess(incidentIds);

    emitter.emit('phone_component:close');
    emitter.emit('phone_component:open', 'caller');

    return { inbound, dnis, history };
  }

  async function simulateOutbound(input: SimulateInput) {
    const currentIncidentId = store.getters['incident/currentIncidentId'];
    const incidentId = input.incidentId ?? currentIncidentId;
    const currentUser = currentUserStore.currentUser.value;

    let outbound: any;
    if (input.phoneOutboundId) {
      const { data } = await axios.get(
        `${API()}/phone_outbound/${input.phoneOutboundId}`,
      );
      outbound = data;
    } else {
      const preDnis = await resolvePhoneDnis(input);
      outbound = await PhoneOutbound.api().createManual({
        number: String(preDnis.dnis),
        incidentId,
        userId: currentUser?.id,
        language: currentUser?.primary_language,
      });
      if (!outbound) {
        throw new Error('Failed to create dummy phone_outbound record');
      }
    }

    const { data: dnis } = await axios.get(
      `${API()}/phone_dnis/${outbound.dnis1}`,
    );

    const sessionId = makeSessionId();

    phoneService.callInfo = {
      callType: 'OUTBOUND',
      uii: sessionId,
      sessionId,
      ani: dnis.dnis,
    };

    let callType = String(outbound.call_type ?? '').toUpperCase();
    if (callType !== 'CALLDOWN') callType = 'OUTBOUND';
    store.commit('phone/setCallType', callType);
    store.commit('phone/setOutgoingCall', outbound);
    store.commit('phone/setCurrentCall', outbound);
    store.commit('phone/setCaller', dnis);
    store.commit('phone/setState', 'ENGAGED-OUTBOUND');

    const { data: history } = await axios.post(`${API()}/phone/history`, {
      session_id: sessionId,
      dnis: dnis.id,
      inbound: null,
    });
    store.commit('phone/setCurrentDnisHistoryRecord', history);

    return { outbound, dnis, history };
  }

  async function endSimulation() {
    // Mirror the happy path of phone.service.ts:endCallFunction — null the
    // inbound/outbound records and flip to AWAY, but keep `call`, `caller`,
    // and `currentDnisHistoryRecord` so the UI surfaces the "Complete call"
    // button and the UpdateStatus screen can run. Also preserve
    // phoneService.callInfo.callType because PhoneSystem.completeCall
    // branches on it when patching phone/history.
    store.commit('phone/setIncomingCall', null);
    store.commit('phone/setOutgoingCall', null);
    store.commit('phone/setState', 'AWAY');
  }

  return { simulateInbound, simulateOutbound, endSimulation };
}
