import { setState, getQueryValue } from './state';
import { getVideoElement, VIDEO_SOURCE_OPTIONS } from './constants';
import { setVideoSource } from './utilts';

interface State {
  children: Array<{
    label: string;
    binding: {
      value: string;
    };
  }>;
}

class VideoSelector extends HTMLElement {
  private currentSelected: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    const initialState = getQueryValue() as State;
    const initialVideo = initialState.children.find((v) => v.label === 'video')?.binding.value;
    if (initialVideo) {
      this.updateSelectedVideo(initialVideo);
    }
  }

  render() {
    if(!this.shadowRoot) {
      return;
    }
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.5);
          padding: 10px;
          border-radius: 10px;
        }
        .thumbnail {
          width: 80px;
          height: 45px;
          border: 2px solid transparent;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .thumbnail:hover {
          transform: scale(1.1);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
        }
        .thumbnail.selected {
          border-color: #fff;
        }
      </style>
      ${Object.entries(VIDEO_SOURCE_OPTIONS)
        .map(
          ([name, source]) => `
            <img
              class="thumbnail${this.currentSelected === source ? ' selected' : ''}"
              src="./demo/${source.replace('.mp4', '.jpg')}"
              alt="${name}"
              data-source="${source}"
            />
          `
        )
        .join('')}
    `;
  }

  setupEventListeners() {
    if(!this.shadowRoot) {
      return;
    }
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target instanceof HTMLElement && e.target.classList.contains('thumbnail')) {
        const source = e.target.dataset.source;
        if (source) {
          this.selectVideo(source);
        }
      }
    });
  }

  selectVideo(source: string) {
    const currentState = getQueryValue() as State;
    console.log('currentState', currentState);
    const videoChild = currentState.children.find((v) => v.label === 'video');
    if (videoChild) {
      videoChild.binding.value = source;
    }
    console.log('updated state', currentState, source);
    setVideoSource(getVideoElement(), source);
    setState(currentState);
    this.updateSelectedVideo(source);
  }

  updateSelectedVideo(source: string) {
    this.currentSelected = source;
    this.shadowRoot?.querySelectorAll('.thumbnail').forEach((thumb) => {
      if (thumb instanceof HTMLElement) {
        thumb.classList.toggle('selected', thumb.dataset.source === source);
      }
    });
  }
}

customElements.define('video-selector', VideoSelector);
