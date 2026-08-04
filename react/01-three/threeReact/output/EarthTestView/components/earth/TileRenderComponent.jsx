import { createTileRenderComponent } from "../../../../core/actors/Earth";
import UEComponent from "../../../../react/components/UEComponent";

function TileRenderComponent() {
  const tileRender = useRef(null);
  if (!tileRender.current) {
    tileRender.current = createTileRenderComponent();
  }
  return <UEComponent com={tileRender.current}></UEComponent>;
}
export default TileRenderComponent;
