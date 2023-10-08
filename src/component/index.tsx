import { defineComponent, onBeforeUnmount, ref, PropType } from 'vue';
import { FrameStream } from '../stream';
import { PlayMode, Player } from '../player';
import FakeProgressBar from './progress';

export const FakeVideoPlayer = defineComponent({
  name: 'FakeVideoPlayer',
  props: {
    name: {
      type: String,
      required: true
    },
    width: {
      type: Number,
      default: 800
    },
    height: {
      type: Number,
      default: 600
    },
    mode: {
      type: Number as PropType<PlayMode>,
      default: PlayMode.buffer
    }
  },
  setup(props, { expose }) {
    const playerDomId = `player-${props.name}`;

    let stream: FrameStream | undefined;
    let player: Player | undefined;

    const maxDuration = ref(0);
    const frameDuration = ref(0);
    const progress = ref(0);
    const disabled = ref(true);

    const loading = ref(false);

    let needToRecoverPlay = false;

    function loadStream(dataStream: FrameStream) {
      maxDuration.value = dataStream.totalDuration;
      frameDuration.value = dataStream.frameDuration;

      player = new Player(playerDomId, dataStream, {
        width: props.width,
        height: props.height,
        mode: props.mode
      });
      player.on('progress', ({ timestamp }) => {
        progress.value = timestamp;
      });
      if (props.mode === PlayMode.buffer) {
        player.on('ready', () => {
          disabled.value = false;
        });
      } else {
        dataStream.on('fullLoad', () => {
          disabled.value = false;
        });
      }
      stream = dataStream;

      dataStream.on('pending', () => {
        loading.value = true;
      });
      dataStream.on('resume', () => {
        loading.value = false;
      });
      dataStream.on('cancel', () => {
        loading.value = false;
      });

      // 开始加载数据流
      dataStream.seek();
    }

    function handleStart() {
      player?.start().catch((e) => {
        console.error(e);
      });
    }
    function handleStop() {
      player?.stop().catch((e) => {
        console.error(e);
      });
    }
    function handleSeekStart() {
      (async () => {
        if (player?.isPlaying === true) {
          await player?.pause();
          needToRecoverPlay = true;
        }
      })().catch((e) => {
        console.error(e);
      });
    }
    function handleSeekEnd(e: { progress: number }) {
      (async () => {
        if (!player || !stream) {
          throw new Error(`播放器未初始化，不能跳转播放`);
        }
        await player.seek(stream.startTimestamp + e.progress);
        if (needToRecoverPlay) {
          if (player.canContinuePlay) {
            await player?.start();
          }
          needToRecoverPlay = false;
        }
      })().catch((e) => {
        console.error(e);
      });
    }

    onBeforeUnmount(() => {
      if (!!player) {
        player.stop();
        player = undefined;
      }
      stream = undefined;

      maxDuration.value = 0;
      frameDuration.value = 0;
      progress.value = 0;
      disabled.value = true;

      loading.value = false;
    });

    expose({
      loadStream
    });

    return () => (
      <div
        style={{
          width: `${props.width}px`,
          position: 'relative'
        }}
      >
        <canvas id={playerDomId}></canvas>
        {loading.value ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'absolute',
              top: '0px',
              width: '100%',
              height: '100%'
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style="margin: auto; background: none; display: block; shape-rendering: auto;"
              width="200px"
              height="200px"
              viewBox="0 0 100 100"
              preserveAspectRatio="xMidYMid"
            >
              <g transform="rotate(0 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.9166666666666666s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(30 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.8333333333333334s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(60 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.75s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(90 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.6666666666666666s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(120 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5833333333333334s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(150 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.5s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(180 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.4166666666666667s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(210 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.3333333333333333s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(240 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.25s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(270 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.16666666666666666s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(300 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="-0.08333333333333333s" repeatCount="indefinite"></animate>
                </rect>
              </g>
              <g transform="rotate(330 50 50)">
                <rect x="47" y="24" rx="3" ry="6" width="6" height="12" fill="#413b3c">
                  <animate attributeName="opacity" values="1;0" keyTimes="0;1" dur="1s" begin="0s" repeatCount="indefinite"></animate>
                </rect>
              </g>
            </svg>
          </div>
        ) : undefined}
        <FakeProgressBar
          {...{
            progress: progress.value,
            max: maxDuration.value,
            step: frameDuration.value,
            onStart: handleStart,
            onStop: handleStop,
            onSeekStart: handleSeekStart,
            onSeekEnd: handleSeekEnd,
            disabled: disabled.value
          }}
        ></FakeProgressBar>
      </div>
    );
  }
});
