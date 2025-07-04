// frontend/src/components/DXFViewer3D/dxfTo3D.js
import * as THREE from 'three';

/**
 * Convert DXF entities to Three.js geometry
 */
export class DXFTo3D {
  constructor() {
    this.materials = {
      outline: new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 }),
      hole: new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 }),
      bend: new THREE.LineDashedMaterial({ 
        color: 0x0066ff, 
        linewidth: 3,
        dashSize: 0.5,
        gapSize: 0.2
      }),
      construction: new THREE.LineBasicMaterial({ 
        color: 0x999999, 
        linewidth: 1,
        transparent: true,
        opacity: 0.5
      }),
      part: new THREE.MeshPhongMaterial({ 
        color: 0xe0e0e0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      })
    };
  }

  /**
   * Convert DXF data to Three.js Group
   */
  convertToThreeJS(dxfData) {
    const group = new THREE.Group();
    
    if (!dxfData) return group;

    // If we have actual DXF entities
    if (dxfData.entities) {
      this.processEntities(dxfData.entities, group);
    } else {
      // Fallback to simplified representation
      this.createSimplifiedGeometry(dxfData, group);
    }

    // Center the group
    this.centerGroup(group);
    
    return group;
  }

  /**
   * Process DXF entities
   */
  processEntities(entities, group) {
    // Group entities by type for better organization
    const circles = [];
    const lines = [];
    const polylines = [];
    const arcs = [];

    Object.values(entities).forEach(entityArray => {
      entityArray.forEach(entity => {
        switch (entity.type) {
          case 'CIRCLE':
            circles.push(entity);
            break;
          case 'LINE':
            lines.push(entity);
            break;
          case 'LWPOLYLINE':
          case 'POLYLINE':
            polylines.push(entity);
            break;
          case 'ARC':
            arcs.push(entity);
            break;
        }
      });
    });

    // Process polylines (main outlines)
    polylines.forEach(polyline => {
      const polylineGroup = this.createPolyline(polyline);
      if (polylineGroup) group.add(polylineGroup);
    });

    // Process circles (holes)
    circles.forEach(circle => {
      const circleGroup = this.createCircle(circle);
      if (circleGroup) group.add(circleGroup);
    });

    // Process lines (could be bend lines or construction)
    lines.forEach(line => {
      const lineObj = this.createLine(line);
      if (lineObj) group.add(lineObj);
    });

    // Process arcs
    arcs.forEach(arc => {
      const arcObj = this.createArc(arc);
      if (arcObj) group.add(arcObj);
    });

    // Create extruded shape if we have closed polylines
    const mainShape = this.createExtrudedShape(polylines, circles);
    if (mainShape) {
      group.add(mainShape);
    }
  }

  /**
   * Create polyline geometry
   */
  createPolyline(polyline) {
    if (!polyline.vertices || polyline.vertices.length < 2) return null;

    const group = new THREE.Group();
    const points = polyline.vertices.map(v => new THREE.Vector3(v.x, v.y, 0));
    
    // Close the polyline if needed
    if (polyline.closed) {
      points.push(points[0].clone());
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = this.getMaterialForEntity(polyline);
    const line = new THREE.Line(geometry, material);
    
    line.userData = {
      type: 'polyline',
      layer: polyline.layer,
      closed: polyline.closed
    };

    group.add(line);
    return group;
  }

  /**
   * Create circle geometry
   */
  createCircle(circle) {
    if (!circle.center || !circle.radius) return null;

    const group = new THREE.Group();
    
    // Create circle outline
    const curve = new THREE.EllipseCurve(
      circle.center.x, circle.center.y,
      circle.radius, circle.radius,
      0, 2 * Math.PI,
      false,
      0
    );
    
    const points = curve.getPoints(64);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = this.materials.hole;
    const outline = new THREE.Line(geometry, material);
    outline.position.z = 0.1;
    
    outline.userData = {
      type: 'hole',
      diameter: circle.radius * 2,
      center: circle.center,
      dimension: `Ø${(circle.radius * 2).toFixed(3)}"`
    };
    
    group.add(outline);

    // Create 3D cylinder
    const cylinderGeometry = new THREE.CylinderGeometry(
      circle.radius, 
      circle.radius, 
      0.2, 
      32
    );
    const cylinder = new THREE.Mesh(cylinderGeometry, new THREE.MeshPhongMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.6
    }));
    cylinder.rotation.x = Math.PI / 2;
    cylinder.position.set(circle.center.x, circle.center.y, 0);
    
    group.add(cylinder);
    
    return group;
  }

  /**
   * Create line geometry
   */
  createLine(line) {
    if (!line.start || !line.end) return null;

    const points = [
      new THREE.Vector3(line.start.x, line.start.y, 0),
      new THREE.Vector3(line.end.x, line.end.y, 0)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = this.getMaterialForEntity(line);
    const lineObj = new THREE.Line(geometry, material);
    
    // If it's a bend line, compute line distances for dashed effect
    if (this.isBendLine(line)) {
      lineObj.computeLineDistances();
      lineObj.position.z = 0.1;
      
      const length = points[0].distanceTo(points[1]);
      lineObj.userData = {
        type: 'bend',
        length: length,
        dimension: `Bend: ${length.toFixed(2)}"`
      };
    }

    return lineObj;
  }

  /**
   * Create arc geometry
   */
  createArc(arc) {
    if (!arc.center || arc.radius === undefined) return null;

    const startAngle = (arc.startAngle || 0) * Math.PI / 180;
    const endAngle = (arc.endAngle || 360) * Math.PI / 180;
    
    const curve = new THREE.ArcCurve(
      arc.center.x,
      arc.center.y,
      arc.radius,
      startAngle,
      endAngle,
      false
    );

    const points = curve.getPoints(64);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = this.getMaterialForEntity(arc);
    const arcObj = new THREE.Line(geometry, material);
    
    return arcObj;
  }

  /**
   * Create extruded shape from closed polylines
   */
  createExtrudedShape(polylines, circles) {
    // Find the largest closed polyline (main outline)
    const closedPolylines = polylines.filter(p => p.closed || this.isPolylineClosed(p));
    if (closedPolylines.length === 0) return null;

    const mainPolyline = closedPolylines.reduce((largest, current) => {
      const currentArea = this.calculatePolylineArea(current);
      const largestArea = this.calculatePolylineArea(largest);
      return currentArea > largestArea ? current : largest;
    });

    if (!mainPolyline || !mainPolyline.vertices) return null;

    // Create shape
    const shape = new THREE.Shape();
    mainPolyline.vertices.forEach((vertex, index) => {
      if (index === 0) {
        shape.moveTo(vertex.x, vertex.y);
      } else {
        shape.lineTo(vertex.x, vertex.y);
      }
    });

    // Add holes
    circles.forEach(circle => {
      if (this.isPointInsidePolyline(circle.center, mainPolyline)) {
        const holePath = new THREE.Path();
        const segments = 32;
        for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          const x = circle.center.x + Math.cos(theta) * circle.radius;
          const y = circle.center.y + Math.sin(theta) * circle.radius;
          if (i === 0) {
            holePath.moveTo(x, y);
          } else {
            holePath.lineTo(x, y);
          }
        }
        shape.holes.push(holePath);
      }
    });

    // Extrude settings
    const extrudeSettings = {
      steps: 1,
      depth: 0.125,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 1
    };

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const mesh = new THREE.Mesh(geometry, this.materials.part);
    mesh.userData.type = 'part';
    
    return mesh;
  }

  /**
   * Create simplified geometry from parsed DXF data
   */
  createSimplifiedGeometry(data, group) {
    // Create bounding box outline
    if (data.boundingBox && data.boundingBox.width > 0 && data.boundingBox.height > 0) {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(data.boundingBox.width, 0);
      shape.lineTo(data.boundingBox.width, data.boundingBox.height);
      shape.lineTo(0, data.boundingBox.height);
      shape.lineTo(0, 0);

      // Add holes
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

      // Create extruded mesh
      const extrudeSettings = {
        steps: 1,
        depth: 0.125,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 1
      };

      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mesh = new THREE.Mesh(geometry, this.materials.part);
      mesh.userData.type = 'part';
      group.add(mesh);

      // Add outline
      const outlinePoints = [
        new THREE.Vector3(0, 0, 0.1),
        new THREE.Vector3(data.boundingBox.width, 0, 0.1),
        new THREE.Vector3(data.boundingBox.width, data.boundingBox.height, 0.1),
        new THREE.Vector3(0, data.boundingBox.height, 0.1),
        new THREE.Vector3(0, 0, 0.1)
      ];
      const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
      const outline = new THREE.Line(outlineGeometry, this.materials.outline);
      outline.userData = {
        type: 'outline',
        dimension: `${data.boundingBox.width.toFixed(2)}" × ${data.boundingBox.height.toFixed(2)}"`
      };
      group.add(outline);
    }

    // Add holes
    if (data.holes && data.holes.length > 0) {
      data.holes.forEach((hole, index) => {
        const holeGroup = this.createCircle({
          center: { x: hole.x, y: hole.y },
          radius: hole.diameter / 2
        });
        if (holeGroup) {
          holeGroup.userData.dimension = `Hole ${index + 1}: Ø${hole.diameter.toFixed(3)}"`;
          group.add(holeGroup);
        }
      });
    }

    // Add bend lines
    if (data.bendLines && data.bendLines.length > 0) {
      data.bendLines.forEach((bend, index) => {
        const bendLine = this.createLine({
          start: bend.startPoint,
          end: bend.endPoint,
          layer: 'BEND'
        });
        if (bendLine) {
          bendLine.userData.dimension = `Bend ${index + 1}: ${bend.length.toFixed(2)}"`;
          group.add(bendLine);
        }
      });
    }
  }

  /**
   * Get material based on entity properties
   */
  getMaterialForEntity(entity) {
    if (this.isBendLine(entity)) {
      return this.materials.bend;
    }
    if (entity.layer && entity.layer.toLowerCase().includes('construction')) {
      return this.materials.construction;
    }
    if (entity.type === 'CIRCLE') {
      return this.materials.hole;
    }
    return this.materials.outline;
  }

  /**
   * Check if entity is a bend line
   */
  isBendLine(entity) {
    if (entity.layer) {
      const layer = entity.layer.toLowerCase();
      if (layer.includes('bend') || layer.includes('fold') || layer.includes('crease')) {
        return true;
      }
    }
    if (entity.color === 1 || entity.color === 2) { // Red or Yellow
      return true;
    }
    return false;
  }

  /**
   * Check if polyline is closed
   */
  isPolylineClosed(polyline) {
    if (polyline.closed) return true;
    if (!polyline.vertices || polyline.vertices.length < 3) return false;
    
    const first = polyline.vertices[0];
    const last = polyline.vertices[polyline.vertices.length - 1];
    const distance = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    
    return distance < 0.001;
  }

  /**
   * Calculate polyline area
   */
  calculatePolylineArea(polyline) {
    if (!polyline.vertices || polyline.vertices.length < 3) return 0;
    
    let area = 0;
    const vertices = polyline.vertices;
    
    for (let i = 0; i < vertices.length; i++) {
      const j = (i + 1) % vertices.length;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }
    
    return Math.abs(area) / 2;
  }

  /**
   * Check if point is inside polyline
   */
  isPointInsidePolyline(point, polyline) {
    if (!polyline.vertices) return false;
    
    let inside = false;
    const vertices = polyline.vertices;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i].x, yi = vertices[i].y;
      const xj = vertices[j].x, yj = vertices[j].y;
      
      const intersect = ((yi > point.y) !== (yj > point.y))
          && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }

  /**
   * Center group at origin
   */
  centerGroup(group) {
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
  }
}

export default DXFTo3D;
