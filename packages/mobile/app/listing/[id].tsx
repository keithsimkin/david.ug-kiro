import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Listing } from '@shared/types';
import { ListingService } from '@shared/services/listing.service';
import { MessagingService } from '@shared/services/messaging.service';
import { AnalyticsService } from '@shared/services/analytics.service';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { SaveButton } from '../../components/listings/SaveButton';

const listingService = new ListingService(supabase);
const analyticsService = new AnalyticsService(supabase);
const { width } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadListing(id);
      trackView(id);
    }
  }, [id]);

  const loadListing = async (listingId: string) => {
    setLoading(true);
    const { listing: data, error: err } = await listingService.getListingById(listingId);

    if (err || !data) {
      setError('Failed to load listing');
    } else {
      setListing(data);
    }

    setLoading(false);
  };

  const trackView = async (listingId: string) => {
    await listingService.incrementViewCount(listingId);
    // Track analytics event
    await analyticsService.trackView(listingId, user?.id);
  };

  const handleContactClick = async () => {
    if (listing) {
      await listingService.incrementContactCount(listing.id);
      // Track analytics event
      await analyticsService.trackContact(listing.id, user?.id);
    }
  };

  const handlePhoneClick = () => {
    if (listing?.contactPhone) {
      Linking.openURL(`tel:${listing.contactPhone}`);
      handleContactClick();
    }
  };

  const handleEmailClick = () => {
    if (listing?.contactEmail) {
      Linking.openURL(`mailto:${listing.contactEmail}`);
      handleContactClick();
    }
  };

  const handleMessageClick = async () => {
    if (!listing || !user) {
      Alert.alert('Error', 'Please log in to message the seller');
      return;
    }

    if (listing.userId === user.id) {
      Alert.alert('Info', 'You cannot message yourself');
      return;
    }

    handleContactClick();

    try {
      // Get or create conversation
      const conversation = await MessagingService.getOrCreateConversation({
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.userId,
      });

      // Navigate to conversation
      router.push(`/conversation/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to start conversation. Please try again.');
    }
  };



  const handleShareClick = async () => {
    if (listing) {
      try {
        await Share.share({
          message: `${listing.title}\n${listing.description}\n\nPrice: ${formatPrice(
            listing.price,
            listing.currency
          )}`,
          title: listing.title,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading listing...</Text>
      </View>
    );
  }

  if (error || !listing) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Listing not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <View style={styles.imageContainer}>
          {listing.images.length > 0 ? (
            <>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(e) => {
                  const index = Math.round(e.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {listing.images.map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
              </ScrollView>
              {listing.images.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {currentImageIndex + 1} / {listing.images.length}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <View style={styles.noImage}>
              <Ionicons name="image-outline" size={64} color="#ccc" />
              <Text style={styles.noImageText}>No image available</Text>
            </View>
          )}

          {/* Back Button */}
          <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <View style={styles.actionButton}>
              <SaveButton listingId={listing.id} size={24} color="#fff" />
            </View>
            <TouchableOpacity style={styles.actionButton} onPress={handleShareClick}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Price and Title */}
          <View style={styles.header}>
            <Text style={styles.price}>{formatPrice(listing.price, listing.currency)}</Text>
            <Text style={styles.title}>{listing.title}</Text>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{listing.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{formatDate(listing.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="eye-outline" size={16} color="#666" />
              <Text style={styles.metaText}>{listing.viewCount} views</Text>
            </View>
            {listing.condition && (
              <View style={styles.conditionBadge}>
                <Text style={styles.conditionText}>{listing.condition}</Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description}</Text>
          </View>

          {/* Category */}
          {listing.category && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <Text style={styles.categoryText}>{listing.category.name}</Text>
            </View>
          )}

          {/* Seller Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Seller Information</Text>
            {listing.user && (
              <View style={styles.sellerInfo}>
                {listing.user.avatarUrl ? (
                  <Image
                    source={{ uri: listing.user.avatarUrl }}
                    style={styles.avatar}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {listing.user.fullName.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.sellerDetails}>
                  <Text style={styles.sellerName}>{listing.user.fullName}</Text>
                  <Text style={styles.sellerUsername}>@{listing.user.username}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Safety Tips */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            <View style={styles.safetyTips}>
              <Text style={styles.safetyTip}>• Meet in a public place</Text>
              <Text style={styles.safetyTip}>• Check the item before you buy</Text>
              <Text style={styles.safetyTip}>• Pay only after collecting the item</Text>
              <Text style={styles.safetyTip}>• Don't share personal information</Text>
              <Text style={styles.safetyTip}>• Report suspicious listings</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Contact Buttons */}
      <View style={styles.footer}>
        {listing.contactPhone && (
          <TouchableOpacity style={styles.primaryButton} onPress={handlePhoneClick}>
            <Ionicons name="call" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Call Seller</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.secondaryButton} onPress={handleMessageClick}>
          <Ionicons name="chatbubble-outline" size={20} color="#2563eb" />
          <Text style={styles.secondaryButtonText}>Message</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    width: width,
    height: width * 0.75,
    backgroundColor: '#f0f0f0',
    position: 'relative',
  },
  image: {
    width: width,
    height: width * 0.75,
  },
  noImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  backIconButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    position: 'absolute',
    top: 48,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  conditionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: '#333',
  },
  section: {
    marginBottom: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
  categoryText: {
    fontSize: 16,
    color: '#666',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sellerUsername: {
    fontSize: 14,
    color: '#666',
  },
  safetyTips: {
    gap: 8,
  },
  safetyTip: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#fff',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2563eb',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '600',
  },
});
