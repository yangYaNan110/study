import {MyButton} from './index';
// import { MyButton } from "my-react-ui-study";
export function App() {

  return (
    <div>
      <h1>我的react组件库练习111</h1>

      <MyButton title="按钮A" size={20}/>
      <MyButton title="按钮B" />

    </div>
  );
}