import { createEarthActor } from "../../../../core/actors";
import ActorComponent from "../../../../react/components/ActorComponent";
import TileRenderComponent from "./TileRenderComponent";

function EarthActor({ children }) {
  const actorRef = useRef(null);
  if (!actorRef.current) {
    actorRef.current = createEarthActor();
  }
  return (
    <ActorComponent actor={actorRef.current}>
      {/* 下面开始放地球的组件 */}
      <TileRenderComponent />
      {children}
    </ActorComponent>
  );
}
export default EarthActor;
