import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import classNames from 'classnames';

import { Modal, IconSpinner } from '../../../components';

import css from './ViewInSpaceModal.module.css';

// Icons
const UploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

const CameraIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const RotateIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6M1 20v-6h6" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const FlipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3M12 3v18" />
  </svg>
);

const ResetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

const DownloadIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const ZoomInIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
  </svg>
);

const ZoomOutIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35M8 11h6" />
  </svg>
);

const SwitchCameraIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
    <circle cx="12" cy="12" r="3" />
    <path d="m18 22-3-3 3-3" />
    <path d="m6 2 3 3-3 3" />
  </svg>
);

const CaptureIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const BackIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

// Check if camera is available
const isCameraAvailable = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * ViewInSpaceModal - Allows users to visualize products in their own space
 * by uploading a room photo or using live camera with product overlay.
 */
const ViewInSpaceModal = props => {
  const {
    isOpen,
    onClose,
    onManageDisableScrolling,
    productImage,
    productTitle,
  } = props;

  const intl = useIntl();
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const productObjectRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureCanvasRef = useRef(null);

  // Mode: 'select' | 'upload' | 'camera' | 'edit'
  const [mode, setMode] = useState('select');
  const [roomImage, setRoomImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [productScale, setProductScale] = useState(1);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = back, 'user' = front

  // Product overlay state for camera mode
  const [productPosition, setProductPosition] = useState({ x: 50, y: 50 });
  const [productSize, setProductSize] = useState(30); // percentage of container width
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const productOverlayRef = useRef(null);
  const cameraContainerRef = useRef(null);

  // Initialize Fabric canvas for edit mode
  useEffect(() => {
    if (mode !== 'edit' || !canvasRef.current || fabricCanvasRef.current) return;

    import('fabric').then(fabricModule => {
      const { Canvas } = fabricModule;

      const canvas = new Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#f5f5f5',
        selection: true,
        preserveObjectStacking: true,
        allowTouchScrolling: false,
        containerClass: 'canvas-container',
      });

      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.moveCursor = 'move';

      fabricCanvasRef.current = canvas;
      setCanvasReady(true);

      const handleResize = () => {
        const container = canvasRef.current?.parentElement;
        if (container && canvas) {
          const width = Math.min(container.clientWidth - 32, 800);
          const height = Math.min(width * 0.75, 600);
          canvas.setDimensions({ width, height });
          canvas.renderAll();
        }
      };

      window.addEventListener('resize', handleResize);
      handleResize();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    });

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setCanvasReady(false);
      }
    };
  }, [mode]);

  // Load room image onto canvas
  const loadRoomImage = useCallback(async (imageSrc) => {
    if (!fabricCanvasRef.current) return;

    const fabricModule = await import('fabric');
    const { FabricImage } = fabricModule;

    return new Promise((resolve) => {
      FabricImage.fromURL(imageSrc, { crossOrigin: 'anonymous' }).then(img => {
        // Check if canvas still exists (modal might have been closed)
        const canvas = fabricCanvasRef.current;
        if (!canvas) {
          resolve();
          return;
        }

        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        );

        img.scale(scale);
        img.set({
          left: (canvas.width - img.width * scale) / 2,
          top: (canvas.height - img.height * scale) / 2,
          selectable: false,
          evented: false,
          hoverCursor: 'default',
        });

        canvas.clear();
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        resolve();
      });
    });
  }, []);

  // Load product image onto canvas
  const loadProductImage = useCallback(async () => {
    if (!fabricCanvasRef.current || !productImage) return;

    const fabricModule = await import('fabric');
    const { FabricImage } = fabricModule;

    // Remove existing product if canvas is available
    if (productObjectRef.current && fabricCanvasRef.current) {
      fabricCanvasRef.current.remove(productObjectRef.current);
      productObjectRef.current = null;
    }

    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';

    imgElement.onload = () => {
      // Check if canvas still exists (modal might have been closed)
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const img = new FabricImage(imgElement, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
      });

      // Use productSize from camera mode if available, otherwise default to 30%
      const sizePercent = productSize / 100;
      const targetWidth = canvas.width * sizePercent;
      const scale = targetWidth / img.width;
      img.scale(scale * productScale);

      img.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
        lockMovementX: false,
        lockMovementY: false,
        lockRotation: false,
        lockScalingX: false,
        lockScalingY: false,
        cornerColor: '#000000',
        cornerStyle: 'circle',
        cornerSize: 12,
        transparentCorners: false,
        borderColor: '#000000',
        borderScaleFactor: 2,
      });

      productObjectRef.current = img;
      canvas.add(img);
      canvas.bringObjectToFront(img);
      canvas.setActiveObject(img);
      canvas.requestRenderAll();
    };

    imgElement.onerror = (err) => {
      console.error('Error loading product image:', err);
    };

    imgElement.src = productImage;
  }, [productImage, productScale, productSize]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setIsLoading(true);

    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLoading(false);
    } catch (error) {
      // AbortError happens when play() is interrupted by a new request - this is not a real error
      if (error.name === 'AbortError') {
        console.log('Camera play() interrupted - new request in progress');
        return;
      }

      console.error('Camera error:', error);
      setIsLoading(false);

      if (error.name === 'NotAllowedError') {
        setCameraError('permission');
      } else if (error.name === 'NotFoundError') {
        setCameraError('notfound');
      } else {
        setCameraError('generic');
      }
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  // Effect to restart camera when facing mode changes
  useEffect(() => {
    if (mode === 'camera' && !cameraError) {
      startCamera();
    }
  }, [facingMode, mode, startCamera, cameraError]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !captureCanvasRef.current) return;

    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw product overlay
    if (productImage && cameraContainerRef.current) {
      const container = cameraContainerRef.current;
      const containerRect = container.getBoundingClientRect();

      // Calculate product position and size relative to video
      const scaleX = video.videoWidth / containerRect.width;
      const scaleY = video.videoHeight / containerRect.height;

      const productImg = new Image();
      productImg.crossOrigin = 'anonymous';
      productImg.onload = () => {
        const prodWidth = (productSize / 100) * containerRect.width * scaleX;
        const prodHeight = (productImg.height / productImg.width) * prodWidth;
        const prodX = (productPosition.x / 100) * containerRect.width * scaleX - prodWidth / 2;
        const prodY = (productPosition.y / 100) * containerRect.height * scaleY - prodHeight / 2;

        context.drawImage(productImg, prodX, prodY, prodWidth, prodHeight);

        // Get the combined image
        const imageSrc = canvas.toDataURL('image/png');
        setRoomImage(imageSrc);
        stopCamera();
        setMode('edit');
      };
      productImg.src = productImage;
    }
  }, [productImage, productPosition, productSize, stopCamera]);

  // Handle room image upload
  const handleRoomImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageSrc = event.target?.result;
      setRoomImage(imageSrc);
      setMode('edit');
      setIsLoading(false);
    };

    reader.onerror = () => {
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Load images when entering edit mode
  useEffect(() => {
    if (mode === 'edit' && roomImage && canvasReady) {
      loadRoomImage(roomImage).then(() => {
        if (productImage) {
          loadProductImage();
        }
      });
    }
  }, [mode, roomImage, canvasReady, loadRoomImage, loadProductImage, productImage]);

  // Product dragging handlers for camera mode
  const handleProductDragStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX, y: clientY });
  };

  const handleProductDrag = useCallback((e) => {
    if (!isDragging || !cameraContainerRef.current) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const container = cameraContainerRef.current.getBoundingClientRect();

    const deltaX = ((clientX - dragStart.x) / container.width) * 100;
    const deltaY = ((clientY - dragStart.y) / container.height) * 100;

    setProductPosition(prev => ({
      x: Math.max(10, Math.min(90, prev.x + deltaX)),
      y: Math.max(10, Math.min(90, prev.y + deltaY)),
    }));

    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, dragStart]);

  const handleProductDragEnd = () => {
    setIsDragging(false);
  };

  // Add/remove drag event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleProductDrag);
      window.addEventListener('mouseup', handleProductDragEnd);
      window.addEventListener('touchmove', handleProductDrag);
      window.addEventListener('touchend', handleProductDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleProductDrag);
      window.removeEventListener('mouseup', handleProductDragEnd);
      window.removeEventListener('touchmove', handleProductDrag);
      window.removeEventListener('touchend', handleProductDragEnd);
    };
  }, [isDragging, handleProductDrag]);

  // Control functions for edit mode
  const handleRotateLeft = () => {
    if (productObjectRef.current && fabricCanvasRef.current) {
      const currentAngle = productObjectRef.current.angle || 0;
      productObjectRef.current.rotate(currentAngle - 15);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleRotateRight = () => {
    if (productObjectRef.current && fabricCanvasRef.current) {
      const currentAngle = productObjectRef.current.angle || 0;
      productObjectRef.current.rotate(currentAngle + 15);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleFlip = () => {
    if (productObjectRef.current && fabricCanvasRef.current) {
      productObjectRef.current.set('flipX', !productObjectRef.current.flipX);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleZoomIn = () => {
    if (mode === 'camera') {
      setProductSize(prev => Math.min(80, prev * 1.2));
    } else if (productObjectRef.current && fabricCanvasRef.current) {
      const currentScale = productObjectRef.current.scaleX || 1;
      productObjectRef.current.scale(currentScale * 1.2);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (mode === 'camera') {
      setProductSize(prev => Math.max(10, prev * 0.8));
    } else if (productObjectRef.current && fabricCanvasRef.current) {
      const currentScale = productObjectRef.current.scaleX || 1;
      productObjectRef.current.scale(currentScale * 0.8);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleReset = async () => {
    if (mode === 'camera') {
      setProductPosition({ x: 50, y: 50 });
      setProductSize(30);
    } else if (roomImage) {
      await loadRoomImage(roomImage);
      if (productImage) {
        await loadProductImage();
      }
    }
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;

    fabricCanvasRef.current.discardActiveObject();
    fabricCanvasRef.current.renderAll();

    const dataURL = fabricCanvasRef.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    });

    const link = document.createElement('a');
    link.download = `${productTitle || 'product'}-in-my-space.png`;
    link.href = dataURL;
    link.click();
  };

  const handleBack = () => {
    stopCamera();
    setRoomImage(null);
    setCameraError(null);
    setMode('select');
    setProductPosition({ x: 50, y: 50 });
    setProductSize(30);
  };

  // Start camera mode
  const handleStartCamera = () => {
    if (!isCameraAvailable()) {
      setCameraError('unavailable');
      return;
    }
    setMode('camera');
    // Note: startCamera() is called by the useEffect when mode changes to 'camera'
  };

  // Start upload mode
  const handleStartUpload = () => {
    setMode('upload');
  };

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setRoomImage(null);
      setMode('select');
      setCameraError(null);
      setProductPosition({ x: 50, y: 50 });
      setProductSize(30);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setCanvasReady(false);
      }
    }
  }, [isOpen, stopCamera]);

  // Render mode selection
  const renderModeSelection = () => (
    <div className={css.modeSelection}>
      <div className={css.modeOption} onClick={handleStartCamera}>
        <CameraIcon />
        <p className={css.modeTitle}>
          <FormattedMessage id="ViewInSpaceModal.useCamera" />
        </p>
        <p className={css.modeHint}>
          <FormattedMessage id="ViewInSpaceModal.useCameraHint" />
        </p>
      </div>
      <div className={css.modeOption} onClick={handleStartUpload}>
        <UploadIcon />
        <p className={css.modeTitle}>
          <FormattedMessage id="ViewInSpaceModal.uploadPhoto" />
        </p>
        <p className={css.modeHint}>
          <FormattedMessage id="ViewInSpaceModal.uploadPhotoHint" />
        </p>
      </div>
    </div>
  );

  // Render upload mode
  const renderUploadMode = () => (
    <div className={css.canvasContainer}>
      <div
        className={css.uploadArea}
        onClick={() => fileInputRef.current?.click()}
      >
        {isLoading ? (
          <IconSpinner />
        ) : (
          <>
            <UploadIcon />
            <p className={css.uploadText}>
              <FormattedMessage id="ViewInSpaceModal.uploadPrompt" />
            </p>
            <p className={css.uploadHint}>
              <FormattedMessage id="ViewInSpaceModal.uploadHint" />
            </p>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleRoomImageUpload}
        className={css.fileInput}
      />
    </div>
  );

  // Render camera mode
  const renderCameraMode = () => (
    <div className={css.cameraContainer} ref={cameraContainerRef}>
      {cameraError ? (
        <div className={css.cameraError}>
          <CameraIcon />
          <p className={css.cameraErrorText}>
            <FormattedMessage id={`ViewInSpaceModal.cameraError.${cameraError}`} />
          </p>
          <button
            type="button"
            className={css.retryButton}
            onClick={() => {
              setCameraError(null);
              startCamera();
            }}
          >
            <FormattedMessage id="ViewInSpaceModal.retryCamera" />
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            className={css.cameraVideo}
            playsInline
            muted
            autoPlay
          />
          {isLoading && (
            <div className={css.cameraLoading}>
              <IconSpinner />
            </div>
          )}
          {!isLoading && productImage && (
            <div
              ref={productOverlayRef}
              className={css.productOverlay}
              style={{
                left: `${productPosition.x}%`,
                top: `${productPosition.y}%`,
                width: `${productSize}%`,
                transform: 'translate(-50%, -50%)',
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              onMouseDown={handleProductDragStart}
              onTouchStart={handleProductDragStart}
            >
              <img src={productImage} alt={productTitle} className={css.productOverlayImage} />
              <div className={css.productOverlayBorder} />
            </div>
          )}
        </>
      )}
      <canvas ref={captureCanvasRef} style={{ display: 'none' }} />
    </div>
  );

  // Render camera controls
  const renderCameraControls = () => (
    <div className={css.cameraControls}>
      <button
        type="button"
        className={css.controlButton}
        onClick={switchCamera}
        title={intl.formatMessage({ id: 'ViewInSpaceModal.switchCamera' })}
      >
        <SwitchCameraIcon />
      </button>
      <button
        type="button"
        className={css.controlButton}
        onClick={handleZoomOut}
        title={intl.formatMessage({ id: 'ViewInSpaceModal.zoomOut' })}
      >
        <ZoomOutIcon />
      </button>
      <button
        type="button"
        className={css.captureButton}
        onClick={capturePhoto}
        title={intl.formatMessage({ id: 'ViewInSpaceModal.capture' })}
      >
        <CaptureIcon />
      </button>
      <button
        type="button"
        className={css.controlButton}
        onClick={handleZoomIn}
        title={intl.formatMessage({ id: 'ViewInSpaceModal.zoomIn' })}
      >
        <ZoomInIcon />
      </button>
      <button
        type="button"
        className={css.controlButton}
        onClick={handleReset}
        title={intl.formatMessage({ id: 'ViewInSpaceModal.reset' })}
      >
        <ResetIcon />
      </button>
    </div>
  );

  // Render edit mode (fabric canvas)
  const renderEditMode = () => (
    <>
      <div className={css.canvasContainer}>
        <canvas ref={canvasRef} className={css.canvas} />
      </div>
      <div className={css.controls}>
        <div className={css.controlGroup}>
          <button
            type="button"
            className={css.controlButton}
            onClick={handleRotateLeft}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.rotateLeft' })}
          >
            <RotateIcon />
          </button>
          <button
            type="button"
            className={css.controlButton}
            onClick={handleRotateRight}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.rotateRight' })}
          >
            <RotateIcon style={{ transform: 'scaleX(-1)' }} />
          </button>
          <button
            type="button"
            className={css.controlButton}
            onClick={handleFlip}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.flip' })}
          >
            <FlipIcon />
          </button>
        </div>

        <div className={css.controlGroup}>
          <button
            type="button"
            className={css.controlButton}
            onClick={handleZoomOut}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.zoomOut' })}
          >
            <ZoomOutIcon />
          </button>
          <button
            type="button"
            className={css.controlButton}
            onClick={handleZoomIn}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.zoomIn' })}
          >
            <ZoomInIcon />
          </button>
        </div>

        <div className={css.controlGroup}>
          <button
            type="button"
            className={css.controlButton}
            onClick={handleReset}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.reset' })}
          >
            <ResetIcon />
          </button>
          <button
            type="button"
            className={classNames(css.controlButton, css.downloadButton)}
            onClick={handleDownload}
            title={intl.formatMessage({ id: 'ViewInSpaceModal.download' })}
          >
            <DownloadIcon />
            <span><FormattedMessage id="ViewInSpaceModal.save" /></span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <Modal
      id="ViewInSpaceModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      containerClassName={css.modalContainer}
      contentClassName={css.modalContent}
    >
      <div className={css.container}>
        {mode !== 'select' && (
          <button type="button" className={css.backButton} onClick={handleBack}>
            <BackIcon />
            <FormattedMessage id="ViewInSpaceModal.back" />
          </button>
        )}

        <h2 className={css.title}>
          <FormattedMessage id="ViewInSpaceModal.title" />
        </h2>
        <p className={css.subtitle}>
          <FormattedMessage
            id={mode === 'camera' ? 'ViewInSpaceModal.subtitleCamera' : 'ViewInSpaceModal.subtitle'}
          />
        </p>

        {mode === 'select' && renderModeSelection()}
        {mode === 'upload' && renderUploadMode()}
        {mode === 'camera' && (
          <>
            {renderCameraMode()}
            {!cameraError && !isLoading && renderCameraControls()}
          </>
        )}
        {mode === 'edit' && renderEditMode()}

        {mode === 'edit' && (
          <button
            type="button"
            className={css.changeRoomButton}
            onClick={handleBack}
          >
            <FormattedMessage id="ViewInSpaceModal.tryAgain" />
          </button>
        )}

        <p className={css.tip}>
          <FormattedMessage
            id={mode === 'camera' ? 'ViewInSpaceModal.tipCamera' : 'ViewInSpaceModal.tip'}
          />
        </p>
      </div>
    </Modal>
  );
};

export default ViewInSpaceModal;
