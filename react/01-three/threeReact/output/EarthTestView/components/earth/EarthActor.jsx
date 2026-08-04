import { createEarthActor } from "../../../../core/actors";
import ActorComponent from "../../../../react/components/ActorComponent";

function EarthActor() {
  const actorRef = useRef(null);
  if (!actorRef.current) {
    actorRef.current = createEarthActor();
  }
  return (
    <ActorComponent actor={actorRef.current}>
      {/* 下面开始放地球的组件 */}
    </ActorComponent>
  );
}
export default EarthActor;
