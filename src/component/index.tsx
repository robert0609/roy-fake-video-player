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
    });

    expose({
      loadStream
    });

    return () => (
      <div
        style={{
          width: `${props.width}px`
        }}
      >
        <canvas id={playerDomId}></canvas>
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
