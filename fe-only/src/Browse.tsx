import { Back } from "./Back";
import { Tree } from "./Tree";

export const Browse = () => <div className="home">
  <Back />
  <Tree isOpen level="client" />
</div>;
