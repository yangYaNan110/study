import { useState } from 'react';

interface MyButtonProps {
  title: string;
}

export function MyButton(props: MyButtonProps) {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      【组件库新版本】{props.title}：{count}
    </button>
  );
}