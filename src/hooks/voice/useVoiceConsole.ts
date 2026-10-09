/**
 * LiveKit side of the admin Voice Console: join a room with a token from
 * `/admins/voice_console/token`, stream the transcript and the agent's
 * `cc.intake` events into reactive call state, and drive a simulated caller.
 *
 * Every call started here is a test call: the API marks the token, and the
 * agent then skips the survivor SMS and removes the case after an hour.
 */
import axios from 'axios';
import {
  type LocalAudioTrack,
  type Participant,
  Room,
  RoomEvent,
  Track,
} from 'livekit-client';
import {
  type CallState,
  applyConsoleEvent,
  createCallState,
  formatClock,
  parseConsoleEvent,
  upsertTranscript,
} from './voiceConsoleState';

const CONSOLE_TOPIC = 'cc.intake'; // agent -> console events
const TRANSCRIPTION_TOPIC = 'lk.transcription';
const CHAT_TOPIC = 'lk.chat'; // typed caller turns the agent listens on
const MAX_SIM_TURNS = 25;

export type AgentState =
  | ''
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'idle';

export interface CallSettings {
  language: string;
  model: string;
  voice: string;
}

interface SimulatedReply {
  reply: string;
  audio_b64?: string;
  audio_error?: string;
}

export function voiceConsoleUrl(path: string): string {
  return `${import.meta.env.VITE_APP_API_BASE_URL}/admins/voice_console/${path}`;
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export function useVoiceConsole() {
  const call = reactive<CallState>(createCallState());
  const status = ref<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const agentState = ref<AgentState>('');
  const elapsed = ref(0);
  const muted = ref(false);
  const log = ref<string[]>([]);
  const simulation = reactive({ running: false, status: '' });

  let room: Room | null = null;
  let startedAt = 0;
  let timer: ReturnType<typeof setInterval> | undefined;
  let audioContext: AudioContext | null = null;
  let simDestination: MediaStreamAudioDestinationNode | null = null;
  let stopRequested = false;
  let agentFinalCount = 0;
  let lastAgentActivity = 0;
  const audioElement = new Audio();
  audioElement.autoplay = true;

  const stamp = () =>
    startedAt ? formatClock((Date.now() - startedAt) / 1000) : '0:00';

  function addLog(message: string) {
    log.value.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  function watchAgentState(participant: Participant) {
    const state = participant.attributes?.['lk.agent.state'] as
      | AgentState
      | undefined;
    if (state) agentState.value = state;
  }

  function registerHandlers(current: Room) {
    current.registerTextStreamHandler(
      TRANSCRIPTION_TOPIC,
      async (reader, info) => {
        const id = reader.info.attributes?.['lk.segment_id'] || reader.info.id;
        const isAgent = info.identity !== current.localParticipant.identity;
        const line = upsertTranscript(call, {
          id,
          at: stamp(),
          who: isAgent ? 'agent' : 'caller',
          text: '',
          final: false,
        });
        for await (const chunk of reader) {
          line.text += chunk;
          if (isAgent) lastAgentActivity = Date.now();
        }
        line.final = true;
        if (isAgent) {
          agentFinalCount += 1;
          lastAgentActivity = Date.now();
        }
      },
    );
    current.registerTextStreamHandler(CONSOLE_TOPIC, async (reader) => {
      const event = parseConsoleEvent(await reader.readAll());
      if (event) applyConsoleEvent(call, event, stamp());
    });
    current.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Audio) {
        track.attach(audioElement);
        addLog('agent audio connected');
      }
    });
    current.on(RoomEvent.ParticipantAttributesChanged, (_changed, p) => {
      if (!p.isLocal) watchAgentState(p);
    });
    current.on(RoomEvent.ParticipantConnected, (p) => {
      addLog(`${p.identity} joined`);
      watchAgentState(p);
    });
    current.on(RoomEvent.ParticipantDisconnected, (p) => {
      addLog(`${p.identity} left`);
      agentState.value = '';
    });
    current.on(RoomEvent.Disconnected, () => {
      addLog('disconnected');
      teardown();
    });
  }

  async function connect(settings: CallSettings, { mic = true } = {}) {
    if (room) return;
    status.value = 'connecting';
    Object.assign(call, createCallState());
    agentFinalCount = 0;
    try {
      const { data } = await axios.post(voiceConsoleUrl('token'), settings);
      call.room = data.room;
      addLog(`connecting to ${data.url} (room ${data.room})`);
      room = new Room({ adaptiveStream: true, dynacast: true });
      registerHandlers(room);
      await room.connect(data.url, data.token);
      status.value = 'live';
      startedAt = Date.now();
      timer = setInterval(() => {
        elapsed.value = (Date.now() - startedAt) / 1000;
      }, 500);
      for (const p of room.remoteParticipants.values()) watchAgentState(p);
      if (mic) {
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          muted.value = false;
          addLog('microphone live');
        } catch (error) {
          addLog(`microphone unavailable: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      status.value = 'error';
      addLog(`error: ${(error as Error).message}`);
      room = null;
      throw error;
    }
  }

  function teardown() {
    if (simulation.running) stopRequested = true;
    clearInterval(timer);
    status.value = 'idle';
    agentState.value = '';
    room = null;
    simDestination = null;
    startedAt = 0;
  }

  async function disconnect() {
    if (room) await room.disconnect();
    teardown();
  }

  async function setMuted(value: boolean) {
    muted.value = value;
    if (room) await room.localParticipant.setMicrophoneEnabled(!value);
  }

  // ---- simulated caller ----------------------------------------------------

  async function waitForAgentTurn(since: number, timeoutMs: number) {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (stopRequested) throw new Error('stopped');
      if (agentFinalCount > since && Date.now() - lastAgentActivity > 1500)
        return;
      await sleep(250);
    }
    throw new Error('timed out waiting for the agent');
  }

  /** Swap the caller audio for a synthetic track the simulator speaks into. */
  async function ensureSimVoice(current: Room) {
    audioContext ??= new AudioContext();
    await audioContext.resume();
    if (simDestination) return;
    simDestination = audioContext.createMediaStreamDestination();
    const simTrack = simDestination.stream.getAudioTracks()[0];
    const micPublication = current.localParticipant.getTrackPublication(
      Track.Source.Microphone,
    );
    // With a mic, replace the media inside the existing publication: the
    // agent keeps the same track, and room noise can't interject.
    await (micPublication?.track
      ? (micPublication.track as LocalAudioTrack).replaceTrack(simTrack, true)
      : current.localParticipant.publishTrack(simTrack, {
          name: 'sim-caller',
          source: Track.Source.Microphone,
        }));
  }

  async function speak(base64: string) {
    if (!audioContext || !simDestination) return;
    const bytes = Uint8Array.from(atob(base64), (c) => c.codePointAt(0)!);
    const buffer = await audioContext.decodeAudioData(bytes.buffer);
    await new Promise<void>((resolve) => {
      const source = audioContext!.createBufferSource();
      source.buffer = buffer;
      source.connect(simDestination!);
      source.addEventListener('ended', () => {
        resolve();
      });
      source.start();
    });
    await sleep(1000); // trailing silence so the agent sees end of turn
  }

  async function runSimulation(facts: string, settings: CallSettings) {
    if (!facts.trim() || simulation.running) return;
    stopRequested = false;
    simulation.running = true;
    simulation.status = 'Connecting…';
    const conversation: { role: 'agent' | 'caller'; text: string }[] = [];
    try {
      if (!room) await connect(settings, { mic: false });
      const current = room!;
      await ensureSimVoice(current);
      simulation.status = 'Waiting for the greeting…';
      try {
        await waitForAgentTurn(0, 20_000);
      } catch (error) {
        if ((error as Error).message === 'stopped') throw error;
      }
      for (let turn = 1; turn <= MAX_SIM_TURNS; turn++) {
        if (stopRequested) throw new Error('stopped');
        conversation.length = 0;
        for (const line of call.transcript) {
          if (line.final && line.who !== 'caller') {
            conversation.push({
              role: line.who === 'agent' ? 'agent' : 'caller',
              text: line.text,
            });
          }
        }
        simulation.status = `Turn ${turn} — caller thinking…`;
        const { data } = await axios.post<SimulatedReply>(
          voiceConsoleUrl('simulate'),
          { facts, transcript: conversation.slice(-30), speak: true },
        );
        if (!data.reply) throw new Error('the simulator gave an empty reply');
        if (data.reply.trim().toUpperCase() === 'HANGUP') {
          simulation.status = 'Call complete — the caller hung up.';
          return;
        }
        upsertTranscript(call, {
          id: `sim-${turn}`,
          at: stamp(),
          who: 'simulated',
          text: data.reply,
          final: true,
        });
        simulation.status = `Turn ${turn} — caller speaking`;
        const before = agentFinalCount;
        if (data.audio_b64) {
          await speak(data.audio_b64);
        } else {
          if (data.audio_error)
            addLog(`caller audio failed: ${data.audio_error}`);
          await current.localParticipant.sendText(data.reply, {
            topic: CHAT_TOPIC,
          });
        }
        await waitForAgentTurn(before, 60_000);
      }
      simulation.status = `Stopped after ${MAX_SIM_TURNS} turns (safety cap).`;
    } catch (error) {
      const message = (error as Error).message;
      simulation.status =
        message === 'stopped'
          ? 'Stopped, or the call ended.'
          : `Failed: ${message}`;
      if (message !== 'stopped') addLog(`simulated call error: ${message}`);
    } finally {
      simulation.running = false;
    }
  }

  function stopSimulation() {
    stopRequested = true;
  }

  onBeforeUnmount(() => {
    void disconnect();
  });

  return {
    call,
    status,
    agentState,
    elapsed,
    muted,
    log,
    simulation,
    connect,
    disconnect,
    setMuted,
    runSimulation,
    stopSimulation,
  };
}
