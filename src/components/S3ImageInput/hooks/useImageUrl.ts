import { type ImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';

interface UseImageUrlParameters<T extends SanityImageSource | undefined> {
  imageSource?: T;
  imageUrlBuilder: ImageUrlBuilder;
  transform?: (builder: ImageUrlBuilder, value: SanityImageSource) => string | undefined;
}

interface UseImageUrlResult {
  url: string | undefined;
}

/**
 * Hook for resolving image URLs with Private asset support.
 *
 * Handles applying URL transformations and object URL generation when needed.
 *
 * @internal
 */
export function useImageUrl<T extends SanityImageSource = SanityImageSource>(
  params: UseImageUrlParameters<T>
): UseImageUrlResult {
  const { imageSource, imageUrlBuilder, transform } = params;

  const networkUrl = (() => {
    if (!imageSource) return undefined;
    // Apply the transformations if provided.
    if (transform) {
      return transform(imageUrlBuilder, imageSource);
    }

    return imageUrlBuilder.image(imageSource).url();
  })();

  return {
    url: networkUrl
  };
}
