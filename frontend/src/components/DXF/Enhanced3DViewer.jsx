import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';

const Enhanced3DViewer = ({ dxfData, material = 'cold-rolled-steel', thickness = 0.125 }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  const meshRef = useRef(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'flat', 'wireframe'
  const [showDimensions, setShowDimensions] = useState(true);
  const [showBendLines, setShowBendLines] = useState(true);

  // Material colors based on type
  const materialColors = {
    'cold-rolled-steel': 0x8b8c8d,
    'stainless-304': 0xb8b8b8,
    'stainless-316': 0xc0c0c0,
    'aluminum-6061': 0xd3d3d3
  };

  useEffect(() => {
    if (!dxfData || !mountRef.current) return;

    // Scene setup
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 10000);
    
    // Renderer with antialiasing
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.5;
    controls.enablePan = true;
    controls.enableZoom = true;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight1.position.set(100, 100, 50);
    directionalLight1.castShadow = true;
    directionalLight1.shadow.camera.near = 0.1;
    directionalLight1.shadow.camera.far = 1000;
    directionalLight1.shadow.camera.left = -500;
    directionalLight1.shadow.camera.right = 500;
    directionalLight1.shadow.camera.top = 500;
    directionalLight1.shadow.camera.bottom = -500;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight2.position.set(-100, 100, -50);
    scene.add(directionalLight2);

    // Grid helper with finer divisions
    const gridSize = 1000;
    const gridDivisions = 50;
    const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xcccccc, 0xe0e0e0);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.z = -1;
    gridHelper.receiveShadow = true;
    scene.add(gridHelper);

    // Create main geometry group
    const partGroup = new THREE.Group();

    // Material for the sheet metal
    const sheetMaterial = new THREE.MeshPhysicalMaterial({
      color: materialColors[material] || 0x8b8c8d,
      metalness: 0.8,
      roughness: 0.4,
      clearcoat: 0.1,
      clearcoatRoughness: 0.1,
      side: THREE.DoubleSide,
      envMapIntensity: 0.5
    });

    // Process the part geometry
    if (dxfData.entities) {
      // Find the main outline (largest polyline)
      const polylines = [];
      const holes = [];
      const bendLines = [];

      // Process entities
      Object.entries(dxfData.entities).forEach(([key, count]) => {
        if (dxfData[key.toLowerCase()]) {
          const entities = dxfData[key.toLowerCase()];
          // Process based on entity type
        }
      });

      // Create the main part shape
      if (dxfData.boundingBox) {
        const { width: partWidth, height: partHeight } = dxfData.boundingBox;
        
        // Create shape from outline
        const shape = new THREE.Shape();
        
        // Simple rectangle for now (will be replaced with actual polyline data)
        shape.moveTo(0, 0);
        shape.lineTo(partWidth, 0);
        shape.lineTo(partWidth, partHeight);
        shape.lineTo(0, partHeight);
        shape.closePath();

        // Add holes
        if (dxfData.holes && dxfData.holes.length > 0) {
          dxfData.holes.forEach(hole => {
            const holePath = new THREE.Path();
            holePath.absarc(hole.x, hole.y, hole.diameter / 2, 0, Math.PI * 2, true);
            shape.holes.push(holePath);
          });
        }

        // Extrude to create 3D part
        const extrudeSettings = {
          depth: thickness * 25.4, // Convert inches to mm for better scale
          bevelEnabled: true,
          bevelThickness: 0.5,
          bevelSize: 0.5,
          bevelSegments: 1
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const mesh = new THREE.Mesh(geometry, sheetMaterial);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Center the part
        const box = new THREE.Box3().setFromObject(mesh);
        const center = box.getCenter(new THREE.Vector3());
        mesh.position.sub(center);
        
        partGroup.add(mesh);
        meshRef.current = mesh;

        // Add bend lines if present
        if (showBendLines && dxfData.bendLines && dxfData.bendLines.length > 0) {
          const bendMaterial = new LineMaterial({
            color: 0xff0000,
            linewidth: 3,
            dashed: true,
            dashSize: 10,
            gapSize: 5,
            resolution: new THREE.Vector2(width, height)
          });

          dxfData.bendLines.forEach(bend => {
            const points = [
              bend.startPoint.x - center.x,
              bend.startPoint.y - center.y,
              thickness * 25.4 / 2,
              bend.endPoint.x - center.x,
              bend.endPoint.y - center.y,
              thickness * 25.4 / 2
            ];

            const lineGeometry = new LineGeometry();
            lineGeometry.setPositions(points);
            
            const line = new Line2(lineGeometry, bendMaterial);
            partGroup.add(line);
          });
        }

        // Add dimensions if enabled
        if (showDimensions) {
          // Add dimension lines and text
          const dimGroup = createDimensions(partWidth, partHeight, center);
          partGroup.add(dimGroup);
        }

        // Scale for better view
        const maxDim = Math.max(partWidth, partHeight);
        const scale = 200 / maxDim;
        partGroup.scale.multiplyScalar(scale);
      }
    }

    scene.add(partGroup);

    // Position camera
    const box = new THREE.Box3().setFromObject(partGroup);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    camera.position.set(maxDim * 1.5, maxDim * 1.5, maxDim * 1.5);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);

    // Add axes helper
    const axesHelper = new THREE.AxesHelper(maxDim / 2);
    scene.add(axesHelper);

    // Animation loop
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      controls.update();
      
      // Update materials based on view mode
      if (meshRef.current) {
        switch (viewMode) {
          case 'wireframe':
            meshRef.current.material.wireframe = true;
            break;
          case 'flat':
            meshRef.current.rotation.x = -Math.PI / 2;
            break;
          default:
            meshRef.current.material.wireframe = false;
            if (meshRef.current.rotation.x !== 0) {
              meshRef.current.rotation.x = 0;
            }
        }
      }
      
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
  }, [dxfData, material, viewMode, showDimensions, showBendLines]);

  // Helper function to create dimension lines
  const createDimensions = (width, height, center) => {
    const dimGroup = new THREE.Group();
    
    // Create dimension lines
    const dimMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
    
    // Width dimension
    const widthPoints = [
      new THREE.Vector3(-center.x, -center.y - 20, 0),
      new THREE.Vector3(width - center.x, -center.y - 20, 0)
    ];
    const widthGeometry = new THREE.BufferGeometry().setFromPoints(widthPoints);
    const widthLine = new THREE.Line(widthGeometry, dimMaterial);
    dimGroup.add(widthLine);
    
    // Height dimension
    const heightPoints = [
      new THREE.Vector3(width - center.x + 20, -center.y, 0),
      new THREE.Vector3(width - center.x + 20, height - center.y, 0)
    ];
    const heightGeometry = new THREE.BufferGeometry().setFromPoints(heightPoints);
    const heightLine = new THREE.Line(heightGeometry, dimMaterial);
    dimGroup.add(heightLine);
    
    return dimGroup;
  };

  return (
    <div className="relative w-full h-full">
      {/* 3D Viewer */}
      <div 
        ref={mountRef} 
        className="w-full h-full"
        style={{ minHeight: '500px' }}
      />
      
      {/* Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 space-y-3">
        <div className="text-sm font-semibold text-gray-700">View Controls</div>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="viewMode"
              value="3d"
              checked={viewMode === '3d'}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-blue-600"
            />
            <span className="text-sm">3D View</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="viewMode"
              value="flat"
              checked={viewMode === 'flat'}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-blue-600"
            />
            <span className="text-sm">Flat View</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="viewMode"
              value="wireframe"
              checked={viewMode === 'wireframe'}
              onChange={(e) => setViewMode(e.target.value)}
              className="text-blue-600"
            />
            <span className="text-sm">Wireframe</span>
          </label>
        </div>
        
        <div className="space-y-2 pt-2 border-t">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showDimensions}
              onChange={(e) => setShowDimensions(e.target.checked)}
              className="text-blue-600"
            />
            <span className="text-sm">Show Dimensions</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showBendLines}
              onChange={(e) => setShowBendLines(e.target.checked)}
              className="text-blue-600"
            />
            <span className="text-sm">Show Bend Lines</span>
          </label>
        </div>
      </div>
      
      {/* Part Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4">
        <div className="text-sm space-y-1">
          <div><span className="font-semibold">Material:</span> {material}</div>
          <div><span className="font-semibold">Thickness:</span> {thickness}"</div>
          {dxfData && (
            <>
              <div><span className="font-semibold">Area:</span> {(dxfData.area / 144).toFixed(2)} sq ft</div>
              <div><span className="font-semibold">Holes:</span> {dxfData.holeCount}</div>
              {dxfData.bendLines && (
                <div><span className="font-semibold">Bends:</span> {dxfData.bendLines.length}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Enhanced3DViewer;
