import { useEffect, useMemo, useRef, useState } from "react";
import Globe from "react-globe.gl";

export interface QuizGlobePoint {
  quizId: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  totalPlays: number;
  lat: number;
  lng: number;
}

interface QuizGlobeProps {
  points: QuizGlobePoint[];
  onPointClick: (quizId: string) => void;
}

export function QuizGlobe({ points, onPointClick }: QuizGlobeProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [globeSize, setGlobeSize] = useState({ width: 0, height: 420 });

  const arcsData = useMemo(() => {
    if (points.length < 2) return [];
    const arcs: {
      startLat: number;
      startLng: number;
      endLat: number;
      endLng: number;
      color: string[];
    }[] = [];

    for (let i = 0; i < points.length - 1; i += 1) {
      const start = points[i];
      const end = points[i + 1];
      arcs.push({
        startLat: start.lat,
        startLng: start.lng,
        endLat: end.lat,
        endLng: end.lng,
        color: ["#10b981", "#6366f1"],
      });
    }
    return arcs;
  }, [points]);

  useEffect(() => {
    if (!globeRef.current) return;
    globeRef.current.pointOfView(
      { lat: 20, lng: 0, altitude: 2.1 },
      1000
    );
    globeRef.current.controls().target.set(0, 0, 0);
    globeRef.current.controls().update();
    globeRef.current.controls().autoRotate = true;
    globeRef.current.controls().autoRotateSpeed = 0.35;
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = () => {
      const width = Math.max(280, node.clientWidth);
      const height = Math.max(320, node.clientHeight);
      setGlobeSize({ width, height });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-4 overflow-hidden">
      <div
        ref={containerRef}
        className="h-[420px] w-full relative"
        onMouseEnter={() => {
          if (!globeRef.current) return;
          globeRef.current.controls().autoRotate = false;
        }}
        onMouseLeave={() => {
          if (!globeRef.current) return;
          globeRef.current.controls().autoRotate = true;
        }}
      >
        <Globe
          ref={globeRef}
          width={globeSize.width}
          height={globeSize.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          backgroundColor="rgba(0,0,0,0)"
          pointsData={points}
          pointLat={(d: any) => d.lat}
          pointLng={(d: any) => d.lng}
          pointAltitude={0.09}
          pointRadius={0.6}
          pointColor={(d: any) =>
            d.difficulty === "easy"
              ? "#22c55e"
              : d.difficulty === "medium"
              ? "#f59e0b"
              : "#ef4444"
          }
          pointLabel={(d: any) =>
            `<div style="font-size:12px">
              <strong>${d.title}</strong><br/>
              Difficulte: ${d.difficulty}<br/>
              Plays: ${d.totalPlays}
            </div>`
          }
          onPointClick={(d: any) => onPointClick(d.quizId)}
          onGlobeReady={() => {
            globeRef.current?.pointOfView({ lat: 20, lng: 0, altitude: 2.1 }, 1000);
            globeRef.current?.controls().target.set(0, 0, 0);
            globeRef.current?.controls().update();
          }}
          arcsData={arcsData}
          arcColor={(d: any) => d.color}
          arcDashLength={0.5}
          arcDashGap={0.8}
          arcDashAnimateTime={3000}
        />
      </div>
    </div>
  );
}
