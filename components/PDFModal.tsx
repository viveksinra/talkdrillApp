import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

interface PDFFile {
  name: string;
  url: string;
  size?: string;
  uploadDate: Date;
}

interface PDFModalProps {
  visible: boolean;
  onClose: () => void;
  pdfFiles: PDFFile[];
}

const { width, height } = Dimensions.get('window');

const getPdfViewerUrl = (url: string, viewerType: 'google' | 'mozilla' | 'direct'): string => {
  const encodedUrl = encodeURIComponent(url);
  
  switch (viewerType) {
    case 'google':
      return `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
    case 'mozilla':
      return `https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodedUrl}`;
    case 'direct':
      return url;
    default:
      return `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
  }
};

export const PDFModal: React.FC<PDFModalProps> = ({
  visible,
  onClose,
  pdfFiles,
}) => {
  const [selectedPdf, setSelectedPdf] = useState<PDFFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [viewerType, setViewerType] = useState<'google' | 'mozilla' | 'direct'>('google');
  const [loadingTimeout, setLoadingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
      }
    };
  }, [loadingTimeout]);

  const handlePdfSelect = (pdf: PDFFile) => {
    setSelectedPdf(pdf);
    setIsLoading(true);
    
    // Set timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      setIsLoading(false);
      handleWebViewError();
    }, 15000); // 15 seconds timeout
    
    setLoadingTimeout(timeout);
  };

  const handleBackToList = () => {
    setSelectedPdf(null);
    setIsLoading(false);
    setViewerType('google');
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      setLoadingTimeout(null);
    }
  };

  const handleWebViewError = () => {
    setIsLoading(false);
    
    // Try different viewers on error
    if (viewerType === 'google') {
      setViewerType('mozilla');
      setIsLoading(true);
    } else if (viewerType === 'mozilla') {
      setViewerType('direct');
      setIsLoading(true);
    } else {
      Alert.alert(
        'Error',
        'Failed to load PDF. Please check your internet connection and try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Retry', 
            onPress: () => {
              setViewerType('google');
              setIsLoading(true);
            }
          }
        ]
      );
    }
  };

  const renderPdfItem = ({ item }: { item: PDFFile }) => (
    <TouchableOpacity
      style={styles.pdfItem}
      onPress={() => handlePdfSelect(item)}
    >
      <View style={styles.pdfItemContent}>
        <View style={styles.pdfIcon}>
          <Ionicons name="document" size={32} color={Colors.light.error} />
        </View>
        <View style={styles.pdfInfo}>
          <Text style={styles.pdfName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.size && (
            <Text style={styles.pdfSize}>{item.size}</Text>
          )}
          {item.uploadDate && (
            <Text style={styles.pdfDate}>{item.uploadDate.toLocaleDateString()}</Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.light.icon} />
      </View>
    </TouchableOpacity>
  );

  const renderPdfList = () => (
    <View style={styles.listContainer}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Session Materials</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      {pdfFiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={64} color={Colors.light.inactive} />
          <Text style={styles.emptyStateText}>No materials available</Text>
          <Text style={styles.emptyStateSubtext}>
            Your professional will share materials during the session
          </Text>
        </View>
      ) : (
        <FlatList
          data={pdfFiles}
          renderItem={renderPdfItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderPdfViewer = () => (
    <View style={styles.viewerContainer}>
      <View style={styles.viewerHeader}>
        <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.viewerTitle} numberOfLines={1}>
          {selectedPdf?.name}
        </Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.webViewContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
        
        <WebView
          source={{ 
            uri: getPdfViewerUrl(selectedPdf?.url || '', viewerType)
          }}
          style={styles.webView}
          onLoad={handleWebViewLoad}
          onError={handleWebViewError}
          onLoadEnd={handleWebViewLoad}
          startInLoadingState={true}
          scalesPageToFit={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          allowsBackForwardNavigationGestures={false}
          allowsLinkPreview={false}
          allowFileAccess={false}
          allowFileAccessFromFileURLs={false}
          allowUniversalAccessFromFileURLs={false}
          mixedContentMode="compatibility"
          onShouldStartLoadWithRequest={(request) => {
            // Block download attempts
            if (request.url.includes('download') || 
                request.url.includes('attachment') ||
                (request.url.endsWith('.pdf') && !request.url.includes('gview') && !request.url.includes('mozilla'))) {
              return false;
            }
            return true;
          }}
          onNavigationStateChange={(navState) => {
            // Prevent navigation to download links
            if (navState.url.includes('download') || 
                navState.url.includes('attachment')) {
              return false;
            }
          }}
          userAgent="Mozilla/5.0 (compatible; PDF Viewer)"
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {selectedPdf ? renderPdfViewer() : renderPdfList()}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingVertical: 16,
  },
  pdfItem: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pdfItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  pdfIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pdfInfo: {
    flex: 1,
  },
  pdfName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  pdfSize: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 2,
  },
  pdfDate: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
  },
  viewerContainer: {
    flex: 1,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surface,
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  viewerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.text,
    marginTop: 12,
  },
}); 