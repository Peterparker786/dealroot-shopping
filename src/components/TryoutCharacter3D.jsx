import { Component, Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Float, RoundedBox } from "@react-three/drei";

/* Cute 3D mascot for the Dealroot Tryouts hero. Pure primitives — no external
   model files, no network. Two variants: male (glasses + tie + cap) and
   female (ponytail + blazer). */

function Character({ variant }) {
  const female = variant === "female";
  const palette = {
    skin: "#ffd0a3",
    skinShade: "#eeb18a",
    hair: female ? "#8a5a33" : "#2f3542",
    shirt: female ? "#9aa1b3" : "#ffffff",
    shirtShade: female ? "#848ba0" : "#e9e5df",
    tie: "#22305c",
    trouser: "#3a3a46",
    shoe: "#2b2b35",
  };

  return (
    <group position={[0, -1.62, 0]}>
      {/* ---- legs ---- */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]}>
          <capsuleGeometry args={[0.15, 0.5, 6, 14]} />
          <meshStandardMaterial color={palette.trouser} roughness={0.85} />
        </mesh>
      ))}

      {/* shoes */}
      {[-0.26, 0.26].map((x) => (
        <mesh key={x} position={[x, 0.02, 0.07]}>
          <sphereGeometry args={[0.16, 20, 16]} />
          <meshStandardMaterial color={palette.shoe} roughness={0.6} />
        </mesh>
      ))}

      {/* ---- body ---- */}
      <RoundedBox
        args={[1.12, 1.18, 0.52]}
        radius={0.2}
        smoothness={5}
        position={[0, 1.42, 0]}
      >
        <meshStandardMaterial color={palette.shirt} roughness={0.6} />
      </RoundedBox>

      {/* collar */}
      <mesh position={[0, 1.98, 0.15]} rotation={[0.15, 0, Math.PI]}>
        <coneGeometry args={[0.3, 0.3, 4]} />
        <meshStandardMaterial color={palette.shirtShade} roughness={0.7} />
      </mesh>

      {/* tie (male) */}
      {!female && (
        <mesh position={[0, 1.72, 0.27]}>
          <coneGeometry args={[0.13, 0.5, 4]} />
          <meshStandardMaterial color={palette.tie} roughness={0.4} />
        </mesh>
      )}

      {/* ---- arms ---- */}
      {/* pointing arm (toward the poster / center) */}
      <group
        position={[female ? -0.66 : 0.66, 1.72, 0]}
        rotation={[0, 0, female ? Math.PI / 3.2 : -Math.PI / 3.2]}
      >
        <mesh position={[0, 0.32, 0]}>
          <capsuleGeometry args={[0.13, 0.5, 6, 14]} />
          <meshStandardMaterial color={palette.shirt} roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.66, 0]}>
          <sphereGeometry args={[0.14, 18, 14]} />
          <meshStandardMaterial color={palette.skin} roughness={0.55} />
        </mesh>
      </group>

      {/* resting arm */}
      <group
        position={[female ? 0.66 : -0.66, 1.7, 0]}
        rotation={[0, 0, female ? -Math.PI / 4.2 : Math.PI / 4.2]}
      >
        <mesh position={[0, -0.32, 0]}>
          <capsuleGeometry args={[0.13, 0.5, 6, 14]} />
          <meshStandardMaterial color={palette.shirt} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.66, 0]}>
          <sphereGeometry args={[0.14, 18, 14]} />
          <meshStandardMaterial color={palette.skin} roughness={0.55} />
        </mesh>
      </group>

      {/* ---- head ---- */}
      <mesh position={[0, 2.52, 0]}>
        <sphereGeometry args={[0.5, 36, 36]} />
        <meshStandardMaterial color={palette.skin} roughness={0.5} />
      </mesh>

      {/* ears */}
      {[-0.5, 0.5].map((x) => (
        <mesh key={x} position={[x, 2.5, 0]}>
          <sphereGeometry args={[0.1, 14, 12]} />
          <meshStandardMaterial color={palette.skin} roughness={0.5} />
        </mesh>
      ))}

      {/* hair cap */}
      <mesh position={[0, 2.72, -0.06]} scale={[1, 0.62, 0.98]}>
        <sphereGeometry args={[0.52, 32, 24]} />
        <meshStandardMaterial color={palette.hair} roughness={0.8} />
      </mesh>

      {/* female ponytail */}
      {female && (
        <mesh position={[0.14, 2.52, -0.5]} scale={[0.7, 1.15, 0.7]}>
          <sphereGeometry args={[0.2, 20, 16]} />
          <meshStandardMaterial color={palette.hair} roughness={0.8} />
        </mesh>
      )}

      {/* eyes */}
      {[-0.16, 0.16].map((x) => (
        <mesh key={x} position={[x, 2.58, 0.44]}>
          <sphereGeometry args={[0.055, 16, 14]} />
          <meshStandardMaterial color="#22242c" roughness={0.3} />
        </mesh>
      ))}

      {/* glasses (male) */}
      {!female && (
        <group position={[0, 2.56, 0.46]}>
          {[-0.18, 0.18].map((x) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, 0]}>
              <torusGeometry args={[0.13, 0.032, 10, 22]} />
              <meshStandardMaterial color="#1f232c" roughness={0.35} />
            </mesh>
          ))}
          <mesh>
            <boxGeometry args={[0.08, 0.035, 0.035]} />
            <meshStandardMaterial color="#1f232c" roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* female earrings */}
      {female && (
        <>
          <mesh position={[-0.52, 2.3, 0]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshStandardMaterial color="#e9b84c" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0.52, 2.3, 0]}>
            <sphereGeometry args={[0.05, 12, 10]} />
            <meshStandardMaterial color="#e9b84c" metalness={0.9} roughness={0.25} />
          </mesh>
        </>
      )}

      {/* smile */}
      <mesh position={[0, 2.3, 0.45]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.085, 16, 12]} />
        <meshStandardMaterial color="#b0562f" roughness={0.55} />
      </mesh>
    </group>
  );
}

