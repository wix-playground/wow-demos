import { setState, getQueryValue } from './state';
import { getVideoElement, VIDEO_SOURCE_OPTIONS } from './constants';
import { setVideoSource } from './utilts';

class VideoSelector extends HTMLElement {
  private currentSelected: string | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    const initialState = getQueryValue();
    const initialVideo = initialState.children.find((v: any) => v.label === 'video')?.binding.value;
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
        .drag-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 80px;
          height: 45px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 5px;
          color: #fff;
          font-size: 10px;
          text-align: center;
          cursor: default;
          border: 2px dashed #fff;
        }
      </style>
      ${Object.entries(VIDEO_SOURCE_OPTIONS)
        .map(
          ([name, source]) => `
            <img
              class="thumbnail${this.currentSelected === source ? ' selected' : ''}"
              src="./assets/${source.replace('.mp4', '.jpg')}"
              alt="${name}"
              data-source="${source}"
            />
          `
        )
        .join('')}
      <div class="drag-info">
        <span>Drag file</span>
      </div>
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

    // Add drag and drop event listeners
    this.addEventListener('dragover', this.handleDragOver.bind(this));
    this.addEventListener('drop', this.handleDrop.bind(this));
  }

  handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        const videoUrl = URL.createObjectURL(file);
        this.selectVideo(videoUrl);
      } else {
        alert('Please drop a valid video file.');
      }
    }
  }

  selectVideo(source: string) {
    const currentState = getQueryValue();
    const videoChild = currentState.children.find((v: any) => v.label === 'video');
    if (videoChild) {
      videoChild.binding.value = source;
    }
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
