import { useState } from 'react';

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>我的第一个 Vite + React 项目</h1>
      <button onClick={() => setCount(count + 1)}>
        点击次数：{count}
      </button>
    </div>
  );
}