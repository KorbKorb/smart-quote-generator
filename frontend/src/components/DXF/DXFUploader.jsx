import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import api from '../../utils/api';

const DXFViewer = ({ dxfData, onDataUpdate }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!dxfData || !dxfData.previewData) return;

    // Initialize Three.js scene
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      50,
      width / height,
      0.1,
      10000
    );

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(1000, 50, 0x888888, 0xcccccc);
    gridHelper.rotation.x = Math.PI / 2;
    scene.add(gridHelper);

    // Create geometry from DXF data
    const geometry = new THREE.Group();

    // Material for sheet metal (green like in the design system)
    const material = new THREE.MeshPhongMaterial({
      color: 0x1a4d46,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    // Material for lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

    // Add lines
    if (dxfData.previewData.lines) {
      dxfData.previewData.lines.forEach(line => {
        const points = [
          new THREE.Vector3(...line.start),
          new THREE.Vector3(...line.end)
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMesh = new THREE.Line(lineGeometry, lineMaterial);
        geometry.add(lineMesh);
      });
    }

    // Add circles (as ring geometry for holes)
    if (dxfData.previewData.circles) {
      dxfData.previewData.circles.forEach(circle => {
        const circleGeometry = new THREE.RingGeometry(
          circle.radius - 0.5,
          circle.radius + 0.5,
          32
        );
        const circleMesh = new THREE.Mesh(circleGeometry, material);
        circleMesh.position.set(...circle.center);
        circleMesh.rotation.x = -Math.PI / 2;
        geometry.add(circleMesh);
      });
    }

    // Add polylines
    if (dxfData.previewData.polylines) {
      dxfData.previewData.polylines.forEach(polyline => {
        if (polyline.vertices.length > 2) {
          const shape = new THREE.Shape();
          
          polyline.vertices.forEach((vertex, index) => {
            if (index === 0) {
              shape.moveTo(vertex[0], vertex[1]);
            } else {
              shape.lineTo(vertex[0], vertex[1]);
            }
          });

          if (polyline.closed) {
            shape.closePath();
          }

          const shapeGeometry = new THREE.ShapeGeometry(shape);
          const shapeMesh = new THREE.Mesh(shapeGeometry, material);
          geometry.add(shapeMesh);
        }
      });
    }

    scene.add(geometry);

    // Center and scale the geometry
    const box = new THREE.Box3().setFromObject(geometry);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 200 / maxDim;

    geometry.scale.multiplyScalar(scale);
    geometry.position.sub(center.multiplyScalar(scale));

    // Position camera
    camera.position.set(150, 150, 150);
    camera.lookAt(0, 0, 0);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [dxfData]);

  return (
    <div 
      ref={mountRef} 
      style={{ width: '100%', height: '400px', position: 'relative' }}
      className="border border-gray-300 rounded-lg overflow-hidden"
    />
  );
};

const DXFUploader = ({ onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.toLowerCase().endsWith('.dxf')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid DXF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/quotes/analyze-dxf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setAnalysisResult(response.data.data);
      if (onAnalysisComplete) {
        onAnalysisComplete(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze DXF file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <label htmlFor="dxf-upload" className="cursor-pointer">
              <div className="flex flex-col items-center space-y-2">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <span className="text-sm text-gray-600">
                  Click to upload DXF file
                </span>
              </div>
              <input
                id="dxf-upload"
                type="file"
                accept=".dxf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {file && (
            <div className="text-center">
              <p className="text-sm text-gray-600">Selected: {file.name}</p>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="mt-2 px-4 py-2 bg-pine-green text-white rounded-md hover:bg-pine-green-dark disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze DXF'}
              </button>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}
        </div>
      </div>

      {analysisResult && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Analysis Results</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Area:</span>{' '}
                {analysisResult.area.toFixed(2)} sq in
              </div>
              <div>
                <span className="font-medium">Perimeter:</span>{' '}
                {analysisResult.perimeter.toFixed(2)} in
              </div>
              <div>
                <span className="font-medium">Cut Length:</span>{' '}
                {analysisResult.cutLength.toFixed(2)} in
              </div>
              <div>
                <span className="font-medium">Holes:</span>{' '}
                {analysisResult.holeCount}
              </div>
              <div>
                <span className="font-medium">Bends:</span>{' '}
                {analysisResult.bendLines.length}
              </div>
              <div>
                <span className="font-medium">Complexity:</span>{' '}
                <span className="capitalize">{analysisResult.complexity}</span>
              </div>
            </div>

            {analysisResult.warnings.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-amber-600">Warnings:</p>
                <ul className="list-disc list-inside text-sm text-amber-600">
                  {analysisResult.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {analysisResult.previewData && (
            <div>
              <h3 className="font-semibold text-lg mb-2">3D Preview</h3>
              <DXFViewer dxfData={analysisResult} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { DXFUploader, DXFViewer };
