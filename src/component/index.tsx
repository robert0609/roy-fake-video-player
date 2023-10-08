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
    const progress = ref(0);
    const disabled = ref(true);

    function loadStream(dataStream: FrameStream) {
      maxDuration.value = dataStream.totalDuration;
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

    onBeforeUnmount(() => {
      if (!!player) {
        player.stop();
        player = undefined;
      }
      stream = undefined;

      maxDuration.value = 0;
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
            onStart: handleStart,
            onStop: handleStop,
            disabled: disabled.value
          }}
        ></FakeProgressBar>
      </div>
    );
  }
});
