import React, { useRef, useEffect, useState } from 'react';
import useCropStore from '../state/useCropStore';

interface CropCanvasProps {
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
}

const CropCanvas: React.FC<CropCanvasProps> = ({ imageUrl, imageWidth, imageHeight }) => {
  const { crop, image, view, transform, setCrop, limits, setPan } = useCropStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [containerDims, setContainerDims] = useState({ width: 0, height: 0 });
  const [scaledImageDims, setScaledImageDims] = useState({ width: 0, height: 0, x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  // Calculate container dimensions
  useEffect(() => {
    const updateContainerDims = () => {
      if (containerRef.current) {
        setContainerDims({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    updateContainerDims();
    window.addEventListener('resize', updateContainerDims);
    return () => window.removeEventListener('resize', updateContainerDims);
  }, []);

  // Calculate scaled image dimensions and initial crop
  useEffect(() => {
    if (imageRef.current && image.width && image.height && containerDims.width && containerDims.height) {
      const aspectRatio = image.width / image.height;
      let scaledWidth = containerDims.width;
      let scaledHeight = containerDims.width / aspectRatio;

      if (scaledHeight > containerDims.height) {
        scaledHeight = containerDims.height;
        scaledWidth = containerDims.height * aspectRatio;
      }

      const offsetX = (containerDims.width - scaledWidth) / 2;
      const offsetY = (containerDims.height - scaledHeight) / 2;

      setScaledImageDims({
        width: scaledWidth,
        height: scaledHeight,
        x: offsetX,
        y: offsetY,
      });

      // Initialize crop to cover the entire scaled image if not already set
      // Initialize crop to cover the entire scaled image if not already set
      // Only do this if crop dimensions are 0, meaning it's the initial load or reset
      if (crop.width === 0 && crop.height === 0 && scaledWidth > 0 && scaledHeight > 0) {
        setCrop({
          x: 0, // Relative to scaled image
          y: 0, // Relative to scaled image
          width: scaledWidth,
          height: scaledHeight,
        });
      }
    }
  }, [image.width, image.height, containerDims, setCrop, transform.rotation]);

  // Convert crop coordinates from image-relative to container-relative
  // These are the coordinates of the crop box *before* any image transformations (zoom, pan, rotate, flip)
  const cropX = scaledImageDims.x + crop.x;
  const cropY = scaledImageDims.y + crop.y;
  const cropWidth = crop.width;
  const cropHeight = crop.height;

  // Pan and Zoom handlers
  const handlePanMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStart.x;
      const dy = moveEvent.clientY - dragStart.y;
      setPan({ x: view.pan.x + dx, y: view.pan.y + dy });
      setDragStart({ x: moveEvent.clientX, y: moveEvent.clientY }); // Update drag start for continuous pan
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent, handle?: string) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
    setInitialCrop({ ...crop });
    setActiveHandle(handle || null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  const handleMouseMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const dx = clientX - dragStart.x;
    const dy = clientY - dragStart.y;

    let { x, y, width, height } = initialCrop;

    // Adjust dx, dy based on current rotation for resizing handles
    // This ensures that dragging a handle "north" always moves it towards the top of the *rotated* image
    let adjustedDx = dx;
    let adjustedDy = dy;
    const rotationRad = (transform.rotation * Math.PI) / 180;
    if (activeHandle !== null) {
      adjustedDx = dx * Math.cos(-rotationRad) - dy * Math.sin(-rotationRad);
      adjustedDy = dx * Math.sin(-rotationRad) + dy * Math.cos(-rotationRad);
    }

    if (activeHandle === null) { // Moving the crop box
      x = initialCrop.x + dx / view.zoom;
      y = initialCrop.y + dy / view.zoom;
    } else { // Resizing the crop box
      const minCrop = limits.minCropPx;
      const imageMaxX = scaledImageDims.width;
      const imageMaxY = scaledImageDims.height;

      // Apply zoom to delta for resizing
      const zoomAdjustedDx = adjustedDx / view.zoom;
      const zoomAdjustedDy = adjustedDy / view.zoom;

      switch (activeHandle) {
        case 'nw': // Top-left
          x = Math.min(initialCrop.x + zoomAdjustedDx, initialCrop.x + initialCrop.width - minCrop);
          y = Math.min(initialCrop.y + zoomAdjustedDy, initialCrop.y + initialCrop.height - minCrop);
          width = initialCrop.width - (x - initialCrop.x);
          height = initialCrop.height - (y - initialCrop.y);
          break;
        case 'ne': // Top-right
          x = initialCrop.x;
          y = Math.min(initialCrop.y + zoomAdjustedDy, initialCrop.y + initialCrop.height - minCrop);
          width = Math.max(minCrop, initialCrop.width + zoomAdjustedDx);
          height = initialCrop.height - (y - initialCrop.y);
          break;
        case 'sw': // Bottom-left
          x = Math.min(initialCrop.x + zoomAdjustedDx, initialCrop.x + initialCrop.width - minCrop);
          y = initialCrop.y;
          width = initialCrop.width - (x - initialCrop.x);
          height = Math.max(minCrop, initialCrop.height + zoomAdjustedDy);
          break;
        case 'se': // Bottom-right
          x = initialCrop.x;
          y = initialCrop.y;
          width = Math.max(minCrop, initialCrop.width + zoomAdjustedDx);
          height = Math.max(minCrop, initialCrop.height + zoomAdjustedDy);
          break;
        case 'n': // Top
          x = initialCrop.x;
          y = Math.min(initialCrop.y + zoomAdjustedDy, initialCrop.y + initialCrop.height - minCrop);
          width = initialCrop.width;
          height = initialCrop.height - (y - initialCrop.y);
          break;
        case 's': // Bottom
          x = initialCrop.x;
          y = initialCrop.y;
          width = initialCrop.width;
          height = Math.max(minCrop, initialCrop.height + zoomAdjustedDy);
          break;
        case 'w': // Left
          x = Math.min(initialCrop.x + zoomAdjustedDx, initialCrop.x + initialCrop.width - minCrop);
          y = initialCrop.y;
          width = initialCrop.width - (x - initialCrop.x);
          height = initialCrop.height;
          break;
        case 'e': // Right
          x = initialCrop.x;
          y = initialCrop.y;
          width = Math.max(minCrop, initialCrop.width + zoomAdjustedDx);
          height = initialCrop.height;
          break;
      }

      // Clamp to image bounds during resize
      x = Math.max(0, x);
      y = Math.max(0, y);
      width = Math.min(width, imageMaxX - x);
      height = Math.min(height, imageMaxY - y);
      width = Math.max(width, minCrop);
      height = Math.max(height, minCrop);
    }

    // Final clamping for move and resize
    x = Math.max(0, Math.min(x, scaledImageDims.width - width));
    y = Math.max(0, Math.min(y, scaledImageDims.height - height));

    setCrop({ x, y, width, height });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setActiveHandle(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const handleTouchMove = (e: TouchEvent) => handleMouseMove(e);
  const handleTouchEnd = () => handleMouseUp();

  const renderHandles = () => {
    const handleClasses = "absolute w-3 h-3 bg-white border border-blue-500 rounded-full z-20";
    const handles = [
      { id: 'nw', className: 'top-0 left-0 cursor-nwse-resize', style: { transform: 'translate(-50%, -50%)' }, ariaLabel: 'Resize top-left' },
      { id: 'ne', className: 'top-0 right-0 cursor-nesw-resize', style: { transform: 'translate(50%, -50%)' }, ariaLabel: 'Resize top-right' },
      { id: 'sw', className: 'bottom-0 left-0 cursor-nesw-resize', style: { transform: 'translate(-50%, 50%)' }, ariaLabel: 'Resize bottom-left' },
      { id: 'se', className: 'bottom-0 right-0 cursor-nwse-resize', style: { transform: 'translate(50%, 50%)' }, ariaLabel: 'Resize bottom-right' },
      { id: 'n', className: 'top-0 left-1/2 cursor-ns-resize', style: { transform: 'translate(-50%, -50%)' }, ariaLabel: 'Resize top' },
      { id: 's', className: 'bottom-0 left-1/2 cursor-ns-resize', style: { transform: 'translate(-50%, 50%)' }, ariaLabel: 'Resize bottom' },
      { id: 'w', className: 'left-0 top-1/2 cursor-ew-resize', style: { transform: 'translate(-50%, -50%)' }, ariaLabel: 'Resize left' },
      { id: 'e', className: 'right-0 top-1/2 cursor-ew-resize', style: { transform: 'translate(50%, -50%)' }, ariaLabel: 'Resize right' },
    ];

    return (
      <>
        {handles.map(handle => (
          <div
            key={handle.id}
            className={`${handleClasses} ${handle.className}`}
            style={handle.style}
            aria-label={handle.ariaLabel}
            onMouseDown={(e) => handleMouseDown(e, handle.id)}
            onTouchStart={(e) => handleMouseDown(e, handle.id)}
          ></div>
        ))}
      </>
    );
  };

  const renderRuleOfThirds = () => {
    if (!view.grid) return null;
    return (
      <>
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
          <div className="border border-dashed border-gray-400 col-start-2 col-end-3 row-start-1 row-end-4"></div>
          <div className="border border-dashed border-gray-400 row-start-2 row-end-3 col-start-1 col-end-4"></div>
        </div>
      </>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-gray-200 flex items-center justify-center overflow-hidden">
      {imageUrl ? (
        <>
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Image to crop"
            className="absolute object-contain"
            style={{
              width: scaledImageDims.width * view.zoom,
              height: scaledImageDims.height * view.zoom,
              left: scaledImageDims.x + view.pan.x - (scaledImageDims.width * view.zoom - scaledImageDims.width) / 2,
              top: scaledImageDims.y + view.pan.y - (scaledImageDims.height * view.zoom - scaledImageDims.height) / 2,
              transform: `rotate(${transform.rotation}deg) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`,
              transformOrigin: 'center center',
            }}
            onLoad={() => {
              // Ensure image dimensions are set in store once loaded
              if (imageRef.current && !image.width && !image.height) {
                useCropStore.getState().openCropMode(imageUrl, imageRef.current.naturalWidth, imageRef.current.naturalHeight);
              }
            }}
          />

          {/* Dimming overlay */}
          <div
            className="absolute inset-0 bg-black opacity-50"
            style={{
              // Apply the same transformations to the overlay as the image
              left: scaledImageDims.x + view.pan.x - (scaledImageDims.width * view.zoom - scaledImageDims.width) / 2,
              top: scaledImageDims.y + view.pan.y - (scaledImageDims.height * view.zoom - scaledImageDims.height) / 2,
              width: scaledImageDims.width * view.zoom,
              height: scaledImageDims.height * view.zoom,
              transform: `rotate(${transform.rotation}deg) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`,
              transformOrigin: 'center center',
              clipPath: `polygon(
                0 0, 0 100%,
                ${crop.x * view.zoom}px 100%,
                ${crop.x * view.zoom}px ${crop.y * view.zoom}px,
                ${(crop.x + crop.width) * view.zoom}px ${crop.y * view.zoom}px,
                ${(crop.x + crop.width) * view.zoom}px ${(crop.y + crop.height) * view.zoom}px,
                ${crop.x * view.zoom}px ${(crop.y + crop.height) * view.zoom}px,
                ${crop.x * view.zoom}px 100%,
                100% 100%, 100% 0
              )`,
            }}
          ></div>

          {/* Crop rectangle */}
          <div
            className="absolute border-2 border-blue-500 box-border"
            style={{
              left: scaledImageDims.x + view.pan.x + crop.x * view.zoom,
              top: scaledImageDims.y + view.pan.y + crop.y * view.zoom,
              width: crop.width * view.zoom,
              height: crop.height * view.zoom,
              cursor: 'grab',
              transform: `rotate(${transform.rotation}deg) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`,
              transformOrigin: `${crop.width * view.zoom / 2}px ${crop.height * view.zoom / 2}px`, // Rotate around its own center
            }}
            onMouseDown={(e) => handleMouseDown(e)}
            onTouchStart={(e) => handleMouseDown(e)}
            role="region"
            aria-label={`Crop area, current size ${Math.round(crop.width)} by ${Math.round(crop.height)} pixels`}
            tabIndex={0} // Make crop area focusable for keyboard interaction
          >
            {renderRuleOfThirds()}
            {renderHandles()}
            <div className="absolute -bottom-6 left-0 text-white text-sm bg-black bg-opacity-75 px-2 py-1 rounded">
              {Math.round(crop.width)} × {Math.round(crop.height)} px
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500">No image loaded for cropping.</p>
      )}
    </div>
  );
};

export default CropCanvas;
