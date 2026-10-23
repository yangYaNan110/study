import { MyButton } from 'my-react-ui-study';

function App() {
  return (
    <div>
      <h1>测试我自己打包的 npm 组件库</h1>

      <MyButton title="我的第一个 npm 组件" />
      <MyButton title="我的第一个 npm 组件" size={20} />

    </div>
  );
}

export default App;