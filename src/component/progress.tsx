import { computed, defineComponent, ref, watch } from 'vue';
import { debounce } from 'lodash-es';

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
    step: {
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
      if (props.disabled || isPlaying.value) {
        return;
      }
      isPlaying.value = true;
      emit('start');
    }
    function stop() {
      if (props.disabled || !isPlaying.value) {
        return;
      }
      isPlaying.value = false;
      emit('stop');
    }

    watch(
      () => props.progress,
      () => {
        // 监听进度变化，如果到头了，自动将正在播放的状态置为停止播放
        if (props.progress >= props.max && isPlaying.value) {
          isPlaying.value = false;
          emit('stop');
        }
      }
    );

    const handleInput = debounce((e: Event) => {
      const newProgress = (e.target as HTMLInputElement).value;
      emit('seek', { progress: Number(newProgress) });
    }, 100);

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
              ['onInput']: handleInput,
              min: props.min,
              max: props.max,
              step: props.step,
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
