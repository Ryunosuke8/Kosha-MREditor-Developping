import * as BABYLON from '@babylonjs/core';
import type { PropertyPanelData } from '../../../shared/types';

export const getPropertyPanelData = (
  mesh: BABYLON.Mesh,
  assetName: string
): PropertyPanelData => {
  const position = mesh.position;
  const rotation = mesh.rotationQuaternion 
    ? mesh.rotationQuaternion.toEulerAngles()
    : mesh.rotation;
  const scaling = mesh.scaling;

  return {
    name: assetName,
    position: {
      x: parseFloat(position.x.toFixed(3)),
      y: parseFloat(position.y.toFixed(3)),
      z: parseFloat(position.z.toFixed(3))
    },
    rotation: {
      x: parseFloat((rotation.x * 180 / Math.PI).toFixed(1)),
      y: parseFloat((rotation.y * 180 / Math.PI).toFixed(1)),
      z: parseFloat((rotation.z * 180 / Math.PI).toFixed(1))
    },
    scale: {
      x: parseFloat(scaling.x.toFixed(3)),
      y: parseFloat(scaling.y.toFixed(3)),
      z: parseFloat(scaling.z.toFixed(3))
    }
  };
};

export const updateMeshTransform = (
  mesh: BABYLON.Mesh,
  transform: {
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
    scale?: { x: number; y: number; z: number };
  }
): void => {
  if (transform.position) {
    mesh.position.set(
      transform.position.x,
      transform.position.y,
      transform.position.z
    );
  }

  if (transform.rotation) {
    const rotationRad = {
      x: transform.rotation.x * Math.PI / 180,
      y: transform.rotation.y * Math.PI / 180,
      z: transform.rotation.z * Math.PI / 180
    };
    mesh.rotation.set(rotationRad.x, rotationRad.y, rotationRad.z);
  }

  if (transform.scale) {
    mesh.scaling.set(
      transform.scale.x,
      transform.scale.y,
      transform.scale.z
    );
  }
}; 