import { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);
  const age:number = "18";
  return (
    <div>
      <h1>React Fast Refresh 测试成功</h1>

      <button onClick={() => setCount(count + 1)}>
        点击次数：{count}{age}
      </button>
    </div>
  );
}