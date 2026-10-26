import "./Background.css";

const layers = [
  { name: "clouds", speed: 175 },
  { name: "clouds2", speed: 75 }
];

function ParallaxLayer({ name, speed }) {
  return (
    <div
      className={`parallax-track ${name}`}
      style={{ "--duration": `${speed}s` }}
    >
      <img src={`/images/${name}.png`} alt="" />
      <img src={`/images/${name}.png`} alt="" />
    </div>
  );
}

export default function ParallaxBackground() {
  return (
    <div className="parallax-background">
        <img className = "static-img" src="images/sky.png"/>
        <img className = "static-img" src="images/glow.png"/>
      {layers.map((layer) => (
        <ParallaxLayer key={layer.name} {...layer} />
      ))}
    </div>
  );
}