class WebGLCheck extends Component {
  state = { failed: false };

  componentDidCatch() {
    this.setState({ failed: true });
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="tryout-3d-fallback" aria-hidden="true">
          🧑
        </div>
      );
    }
    return this.props.children;
  }
}

export default function TryoutCharacter3D({ variant = "male" }) {
  // Mount the WebGL canvas only on screens wide enough to show the
  // characters (≥900px). Below that the container is hidden by CSS, so
  // mounting anyway would waste GPU/battery on mobile.
  const [canRender, setCanRender] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return true;
    }
    return window.matchMedia("(min-width: 900px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 900px)");
    const onChange = (event) => setCanRender(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="tryout-3d-char" aria-hidden="true">
      <div className="tryout-3d-shadow" />
      {canRender ? (
        <WebGLCheck>
          <Suspense fallback={null}>
            <Canvas
              camera={{ position: [0, 0.9, 5.4], fov: 42 }}
              dpr={[1, 2]}
              gl={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
                // Kept so the canvas can be pixel-read/screenshotted;
                // cost is nil since the scene re-renders every frame anyway.
                preserveDrawingBuffer: true,
              }}
            >
              <ambientLight intensity={0.8} />
              <directionalLight position={[4, 6, 4]} intensity={1.15} />
              <directionalLight
                position={[-4, 2, -3]}
                intensity={0.4}
                color="#b9a4ff"
              />
              <Float speed={1.6} rotationIntensity={0.14} floatIntensity={0.5}>
                <Character variant={variant} />
              </Float>
            </Canvas>
          </Suspense>
        </WebGLCheck>
      ) : (
        <div className="tryout-3d-fallback" aria-hidden="true">
          🧑
        </div>
      )}
    </div>
  );
}
