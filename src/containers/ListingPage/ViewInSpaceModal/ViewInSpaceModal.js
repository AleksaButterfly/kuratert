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

/**
 * ViewInSpaceModal - Allows users to visualize products in their own space
 * by uploading a room photo and overlaying the product image on it.
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

  const [roomImage, setRoomImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [productScale, setProductScale] = useState(1);

  // Initialize Fabric canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current || fabricCanvasRef.current) return;

    // Dynamic import of fabric to avoid SSR issues
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

      // Ensure canvas is interactive
      canvas.selection = true;
      canvas.defaultCursor = 'default';
      canvas.hoverCursor = 'move';
      canvas.moveCursor = 'move';

      fabricCanvasRef.current = canvas;
      setCanvasReady(true);

      // Handle window resize
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
  }, [isOpen]);

  // Load room image onto canvas
  const loadRoomImage = useCallback(async (imageSrc) => {
    if (!fabricCanvasRef.current) return;

    const fabricModule = await import('fabric');
    const { FabricImage } = fabricModule;
    const canvas = fabricCanvasRef.current;

    return new Promise((resolve) => {
      FabricImage.fromURL(imageSrc, { crossOrigin: 'anonymous' }).then(img => {
        // Scale to fit canvas
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

        // Clear and add room image as background
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
    const canvas = fabricCanvasRef.current;

    // Remove existing product if any
    if (productObjectRef.current) {
      canvas.remove(productObjectRef.current);
      productObjectRef.current = null;
    }

    // Use native Image to handle CORS better
    const imgElement = new Image();
    imgElement.crossOrigin = 'anonymous';

    imgElement.onload = () => {
      const img = new FabricImage(imgElement, {
        left: canvas.width / 2,
        top: canvas.height / 2,
        originX: 'center',
        originY: 'center',
      });

      // Scale product to reasonable size (30% of canvas width)
      const targetWidth = canvas.width * 0.3;
      const scale = targetWidth / img.width;
      img.scale(scale * productScale);

      // Set interactive properties
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
  }, [productImage, productScale]);

  // Handle room image upload
  const handleRoomImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const imageSrc = event.target?.result;
      setRoomImage(imageSrc);
      await loadRoomImage(imageSrc);
      // Load product image after room image is ready
      if (productImage) {
        await loadProductImage();
      }
      setIsLoading(false);
    };

    reader.onerror = () => {
      setIsLoading(false);
    };

    reader.readAsDataURL(file);
  };

  // Control functions
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
    if (productObjectRef.current && fabricCanvasRef.current) {
      const currentScale = productObjectRef.current.scaleX || 1;
      productObjectRef.current.scale(currentScale * 1.2);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleZoomOut = () => {
    if (productObjectRef.current && fabricCanvasRef.current) {
      const currentScale = productObjectRef.current.scaleX || 1;
      productObjectRef.current.scale(currentScale * 0.8);
      fabricCanvasRef.current.renderAll();
    }
  };

  const handleReset = async () => {
    if (roomImage) {
      await loadRoomImage(roomImage);
      if (productImage) {
        await loadProductImage();
      }
    }
  };

  const handleDownload = () => {
    if (!fabricCanvasRef.current) return;

    // Deselect to hide controls in export
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

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      setRoomImage(null);
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        setCanvasReady(false);
      }
    }
  }, [isOpen]);

  return (
    <Modal
      id="ViewInSpaceModal"
      isOpen={isOpen}
      onClose={onClose}
      onManageDisableScrolling={onManageDisableScrolling}
      usePortal
      contentClassName={css.modalContent}
    >
      <div className={css.container}>
        <h2 className={css.title}>
          <FormattedMessage id="ViewInSpaceModal.title" />
        </h2>
        <p className={css.subtitle}>
          <FormattedMessage id="ViewInSpaceModal.subtitle" />
        </p>

        <div className={css.canvasContainer}>
          <canvas ref={canvasRef} className={css.canvas} style={{ display: roomImage ? 'block' : 'none' }} />

          {!roomImage && (
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
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleRoomImageUpload}
            className={css.fileInput}
          />
        </div>

        {roomImage && (
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
        )}

        {roomImage && (
          <button
            type="button"
            className={css.changeRoomButton}
            onClick={() => fileInputRef.current?.click()}
          >
            <FormattedMessage id="ViewInSpaceModal.changeRoom" />
          </button>
        )}

        <p className={css.tip}>
          <FormattedMessage id="ViewInSpaceModal.tip" />
        </p>
      </div>
    </Modal>
  );
};

export default ViewInSpaceModal;
