// frontend/src/components/DXFViewer3D/DXFViewer3D.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Line2 } from 'three/examples/jsm/lines/Line2';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry';
import './DXFViewer3D.css';

const DXFViewer3D = ({ dxfData, width = '100%', height = '400px' }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());
  const [hoveredObject, setHoveredObject] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, area: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current || !dxfData) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      sceneRef.current = scene;

      // Camera setup
      const aspectRatio = mountRef.current.clientWidth / mountRef.current.clientHeight;
      const camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
      camera.position.set(0, 0, 50);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Controls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = true;
      controls.minDistance = 10;
      controls.maxDistance = 200;
      controls.enableRotate = true;
      controls.enableZoom = true;
      controls.enablePan = true;
      
      // Touch controls
      controls.touches = {
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      };
      
      controlsRef.current = controls;

      // Raycaster for hover detection
      raycasterRef.current = new THREE.Raycaster();
      raycasterRef.current.params.Line.threshold = 0.5;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
      directionalLight.position.set(10, 10, 10);
      scene.add(directionalLight);

      // Grid helper
      const gridHelper = new THREE.GridHelper(100, 20, 0xcccccc, 0xeeeeee);
      gridHelper.rotation.x = Math.PI / 2;
      scene.add(gridHelper);

      // Axes helper
      const axesHelper = new THREE.AxesHelper(20);
      scene.add(axesHelper);

      // Convert DXF data to 3D geometry
      const geometryGroup = createGeometryFromDXF(dxfData);
      scene.add(geometryGroup);

      // Center and fit camera
      fitCameraToObject(camera, geometryGroup, controls);

      // Calculate dimensions
      const box = new THREE.Box3().setFromObject(geometryGroup);
      const size = box.getSize(new THREE.Vector3());
      setDimensions({
        width: size.x.toFixed(2),
        height: size.y.toFixed(2),
        area: dxfData.area?.toFixed(2) || (size.x * size.y).toFixed(2)
      });

      setIsLoading(false);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Event handlers
      const handleResize = () => {
        if (!mountRef.current) return;
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      };

      const handleMouseMove = (event) => {
        if (!mountRef.current) return;
        const rect = mountRef.current.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        checkHover();
      };

      const checkHover = () => {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(geometryGroup.children, true);
        
        if (intersects.length > 0) {
          const object = intersects[0].object;
          if (object.userData.dimension) {
            setHoveredObject(object.userData);
            renderer.domElement.style.cursor = 'pointer';
          } else {
            setHoveredObject(null);
            renderer.domElement.style.cursor = 'default';
          }
        } else {
          setHoveredObject(null);
          renderer.domElement.style.cursor = 'default';
        }
      };

      window.addEventListener('resize', handleResize);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);

      return () => {
        window.removeEventListener('resize', handleResize);
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        mountRef.current?.removeChild(renderer.domElement);
        renderer.dispose();
        controls.dispose();
      };
    } catch (err) {
      console.error('Error initializing 3D viewer:', err);
      setError('Failed to load 3D view');
      setIsLoading(false);
    }
  }, [dxfData]);

  // Create 3D geometry from DXF data
  const createGeometryFromDXF = (data) => {
    const group = new THREE.Group();
    
    if (!data) return group;

    // Create main outline (assumed to be from perimeter)
    if (data.perimeter > 0 && data.boundingBox) {
      const outlineGeometry = new THREE.BufferGeometry();
      const outlinePoints = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(data.boundingBox.width, 0, 0),
        new THREE.Vector3(data.boundingBox.width, data.boundingBox.height, 0),
        new THREE.Vector3(0, data.boundingBox.height, 0),
        new THREE.Vector3(0, 0, 0)
      ];
      
      outlineGeometry.setFromPoints(outlinePoints);
      const outlineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x333333, 
        linewidth: 2 
      });
      const outline = new THREE.Line(outlineGeometry, outlineMaterial);
      outline.userData.type = 'outline';
      outline.userData.dimension = `Perimeter: ${data.perimeter.toFixed(2)}"`;
      group.add(outline);

      // Create extruded shape for 3D effect
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(data.boundingBox.width, 0);
      shape.lineTo(data.boundingBox.width, data.boundingBox.height);
      shape.lineTo(0, data.boundingBox.height);
      shape.lineTo(0, 0);

      // Subtract holes from shape
      if (data.holes && data.holes.length > 0) {
        data.holes.forEach(hole => {
          const holePath = new THREE.Path();
          const segments = 32;
          for (let i = 0; i <= segments; i++) {
            const theta = (i / segments) * Math.PI * 2;
            const x = hole.x + Math.cos(theta) * (hole.diameter / 2);
            const y = hole.y + Math.sin(theta) * (hole.diameter / 2);
            if (i === 0) {
              holePath.moveTo(x, y);
            } else {
              holePath.lineTo(x, y);
            }
          }
          shape.holes.push(holePath);
        });
      }

      const extrudeSettings = {
        steps: 1,
        depth: 0.125, // Thickness visualization
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 1
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xe0e0e0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData.type = 'part';
      group.add(mesh);
    }

    // Add holes as red cylinders
    if (data.holes && data.holes.length > 0) {
      data.holes.forEach((hole, index) => {
        const holeGroup = new THREE.Group();
        
        // Hole outline circle
        const circleGeometry = new THREE.CircleGeometry(hole.diameter / 2, 32);
        const edges = new THREE.EdgesGeometry(circleGeometry);
        const holeLine = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ 
          color: 0xff0000,
          linewidth: 2
        }));
        holeLine.position.set(hole.x, hole.y, 0.1);
        holeLine.userData.type = 'hole';
        holeLine.userData.dimension = `Hole ${index + 1}: Ø${hole.diameter.toFixed(3)}"`;
        holeGroup.add(holeLine);

        // 3D cylinder for hole
        const cylinderGeometry = new THREE.CylinderGeometry(
          hole.diameter / 2, 
          hole.diameter / 2, 
          0.2, 
          32
        );
        const cylinderMaterial = new THREE.MeshPhongMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.6
        });
        const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
        cylinder.rotation.x = Math.PI / 2;
        cylinder.position.set(hole.x, hole.y, 0);
        holeGroup.add(cylinder);

        group.add(holeGroup);
      });
    }

    // Add bend lines as blue lines
    if (data.bendLines && data.bendLines.length > 0) {
      data.bendLines.forEach((bend, index) => {
        const bendGeometry = new THREE.BufferGeometry();
        const bendPoints = [
          new THREE.Vector3(bend.startPoint.x, bend.startPoint.y, 0.1),
          new THREE.Vector3(bend.endPoint.x, bend.endPoint.y, 0.1)
        ];
        bendGeometry.setFromPoints(bendPoints);
        
        const bendMaterial = new THREE.LineBasicMaterial({ 
          color: 0x0066ff,
          linewidth: 3
        });
        const bendLine = new THREE.Line(bendGeometry, bendMaterial);
        bendLine.userData.type = 'bend';
        bendLine.userData.dimension = `Bend ${index + 1}: ${bend.length.toFixed(2)}"`;
        
        // Add dashed line effect
        const dashedMaterial = new THREE.LineDashedMaterial({
          color: 0x0066ff,
          linewidth: 3,
          scale: 1,
          dashSize: 0.5,
          gapSize: 0.2
        });
        bendLine.material = dashedMaterial;
        bendLine.computeLineDistances();
        
        group.add(bendLine);
      });
    }

    // Center the group
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);

    return group;
  };

  // Fit camera to object
  const fitCameraToObject = (camera, object, controls) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    camera.position.set(center.x, center.y, center.z + cameraZ * 1.5);
    camera.lookAt(center);
    
    controls.target = center;
    controls.minDistance = cameraZ * 0.5;
    controls.maxDistance = cameraZ * 3;
    controls.update();
  };

  // Reset view
  const handleResetView = () => {
    if (!cameraRef.current || !controlsRef.current || !sceneRef.current) return;
    
    const geometryGroup = sceneRef.current.children.find(child => child.type === 'Group');
    if (geometryGroup) {
      fitCameraToObject(cameraRef.current, geometryGroup, controlsRef.current);
    }
  };

  // Toggle wireframe view
  const handleToggleWireframe = () => {
    if (!sceneRef.current) return;
    
    sceneRef.current.traverse((child) => {
      if (child.isMesh && child.userData.type === 'part') {
        child.material.wireframe = !child.material.wireframe;
      }
    });
  };

  return (
    <div className="dxf-viewer-3d">
      <div className="viewer-header">
        <h4>3D Part Preview</h4>
        <div className="viewer-controls">
          <button className="viewer-btn" onClick={handleResetView} title="Reset View">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M1 4v6h6M23 20v-6h-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button className="viewer-btn" onClick={handleToggleWireframe} title="Toggle Wireframe">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <line x1="9" y1="3" x2="9" y2="21" strokeWidth="2"/>
              <line x1="15" y1="3" x2="15" y2="21" strokeWidth="2"/>
              <line x1="3" y1="9" x2="21" y2="9" strokeWidth="2"/>
              <line x1="3" y1="15" x2="21" y2="15" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="viewer-container" style={{ width, height }}>
        {isLoading && (
          <div className="viewer-loading">
            <div className="loading-spinner"></div>
            <p>Loading 3D view...</p>
          </div>
        )}
        
        {error && (
          <div className="viewer-error">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
            </svg>
            <p>{error}</p>
          </div>
        )}

        <div ref={mountRef} className="threejs-mount" />

        {hoveredObject && (
          <div className="dimension-tooltip">
            {hoveredObject.dimension}
          </div>
        )}
      </div>

      <div className="viewer-info">
        <div className="info-item">
          <span className="info-label">Width:</span>
          <span className="info-value">{dimensions.width}"</span>
        </div>
        <div className="info-item">
          <span className="info-label">Height:</span>
          <span className="info-value">{dimensions.height}"</span>
        </div>
        <div className="info-item">
          <span className="info-label">Area:</span>
          <span className="info-value">{dimensions.area} sq in</span>
        </div>
      </div>

      <div className="viewer-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#333' }}></span>
          <span>Outline</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#ff0000' }}></span>
          <span>Holes</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#0066ff' }}></span>
          <span>Bend Lines</span>
        </div>
      </div>
    </div>
  );
};

export default DXFViewer3D;
