import { defineComponent, onBeforeUnmount, ref } from 'vue';
import { FrameStream } from '../stream';
import { Player } from '../player';
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

    function loadStream(dataStream: FrameStream) {
      maxDuration.value = dataStream.totalDuration;
      frameDuration.value = dataStream.frameDuration;

      player = new Player(playerDomId, dataStream, {
        width: props.width,
        height: props.height
      });
      player.on('progress', ({ timestamp }) => {
        progress.value = timestamp;
      });
      dataStream.on('fullLoad', () => {
        disabled.value = false;
      });
      stream = dataStream;
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
    function handleSeek(e: { progress: number }) {
      if (!player || !stream) {
        throw new Error(`播放器未初始化，不能跳转播放`);
      }
      player.seek(stream.startTimestamp + e.progress).catch((e) => {
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
            onSeek: handleSeek,
            disabled: disabled.value
          }}
        ></FakeProgressBar>
      </div>
    );
  }
});
