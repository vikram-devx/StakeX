import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import headsImgPath from '@assets/heads.png';
import tailsImgPath from '@assets/tails.png';

interface ThreeDCoinProps {
  isFlipping: boolean;
  result?: 'heads' | 'tails';
  onAnimationComplete?: () => void;
  className?: string;
}

export default function ThreeDCoin({
  isFlipping,
  result,
  onAnimationComplete,
  className,
}: ThreeDCoinProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const [animationComplete, setAnimationComplete] = useState(false);
  const [finalResult, setFinalResult] = useState<'heads' | 'tails' | undefined>(undefined);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coinRef = useRef<THREE.Mesh | null>(null);
  const targetRotation = useRef(0);
  const currentRotation = useRef(0);
  const flipCount = useRef(0);
  const totalFlips = useRef(0);
  const startTime = useRef(0);
  
  // Set up the Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // Camera
    const camera = new THREE.PerspectiveCamera(
      45, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Create coin
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
    
    // Materials for both sides of the coin
    const headsMaterial = new THREE.MeshStandardMaterial({
      color: 0xF7CB45, // Gold-like color
      metalness: 0.8,
      roughness: 0.3,
    });
    
    const tailsMaterial = new THREE.MeshStandardMaterial({
      color: 0xDAA520, // Slightly darker gold for tails
      metalness: 0.8,
      roughness: 0.4,
    });
    
    // Create a material array for the coin
    const materials = [
      headsMaterial, // Side
      tailsMaterial, // Heads side
      headsMaterial, // Tails side
    ];
    
    // Create the coin mesh
    const coin = new THREE.Mesh(geometry, materials);
    scene.add(coin);
    coinRef.current = coin;
    
    // Load the one rupee coin images
    // Create image objects
    const headsImage = new Image();
    headsImage.src = headsImgPath;
    
    const tailsImage = new Image();
    tailsImage.src = tailsImgPath;
    
    // Create textures for heads side
    const headsCanvas = document.createElement('canvas');
    headsCanvas.width = 256;
    headsCanvas.height = 256;
    const headsCtx = headsCanvas.getContext('2d');
    
    // Create textures for tails side
    const tailsCanvas = document.createElement('canvas');
    tailsCanvas.width = 256;
    tailsCanvas.height = 256;
    const tailsCtx = tailsCanvas.getContext('2d');
    
    // Draw images to canvases when they load
    headsImage.onload = () => {
      if (headsCtx) {
        headsCtx.clearRect(0, 0, 256, 256);
        headsCtx.drawImage(headsImage, 0, 0, 256, 256);
        
        // Update the texture to trigger a re-render
        if (headsTexture) {
          headsTexture.needsUpdate = true;
        }
      }
    };
    
    tailsImage.onload = () => {
      if (tailsCtx) {
        tailsCtx.clearRect(0, 0, 256, 256);
        tailsCtx.drawImage(tailsImage, 0, 0, 256, 256);
        
        // Update the texture to trigger a re-render
        if (tailsTexture) {
          tailsTexture.needsUpdate = true;
        }
      }
    };
    
    // Create initial textures (will be updated when images load)
    const headsTexture = new THREE.CanvasTexture(headsCanvas);
    const headsTextMaterial = new THREE.MeshBasicMaterial({
      map: headsTexture,
      transparent: true,
      alphaTest: 0.1, // Helps with transparency
    });
    
    const tailsTexture = new THREE.CanvasTexture(tailsCanvas);
    const tailsTextMaterial = new THREE.MeshBasicMaterial({
      map: tailsTexture,
      transparent: true,
      alphaTest: 0.1, // Helps with transparency
    });
    
    // Create planes for the coin images
    const textPlaneGeometry = new THREE.PlaneGeometry(2.5, 2.5);
    
    // Heads image plane
    const headsImagePlane = new THREE.Mesh(textPlaneGeometry, headsTextMaterial);
    headsImagePlane.position.set(0, 0.101, 0); // Position slightly above the coin's surface
    headsImagePlane.rotation.x = -Math.PI / 2; // Align with the coin's face
    
    // Tails image plane
    const tailsImagePlane = new THREE.Mesh(textPlaneGeometry, tailsTextMaterial);
    tailsImagePlane.position.set(0, -0.101, 0); // Position slightly below the coin's surface
    tailsImagePlane.rotation.x = Math.PI / 2; // Align with the coin's face
    tailsImagePlane.rotation.z = Math.PI; // Flip image right-side up
    
    // Add image planes to coin
    coin.add(headsImagePlane);
    coin.add(tailsImagePlane);
    
    // Set initial rotation so the coin is viewed properly
    coin.rotation.x = Math.PI / 2;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(-5, 5, 5);
    scene.add(pointLight);
    
    // Animation loop
    const animate = () => {
      if (coinRef.current && isFlipping) {
        // Calculate the current position in the animation
        const elapsed = Date.now() - startTime.current;
        
        // Smooth animation using easing
        const targetZ = targetRotation.current;
        
        // Apply a damping factor to make the animation smoother
        const damping = 0.1;
        coinRef.current.rotation.z += (targetZ - coinRef.current.rotation.z) * damping;
        
        // Check if we're close enough to the target to consider this flip complete
        if (Math.abs(targetZ - coinRef.current.rotation.z) < 0.01 && 
            flipCount.current < totalFlips.current) {
          
          // Move to the next flip
          flipCount.current++;
          targetRotation.current += Math.PI;
        }
        
        // Check if all flips are complete
        if (flipCount.current >= totalFlips.current && 
            Math.abs(targetZ - coinRef.current.rotation.z) < 0.01 && 
            !animationComplete) {
          
          setAnimationComplete(true);
          setFinalResult(result);
          
          if (onAnimationComplete) {
            onAnimationComplete();
          }
        }
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      if (rendererRef.current && containerRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);
  
  // Handle the flipping animation
  useEffect(() => {
    if (isFlipping && coinRef.current) {
      // Reset state for a new flip
      setAnimationComplete(false);
      setFinalResult(undefined);
      
      // Set starting time for the animation
      startTime.current = Date.now();
      
      // Determine the number of flips
      flipCount.current = 0;
      totalFlips.current = Math.floor(Math.random() * 3) + 5; // 5-7 flips
      
      // Calculate the target rotation to end on the correct side
      // If result is 'heads', we need an even number of half-rotations
      // If result is 'tails', we need an odd number of half-rotations
      const needsEvenFlips = result === 'heads';
      
      // Adjust total flips to ensure it ends with the correct side up
      if ((totalFlips.current % 2 === 0 && !needsEvenFlips) || 
          (totalFlips.current % 2 === 1 && needsEvenFlips)) {
        totalFlips.current += 1;
      }
      
      // Set the target rotation for the animation
      targetRotation.current = coinRef.current.rotation.z + (totalFlips.current * Math.PI);
    }
  }, [isFlipping, result]);
  
  return (
    <div className={cn("relative", className)}>
      <div 
        ref={containerRef} 
        className="w-40 h-40 mx-auto"
      />
      
      {/* Status indicator */}
      {isFlipping && !animationComplete && (
        <div className="absolute -bottom-10 w-full text-center font-medium text-gray-700 animate-pulse">
          Flipping...
        </div>
      )}
      
      {finalResult && animationComplete && (
        <div className="absolute -bottom-10 w-full text-center font-bold text-lg text-primary">
          {finalResult.toUpperCase()}!
        </div>
      )}
    </div>
  );
}