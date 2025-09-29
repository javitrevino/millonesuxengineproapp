"use client";

import { useState, useRef, useCallback } from "react";

interface Rectangle {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export default function Home() {
  const [rectangles, setRectangles] = useState<Rectangle[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<Rectangle | null>(null);
  const [movingRectId, setMovingRectId] = useState<string | null>(null);
  const [selectedRectId, setSelectedRectId] = useState<string | null>(null);
  const [moveOffset, setMoveOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const findRectangleAtPoint = useCallback((x: number, y: number): Rectangle | null => {
    for (let i = rectangles.length - 1; i >= 0; i--) {
      const rect = rectangles[i];
      const left = rect.width >= 0 ? rect.x : rect.x + rect.width;
      const top = rect.height >= 0 ? rect.y : rect.y + rect.height;
      const right = left + Math.abs(rect.width);
      const bottom = top + Math.abs(rect.height);

      if (x >= left && x <= right && y >= top && y <= bottom) {
        return rect;
      }
    }
    return null;
  }, [rectangles]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedRect = findRectangleAtPoint(x, y);

    if (clickedRect) {
      setSelectedRectId(clickedRect.id);
      setMovingRectId(clickedRect.id);
      const rectLeft = clickedRect.width >= 0 ? clickedRect.x : clickedRect.x + clickedRect.width;
      const rectTop = clickedRect.height >= 0 ? clickedRect.y : clickedRect.y + clickedRect.height;
      setMoveOffset({
        x: x - rectLeft,
        y: y - rectTop,
      });
    } else {
      setIsDrawing(true);
      setStartPoint({ x, y });

      const newRect: Rectangle = {
        id: Date.now().toString(),
        name: `div ${rectangles.length + 1}`,
        x,
        y,
        width: 0,
        height: 0,
        color: "#3b82f6",
      };

      setCurrentRect(newRect);
    }
  }, [findRectangleAtPoint, rectangles.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const currentX = e.clientX - canvasRect.left;
    const currentY = e.clientY - canvasRect.top;

    if (movingRectId) {
      const newX = currentX - moveOffset.x;
      const newY = currentY - moveOffset.y;

      setRectangles(prev => prev.map(rect => {
        if (rect.id === movingRectId) {
          const normalizedX = rect.width >= 0 ? newX : newX - Math.abs(rect.width);
          const normalizedY = rect.height >= 0 ? newY : newY - Math.abs(rect.height);

          return {
            ...rect,
            x: normalizedX,
            y: normalizedY,
          };
        }
        return rect;
      }));
    } else if (isDrawing && currentRect) {
      const width = currentX - startPoint.x;
      const height = currentY - startPoint.y;

      setCurrentRect({
        ...currentRect,
        width,
        height,
      });
    }
  }, [isDrawing, startPoint, currentRect, movingRectId, moveOffset]);

  const handleMouseUp = useCallback(() => {
    if (movingRectId) {
      setMovingRectId(null);
      setMoveOffset({ x: 0, y: 0 });
    } else if (isDrawing && currentRect) {
      if (Math.abs(currentRect.width) > 5 && Math.abs(currentRect.height) > 5) {
        setRectangles(prev => [...prev, currentRect]);
      }

      setIsDrawing(false);
      setCurrentRect(null);
    }
  }, [isDrawing, currentRect, movingRectId]);

  const clearCanvas = () => {
    setRectangles([]);
    setCurrentRect(null);
    setMovingRectId(null);
    setSelectedRectId(null);
    setMoveOffset({ x: 0, y: 0 });
  };

  const updateRectangle = (id: string, updates: Partial<Rectangle>) => {
    setRectangles(prev => prev.map(rect =>
      rect.id === id ? { ...rect, ...updates } : rect
    ));
  };

  const LayerList = () => (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">Layers</h3>
      {rectangles.length === 0 ? (
        <p className="text-sm text-gray-500">No layers yet</p>
      ) : (
        <div className="space-y-1">
          {rectangles.map((rectangle) => (
            <div
              key={rectangle.id}
              className={`p-2 rounded cursor-pointer text-sm ${
                selectedRectId === rectangle.id
                  ? "bg-blue-100 border border-blue-300"
                  : "hover:bg-gray-50"
              }`}
              onClick={() => setSelectedRectId(rectangle.id)}
            >
              {rectangle.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const PropertiesPanel = () => {
    const selectedRect = rectangles.find(rect => rect.id === selectedRectId);

    if (!selectedRect) {
      return (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Properties</h3>
          <p className="text-sm text-gray-500">Select a layer to edit properties</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Properties</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={selectedRect.name}
              onChange={(e) => updateRectangle(selectedRect.id, { name: e.target.value })}
              className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={selectedRect.color}
              onChange={(e) => updateRectangle(selectedRect.id, { color: e.target.value })}
              className="w-full h-8 border border-gray-300 rounded cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                X Position
              </label>
              <input
                type="number"
                value={Math.round(selectedRect.x)}
                onChange={(e) => updateRectangle(selectedRect.id, { x: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Y Position
              </label>
              <input
                type="number"
                value={Math.round(selectedRect.y)}
                onChange={(e) => updateRectangle(selectedRect.id, { y: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                type="number"
                value={Math.round(Math.abs(selectedRect.width))}
                onChange={(e) => updateRectangle(selectedRect.id, { width: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <input
                type="number"
                value={Math.round(Math.abs(selectedRect.height))}
                onChange={(e) => updateRectangle(selectedRect.id, { height: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
          Draw Rectangles
        </h1>

        <div className="mb-4 text-center">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear Canvas
          </button>
        </div>

        <div className="mb-4 text-center text-gray-600">
          Click and drag to draw rectangles • Click existing rectangles to move them
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div
              ref={canvasRef}
              className="relative w-full h-96 bg-white border-2 border-gray-300 rounded-lg shadow-lg cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
          {rectangles.map((rectangle) => (
            <div
              key={rectangle.id}
              className={`absolute border-2 transition-all cursor-move ${
                movingRectId === rectangle.id
                  ? "border-orange-500 opacity-90"
                  : selectedRectId === rectangle.id
                  ? "border-blue-600 opacity-80"
                  : "border-gray-400 opacity-70 hover:border-gray-600 hover:opacity-80"
              }`}
              style={{
                left: rectangle.width >= 0 ? rectangle.x : rectangle.x + rectangle.width,
                top: rectangle.height >= 0 ? rectangle.y : rectangle.y + rectangle.height,
                width: Math.abs(rectangle.width),
                height: Math.abs(rectangle.height),
                backgroundColor: rectangle.color,
              }}
            />
          ))}

          {currentRect && (
            <div
              className="absolute border-2 border-green-500 bg-green-200 opacity-70"
              style={{
                left: currentRect.width >= 0 ? currentRect.x : currentRect.x + currentRect.width,
                top: currentRect.height >= 0 ? currentRect.y : currentRect.y + currentRect.height,
                width: Math.abs(currentRect.width),
                height: Math.abs(currentRect.height),
              }}
            />
          )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4">
            <LayerList />
            <PropertiesPanel />
          </div>
        </div>

      </div>
    </div>
  );
}
