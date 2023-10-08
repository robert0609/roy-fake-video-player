import { computed, defineComponent, onBeforeUnmount, ref } from 'vue';

export default defineComponent({
  name: 'FakeProgressBar',
  props: {
    // 当前进度毫秒数
    progress: {
      type: Number,
      default: 0
    },
    min: {
      type: Number,
      default: 0
    },
    // 最大毫秒数
    max: {
      type: Number,
      required: true
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  setup(props, { emit }) {
    const isPlaying = ref(false);

    const ts = computed(() => {
      const minutes = Math.floor(props.progress / 60000);
      const seconds = Math.floor((props.progress % 60000) / 1000);
      return { minutes: minutes < 10 ? `0${minutes}` : minutes.toString(), seconds: seconds < 10 ? `0${seconds}` : seconds.toString() };
    });

    function start() {
      if (props.disabled) {
        return;
      }
      isPlaying.value = true;
      emit('start');
    }
    function stop() {
      if (props.disabled) {
        return;
      }
      isPlaying.value = false;
      emit('stop');
    }

    return () => (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {!isPlaying.value ? (
          <span
            onClick={start}
            style={{
              cursor: 'pointer'
            }}
          >
            play
          </span>
        ) : (
          <span
            onClick={stop}
            style={{
              cursor: 'pointer'
            }}
          >
            stop
          </span>
        )}
        <div
          style={{
            width: '100%',
            position: 'relative',
            height: '24px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <input
            type="range"
            style={{
              width: '100%'
            }}
            {...{
              value: props.progress,
              min: props.min,
              max: props.max,
              step: 1,
              disabled: props.disabled
            }}
          ></input>
        </div>
        <span>
          {ts.value.minutes}:{ts.value.seconds}
        </span>
      </div>
    );
  }
});
