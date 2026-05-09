import { useState, useRef } from 'react';
import {
  View,
  Image,
  FlatList,
  Dimensions,
  ViewToken,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ImageCarouselProps {
  images: string[];
  height?: number;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackEmoji?: string;
}

/**
 * Horizontal paging carousel with dot indicators. Used on the
 * hebergement-detail hero so clients see every photo posted by the
 * hebergeur, not just the first.
 *
 * If `images` is empty, falls back to a centered icon/emoji on a tinted
 * background so the layout doesn't collapse.
 */
export function ImageCarousel({
  images,
  height = 240,
  fallbackIcon = 'image-outline',
  fallbackEmoji,
}: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const screenWidth = Dimensions.get('window').width;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && typeof viewableItems[0].index === 'number') {
        setActiveIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  if (images.length === 0) {
    return (
      <View style={[styles.fallback, { height, width: screenWidth }]}>
        {fallbackEmoji ? (
          <Text style={{ fontSize: 64 }}>{fallbackEmoji}</Text>
        ) : (
          <Ionicons name={fallbackIcon} size={64} color="rgba(255,255,255,0.7)" />
        )}
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        keyExtractor={(uri, idx) => `${idx}-${uri}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={{ width: screenWidth, height }} resizeMode="cover" />
        )}
      />
      {images.length > 1 && (
        <View style={styles.dotsContainer}>
          {images.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                idx === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
  dotActive: {
    width: 22,
    backgroundColor: 'white',
  },
  dotInactive: {
    width: 7,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
});
