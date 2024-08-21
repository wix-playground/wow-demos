import { describe, it, expect, vi } from 'vitest';
import { resolveConfig } from './kampos-effects';
import * as mediaUtils from '../utils/media-utils'; // Adjust the path as necessary

// Mock the module that contains loadImage and loadVideo
vi.mock('../utils/video-utils', () => ({
  loadImage: vi.fn(async (path: string) => `image:${path}`),
  loadVideo: vi.fn(async (path: string) => `video:${path}`),
}));

describe('resolveConfig', () => {
  it('should resolve hex color values to normalized RGBA', async () => {
    const config = {
      backgroundColor: '#ff0000',
    };

    const resolvedConfig = await resolveConfig(config);

    expect(resolvedConfig).toEqual({
      backgroundColor: [1, 0, 0, 1], // The normalized RGBA for #ff0000
    });
  });

  it('should resolve media paths to image or video objects', async () => {
    const config = {
      backgroundImage: '/path/to/image.png',
      videoSource: '/path/to/video.mp4',
    };

    const resolvedConfig = await resolveConfig(config);

    expect(resolvedConfig).toEqual({
      backgroundImage: 'image:/path/to/image.png',
      videoSource: 'video:/path/to/video.mp4',
    });
  });

  it('should filter out "none" and "WIP" values', async () => {
    const config = {
      backgroundColor: '#ff0000',
      filter: 'none',
      status: 'WIP',
    };

    const resolvedConfig = await resolveConfig(config);

    expect(resolvedConfig).toEqual({
      backgroundColor: [1, 0, 0, 1],
    });
  });

  it('should return non-string values as-is', async () => {
    const config = {
      alpha: 0.5,
      threshold: 128,
    };

    const resolvedConfig = await resolveConfig(config);

    expect(resolvedConfig).toEqual({
      alpha: 0.5,
      threshold: 128,
    });
  });

  it('should handle a mixture of values', async () => {
    const config = {
      backgroundColor: '#00ff00',
      backgroundImage: '/path/to/image.png',
      opacity: 0.8,
      filter: 'none',
    };

    const resolvedConfig = await resolveConfig(config);

    expect(resolvedConfig).toEqual({
      backgroundColor: [0, 1, 0, 1], // The normalized RGBA for #00ff00
      backgroundImage: 'image:/path/to/image.png',
      opacity: 0.8,
    });
  });

  it('should cache resolved media paths', async () => {
    const path = '/path/to/image.png';
    const config = {
      backgroundImage: path,
    };

    // First resolution - this should call loadImage
    await resolveConfig(config);
    expect(mediaUtils.loadImage).toHaveBeenCalledWith(path);

    // Second resolution should hit the cache and not call loadImage again
    await resolveConfig(config);
    expect(mediaUtils.loadImage).toHaveBeenCalledTimes(1);
  });

  it('should return the path as a string for unknown media types', async () => {
    const config = {
      unknownMedia: '/path/to/file.txt',
    };

    const resolvedConfig = await resolveConfig(config);

    expect(resolvedConfig).toEqual({
      unknownMedia: '/path/to/file.txt',
    });
  });
});
