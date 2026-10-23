import { useState } from 'react';

interface MyButtonProps {
  title: string;
  size?: number;
}

export function MyButton(props: MyButtonProps) {
  const [count, setCount] = useState(0);

  return (
    <button
      style={{ fontSize: props.size ?? 16 }}
      onClick={() => setCount(count + 1)}
    >
      {props.title}：{count}
    </button>
  );
}