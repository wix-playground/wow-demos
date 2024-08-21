import { describe, it, expect, vi } from 'vitest';
import { resolveConfig } from './kampos-effects';
import * as mediaUtils from '../utils/media-utils';

// Mock the module that contains loadImage and loadVideo
vi.mock('../utils/media-utils', () => ({
  loadImage: vi.fn(async (path: string) => `image:${path}`),
  loadVideo: vi.fn(async (path: string) => `video:${path}`),
}));

const noMattersEffectName = 'noMatters';

describe('resolveConfig', () => {
  it('should resolve hex color values to normalized RGBA', async () => {
    const config = {
      backgroundColor: '#ff0000',
    };

    const resolvedConfig = await resolveConfig(noMattersEffectName, config);

    expect(resolvedConfig).toEqual({
      backgroundColor: [1, 0, 0, 1], // The normalized RGBA for #ff0000
    });
  });

  it('should resolve media paths to image or video objects', async () => {
    const config = {
      backgroundImage: '/path/to/image.png',
      videoSource: '/path/to/video.mp4',
    };

    const resolvedConfig = await resolveConfig(noMattersEffectName, config);

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

    const resolvedConfig = await resolveConfig(noMattersEffectName, config);

    expect(resolvedConfig).toEqual({
      backgroundColor: [1, 0, 0, 1],
    });
  });

  it('should return non-string values as-is', async () => {
    const config = {
      alpha: 0.5,
      threshold: 128,
    };

    const resolvedConfig = await resolveConfig(noMattersEffectName, config);

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

    const resolvedConfig = await resolveConfig(noMattersEffectName, config);

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
    await resolveConfig(noMattersEffectName, config);
    expect(mediaUtils.loadImage).toHaveBeenCalledWith(path);

    // Second resolution should hit the cache and not call loadImage again
    await resolveConfig(noMattersEffectName, config);
    expect(mediaUtils.loadImage).toHaveBeenCalledTimes(1);
  });

  it('should return the path as a string for unknown media types', async () => {
    const config = {
      unknownMedia: '/path/to/file.txt',
    };

    const resolvedConfig = await resolveConfig(noMattersEffectName, config);

    expect(resolvedConfig).toEqual({
      unknownMedia: '/path/to/file.txt',
    });
  });


const displacementEffectName = 'displacement';
const unknownEffectName = 'unknownEffect';

describe('resolveConfig with effect config resolver logic', () => {
    it('should resolve config using the displacement effect resolver and convert scaleX and scaleY to an object', async () => {
      const config = {
        scaleX: 2,
        scaleY: 3,
        wrap: 'wrap',
        backgroundImage: '/path/to/image.png',
      };

      const resolvedConfig = await resolveConfig(displacementEffectName, config);

      expect(resolvedConfig.scale).toEqual({
        x: 2,
        y: 3,
      });
      expect(resolvedConfig.backgroundImage).toBe('image:/path/to/image.png');
    });

    it.each([
        ['CLAMP', 'clamp(dispVec'],
        ['WRAP', 'mod(dispVec'],
        ['DISCARD', 'discard;']
      ])('should resolve wrap for %s and check if wrap contains "%s"', async (wrapType, expectedContain) => {
        const config = {
          scaleX: 1,
          scaleY: 1,
          wrap: wrapType,
        };

        const resolvedConfig = await resolveConfig(displacementEffectName, config);

        expect(resolvedConfig.wrap).toContain(expectedContain);
      });

    it('should return config as-is for unknown effects', async () => {
      const config = {
        someProp: 'someValue',
        backgroundImage: '/path/to/image.png',
      };

      const resolvedConfig = await resolveConfig(unknownEffectName, config);

      expect(resolvedConfig).toEqual({
        someProp: 'someValue',
        backgroundImage: 'image:/path/to/image.png',
      });
    });
});
});
