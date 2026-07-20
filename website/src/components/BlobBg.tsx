export default function BlobBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {/* Dot-grid overlay */}
      <div
        className="dot-grid"
        style={{ position: 'absolute', inset: 0, opacity: 0.4 }}
      />

      <style>{`
        @keyframes orbFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          33% { transform: translate(30px, -30px) scale(1.05); opacity: 0.45; }
          66% { transform: translate(-20px, 20px) scale(0.95); opacity: 0.25; }
        }
        @keyframes orbFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.2; }
          33% { transform: translate(-25px, 20px) scale(1.08); opacity: 0.35; }
          66% { transform: translate(35px, -15px) scale(0.92); opacity: 0.2; }
        }
        @keyframes orbFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          33% { transform: translate(20px, 25px) scale(1.1); opacity: 0.3; }
          66% { transform: translate(-30px, -20px) scale(0.9); opacity: 0.12; }
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
        }
        .orb-1 {
          width: 600px; height: 600px;
          left: -10%; top: -10%;
          background: radial-gradient(circle, rgba(0,113,227,0.12), transparent 70%);
          animation: orbFloat1 16s ease-in-out infinite;
        }
        .orb-2 {
          width: 450px; height: 450px;
          left: 65%; top: 40%;
          background: radial-gradient(circle, rgba(108,92,231,0.10), transparent 70%);
          animation: orbFloat2 14s ease-in-out infinite;
        }
        .orb-3 {
          width: 350px; height: 350px;
          left: 30%; top: 55%;
          background: radial-gradient(circle, rgba(0,113,227,0.06), transparent 70%);
          animation: orbFloat3 18s ease-in-out infinite;
        }
      `}</style>

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
    </div>
  );
}
